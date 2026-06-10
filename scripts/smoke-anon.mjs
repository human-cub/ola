#!/usr/bin/env node
// Anon smoke: проверяет витрину ГЛАЗАМИ АНОНИМНОГО посетителя.
// Ловит класс багов "тихая деградация": слетевшие grants/RLS, пустые вьюхи,
// сломанные edge-функции, утечку оптовых цен анониму.
// Запуск: npm run smoke (или node scripts/smoke-anon.mjs). Exit 1 при фейле.
// Локальное зеркало edge-функции anon-smoke (та же логика, для дев/CI).

import { readFileSync } from "node:fs";

const env = {};
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)="?([^"\n]+)"?/);
    if (m) env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const OLA_URL = env.VITE_SUPABASE_URL ?? "https://hqrnddgpnxwdcowsmpem.supabase.co";
const OLA_ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY;
const CATALOG_FN = "https://bqbywleogtdelcmpmnny.supabase.co/functions/v1/catalog-products";

if (!OLA_ANON) {
  console.error("No anon key (.env VITE_SUPABASE_PUBLISHABLE_KEY). Abortando.");
  process.exit(1);
}

const H = { apikey: OLA_ANON, Authorization: `Bearer ${OLA_ANON}`, "Content-Type": "application/json" };
const checks = [];
const add = (name, ok, detail) => checks.push({ name, ok, detail });
const rest = async (path) => {
  const r = await fetch(`${OLA_URL}/rest/v1/${path}`, { headers: H });
  const body = await r.json().catch(() => null);
  return { status: r.status, ok: r.ok, body };
};

try {
  const r = await fetch(CATALOG_FN, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const j = await r.json().catch(() => null);
  const n = Array.isArray(j?.products) ? j.products.length : 0;
  const priced = (j?.products ?? []).filter((p) => (p.price_t4 ?? 0) > 0).length;
  add("catalog-products", r.ok && n > 50 && priced > 50, `http ${r.status}, products=${n}, priced=${priced}`);
} catch (e) { add("catalog-products", false, String(e)); }

try {
  const { status, body } = await rest("sku_prices_public?select=sku,this_week_prices&this_week_prices=not.is.null&limit=5");
  add("sku_prices_public.this_week", status === 200 && Array.isArray(body) && body.length > 0, `http ${status}, rows=${Array.isArray(body) ? body.length : "?"}`);
} catch (e) { add("sku_prices_public.this_week", false, String(e)); }

try {
  const { status, body } = await rest("product_popularity?select=product_id,orders_count&limit=5");
  add("product_popularity", status === 200 && Array.isArray(body) && body.length > 0, `http ${status}, rows=${Array.isArray(body) ? body.length : "?"}`);
} catch (e) { add("product_popularity", false, String(e)); }

try {
  const { status, body } = await rest("app_settings?select=key,value&limit=20");
  add("app_settings", status === 200 && Array.isArray(body) && body.length > 0, `http ${status}, rows=${Array.isArray(body) ? body.length : "?"}`);
} catch (e) { add("app_settings", false, String(e)); }

try {
  const { status } = await rest("brand_collection_public?select=slug&limit=1");
  add("brand_collection_public", status === 200, `http ${status}`);
} catch (e) { add("brand_collection_public", false, String(e)); }

for (const fn of ["fetch-external-brands", "fetch-external-categories"]) {
  try {
    const r = await fetch(`${OLA_URL}/functions/v1/${fn}`, { method: "POST", headers: H, body: "{}" });
    const j = await r.json().catch(() => null);
    const arr = j?.brands ?? j?.categories ?? j;
    add(fn, r.ok && Array.isArray(arr) && arr.length > 0, `http ${r.status}, n=${Array.isArray(arr) ? arr.length : "?"}`);
  } catch (e) { add(fn, false, String(e)); }
}

try {
  const r = await fetch(CATALOG_FN, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const j = await r.json().catch(() => null);
  const leaked = (j?.products ?? []).filter((p) => (p.buy_price ?? 0) > 0).length;
  add("no buy_price leak", leaked === 0, leaked === 0 ? "ok" : `LEAK: ${leaked} con buy_price>0`);
} catch (e) { add("no buy_price leak", false, String(e)); }

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? "✓" : "✗"} ${c.name} — ${c.detail}`);
console.log(`\n${failed.length === 0 ? "PASS" : "FAIL"}: ${checks.length - failed.length}/${checks.length} ok`);
process.exit(failed.length === 0 ? 0 : 1);
