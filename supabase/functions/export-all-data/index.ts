// supabase/functions/export-all-data/index.ts
//
// РАЗОВЫЙ экспортёр для миграции. Работает ВНУТРИ бэкенда Lovable
// (единственное место, где есть service_role). Выгружает auth-пользователей
// + все нужные public-таблицы в ОДИН JSON-файл.
//
// Деплой в Lovable: попроси ассистента создать edge function с этим кодом,
// verify_jwt = false, и задай секрет проекта EXPORT_SECRET (любое значение).
// Вызвать ОДИН раз, забрать JSON, потом УДАЛИТЬ функцию (она отдаёт все PII).
//
// Вызов из браузера:
//   https://vczrkqwnokjuxehvbrbx.supabase.co/functions/v1/export-all-data?secret=ТВОЙ_СЕКРЕТ

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-export-secret',
}

// public-таблицы для выгрузки (email-очередь и регенерируемые снапшоты пропущены)
const TABLES = [
  'profiles', 'user_roles', 'login_history',
  'user_orders', 'orders', 'cart_items', 'waiting_list_items', 'promo_codes',
  'app_settings', 'brand_overrides', 'category_overrides', 'socios_product_overrides',
  'wholesale_leads', 'wholesale_invite_tokens',
  'brands', 'products',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const url = new URL(req.url)
  const secret = req.headers.get('x-export-secret') ?? url.searchParams.get('secret')
  const expected = Deno.env.get('EXPORT_SECRET')
  if (!expected || secret !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ---- auth-пользователи (хэши паролей Admin API НЕ возвращает — и не нужны) ----
  const authUsers: Record<string, unknown>[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) {
      return new Response(JSON.stringify({ error: `auth: ${error.message}` }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    for (const u of data.users) {
      authUsers.push({
        id: u.id,                              // ← СОХРАНИМ в новом проекте (связь profiles/orders)
        email: u.email,
        phone: u.phone ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        user_metadata: u.user_metadata ?? {},
        app_metadata: u.app_metadata ?? {},
      })
    }
    if (data.users.length < 1000) break
  }

  // ---- public-таблицы (пагинация по 1000; service_role обходит RLS) ----
  const tables: Record<string, unknown> = {}
  for (const t of TABLES) {
    const rows: unknown[] = []
    let from = 0
    const step = 1000
    while (true) {
      const { data, error } = await supabase.from(t).select('*').range(from, from + step - 1)
      if (error) { tables[t] = { error: error.message }; break }   // нет таблицы/данных — не падаем
      rows.push(...data)
      if (data.length < step) { tables[t] = rows; break }
      from += step
    }
  }

  const body = JSON.stringify({
    exported_at: new Date().toISOString(),
    auth_user_count: authUsers.length,
    auth_users: authUsers,
    tables,
  }, null, 2)

  return new Response(body, {
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="alaola-export.json"',
    },
  })
})