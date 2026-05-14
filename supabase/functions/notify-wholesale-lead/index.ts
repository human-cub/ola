import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LeadData {
  full_name: string;
  phone: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram credentials');
      return new Response(
        JSON.stringify({ error: 'Missing Telegram credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as LeadData;

    if (!body?.full_name || !body?.phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify a matching wholesale_leads record was actually inserted recently.
    // This prevents abuse of the open Telegram notification endpoint by tying
    // every notification to a real DB row (which is the actual lead submission).
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const sinceIso = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: matching, error: matchErr } = await supabaseAdmin
      .from('wholesale_leads')
      .select('id')
      .eq('full_name', body.full_name)
      .eq('phone', body.phone)
      .gte('created_at', sinceIso)
      .limit(1);

    if (matchErr) {
      console.error('Lead lookup failed:', matchErr);
      return new Response(
        JSON.stringify({ error: 'Verification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!matching || matching.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No matching recent lead found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullName = escapeHtml(String(body.full_name).slice(0, 200));
    const phone = escapeHtml(String(body.phone).slice(0, 50));

    const message = `
🏪 <b>Nueva Solicitud Mayorista</b>

👤 <b>Nombre:</b> ${fullName}
📱 <b>Teléfono:</b> ${phone}
📋 <b>Tipo:</b> Solicitud de catálogo mayorista
    `.trim();

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.text();
      console.error('Telegram API error:', errorData);
      throw new Error(`Telegram API error: ${errorData}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-wholesale-lead function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});