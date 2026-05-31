import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Rolls the weekly snapshot for every SKU:
//   last_week_prices  <- this_week_prices
//   this_week_prices  <- current_prices
// current_prices is left untouched (it gets refreshed by sync-sku-prices).
// Runs by cron on Monday 02:59 UTC (Sunday 23:59 ART) and on-demand from admin.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const CRON_SECRET = Deno.env.get("CRON_SECRET");

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

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Pull every row, roll the windows in JS, upsert back.
    const { data: rows, error: readErr } = await admin
      .from("sku_price_snapshots")
      .select("sku, current_prices, this_week_prices");
    if (readErr) throw readErr;

    const now = new Date().toISOString();
    const updates = (rows ?? [])
      // Skip rows that have no current snapshot at all — nothing to freeze yet.
      .filter((r) => r.current_prices)
      .map((r) => ({
        sku: r.sku,
        last_week_prices: r.this_week_prices ?? null,
        this_week_prices: r.current_prices,
        snapshotted_at: now,
      }));

    const CHUNK = 500;
    let updated = 0;
    for (let i = 0; i < updates.length; i += CHUNK) {
      const slice = updates.slice(i, i + CHUNK);
      const { error } = await admin
        .from("sku_price_snapshots")
        .upsert(slice, { onConflict: "sku" });
      if (error) throw error;
      updated += slice.length;
    }

    return new Response(
      JSON.stringify({ success: true, frozen: updated, timestamp: now }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("freeze-weekly-prices error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});