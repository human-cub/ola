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

    // Try lowercase first, then capitalized
    let extData: Array<{ id?: string; name: string; slug: string }> | null = null;
    let extError: unknown = null;
    for (const tableName of ["categories", "Categories"]) {
      const { data, error } = await external
        .from(tableName)
        .select("id, name, slug")
        .order("name", { ascending: true });
      if (!error) {
        extData = (data ?? []) as Array<{ id?: string; name: string; slug: string }>;
        break;
      }
      extError = error;
    }
    if (!extData) {
      throw new Error(
        `Cannot read external categories: ${
          (extError as { message?: string })?.message ?? "unknown error"
        }`,
      );
    }

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
        is_active: ov?.is_active ?? true,
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