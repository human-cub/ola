import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const REF_RE = /^[A-Z2-9]{7}$/

async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const svcKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !svcKey) return json({ error: 'Server configuration error' }, 500)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ ok: false }, 200) }
  const refCode = typeof body.ref_code === 'string' ? body.ref_code.trim().toUpperCase() : ''
  const visitorHash = typeof body.visitor_hash === 'string' ? body.visitor_hash.trim() : ''
  if (!REF_RE.test(refCode)) return json({ ok: false }, 200)

  const xff = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || ''
  const ip = (xff.split(',')[0] || '').trim() || 'unknown'
  const ipHash = await sha256hex(ip + '|' + svcKey)

  let caller: string | null = null
  const authH = req.headers.get('Authorization')
  if (authH && anonKey) {
    try {
      const uc = createClient(url, anonKey, { global: { headers: { Authorization: authH } } })
      const { data } = await uc.auth.getUser()
      caller = data?.user?.id ?? null
    } catch { /* anon visitor */ }
  }

  const svc = createClient(url, svcKey)
  await svc.rpc('record_referral_click', {
    _ref_code: refCode,
    _visitor_hash: visitorHash || null,
    _ip_hash: ipHash,
    _caller: caller,
  })
  return json({ ok: true }, 200)
})
