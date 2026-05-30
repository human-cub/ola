import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check: must be admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const { data: roleRow } = await userClient
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // products: id -> brand_slug (joined via brand_id -> brands.slug if present, else null)
    const { data: products } = await admin
      .from("products")
      .select("id, brand_id");
    const { data: brands } = await admin
      .from("brands")
      .select("id, slug");
    const brandSlugById = new Map<string, string>();
    for (const b of brands ?? []) {
      if (b.id && b.slug) brandSlugById.set(b.id, b.slug);
    }
    const slugByProductId = new Map<string, string>();
    for (const p of products ?? []) {
      const slug = p.brand_id ? brandSlugById.get(p.brand_id) : undefined;
      if (slug) slugByProductId.set(p.id, slug);
    }

    // Current week start (Monday 00:00 UTC matches the existing weekly counter logic in DB)
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sun
    const diff = (day === 0 ? 6 : day - 1);
    const weekStart = new Date(now);
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(weekStart.getUTCDate() - diff);

    const { data: orders } = await admin
      .from("user_orders")
      .select("items, status, created_at")
      .eq("status", "pending")
      .gte("created_at", weekStart.toISOString());

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
        const sum = qty * ppu;
        mayoristaBySlug.set(slug, (mayoristaBySlug.get(slug) ?? 0) + sum);
      }
    }

    const { data: overrides } = await admin
      .from("brand_overrides")
      .select("slug, virtual_score");
    const virtualBySlug = new Map<string, number>();
    for (const o of overrides ?? []) {
      virtualBySlug.set(o.slug, Number(o.virtual_score ?? 0));
    }

    const allSlugs = new Set<string>([...mayoristaBySlug.keys(), ...virtualBySlug.keys()]);
    const result = Array.from(allSlugs).map((slug) => {
      const mayorista = mayoristaBySlug.get(slug) ?? 0;
      const virtual = virtualBySlug.get(slug) ?? 0;
      return { slug, mayorista, virtual, score: mayorista + virtual };
    });

    return new Response(JSON.stringify({ scores: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message, scores: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});