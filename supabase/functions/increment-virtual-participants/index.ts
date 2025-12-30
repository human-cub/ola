import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get time factor based on hour (simulates user activity patterns)
function getTimeFactor(hour: number): number {
  // Night hours (22-10): low activity
  if (hour >= 22 || hour < 10) {
    return 0.1 + Math.random() * 0.3; // 0.1-0.4
  }
  // Peak hours (12-21): high activity
  return 0.9 + Math.random() * 0.5; // 0.9-1.4
}

// Get saturation factor based on how close to max
function getSaturationFactor(current: number, max: number): number {
  const ratio = current / max;
  
  if (ratio < 0.4) return 1.0;
  if (ratio < 0.7) return 0.6;
  if (ratio < 0.9) return 0.25;
  return 0.05;
}

// Check if a new week has started (Monday)
function isNewWeek(weekStartDate: string): boolean {
  const start = new Date(weekStartDate);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceStart >= 7;
}

// Generate new random parameters for a product
function generateNewWeekParams() {
  return {
    max_weekly_participants: 55 + Math.floor(Math.random() * 26), // 55-80
    base_probability: 0.15 + Math.random() * 0.15, // 0.15-0.30 (15-30% chance per run)
    cooldown_minutes: 15 + Math.floor(Math.random() * 46), // 15-60 minutes (faster cycles)
    virtual_orders_count: Math.floor(Math.random() * 6), // 0-5 start
    week_start_date: new Date().toISOString().split('T')[0],
    last_increment_at: null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all products with their virtual participant settings
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, virtual_orders_count, max_weekly_participants, base_probability, last_increment_at, cooldown_minutes, week_start_date');

    if (fetchError) {
      throw fetchError;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const timeFactor = getTimeFactor(currentHour);
    
    const updates: Promise<any>[] = [];
    const results: { id: string; action: string; newCount?: number }[] = [];

    for (const product of products || []) {
      // Check if new week - reset with new random parameters
      if (product.week_start_date && isNewWeek(product.week_start_date)) {
        const newParams = generateNewWeekParams();
        updates.push(
          (async () => {
            await supabase
              .from('products')
              .update(newParams)
              .eq('id', product.id);
          })()
        );
        results.push({ id: product.id, action: 'reset_week', newCount: newParams.virtual_orders_count });
        continue;
      }

      // Check cooldown
      if (product.last_increment_at) {
        const lastIncrement = new Date(product.last_increment_at);
        const minutesSinceLastIncrement = (now.getTime() - lastIncrement.getTime()) / (1000 * 60);
        
        if (minutesSinceLastIncrement < product.cooldown_minutes) {
          results.push({ id: product.id, action: 'cooldown' });
          continue;
        }
      }

      // Check if already at max
      const currentCount = product.virtual_orders_count || 0;
      const maxCount = product.max_weekly_participants || 70;
      
      if (currentCount >= maxCount) {
        results.push({ id: product.id, action: 'at_max' });
        continue;
      }

      // Calculate probability of adding a participant
      // Use higher default probability for meaningful increments
      const baseProbability = product.base_probability < 0.05 ? 0.20 : product.base_probability;
      const saturationFactor = getSaturationFactor(currentCount, maxCount);
      
      // Add random "skip" factor (8% chance of no growth at all this run)
      const skipFactor = Math.random() < 0.08 ? 0 : 1;
      
      const finalProbability = baseProbability * timeFactor * saturationFactor * skipFactor;
      
      // Roll the dice
      if (Math.random() < finalProbability) {
        const newCount = currentCount + 1;
        const newCooldown = 30 + Math.floor(Math.random() * 151); // New random cooldown
        
        updates.push(
          (async () => {
            await supabase
              .from('products')
              .update({ 
                virtual_orders_count: newCount,
                last_increment_at: now.toISOString(),
                cooldown_minutes: newCooldown
              })
              .eq('id', product.id);
          })()
        );
        results.push({ id: product.id, action: 'incremented', newCount });
      } else {
        results.push({ id: product.id, action: 'no_increment' });
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    const incrementedCount = results.filter(r => r.action === 'incremented').length;
    const resetCount = results.filter(r => r.action === 'reset_week').length;

    console.log(`Processed ${products?.length || 0} products: ${incrementedCount} incremented, ${resetCount} reset, hour=${currentHour}, timeFactor=${timeFactor.toFixed(2)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: products?.length || 0,
        incremented: incrementedCount,
        reset: resetCount,
        hour: currentHour,
        timeFactor: timeFactor.toFixed(2),
        details: results,
        timestamp: now.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing virtual participants:', error);
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
