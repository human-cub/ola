import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

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

    console.log(`Authenticated via: ${isCronAuth ? 'cron secret' : 'admin user'}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id');

    if (fetchError) {
      throw fetchError;
    }

    // Reset each product with new week parameters
    // Target: 63-83 participants (not 48-59)
    const updates = products?.map(async (product) => {
      const weekMax = 63 + Math.floor(Math.random() * 21); // 63-83
      
      return supabase
        .from('products')
        .update({ 
          virtual_orders_count: 0, // Reset to 0 on Monday
          max_weekly_participants: weekMax,
          week_start_date: new Date().toISOString().split('T')[0],
          last_increment_at: null,
          base_probability: 0.12 + Math.random() * 0.13, // 0.12-0.25
          cooldown_minutes: 5 + Math.floor(Math.random() * 11) // 5-15 min
        })
        .eq('id', product.id);
    });

    if (updates) {
      await Promise.all(updates);
    }

    console.log(`Successfully reset weekly orders for ${products?.length || 0} products to 0, new max: 63-83`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Reset ${products?.length || 0} products to 0, new max: 63-83`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error resetting weekly orders:', error);
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
