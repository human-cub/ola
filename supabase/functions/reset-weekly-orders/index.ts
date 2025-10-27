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

    // Update each product with random virtual orders between 48 and 59
    const updates = products?.map(async (product) => {
      const randomOrders = Math.floor(Math.random() * (59 - 48 + 1)) + 48;
      
      return supabase
        .from('products')
        .update({ virtual_orders_count: randomOrders })
        .eq('id', product.id);
    });

    if (updates) {
      await Promise.all(updates);
    }

    console.log(`Successfully reset virtual orders for ${products?.length || 0} products`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Reset ${products?.length || 0} products`,
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
