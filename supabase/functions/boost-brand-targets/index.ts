import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// ART = UTC-3 (Buenos Aires, no DST)
const ART_OFFSET_MS = -3 * 60 * 60 * 1000;
// Weekly reset boundary = Monday 00:30 ART; accrual starts 9.5h later = Monday 10:00 ART.
const ACCRUAL_DELAY_MS = 9.5 * 60 * 60 * 1000;
const toArt = (d: Date) => new Date(d.getTime() + ART_OFFSET_MS);

// Most recent Monday 00:30 ART (returned as UTC Date) — the weekly RESET boundary.
const currentCycleStart = (now: Date): Date => {
  const art = toArt(now);
  const dayFromMon = (art.getUTCDay() + 6) % 7;
  const cycle = new Date(art);
  cycle.setUTCHours(0, 30, 0, 0);
  cycle.setUTCDate(cycle.getUTCDate() - dayFromMon);
  if (now.getTime() < (cycle.getTime() - ART_OFFSET_MS)) {
    cycle.setUTCDate(cycle.getUTCDate() - 7);
  }
  return new Date(cycle.getTime() - ART_OFFSET_MS);
};

// Progress 0..1 across the week. Accrual starts Monday 10:00 ART (cycleStart + 9.5h);
// returns 0 from Monday 00:30 to 10:00 (counters reset, no growth yet).
const expectedProgress = (now: Date, cycleStart: Date): number => {
  const accrualStart = cycleStart.getTime() + ACCRUAL_DELAY_MS;
  const h = (now.getTime() - accrualStart) / 3_600_000;
  if (h <= 0) return 0;
  if (h <= 24) return (h / 24) * 0.275;
  if (h <= 108) {
    const t = (h - 24) / 84;
    return 0.275 + t * (0.75 - 0.275);
  }
  if (h <= 120) return 0.75;
  if (h <= 156) {
    const t = (h - 120) / 36;
    return 0.75 + t * 0.25;
  }
  return 1;
};

// Stable per-brand factor in [0,1) from slug → each brand its own trajectory
function brandHash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  return Math.abs(h % 10000) / 10000;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const expected = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const now = new Date();
    const cycleStart = currentCycleStart(now);
    const accrualStart = cycleStart.getTime() + ACCRUAL_DELAY_MS;

    // Past Monday 00:30 of a new cycle → reset virtual_score to 0
    await admin
      .from("brand_overrides")
      .update({ virtual_score: 0, booster_started_at: now.toISOString() })
      .neq("booster_mode", "off")
      .or(`booster_started_at.is.null,booster_started_at.lt.${cycleStart.toISOString()}`);

    const { data: overrides } = await admin
      .from("brand_overrides")
      .select("slug, target_amount, booster_mode, booster_started_at, virtual_score, real_score")
      .neq("booster_mode", "off");

    if (!overrides || overrides.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // Guaranteed price per brand (Precio Garantizado = second-to-last collective tier; last = Súper)
    const { data: products } = await admin.from("products").select("id, brand_id, prices");
    const { data: brands } = await admin.from("brands").select("id, slug");
    const slugByBrandId = new Map<string, string>();
    for (const b of brands ?? []) if (b.id && b.slug) slugByBrandId.set(b.id, b.slug);
    const pricesBySlug = new Map<string, number[]>();
    for (const p of products ?? []) {
      const s = p.brand_id ? slugByBrandId.get(p.brand_id) : undefined;
      if (!s) continue;
      const tiers = Array.isArray(p.prices) ? p.prices : [];
      const gTier = (tiers.length >= 2 ? tiers[tiers.length - 2] : tiers[tiers.length - 1]) as { price?: number } | undefined;
      const price = Number(gTier?.price ?? 0);
      if (price > 0) {
        const list = pricesBySlug.get(s) ?? [];
        list.push(price);
        pricesBySlug.set(s, list);
      }
    }

    let processed = 0;
    for (const ov of overrides) {
      const target = Number(ov.target_amount ?? 0);
      if (target <= 0) continue;

      // first_24h: only accrue during the first 24h of accrual (Mon 10:00 → Tue 10:00)
      if (ov.booster_mode === "first_24h" && now.getTime() >= accrualStart + 24 * 3_600_000) {
        continue;
      }

      const real = Number(ov.real_score ?? 0);
      let virtual = Number(ov.virtual_score ?? 0);
      const current = real + virtual;

      // Curve × stable per-brand multiplier (±15%) × jitter (±2%). At 0% (morning) stays 0.
      const basePct = expectedProgress(now, cycleStart);
      const brandFactor = 1 + (brandHash(ov.slug) - 0.5) * 0.30;
      const jitter = 1 + ((Math.random() * 0.04) - 0.02);
      let pct = Math.max(0, Math.min(1, basePct * brandFactor * jitter));
      let expectedAmt = target * pct;

      // Final phase (curve hit 100% ~Sun 22:00): 80% chance to actually reach 100%, else 92–98%
      const hoursSinceAccrual = (now.getTime() - accrualStart) / 3_600_000;
      if (hoursSinceAccrual > 156) {
        if (Math.random() < 0.8) expectedAmt = target;
        else expectedAmt = target * (0.92 + Math.random() * 0.06);
      }

      if (current < expectedAmt) {
        const brandPrices = pricesBySlug.get(ov.slug) ?? [];
        const randomChunk = () =>
          brandPrices.length > 0
            ? brandPrices[Math.floor(Math.random() * brandPrices.length)]
            : Math.floor(10_000 + Math.random() * 60_000);
        let added = 0;
        for (let i = 0; i < 200 && current + added < expectedAmt; i++) added += randomChunk();
        virtual += added;
        await admin.from("brand_overrides").update({ virtual_score: virtual }).eq("slug", ov.slug);
        processed++;
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
