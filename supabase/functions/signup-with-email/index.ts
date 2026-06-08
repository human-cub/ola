import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const isEmail = (value: unknown): value is string =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const isPassword = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration error' }, 500)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = body.password

  if (!isEmail(email)) return json({ error: 'Email inválido' }, 400)
  if (!isPassword(password)) {
    return json({ error: 'La contraseña debe tener al menos 8 caracteres, con letras y números' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Email confirmation disabled: create the account already confirmed, no email sent.
  const { error } = await supabase.auth.admin.createUser({
    email,
    password: password as string,
    email_confirm: true,
  })

  if (error) {
    const already =
      error.message.includes('already been registered') ||
      error.message.includes('already registered') ||
      error.message.includes('already exists')
    return json({ error: already ? 'Este email ya está registrado' : error.message }, already ? 409 : 400)
  }

  return json({ success: true })
})
