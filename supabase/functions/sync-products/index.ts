import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface ProductData {
  id: string;
  name: string;
  weight: string;
  description?: string;
  link?: string;
  image?: string;
  priceSlider: { people: number; price: number }[];
  flavors?: string[];
  variants?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication - verify the JWT token and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Create client with user's auth header for token verification
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Invalid token:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      console.error('No user ID in token claims');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      console.error('User is not admin:', userId);
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated admin user:', userId);

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
      .select('name, weight, images, is_manual')

    if (fetchError) {
      console.error('Error fetching existing products:', fetchError)
      throw fetchError
    }

    // Create a map of existing products for fast lookup
    const existingProductMap = new Map(
      existingProducts?.map(p => [`${p.name}-${p.weight}`, p]) || []
    )

    // Separate new products and products to update
    const newProducts: ProductData[] = []
    const productsToUpdate: { name: string; weight: string; images: string[] }[] = []

    for (const p of products) {
      const key = `${p.name}-${p.weight}`
      const existing = existingProductMap.get(key)
      
      if (!existing) {
        newProducts.push(p)
      } else if (!existing.is_manual && (!existing.images || existing.images.length === 0) && p.image) {
        // Update images for non-manual products that don't have images
        productsToUpdate.push({
          name: p.name,
          weight: p.weight,
          images: [p.image]
        })
      }
    }

    console.log(`Found ${newProducts.length} new products to insert`)
    console.log(`Found ${productsToUpdate.length} products to update images`)

    // Update images for existing products
    for (const p of productsToUpdate) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: p.images })
        .eq('name', p.name)
        .eq('weight', p.weight)

      if (updateError) {
        console.error('Error updating product images:', updateError)
      }
    }

    if (newProducts.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: `All products already synced. Updated images for ${productsToUpdate.length} products`, 
          inserted: 0,
          updated: productsToUpdate.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert new products with full data
    const productsToInsert = newProducts.map(p => ({
      name: p.name,
      weight: p.weight,
      prices: p.priceSlider,
      description: p.description || null,
      link: p.link || null,
      images: p.image ? [p.image] : [],
      flavors: p.flavors || p.variants || [],
      is_manual: false,
      category: getCategoryFromProduct(p),
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
        message: `Successfully synced ${newProducts.length} new products, updated ${productsToUpdate.length} images`,
        inserted: newProducts.length,
        updated: productsToUpdate.length
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

function getCategoryFromProduct(p: ProductData): string {
  const name = p.name.toLowerCase();
  if (name.includes('protein') || name.includes('whey')) return 'proteinas';
  if (name.includes('creatina') || name.includes('creatine')) return 'creatinas';
  if (name.includes('pump') || name.includes('pre-')) return 'pre-entrenos';
  if (name.includes('gainer')) return 'aumentadores';
  if (name.includes('bar')) return 'barras';
  if (name.includes('omega')) return 'vitaminas';
  if (name.includes('collagen') || name.includes('colágeno')) return 'colageno';
  if (name.includes('magnesio')) return 'vitaminas';
  return 'proteinas';
}
