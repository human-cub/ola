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

// Get hours since week start
function getHoursSinceWeekStart(weekStartDate: string): number {
  const start = new Date(weekStartDate);
  const now = new Date();
  return (now.getTime() - start.getTime()) / (1000 * 60 * 60);
}

// Check if still in first 24 hours
function isFirstDay(weekStartDate: string): boolean {
  return getHoursSinceWeekStart(weekStartDate) < 24;
}

// Get saturation factor based on how close to max (for slow phase after first day)
function getSaturationFactor(current: number, max: number): number {
  const ratio = current / max;
  
  if (ratio < 0.4) return 1.0;
  if (ratio < 0.7) return 0.6;
  if (ratio < 0.9) return 0.25;
  return 0.05;
}

// Check if a new week has started (7 days passed)
function isNewWeek(weekStartDate: string): boolean {
  const start = new Date(weekStartDate);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceStart >= 7;
}

// Generate new random parameters for a product
function generateNewWeekParams() {
  // First day target: 27-48 participants
  // Total week target: 83
  return {
    max_weekly_participants: 83, // Fixed max of 83
    first_day_target: 27 + Math.floor(Math.random() * 22), // 27-48 for first day
    base_probability: 0.15 + Math.random() * 0.15, // 0.15-0.30 for slow phase
    cooldown_minutes: 5 + Math.floor(Math.random() * 11), // 5-15 min for first day (faster)
    virtual_orders_count: Math.floor(Math.random() * 4), // 0-3 start
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
    const results: { id: string; action: string; newCount?: number; phase?: string }[] = [];

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

      // Initialize if no week_start_date
      if (!product.week_start_date) {
        const newParams = generateNewWeekParams();
        updates.push(
          (async () => {
            await supabase
              .from('products')
              .update(newParams)
              .eq('id', product.id);
          })()
        );
        results.push({ id: product.id, action: 'initialized', newCount: newParams.virtual_orders_count });
        continue;
      }

      const currentCount = product.virtual_orders_count || 0;
      const maxCount = product.max_weekly_participants || 83;
      const firstDayTarget = 35; // Default first day target if not set (midpoint of 27-48)
      
      // Check if still in first 24 hours (fast growth phase)
      const inFirstDay = isFirstDay(product.week_start_date);
      const hoursSinceStart = getHoursSinceWeekStart(product.week_start_date);
      
      // Determine current target based on phase
      let currentPhaseMax: number;
      let cooldownMin: number;
      let cooldownMax: number;
      let baseProbability: number;
      
      if (inFirstDay) {
        // First 24 hours: aggressive growth to reach 27-48
        currentPhaseMax = firstDayTarget;
        cooldownMin = 3; // 3-10 min cooldown (very fast)
        cooldownMax = 10;
        
        // Calculate how many we need per hour to hit target
        const remainingHours = Math.max(1, 24 - hoursSinceStart);
        const needed = Math.max(0, currentPhaseMax - currentCount);
        const neededPerHour = needed / remainingHours;
        
        // With 4 runs per hour (every 15 min), we need high probability
        // If we need 2 per hour, and 4 runs per hour, each run needs 50% success
        baseProbability = Math.min(0.85, Math.max(0.3, neededPerHour / 3));
      } else {
        // After first day: slow growth from first_day_target to 83
        currentPhaseMax = maxCount;
        cooldownMin = 30; // 30-120 min cooldown (slower)
        cooldownMax = 120;
        baseProbability = product.base_probability || 0.15;
      }
      
      // Check if at current phase max
      if (currentCount >= currentPhaseMax) {
        if (inFirstDay) {
          results.push({ id: product.id, action: 'at_first_day_target', phase: 'first_day' });
        } else {
          results.push({ id: product.id, action: 'at_max', phase: 'slow' });
        }
        continue;
      }

      // Check cooldown
      if (product.last_increment_at) {
        const lastIncrement = new Date(product.last_increment_at);
        const minutesSinceLastIncrement = (now.getTime() - lastIncrement.getTime()) / (1000 * 60);
        
        // Use shorter cooldown for first day
        const requiredCooldown = inFirstDay 
          ? Math.min(product.cooldown_minutes || 5, 10) 
          : (product.cooldown_minutes || 30);
        
        if (minutesSinceLastIncrement < requiredCooldown) {
          results.push({ id: product.id, action: 'cooldown', phase: inFirstDay ? 'first_day' : 'slow' });
          continue;
        }
      }

      // Calculate final probability
      let finalProbability: number;
      
      if (inFirstDay) {
        // First day: high probability with slight time variation
        finalProbability = baseProbability * (0.8 + Math.random() * 0.4);
      } else {
        // After first day: use saturation and time factors for natural slow growth
        const saturationFactor = getSaturationFactor(currentCount, maxCount);
        const skipFactor = Math.random() < 0.08 ? 0 : 1; // 8% chance of skip
        finalProbability = baseProbability * timeFactor * saturationFactor * skipFactor;
      }
      
      // Roll the dice
      if (Math.random() < finalProbability) {
        const newCount = currentCount + 1;
        const newCooldown = cooldownMin + Math.floor(Math.random() * (cooldownMax - cooldownMin + 1));
        
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
        results.push({ 
          id: product.id, 
          action: 'incremented', 
          newCount, 
          phase: inFirstDay ? 'first_day' : 'slow' 
        });
      } else {
        results.push({ 
          id: product.id, 
          action: 'no_increment', 
          phase: inFirstDay ? 'first_day' : 'slow' 
        });
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    const incrementedCount = results.filter(r => r.action === 'incremented').length;
    const resetCount = results.filter(r => r.action === 'reset_week').length;
    const firstDayProducts = results.filter(r => r.phase === 'first_day').length;

    console.log(`Processed ${products?.length || 0} products: ${incrementedCount} incremented, ${resetCount} reset, ${firstDayProducts} in first-day phase, hour=${currentHour}, timeFactor=${timeFactor.toFixed(2)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: products?.length || 0,
        incremented: incrementedCount,
        reset: resetCount,
        firstDayProducts,
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
