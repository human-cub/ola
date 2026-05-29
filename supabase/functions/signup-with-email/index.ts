import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = 'Ola'
const SITE_URL = 'https://alaola.com.ar'
const SENDER_DOMAIN = 'notify.alaola.com.ar'
const FROM_DOMAIN = 'alaola.com.ar'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const isEmail = (value: unknown): value is string =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const isPassword = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value)

const getUnsubscribeToken = async (
  supabase: ReturnType<typeof createClient>,
  email: string,
): Promise<string> => {
  const { data: existing } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('email', email)
    .maybeSingle()

  if (existing?.token) return existing.token

  const token = crypto.randomUUID()
  const { error } = await supabase
    .from('email_unsubscribe_tokens')
    .insert({ email, token })

  if (error) throw error
  return token
}

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
  const redirectTo = typeof body.redirectTo === 'string' && body.redirectTo.startsWith('http')
    ? body.redirectTo
    : `${SITE_URL}/completar-perfil`

  if (!isEmail(email)) return json({ error: 'Email inválido' }, 400)
  if (!isPassword(password)) {
    return json({ error: 'La contraseña debe tener al menos 8 caracteres, con letras y números' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: { redirectTo },
  })

  if (linkError) {
    const message = linkError.message.includes('already been registered') || linkError.message.includes('already registered')
      ? 'Este email ya está registrado'
      : linkError.message
    return json({ error: message }, 400)
  }

  const confirmationUrl = linkData.properties?.action_link
  if (!confirmationUrl) return json({ error: 'No se pudo generar el enlace de confirmación' }, 500)

  const html = await renderAsync(React.createElement(SignupEmail, {
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    recipient: email,
    confirmationUrl,
  }))
  const text = await renderAsync(React.createElement(SignupEmail, {
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    recipient: email,
    confirmationUrl,
  }), { plainText: true })

  const messageId = crypto.randomUUID()
  const unsubscribeToken = await getUnsubscribeToken(supabase, email)
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: 'signup',
    recipient_email: email,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'auth_emails',
    payload: {
      message_id: messageId,
      to: email,
      from: `${SITE_NAME} <no-reply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: 'Confirmá tu cuenta de Ola',
      html,
      text,
      purpose: 'transactional',
      label: 'signup',
      idempotency_key: `signup:${messageId}`,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('Failed to enqueue signup email', enqueueError)
    return json({ error: 'No se pudo enviar el email de confirmación' }, 500)
  }

  return json({ success: true })
})
