import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MergedBrand {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
  is_active_general: boolean;
  seo_title: string | null;
  seo_description: string | null;
  products_count: number;
  target_amount: number;
  booster_mode: 'off' | 'active' | 'first_24h';
  booster_started_at: string | null;
  virtual_score: number;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const pickStr = (r: Record<string, unknown>, keys: string[]) => {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const EXTERNAL_URL = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const EXTERNAL_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    const LOCAL_URL = Deno.env.get("SUPABASE_URL");
    const LOCAL_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!EXTERNAL_URL || !EXTERNAL_KEY) {
      throw new Error("External Supabase credentials are not configured");
    }
    if (!LOCAL_URL || !LOCAL_KEY) {
      throw new Error("Local Supabase credentials are not configured");
    }

    const external = createClient(EXTERNAL_URL, EXTERNAL_KEY, {
      auth: { persistSession: false },
    });
    const local = createClient(LOCAL_URL, LOCAL_KEY, {
      auth: { persistSession: false },
    });

    // Only admins receive booster / virtual_score internals.
    let isAdmin = false;
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const ANON = Deno.env.get("SUPABASE_ANON_KEY");
        if (ANON) {
          const userClient = createClient(LOCAL_URL, ANON, {
            global: { headers: { Authorization: authHeader } },
            auth: { persistSession: false },
          });
          const token = authHeader.replace("Bearer ", "");
          const { data: claimsData } = await userClient.auth.getClaims(token);
          const uid = claimsData?.claims?.sub as string | undefined;
          if (uid) {
            const { data: roles } = await local
              .from("user_roles")
              .select("role")
              .eq("user_id", uid);
            isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
          }
        }
      }
    } catch (e) {
      console.warn("admin check failed:", e);
    }

    // Discover tables via OpenAPI
    const specRes = await fetch(`${EXTERNAL_URL}/rest/v1/`, {
      headers: { apikey: EXTERNAL_KEY, Authorization: `Bearer ${EXTERNAL_KEY}` },
    });
    if (!specRes.ok) {
      throw new Error(`Cannot read external REST spec: ${specRes.status}`);
    }
    const spec = await specRes.json() as { definitions?: Record<string, unknown> };
    const allTables = Object.keys(spec.definitions ?? {});

    // Strict: pick the "brands" table only — NOT vendors/distributors
    const brandTable = allTables.find((t) => /^brands?$/i.test(t))
      ?? allTables.find((t) => /^marcas?$/i.test(t));
    if (!brandTable) {
      throw new Error(
        `No brands table found in external DB. Available: ${allTables.join(", ")}`,
      );
    }

    const { data: brandRows, error: brandErr } = await external
      .from(brandTable)
      .select("*");
    if (brandErr) {
      throw new Error(`Cannot read external brands from "${brandTable}": ${brandErr.message}`);
    }
    const rows = (brandRows ?? []) as Record<string, unknown>[];
    if (rows.length > 0) {
      console.log("external brand columns:", Object.keys(rows[0]));
    }

    // Try to count products per brand from external DB
    const productTable = allTables.find((t) => /^products?$/i.test(t))
      ?? allTables.find((t) => /^productos?$/i.test(t));
    const countsByBrandId = new Map<string, number>();
    if (productTable) {
      const { data: prodRows, error: prodErr } = await external
        .from(productTable)
        .select("*");
      if (!prodErr && prodRows) {
        const productList = prodRows as Record<string, unknown>[];
        if (productList.length > 0) {
          console.log("external product columns sample:", Object.keys(productList[0]));
        }
        const FK_KEYS = ["brand_id", "brandId", "brand", "Brand", "BrandId", "marca_id", "marcaId"];
        for (const p of productList) {
          for (const k of FK_KEYS) {
            const v = p[k];
            if (typeof v === "string" && v.length > 0) {
              countsByBrandId.set(v, (countsByBrandId.get(v) ?? 0) + 1);
              break;
            }
            if (typeof v === "number") {
              const key = String(v);
              countsByBrandId.set(key, (countsByBrandId.get(key) ?? 0) + 1);
              break;
            }
          }
        }
      } else if (prodErr) {
        console.warn("Could not read external products for counts:", prodErr.message);
      }
    } else {
      console.warn("No external products table found; product counts unavailable");
    }

    const extData = rows
      .map((r) => {
        const name = pickStr(r, ["name", "Name", "title", "Title", "nombre", "Nombre"]);
        if (!name) return null;
        let slug = pickStr(r, ["slug", "Slug", "handle", "Handle"]);
        if (!slug) slug = slugify(name);
        const id = pickStr(r, ["id", "Id", "ID", "uuid"]);
        const logo_url = pickStr(r, [
          "logo_url", "logoUrl", "logo", "image", "image_url", "imageUrl",
          "Logo", "LogoUrl", "Image", "picture",
        ]) ?? null;
        const seo_title = pickStr(r, ["seo_title", "SeoTitle", "seoTitle", "meta_title"]) ?? null;
        const seo_description = pickStr(r, ["seo_description", "SeoDescription", "seoDescription", "meta_description"]) ?? null;
        const productsCount = id ? (countsByBrandId.get(id) ?? 0) : 0;
        const active_ola = typeof r["active_ola"] === "boolean" ? (r["active_ola"] as boolean) : true;
        const active_general = typeof r["active"] === "boolean" ? (r["active"] as boolean) : true;
        return { id, name, slug, logo_url, seo_title, seo_description, productsCount, active_ola, active_general };
      })
      .filter((x): x is {
        id?: string; name: string; slug: string; logo_url: string | null;
        seo_title: string | null; seo_description: string | null; productsCount: number;
        active_ola: boolean; active_general: boolean;
      } => x !== null);

    const { data: overrides, error: ovErr } = await local
      .from("brand_overrides")
      .select("slug, emoji, sort_order, is_active, target_amount, booster_mode, booster_started_at, virtual_score, real_score");
    if (ovErr) {
      throw new Error(`Cannot read local brand overrides: ${ovErr.message}`);
    }
    const ovMap = new Map<string, {
      emoji: string | null; sort_order: number; is_active: boolean;
      target_amount: number; booster_mode: 'off' | 'active' | 'first_24h';
      booster_started_at: string | null; virtual_score: number; real_score: number;
    }>();
    for (const o of overrides ?? []) {
      ovMap.set(o.slug, {
        emoji: o.emoji ?? null,
        sort_order: o.sort_order ?? 0,
        is_active: o.is_active ?? true,
        target_amount: Number(o.target_amount ?? 0),
        booster_mode: (o.booster_mode ?? 'off') as 'off' | 'active' | 'first_24h',
        booster_started_at: o.booster_started_at ?? null,
        virtual_score: Number(o.virtual_score ?? 0),
        real_score: Number((o as Record<string, unknown>).real_score ?? 0),
      });
    }

    const merged: MergedBrand[] = extData.map((b, i) => {
      const ov = ovMap.get(b.slug);
      const hasProducts = b.productsCount > 0;
      const collectedTotal = Number(ov?.virtual_score ?? 0) + Number(ov?.real_score ?? 0);
      const target = Number(ov?.target_amount ?? 0);
      return {
        id: b.id ?? b.slug,
        name: b.name,
        slug: b.slug,
        emoji: null,
        logo_url: b.logo_url,
        sort_order: ov?.sort_order ?? i,
        // Retail (ola) visibility = master pim-pum brands.active_ola.
        // General (socios + default) = master pim-pum brands.active.
        is_active: hasProducts && b.active_ola,
        is_active_general: hasProducts && b.active_general,
        seo_title: b.seo_title,
        seo_description: b.seo_description,
        products_count: b.productsCount,
        // Public: target_amount + virtual_score (collected total) are shown on UI.
        // Booster internals (mode, started_at) leak strategy — admin only.
        target_amount: target,
        booster_mode: isAdmin ? (ov?.booster_mode ?? 'off') : 'off',
        booster_started_at: isAdmin ? (ov?.booster_started_at ?? null) : null,
        // Non-admin: only the combined collected total (identical to brand_collection_public),
        // so the virtual/real split cannot be derived. Admins get the raw virtual component.
        virtual_score: isAdmin ? Number(ov?.virtual_score ?? 0) : collectedTotal,
      };
    });

    merged.sort((a, b) => a.sort_order - b.sort_order);

    return new Response(JSON.stringify({ brands: merged }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("fetch-external-brands error:", message);
    return new Response(JSON.stringify({ error: message, brands: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});