import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-cron-secret',
};

const SENDER = 'Ola! Marketplace <hola@alaola.com.ar>';

interface EmailRequest {
  type: 'welcome' | 'order_confirmation' | 'collective_cycle_closed' | 'collective_order_confirmed' | 'password_reset';
  to: string;
  data?: Record<string, any>;
}

function getWelcomeEmail(to: string) {
  return {
    from: SENDER,
    to,
    subject: '¡Bienvenido/a a Ola! 🌊',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="background:white;border-radius:16px;padding:40px 32px;text-align:center;">
    <img src="https://alaola.com.ar/lovable-uploads/f61342f0-4c86-4d5f-8e4a-6f6380460a50.png" alt="Ola" width="60" height="60" style="margin-bottom:16px;" />
    <h1 style="font-size:24px;color:#1a1a1a;margin:0 0 8px;">¡Bienvenido/a a Ola! 🌊</h1>
    <p style="color:#666;font-size:16px;line-height:1.5;margin:0 0 24px;">
      Tu cuenta fue creada exitosamente.<br/>
      Accedé a precios de mayorista — hasta 50% menos.
    </p>
    <a href="https://alaola.com.ar/" style="display:inline-block;background:#1a1a1a;color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
      Explorar productos
    </a>
    <p style="color:#999;font-size:13px;margin-top:24px;">
      ¿Preguntas? Escribinos a <a href="mailto:hola@alaola.com.ar" style="color:#1a1a1a;">hola@alaola.com.ar</a>
    </p>
  </div>
</div>
</body>
</html>`,
  };
}

function getOrderConfirmationEmail(to: string, data: Record<string, any>) {
  const items = data.items || [];
  const itemsHtml = items.map((item: any) =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.quantity}x ${item.product_name}${item.flavor ? ` (${item.flavor})` : ''}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">$${Math.round(item.price_per_unit * item.quantity).toLocaleString('es-AR')}</td>
    </tr>`
  ).join('');

  return {
    from: SENDER,
    to,
    subject: `Pedido confirmado #${data.order_number} ✅`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="background:white;border-radius:16px;padding:40px 32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="https://alaola.com.ar/lovable-uploads/f61342f0-4c86-4d5f-8e4a-6f6380460a50.png" alt="Ola" width="48" height="48" />
    </div>
    <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 4px;text-align:center;">¡Pedido confirmado! ✅</h1>
    <p style="color:#666;text-align:center;margin:0 0 24px;">Pedido <strong>#${data.order_number}</strong></p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr><th style="text-align:left;padding:8px 0;border-bottom:2px solid #eee;font-size:14px;color:#666;">Producto</th><th style="text-align:right;padding:8px 0;border-bottom:2px solid #eee;font-size:14px;color:#666;">Precio</th></tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    ${data.delivery_cost > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#666;"><span>Envío</span><span>$${Math.round(data.delivery_cost).toLocaleString('es-AR')}</span></div>` : ''}

    <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid #1a1a1a;margin-top:8px;">
      <strong style="font-size:18px;">TOTAL</strong>
      <strong style="font-size:18px;">$${Math.round(data.total).toLocaleString('es-AR')}</strong>
    </div>

    <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin-top:16px;font-size:14px;">
      <p style="margin:0 0 4px;"><strong>Pago:</strong> ${data.payment_method || 'No especificado'}</p>
      ${data.address ? `<p style="margin:0;"><strong>Dirección:</strong> ${data.address}</p>` : ''}
    </div>

    <div style="text-align:center;margin-top:24px;">
      <a href="https://alaola.com.ar/mi-cuenta/pedidos/${data.order_id}" style="display:inline-block;background:#1a1a1a;color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Ver comprobante
      </a>
    </div>

    <p style="color:#999;font-size:13px;text-align:center;margin-top:24px;">
      Nos pondremos en contacto en las próximas horas para confirmar los detalles.
    </p>
  </div>
</div>
</body>
</html>`,
  };
}

function getCollectiveCycleClosedEmail(to: string, data: Record<string, any>) {
  const items = data.items || [];
  const itemsHtml = items.map((item: any) =>
    `<li style="padding:4px 0;">${item.quantity}x ${item.product_name}${item.flavor ? ` (${item.flavor})` : ''} — $${Math.round(item.price_per_unit * item.quantity).toLocaleString('es-AR')}</li>`
  ).join('');

  return {
    from: SENDER,
    to,
    subject: '¡Tu compra colectiva se cerró! Finalizá tu pedido 🎉',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="background:white;border-radius:16px;padding:40px 32px;text-align:center;">
    <img src="https://alaola.com.ar/lovable-uploads/f61342f0-4c86-4d5f-8e4a-6f6380460a50.png" alt="Ola" width="48" height="48" style="margin-bottom:16px;" />
    <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 8px;">¡Compra colectiva cerrada! 🎉</h1>
    <p style="color:#666;font-size:15px;line-height:1.5;margin:0 0 8px;">
      El ciclo de esta semana terminó. Tu pedido está listo para ser finalizado.
    </p>
    <p style="color:#1a1a1a;font-size:20px;font-weight:700;margin:16px 0;">
      Total: $${Math.round(data.subtotal).toLocaleString('es-AR')}
    </p>
    <ul style="text-align:left;list-style:none;padding:0;margin:0 0 24px;">${itemsHtml}</ul>
    <a href="https://alaola.com.ar/lista-espera" style="display:inline-block;background:#1a1a1a;color:white;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;">
      Finalizar pedido
    </a>
    <p style="color:#e53e3e;font-size:13px;margin-top:16px;">
      ⏰ Tenés hasta el próximo domingo para confirmar tu pedido. Si no confirmás, se cancelará automáticamente.
    </p>
  </div>
</div>
</body>
</html>`,
  };
}

function getPasswordResetEmail(to: string, resetLink: string) {
  return {
    from: SENDER,
    to,
    subject: 'Restablecé tu contraseña 🔑',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="background:white;border-radius:16px;padding:40px 32px;text-align:center;">
    <img src="https://alaola.com.ar/lovable-uploads/f61342f0-4c86-4d5f-8e4a-6f6380460a50.png" alt="Ola" width="48" height="48" style="margin-bottom:16px;" />
    <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 8px;">Restablecé tu contraseña</h1>
    <p style="color:#666;font-size:15px;line-height:1.5;margin:0 0 24px;">
      Recibimos tu solicitud para restablecer la contraseña de tu cuenta.<br/>
      Hacé clic en el botón de abajo para elegir una nueva.
    </p>
    <a href="${resetLink}" style="display:inline-block;background:#1a1a1a;color:white;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;">
      Restablecer contraseña
    </a>
    <p style="color:#999;font-size:13px;margin-top:24px;">
      Si no solicitaste este cambio, podés ignorar este email tranquilamente.
    </p>
    <p style="color:#ccc;font-size:12px;margin-top:16px;">
      Este enlace es válido por 1 hora.
    </p>
  </div>
</div>
</body>
</html>`,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Allow both authenticated users and cron jobs
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    const isCronAuth = cronSecret && cronSecret === expectedCronSecret;

    if (!isCronAuth) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const body: EmailRequest | EmailRequest[] = await req.json();
    const emails = Array.isArray(body) ? body : [body];
    
    const results = [];

    for (const emailReq of emails) {
      let emailPayload;

      switch (emailReq.type) {
        case 'welcome':
          emailPayload = getWelcomeEmail(emailReq.to);
          break;
        case 'order_confirmation':
        case 'collective_order_confirmed':
          emailPayload = getOrderConfirmationEmail(emailReq.to, emailReq.data || {});
          break;
        case 'collective_cycle_closed':
          emailPayload = getCollectiveCycleClosedEmail(emailReq.to, emailReq.data || {});
          break;
        case 'password_reset': {
          // Generate reset link using admin API
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

          const redirectTo = emailReq.data?.redirectTo || 'https://alaola.com.ar/restablecer-clave';

          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: emailReq.to,
            options: { redirectTo },
          });

          if (linkError) {
            console.error('Failed to generate reset link:', linkError);
            results.push({ to: emailReq.to, success: false, error: linkError.message });
            continue;
          }

          // Build the redirect URL with the token hash
          const tokenHash = linkData.properties?.hashed_token;
          const resetLink = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`;

          emailPayload = getPasswordResetEmail(emailReq.to, resetLink);
          break;
        }
        default:
          results.push({ to: emailReq.to, success: false, error: 'Unknown email type' });
          continue;
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      const resData = await res.json();

      if (!res.ok) {
        console.error(`Failed to send ${emailReq.type} to ${emailReq.to}:`, resData);
        results.push({ to: emailReq.to, success: false, error: resData });
      } else {
        console.log(`Sent ${emailReq.type} to ${emailReq.to}`);
        results.push({ to: emailReq.to, success: true, id: resData.id });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
