import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderData {
  product_name: string;
  customer_name: string;
  phone: string;
  comment?: string;
  waiting_for_discount?: boolean;
  created_at: string;
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

    const orderData: OrderData = await req.json();
    
    const waitingStatus = orderData.waiting_for_discount 
      ? "🕐 <b>SÍ</b> - Espera descuento hasta domingo" 
      : "❌ No";
    
    const message = `
🔔 <b>Nueva Orden Recibida</b>

📦 <b>Producto:</b> ${orderData.product_name}
👤 <b>Cliente:</b> ${orderData.customer_name}
📱 <b>Teléfono:</b> ${orderData.phone}
💬 <b>Comentario:</b> ${orderData.comment || 'Sin comentarios'}
⏳ <b>Espera Descuento:</b> ${waitingStatus}
📅 <b>Fecha:</b> ${new Date(orderData.created_at).toLocaleString('es-AR')}
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

    console.log('Telegram notification sent successfully');
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-telegram function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
