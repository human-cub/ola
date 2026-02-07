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
    
    // Get all pending collective orders
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('user_orders')
      .select('id, items, subtotal')
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
      .select('id, total_orders_count, prices');

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
        };
      });

      // Get the full price (first tier) for discount calculation
      let fullPrice = 0;
      updatedItems.forEach((item) => {
        const productInfo = productMap.get(item.product_id);
        if (productInfo && productInfo.prices.length > 0) {
          // First tier = highest price (people: 1)
          const sortedPrices = [...productInfo.prices].sort((a, b) => a.people - b.people);
          fullPrice += sortedPrices[0].price * item.quantity;
        }
      });

      // Calculate discount from full price
      const discountAmount = fullPrice - newSubtotal;

      // Get total participants count (sum across all items' products)
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
        console.log(`[reset-weekly-orders] Snapshot order ${order.id}: participants=${maxParticipants}, subtotal=${newSubtotal}, discount=${discountAmount}`);
      }
    }

    console.log(`[reset-weekly-orders] Successfully snapshot ${snapshotCount} pending orders`);

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
