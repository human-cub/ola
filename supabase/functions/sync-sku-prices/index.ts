import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Pulls current prices for every external SKU and upserts them into
// public.sku_price_snapshots.current_prices. Does NOT touch this_week / last_week.
// Runs by cron (Sunday ~23:00 UTC) and on-demand from the admin panel.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const CRON_SECRET = Deno.env.get("CRON_SECRET");

    // Auth: cron secret OR admin JWT
    const cronSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("Authorization");
    const isCronAuth = !!cronSecret && cronSecret === CRON_SECRET;

    let isAdminAuth = false;
    if (!isCronAuth && authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claims } = await userClient.auth.getClaims(token);
      const uid = claims?.claims?.sub;
      if (uid) {
        const admin = createClient(SUPABASE_URL, SERVICE_KEY);
        const { data: role } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .eq("role", "admin")
          .maybeSingle();
        isAdminAuth = !!role;
      }
    }
    if (!isCronAuth && !isAdminAuth) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Call the existing fetch-external-products function to reuse normalization.
    const fetchRes = await fetch(
      `${SUPABASE_URL}/functions/v1/fetch-external-products`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
        },
        body: "{}",
      },
    );
    if (!fetchRes.ok) {
      throw new Error(`fetch-external-products: ${fetchRes.status}`);
    }
    const payload = (await fetchRes.json()) as {
      products?: Array<{
        sku: string;
        price_retail_display: number;
        price_t1: number;
        price_t2: number;
        price_t3: number;
        price_t4: number;
      }>;
    };
    const rows = (payload.products ?? []).filter((p) => p.sku);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const now = new Date().toISOString();

    // Upsert in chunks to stay under PostgREST payload limits.
    const CHUNK = 500;
    let upserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK).map((p) => ({
        sku: p.sku,
        current_prices: {
          retail: p.price_retail_display,
          t1: p.price_t1,
          t2: p.price_t2,
          t3: p.price_t3,
          t4: p.price_t4,
        },
        current_updated_at: now,
      }));
      const { error } = await admin
        .from("sku_price_snapshots")
        .upsert(slice, { onConflict: "sku" });
      if (error) throw error;
      upserted += slice.length;
    }

    return new Response(
      JSON.stringify({ success: true, upserted, timestamp: now }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("sync-sku-prices error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});