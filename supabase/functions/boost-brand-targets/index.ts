import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// ART = UTC-3 (Buenos Aires, no DST)
const ART_OFFSET_MS = -3 * 60 * 60 * 1000;
// Weekly reset boundary = Monday 00:00 ART; accrual starts 10h later = Monday 10:00 ART.
const ACCRUAL_DELAY_MS = 10 * 60 * 60 * 1000;
const toArt = (d: Date) => new Date(d.getTime() + ART_OFFSET_MS);

// Most recent Monday 00:00 ART (returned as UTC Date) — the weekly RESET boundary.
const currentCycleStart = (now: Date): Date => {
  const art = toArt(now);
  const dayFromMon = (art.getUTCDay() + 6) % 7;
  const cycle = new Date(art);
  cycle.setUTCHours(0, 0, 0, 0);
  cycle.setUTCDate(cycle.getUTCDate() - dayFromMon);
  if (now.getTime() < (cycle.getTime() - ART_OFFSET_MS)) {
    cycle.setUTCDate(cycle.getUTCDate() - 7);
  }
  return new Date(cycle.getTime() - ART_OFFSET_MS);
};

// ---------- deterministic per-brand randomness ----------
// Seeded RNG so every cron run (every 30 min) samples the SAME weekly curve for a
// brand. Without this the trajectory would re-roll on each invocation.
const hashStr = (s: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const rngFor = (...parts: (string | number)[]) =>
  mulberry32(hashStr(parts.join("|")));

// ---------- per-section trajectory "personalities" ----------
// Monotone curve [0,1] -> [0,1] with f(0)=0, f(1)=1. Section boundary values are
// therefore ALWAYS preserved; only the path between them differs per brand+week.
type Shape = (t: number) => number;

const makeShape = (rng: () => number): Shape => {
  const roll = rng();
  if (roll < 0.28) {
    // Sprinter: accrues fast early, then nearly flat.
    const k = 0.3 + rng() * 0.25;
    return (t) => Math.pow(t, k);
  }
  if (roll < 0.55) {
    // Steady: close to linear.
    const k = 0.85 + rng() * 0.4;
    return (t) => Math.pow(t, k);
  }
  if (roll < 0.8) {
    // Latecomer: long quiet stretch, growth arrives near the end.
    const k = 2.4 + rng() * 1.8;
    return (t) => Math.pow(t, k);
  }
  // Stairs: 2-3 bursts separated by dead plateaus.
  const n = rng() < 0.5 ? 2 : 3;
  const w = 0.05 + rng() * 0.04; // half-width of each ramp
  const centers: number[] = [];
  for (let i = 0; i < n; i++) {
    const lo = w + (i / n) * (1 - 2 * w);
    const hi = w + ((i + 1) / n) * (1 - 2 * w);
    centers.push(lo + rng() * (hi - lo));
  }
  const weights: number[] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const g = 0.2 + rng();
    weights.push(g);
    sum += g;
  }
  for (let i = 0; i < n; i++) weights[i] /= sum;
  return (t) => {
    let v = 0;
    for (let i = 0; i < n; i++) {
      const a = centers[i] - w;
      const b = centers[i] + w;
      v += weights[i] * Math.max(0, Math.min(1, (t - a) / (b - a)));
    }
    return v;
  };
};

// Week sections (hours since accrual start, Mon 10:00 ART) with FIXED boundary
// percentages shared by all brands. Inside a section each brand walks its own
// deterministic path (seed = slug + week + section index).
const SECTIONS = [
  { from: 0, to: 24, start: 0, end: 0.275 }, // first day: Mon 10:00 -> Tue 10:00
  { from: 24, to: 108, start: 0.275, end: 0.75 }, // weekdays: Tue 10:00 -> Fri 22:00
  { from: 120, to: 156, start: 0.75, end: 1 }, // weekend: Sat 10:00 -> Sun 22:00
] as const;

const expectedProgress = (
  now: Date,
  cycleStart: Date,
  slug: string,
  weekKey: string,
): number => {
  const h = (now.getTime() - cycleStart.getTime() - ACCRUAL_DELAY_MS) / 3_600_000;
  if (h <= 0) return 0;
  if (h >= 156) return 1;
  if (h > 108 && h <= 120) return 0.75; // overnight plateau Fri 22:00 -> Sat 10:00
  for (let i = 0; i < SECTIONS.length; i++) {
    const s = SECTIONS[i];
    if (h > s.from && h <= s.to) {
      const t = (h - s.from) / (s.to - s.from);
      const shape = makeShape(rngFor(slug, weekKey, "sec", i));
      return s.start + shape(t) * (s.end - s.start);
    }
  }
  return 1;
};

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
    const weekKey = cycleStart.toISOString().slice(0, 10);

    // Past Monday 00:00 of a new cycle -> reset virtual_score to 0
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

      // first_24h: only accrue during the first 24h of accrual (Mon 10:00 -> Tue 10:00)
      if (ov.booster_mode === "first_24h" && now.getTime() >= accrualStart + 24 * 3_600_000) {
        continue;
      }

      const real = Number(ov.real_score ?? 0);
      let virtual = Number(ov.virtual_score ?? 0);
      const current = real + virtual;

      // Personality curve x stable weekly brand multiplier (+/-15%) x jitter (+/-2%).
      // brandFactor is re-seeded every week so the same brand is not always the high/low one.
      const basePct = expectedProgress(now, cycleStart, ov.slug, weekKey);
      const brandFactor = 1 + (rngFor(ov.slug, weekKey, "factor")() - 0.5) * 0.30;
      const jitter = 1 + ((Math.random() * 0.04) - 0.02);
      const pct = Math.max(0, Math.min(1, basePct * brandFactor * jitter));
      let expectedAmt = target * pct;

      // Final phase (curve hit 100% ~Sun 22:00): the weekly outcome is seeded per
      // brand+week so it stays stable across cron runs — 80% of brands actually
      // reach 100%, the rest stall at a fixed 92-98%.
      const hoursSinceAccrual = (now.getTime() - accrualStart) / 3_600_000;
      if (hoursSinceAccrual > 156) {
        const finalRng = rngFor(ov.slug, weekKey, "final");
        if (finalRng() < 0.8) expectedAmt = target;
        else expectedAmt = target * (0.92 + finalRng() * 0.06);
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
