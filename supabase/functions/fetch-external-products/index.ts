import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SociosProduct {
  sku: string;
  name: string;
  name_short: string | null;
  flavor: string | null;
  size: string | null;
  category_slug: string | null;
  url_slug: string | null;
  images: string[];
  retail_price: number;
  buy_price: number;
  discount_pct: number;
  brand_id: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  sort_order: number;
  tags: string[];
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const toNum = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  return 0;
};

const toImages = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  if (typeof v === "string" && v.length > 0) {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p.filter((x) => typeof x === "string");
    } catch {
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const toTags = (v: unknown): string[] => {
  if (Array.isArray(v)) {
    return v.filter((x) => typeof x === "string" && x.trim().length > 0)
      .map((x) => (x as string).trim());
  }
  if (typeof v === "string" && v.length > 0) {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) {
        return p.filter((x) => typeof x === "string" && x.trim().length > 0)
          .map((x) => (x as string).trim());
      }
    } catch {
      return v.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const EXTERNAL_URL = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const EXTERNAL_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (!EXTERNAL_URL || !EXTERNAL_KEY) {
      throw new Error("External Supabase credentials are not configured");
    }

    const external = createClient(EXTERNAL_URL, EXTERNAL_KEY, {
      auth: { persistSession: false },
    });

    // Discover tables via OpenAPI
    const specRes = await fetch(`${EXTERNAL_URL}/rest/v1/`, {
      headers: { apikey: EXTERNAL_KEY, Authorization: `Bearer ${EXTERNAL_KEY}` },
    });
    if (!specRes.ok) {
      throw new Error(`Cannot read external REST spec: ${specRes.status}`);
    }
    const spec = await specRes.json() as { definitions?: Record<string, unknown> };
    const allTables = Object.keys(spec.definitions ?? {});

    const productTable = allTables.find((t) => /^products?$/i.test(t))
      ?? allTables.find((t) => /^productos?$/i.test(t));
    if (!productTable) {
      throw new Error(`No products table in external DB`);
    }
    const brandTable = allTables.find((t) => /^brands?$/i.test(t))
      ?? allTables.find((t) => /^marcas?$/i.test(t));

    const { data: prodRows, error: prodErr } = await external
      .from(productTable)
      .select("*");
    if (prodErr) throw new Error(`Read products: ${prodErr.message}`);

    let brandsById = new Map<string, { name: string; slug: string }>();
    if (brandTable) {
      const { data: brandRows } = await external.from(brandTable).select("*");
      for (const b of (brandRows ?? []) as Record<string, unknown>[]) {
        const id = b.id as string | undefined;
        const name = (b.name ?? b.Name ?? b.nombre) as string | undefined;
        if (id && name) {
          const slug = (b.slug as string | undefined) ?? slugify(name);
          brandsById.set(String(id), { name, slug });
        }
      }
    }

    const products: SociosProduct[] = ((prodRows ?? []) as Record<string, unknown>[])
      .filter((p) => p.active !== false && p.active !== 0)
      .map((p) => {
        const retail = toNum(p.price_retail);
        const t4 = toNum(p.price_t4);
        const buy = t4 > 0 ? t4 : retail;
        const discount = retail > 0 && buy < retail
          ? Math.round(((retail - buy) / retail) * 100)
          : 0;
        const brandId = p.brand_id ? String(p.brand_id) : null;
        const brand = brandId ? brandsById.get(brandId) : undefined;
        return {
          sku: String(p.sku ?? ""),
          name: String(p.name ?? ""),
          name_short: (p.name_short as string) ?? null,
          flavor: (p.flavor as string) ?? null,
          size: (p.size as string) ?? null,
          category_slug: (p.category_slug as string) ?? null,
          url_slug: (p.url_slug as string) ?? null,
          images: toImages(p.image_urls),
          retail_price: retail,
          buy_price: buy,
          discount_pct: discount,
          brand_id: brandId,
          brand_name: brand?.name ?? null,
          brand_slug: brand?.slug ?? null,
          sort_order: toNum(p.sort_order),
          tags: toTags(p.tags ?? p.keywords ?? p.search_terms),
        };
      })
      .filter((p) => p.sku && p.name && p.buy_price > 0);

    products.sort((a, b) =>
      a.sort_order - b.sort_order || a.name.localeCompare(b.name)
    );

    return new Response(JSON.stringify({ products }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
      status: 200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("fetch-external-products error:", message);
    return new Response(JSON.stringify({ error: message, products: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});