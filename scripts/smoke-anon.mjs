#!/usr/bin/env node
// Anon smoke: проверяет витрину ГЛАЗАМИ АНОНИМНОГО посетителя.
// Ловит класс багов "тихая деградация": слетевшие grants/RLS, пустые вьюхи,
// сломанные edge-функции, утечку оптовых цен анониму.
// Запуск: npm run smoke (или node scripts/smoke-anon.mjs). Exit 1 при фейле.

import { readFileSync } from "node:fs";

const env = {};
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)="?([^"\n]+)"?/);
    if (m) env[m[1]] = m[2];
  }
} catch { /* .env optional — fall back to hardcoded public values */ }

const OLA_URL = env.VITE_SUPABASE_URL ?? "https://hqrnddgpnxwdcowsmpem.supabase.co";
const OLA_ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY;
const CATALOG_FN = "https://bqbywleogtdelcmpmnny.supabase.co/functions/v1/catalog-products";

if (!OLA_ANON) {
  console.error("No anon key (.env VITE_SUPABASE_PUBLISHABLE_KEY)
