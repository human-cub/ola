// anon-smoke — comprueba, con la MISMA llave anónima que un visitante real,
// que las piezas críticas de la tienda responden. Pensada para correr por cron
// (cada hora) y on-demand. Si algo falla, avisa por Telegram. Devuelve 200 con
// el detalle (ok/fail por check) salvo error interno.
//
// Por qué existe: el orden "Más populares" se apagó en silencio cuando una
// vista perdió el SELECT de anon, y nada lo detectó. Esto lo detecta en minutos.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const CATALOG_PRODUCTS_URL = "https://bqbywleogtdelcmpmnny.supabase.co/functions/v1/catalog-products";

type Check = { name: string; ok: boolean; detail: string };

async function run(): Promise<Check[]> {
  const url = Deno.env.get("SUPABASE_URL")!;
  // Anon key = exactamente lo que ve un visitante (NO service role).
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  // 1. Catálogo (pim-pum edge fn): debe traer productos con precio.
  try {
    const r = await fetch(CATALOG_PRODUCTS_URL, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
    const j = await r.json().catch(() => null);
    const n = Array.isArray(j?.products) ? j.products.length : 0;
    const priced = (j?.products ?? []).filter((p: any) => (p.price_t4 ?? 0) > 0).length;
    add("catalog-products", r.ok && n > 50 && priced > 50, `http ${r.status}, products=${n}, priced=${priced}`);
  } catch (e) {
    add("catalog-products", false, String(e));
  }

  // 2. Precios de la semana (lo que paga el cliente): vista pública con this_week_prices.
  try {
    const { data, error } = await sb
      .from("sku_prices_public" as any)
      .select("sku, this_week_prices")
      .not("this_week_prices", "is", null)
      .limit(5);
    add("sku_prices_public.this_week", !error && (data?.length ?? 0) > 0, error?.message ?? `rows=${data?.length ?? 0}`);
  } catch (e) {
    add("sku_prices_public.this_week", false, String(e));
  }

  // 3. Popularidad (orden "Más populares"): la vista que se rompió.
  try {
    const { data, error } = await sb
      .from("product_popularity" as any)
      .select("product_id, orders_count")
      .limit(5);
    add("product_popularity", !error && (data?.length ?? 0) > 0, error?.message ?? `rows=${data?.length ?? 0}`);
  } catch (e) {
    add("product_popularity", false, String(e));
  }

  // 4. app_settings (cortina de precios / flags virales): anon debe poder leer.
  try {
    const { data, error } = await sb.from("app_settings" as any).select("key, value").limit(20);
    add("app_settings", !error && (data?.length ?? 0) > 0, error?.message ?? `rows=${data?.length ?? 0}`);
  } catch (e) {
    add("app_settings", false, String(e));
  }

  // 5. Colección de marcas (barra de progreso colectiva): vista pública.
  try {
    const { error } = await sb.from("brand_collection_public" as any).select("slug").limit(1);
    add("brand_collection_public", !error, error?.message ?? "ok");
  } catch (e) {
    add("brand_collection_public", false, String(e));
  }

  // 6. Marcas y categorías de la vitrina (edge fns en ola-app).
  for (const fn of ["fetch-external-brands", "fetch-external-categories"]) {
    try {
      const r = await fetch(`${url}/functions/v1/${fn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
        body: "{}",
      });
      const j = await r.json().catch(() => null);
      const arr = j?.brands ?? j?.categories ?? j;
      add(fn, r.ok && Array.isArray(arr) && arr.length > 0, `http ${r.status}, n=${Array.isArray(arr) ? arr.length : "?"}`);
    } catch (e) {
      add(fn, false, String(e));
    }
  }

  return checks;
}

async function alertTelegram(failed: Check[]) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chat = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chat) return;
  const lines = failed.map((c) => `❌ <b>${c.name}</b>: ${c.detail}`).join("\n");
  const text = `🚨 <b>alaola smoke FAILED</b>\n\n${lines}\n\nhttps://alaola.com.ar`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
  }).catch(() => {});
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const checks = await run();
  const failed = checks.filter((c) => !c.ok);
  if (failed.length > 0) await alertTelegram(failed);

  return new Response(
    JSON.stringify({ ok: failed.length === 0, failed: failed.length, checks }, null, 2),
    { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
  );
});
