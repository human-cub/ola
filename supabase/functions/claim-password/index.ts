// claim-password: migration helper.
// Lets a migrated user (no password yet) set their password on first login attempt.
// GUARDRAIL: only sets a password while user_metadata.password_set === false.
// Never overwrites an existing password -> established accounts are untouchable,
// and each account is claimable only once (its first login).
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
const isEmail = (v: unknown): v is string =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return json({ claimed: false }, 405)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ claimed: false }) }

  const email = isEmail(body?.email) ? (body.email as string).trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? (body.password as string) : ''
  if (!email || password.length < 6) return json({ claimed: false })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null
  for (let page = 1; page <= 5 && !user; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return json({ claimed: false })
    user = data.users.find((u) => (u.email ?? '').toLowerCase() === email) ?? null
    if (data.users.length < 1000) break
  }

  if (!user || (user.user_metadata?.password_set) !== false) return json({ claimed: false })

  const { error: upErr } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    user_metadata: { ...user.user_metadata, password_set: true },
  })
  if (upErr) return json({ claimed: false })

  return json({ claimed: true })
})
