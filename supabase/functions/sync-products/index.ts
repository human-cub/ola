import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductData {
  id: string;
  name: string;
  weight: string;
  priceSlider: { people: number; price: number }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { products } = await req.json() as { products: ProductData[] }

    if (!products || !Array.isArray(products)) {
      console.error('Invalid products data received')
      return new Response(
        JSON.stringify({ error: 'Invalid products data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Syncing ${products.length} products...`)

    // Get existing products from database
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('name, weight')

    if (fetchError) {
      console.error('Error fetching existing products:', fetchError)
      throw fetchError
    }

    // Create a set of existing product keys for fast lookup
    const existingProductKeys = new Set(
      existingProducts?.map(p => `${p.name}-${p.weight}`) || []
    )

    // Filter out products that already exist
    const newProducts = products.filter(
      p => !existingProductKeys.has(`${p.name}-${p.weight}`)
    )

    console.log(`Found ${newProducts.length} new products to insert`)

    if (newProducts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All products already synced', inserted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert new products
    const productsToInsert = newProducts.map(p => ({
      name: p.name,
      weight: p.weight,
      prices: p.priceSlider,
    }))

    const { error: insertError } = await supabase
      .from('products')
      .insert(productsToInsert)

    if (insertError) {
      console.error('Error inserting products:', insertError)
      throw insertError
    }

    console.log(`Successfully inserted ${newProducts.length} products`)

    return new Response(
      JSON.stringify({ 
        message: `Successfully synced ${newProducts.length} new products`,
        inserted: newProducts.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})