import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// ART = UTC-3 (Buenos Aires, no DST)
const ART_OFFSET_MS = -3 * 60 * 60 * 1000;

const toArt = (d: Date) => new Date(d.getTime() + ART_OFFSET_MS);

// Returns Monday 10:00 ART <= now (as UTC Date)
const currentCycleStart = (now: Date): Date => {
  const art = toArt(now);
  const day = art.getUTCDay(); // 0..6 (Sun..Sat) in shifted clock
  // We want Monday = 1 as anchor at 10:00
  const dayFromMon = (day + 6) % 7; // 0=Mon ... 6=Sun
  const cycle = new Date(art);
  cycle.setUTCHours(10, 0, 0, 0);
  cycle.setUTCDate(cycle.getUTCDate() - dayFromMon);
  // If we're earlier than Monday 10:00 in this week, go back one week
  if (now.getTime() < (cycle.getTime() - ART_OFFSET_MS)) {
    cycle.setUTCDate(cycle.getUTCDate() - 7);
  }
  return new Date(cycle.getTime() - ART_OFFSET_MS); // convert back to UTC
};

// Phase target progress (0..1) for given ART time within the cycle
const expectedProgress = (now: Date, cycleStart: Date): number => {
  const hoursSinceStart = (now.getTime() - cycleStart.getTime()) / (3_600_000);
  // Phases (hours since Monday 10:00 ART):
  // 0..24       -> ramp 0% -> 27.5%
  // 24..108     -> ramp 27.5% -> 75% (Tue 10 -> Fri 22 = 84h)
  // 108..120    -> hold 75%
  // 120..156    -> ramp 75% -> 100% (Sat 10 -> Sun 22 = 36h)
  // >156        -> 100%
  if (hoursSinceStart <= 0) return 0;
  if (hoursSinceStart <= 24) {
    return (hoursSinceStart / 24) * 0.275;
  }
  if (hoursSinceStart <= 108) {
    const t = (hoursSinceStart - 24) / 84;
    return 0.275 + t * (0.75 - 0.275);
  }
  if (hoursSinceStart <= 120) {
    return 0.75;
  }
  if (hoursSinceStart <= 156) {
    const t = (hoursSinceStart - 120) / 36;
    return 0.75 + t * 0.25;
  }
  return 1;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const expected = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const now = new Date();
    const cycleStart = currentCycleStart(now);

    // Reset virtual_score if booster_started_at is before this cycle (new week)
    await admin
      .from("brand_overrides")
      .update({ virtual_score: 0, booster_started_at: now.toISOString() })
      .neq("booster_mode", "off")
      .or(`booster_started_at.is.null,booster_started_at.lt.${cycleStart.toISOString()}`);

    // Fetch all active boosters
    const { data: overrides } = await admin
      .from("brand_overrides")
      .select("slug, target_amount, booster_mode, booster_started_at, virtual_score")
      .neq("booster_mode", "off");

    if (!overrides || overrides.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get mayorista per slug (real)
    const { data: products } = await admin.from("products").select("id, brand_id");
    const { data: brands } = await admin.from("brands").select("id, slug");
    const slugByBrandId = new Map<string, string>();
    for (const b of brands ?? []) if (b.id && b.slug) slugByBrandId.set(b.id, b.slug);
    const slugByProductId = new Map<string, string>();
    for (const p of products ?? []) {
      const s = p.brand_id ? slugByBrandId.get(p.brand_id) : undefined;
      if (s) slugByProductId.set(p.id, s);
    }
    const { data: orders } = await admin
      .from("user_orders")
      .select("items, status, created_at")
      .eq("status", "pending")
      .gte("created_at", cycleStart.toISOString());
    const mayoristaBySlug = new Map<string, number>();
    for (const o of orders ?? []) {
      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        const pid = (it as Record<string, unknown>).product_id as string | undefined;
        if (!pid) continue;
        const slug = slugByProductId.get(pid);
        if (!slug) continue;
        const qty = Number((it as Record<string, unknown>).quantity ?? 0);
        const ppu = Number((it as Record<string, unknown>).price_per_unit ?? 0);
        mayoristaBySlug.set(slug, (mayoristaBySlug.get(slug) ?? 0) + qty * ppu);
      }
    }

    let processed = 0;
    for (const ov of overrides) {
      const target = Number(ov.target_amount ?? 0);
      if (target <= 0) continue;

      // first_24h: skip if more than 24h elapsed since booster_started_at
      if (ov.booster_mode === "first_24h" && ov.booster_started_at) {
        const elapsed = now.getTime() - new Date(ov.booster_started_at).getTime();
        if (elapsed > 24 * 3_600_000) continue;
      }

      const mayorista = mayoristaBySlug.get(ov.slug) ?? 0;
      let virtual = Number(ov.virtual_score ?? 0);
      const current = mayorista + virtual;

      // Expected progress with small jitter +/- 2%
      let pct = expectedProgress(now, cycleStart);
      const jitter = (Math.random() * 0.04) - 0.02;
      pct = Math.max(0, Math.min(1, pct + jitter));
      let expectedAmt = target * pct;

      // Final phase 90% chance to actually hit 100%
      const hours = (now.getTime() - cycleStart.getTime()) / 3_600_000;
      if (hours > 156) {
        if (Math.random() < 0.9) expectedAmt = target;
        else expectedAmt = target * (0.92 + Math.random() * 0.06);
      }

      if (current < expectedAmt) {
        const delta = expectedAmt - current;
        virtual += delta;
        await admin
          .from("brand_overrides")
          .update({ virtual_score: virtual })
          .eq("slug", ov.slug);
        processed++;
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});