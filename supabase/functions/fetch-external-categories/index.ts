import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MergedCategory {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  sort_order: number;
  is_active: boolean;
}

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

    // Discover the categories table from the REST OpenAPI spec
    const specRes = await fetch(`${EXTERNAL_URL}/rest/v1/`, {
      headers: { apikey: EXTERNAL_KEY, Authorization: `Bearer ${EXTERNAL_KEY}` },
    });
    if (!specRes.ok) {
      throw new Error(`Cannot read external REST spec: ${specRes.status}`);
    }
    const spec = await specRes.json() as { definitions?: Record<string, unknown> };
    const allTables = Object.keys(spec.definitions ?? {});
    const candidate = allTables.find((t) => /^categor(y|ies|ias|i[ae])$/i.test(t))
      ?? allTables.find((t) => /categor/i.test(t));
    if (!candidate) {
      throw new Error(
        `No categories table found in external DB. Available tables: ${allTables.join(", ")}`,
      );
    }

    const { data, error } = await external
      .from(candidate)
      .select("*");
    if (error) {
      throw new Error(`Cannot read external categories from "${candidate}": ${error.message}`);
    }
    const rows = (data ?? []) as Record<string, unknown>[];
    // Normalize: find best name + slug columns
    const pickStr = (r: Record<string, unknown>, keys: string[]) => {
      for (const k of keys) {
        const v = r[k];
        if (typeof v === "string" && v.length > 0) return v;
      }
      return undefined;
    };
    const slugify = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const pickBool = (r: Record<string, unknown>, keys: string[]) => {
      for (const k of keys) {
        if (k in r) {
          const v = r[k];
          if (typeof v === "boolean") return v;
          if (typeof v === "number") return v !== 0;
          if (typeof v === "string") {
            const s = v.toLowerCase().trim();
            if (["true", "t", "1", "yes", "si", "sí", "y"].includes(s)) return true;
            if (["false", "f", "0", "no", "n", ""].includes(s)) return false;
          }
          if (v === null) return undefined;
        }
      }
      return undefined;
    };
    const ACTIVE_KEYS = [
      "active", "is_active", "activo", "is_activo", "enabled", "is_enabled",
      "visible", "is_visible", "published", "is_published", "status",
      "Active", "IsActive", "Activo", "Enabled", "Visible", "Published",
    ];
    if (rows.length > 0) {
      console.log("external category columns:", Object.keys(rows[0]));
    }
    const extData: Array<{ id?: string; name: string; slug: string; externalActive: boolean }> = rows
      .map((r) => {
        const name = pickStr(r, ["name", "Name", "title", "Title", "nombre", "Nombre"]);
        let slug = pickStr(r, ["slug", "Slug", "handle", "Handle"]);
        if (!name) return null;
        if (!slug) slug = slugify(name);
        const id = pickStr(r, ["id", "Id", "ID", "uuid"]);
        const activeRaw = pickBool(r, ACTIVE_KEYS);
        const externalActive = activeRaw ?? true; // default true if no such column
        return { id, name, slug, externalActive };
      })
      .filter((x): x is { id?: string; name: string; slug: string; externalActive: boolean } => x !== null);

    const { data: overrides, error: ovErr } = await local
      .from("category_overrides")
      .select("slug, emoji, sort_order, is_active");
    if (ovErr) {
      throw new Error(`Cannot read local overrides: ${ovErr.message}`);
    }

    const ovMap = new Map<string, {
      emoji: string | null;
      sort_order: number;
      is_active: boolean;
    }>();
    for (const o of overrides ?? []) {
      ovMap.set(o.slug, {
        emoji: o.emoji ?? null,
        sort_order: o.sort_order ?? 0,
        is_active: o.is_active ?? true,
      });
    }

    const merged: MergedCategory[] = extData.map((c, i) => {
      const ov = ovMap.get(c.slug);
      return {
        id: c.id ?? c.slug,
        name: c.name,
        slug: c.slug,
        emoji: ov?.emoji ?? null,
        sort_order: ov?.sort_order ?? i,
        // Hide if either external DB OR local override marks inactive
        is_active: c.externalActive && (ov?.is_active ?? true),
      };
    });

    merged.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.name.localeCompare(b.name);
    });

    return new Response(JSON.stringify({ categories: merged }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("fetch-external-categories error:", message);
    return new Response(JSON.stringify({ error: message, categories: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});