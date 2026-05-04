import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

interface PriceTier {
  people: number;
  price: number;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  flavor: string | null;
  product_image: string | null;
}

// Calculate price based on total participants and pricing tiers
function calculatePrice(prices: PriceTier[], totalParticipants: number): number {
  if (!prices || prices.length === 0) return 0;
  
  // Sort tiers by people ascending
  const sortedPrices = [...prices].sort((a, b) => a.people - b.people);
  
  // Find the applicable tier (highest tier where people <= totalParticipants)
  let applicablePrice = sortedPrices[0].price; // Default to first tier (highest price)
  
  for (const tier of sortedPrices) {
    if (totalParticipants >= tier.people) {
      applicablePrice = tier.price;
    } else {
      break;
    }
  }
  
  return applicablePrice;
}

function getCollectiveCycleClosedEmailHtml(data: Record<string, any>): string {
  const items = data.items || [];
  const itemsHtml = items.map((item: any) =>
    `<li style="padding:4px 0;">${item.quantity}x ${item.product_name}${item.flavor ? ` (${item.flavor})` : ''} — $${Math.round(item.price_per_unit * item.quantity).toLocaleString('es-AR')}</li>`
  ).join('');

  return `
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
</html>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate: either valid cron secret OR admin user token
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Option 1: Cron job authentication via secret
    const isCronAuth = cronSecret && cronSecret === expectedCronSecret;
    
    // Option 2: Admin user authentication via JWT
    let isAdminAuth = false;
    if (!isCronAuth && authHeader && authHeader.startsWith('Bearer ')) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      
      if (!claimsError && claimsData?.claims?.sub) {
        const userId = claimsData.claims.sub;
        
        // Check if user is admin
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        isAdminAuth = !!roleData;
      }
    }

    if (!isCronAuth && !isAdminAuth) {
      console.error('Unauthorized access attempt to reset-weekly-orders');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin or cron access required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[reset-weekly-orders] Authenticated via: ${isCronAuth ? 'cron secret' : 'admin user'}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ==========================================
    // STEP 1: Snapshot prices in pending collective orders
    // ==========================================
    
    // Get all pending collective orders (with user_id for email)
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('user_orders')
      .select('id, items, subtotal, user_id')
      .eq('order_type', 'collective')
      .eq('status', 'pending');

    if (ordersError) {
      console.error('[reset-weekly-orders] Error fetching pending orders:', ordersError);
      throw ordersError;
    }

    console.log(`[reset-weekly-orders] Found ${pendingOrders?.length || 0} pending collective orders to snapshot`);

    // Get all products with their current counts and prices
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, total_orders_count, prices, pending_prices');

    if (productsError) {
      console.error('[reset-weekly-orders] Error fetching products:', productsError);
      throw productsError;
    }

    // Build a map of product_id -> { total_orders_count, prices }
    const productMap = new Map<string, { total_orders_count: number; prices: PriceTier[] }>();
    products?.forEach((p) => {
      productMap.set(p.id, {
        total_orders_count: p.total_orders_count || 0,
        prices: (p.prices as PriceTier[]) || [],
      });
    });

    // Collect user IDs for email notification
    const userIdsForEmail: string[] = [];

    // Update each pending order with snapshot prices
    let snapshotCount = 0;
    for (const order of pendingOrders || []) {
      const items = order.items as OrderItem[];
      if (!items || items.length === 0) continue;

      // Calculate final price for each item based on current total_orders_count
      let newSubtotal = 0;
      const updatedItems = items.map((item) => {
        const productInfo = productMap.get(item.product_id);
        if (!productInfo) return item;

        // Calculate the final unit price based on total participants
        const finalPrice = calculatePrice(productInfo.prices, productInfo.total_orders_count);
        newSubtotal += finalPrice * item.quantity;

        return {
          ...item,
          price_per_unit: finalPrice,
          participants_count: productInfo.total_orders_count, // per-product frozen count
        };
      });

      // Get the full price (first tier) for discount calculation
      let fullPrice = 0;
      updatedItems.forEach((item) => {
        const productInfo = productMap.get(item.product_id);
        if (productInfo && productInfo.prices.length > 0) {
          const sortedPrices = [...productInfo.prices].sort((a, b) => a.people - b.people);
          fullPrice += sortedPrices[0].price * item.quantity;
        }
      });

      // Calculate discount from full price
      const discountAmount = fullPrice - newSubtotal;

      // Keep order-level participants_count as max for backward compat
      const productIds = [...new Set(updatedItems.map((i) => i.product_id))];
      let maxParticipants = 0;
      productIds.forEach((pid) => {
        const productInfo = productMap.get(pid);
        if (productInfo) {
          maxParticipants = Math.max(maxParticipants, productInfo.total_orders_count);
        }
      });

      // Update the order with snapshot data
      const { error: updateError } = await supabase
        .from('user_orders')
        .update({
          items: updatedItems,
          subtotal: newSubtotal,
          total_amount: newSubtotal, // For collective, no delivery cost yet
          discount_amount: discountAmount,
          participants_count: maxParticipants,
        })
        .eq('id', order.id);

      if (updateError) {
        console.error(`[reset-weekly-orders] Error updating order ${order.id}:`, updateError);
      } else {
        snapshotCount++;
        userIdsForEmail.push(order.user_id);
        console.log(`[reset-weekly-orders] Snapshot order ${order.id}: participants=${maxParticipants}, subtotal=${newSubtotal}, discount=${discountAmount}`);
      }
    }

    console.log(`[reset-weekly-orders] Successfully snapshot ${snapshotCount} pending orders`);

    // ==========================================
    // STEP 1.6: Clear waiting_list_items for users whose orders were just frozen
    // After snapshot, the waiting list must represent the NEW cycle (empty).
    // Frozen items live exclusively in user_orders.items from now on.
    // ==========================================
    if (userIdsForEmail.length > 0) {
      const { error: clearWLError } = await supabase
        .from('waiting_list_items')
        .delete()
        .in('user_id', userIdsForEmail);
      if (clearWLError) {
        console.error('[reset-weekly-orders] Error clearing waiting_list_items:', clearWLError);
      } else {
        console.log(`[reset-weekly-orders] Cleared waiting_list_items for ${userIdsForEmail.length} users`);
      }
    }

    // ==========================================
    // STEP 1.5: Send email notifications to users with pending orders
    // ==========================================
    if (userIdsForEmail.length > 0) {
      try {
        // Fetch user emails from profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', userIdsForEmail);

        const emailMap = new Map<string, string>();
        profiles?.forEach(p => {
          if (p.email) emailMap.set(p.user_id, p.email);
        });

        // Prepare email batch
        const emailRequests = (pendingOrders || [])
          .filter(o => emailMap.has(o.user_id))
          .map(order => ({
            type: 'collective_cycle_closed' as const,
            to: emailMap.get(order.user_id)!,
            data: {
              items: order.items,
              subtotal: order.subtotal,
            },
          }));

        if (emailRequests.length > 0) {
          const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
          if (RESEND_API_KEY) {
            for (const emailReq of emailRequests) {
              try {
                // Call the send-email function internally via Resend directly
                const emailHtml = getCollectiveCycleClosedEmailHtml(emailReq.data);
                const res = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: 'Ola <hola@alaola.com.ar>',
                    to: emailReq.to,
                    subject: '¡Tu compra colectiva se cerró! Finalizá tu pedido 🎉',
                    html: emailHtml,
                  }),
                });
                const resData = await res.json();
                if (res.ok) {
                  console.log(`[reset-weekly-orders] Email sent to ${emailReq.to}`);
                } else {
                  console.error(`[reset-weekly-orders] Email failed for ${emailReq.to}:`, resData);
                }
              } catch (emailErr) {
                console.error(`[reset-weekly-orders] Email error for ${emailReq.to}:`, emailErr);
              }
            }
          } else {
            console.log('[reset-weekly-orders] RESEND_API_KEY not set, skipping emails');
          }
        }
      } catch (emailError) {
        console.error('[reset-weekly-orders] Error sending email notifications:', emailError);
        // Don't throw - emails are non-critical
      }
    }

    // ==========================================
    // STEP 2: Reset product counters for new week
    // ==========================================
    
    const updates = products?.map(async (product) => {
      const weekMax = 45 + Math.floor(Math.random() * 21); // 45-65 (phase 2 target)
      
      return supabase
        .from('products')
        .update({ 
          virtual_orders_count: 0, // Reset to 0 on Monday
          max_weekly_participants: weekMax,
          week_start_date: new Date().toISOString().split('T')[0],
          last_increment_at: null,
          // Reset to default: speed 1.0 (0.005), mode active (is_manual = false)
          base_probability: 0.005, // Default speed = 1.0
          is_manual: false, // Default mode = Activa Siempre
          cooldown_minutes: 5 + Math.floor(Math.random() * 11) // 5-15 min
        })
        .eq('id', product.id);
    });

    if (updates) {
      await Promise.all(updates);
    }

    console.log(`[reset-weekly-orders] Successfully reset virtual counters for ${products?.length || 0} products`);

    // ==========================================
    // STEP 2.5: Apply pending_prices for the new week
    // (after orders were already snapshotted with old prices in STEP 1)
    // ==========================================
    let appliedPendingCount = 0;
    for (const product of products || []) {
      const pending = (product as any).pending_prices as PriceTier[] | null;
      if (pending && Array.isArray(pending) && pending.length > 0) {
        const { error: pendingError } = await supabase
          .from('products')
          .update({
            prices: pending,
            pending_prices: null,
          })
          .eq('id', product.id);
        if (pendingError) {
          console.error(`[reset-weekly-orders] Error applying pending_prices for ${product.id}:`, pendingError);
        } else {
          appliedPendingCount++;
        }
      }
    }
    console.log(`[reset-weekly-orders] Applied pending_prices for ${appliedPendingCount} products`);

    // Recompute waiting_for_discount_count based on current week only
    const { error: recomputeError } = await supabase.rpc('recompute_waiting_for_discount_counts');
    if (recomputeError) {
      console.error('[reset-weekly-orders] Error recomputing waiting_for_discount_counts:', recomputeError);
    } else {
      console.log('[reset-weekly-orders] Successfully recomputed waiting_for_discount_counts for new week');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Snapshot ${snapshotCount} orders, reset ${products?.length || 0} products`,
        ordersSnapshot: snapshotCount,
        productsReset: products?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('[reset-weekly-orders] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
