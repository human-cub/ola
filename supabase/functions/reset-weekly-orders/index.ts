import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
