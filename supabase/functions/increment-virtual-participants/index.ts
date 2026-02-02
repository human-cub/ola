import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// ============================================================
// CONFIGURATION - Agreed upon targets:
// First 24 hours: Rapid growth to 27-34 units
// After: Slow growth to 53-77 units per week
// Reset: Every Monday at 00:00
// ============================================================
const FIRST_DAY_MIN = 27;
const FIRST_DAY_MAX = 34;
const WEEK_MIN = 53;
const WEEK_MAX = 77;

// Get time factor based on hour (simulates user activity patterns)
function getTimeFactor(hour: number): number {
  // Night hours (0-8): low activity
  if (hour >= 0 && hour < 8) {
    return 0.2 + Math.random() * 0.3; // 0.2-0.5
  }
  // Morning (8-12): medium activity
  if (hour >= 8 && hour < 12) {
    return 0.6 + Math.random() * 0.3; // 0.6-0.9
  }
  // Afternoon/evening (12-22): peak activity
  if (hour >= 12 && hour < 22) {
    return 0.9 + Math.random() * 0.3; // 0.9-1.2
  }
  // Late night (22-24): low activity
  return 0.3 + Math.random() * 0.3; // 0.3-0.6
}

// Get hours since week start (or product creation)
function getHoursSinceStart(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  return (now.getTime() - start.getTime()) / (1000 * 60 * 60);
}

// Check if still in first 24 hours
function isFirstDay(startDate: string): boolean {
  return getHoursSinceStart(startDate) < 24;
}

// Get saturation factor based on how close to max (for slow phase after first day)
function getSaturationFactor(current: number, max: number): number {
  const ratio = current / max;
  
  if (ratio < 0.5) return 1.0;
  if (ratio < 0.7) return 0.7;
  if (ratio < 0.85) return 0.4;
  if (ratio < 0.95) return 0.15;
  return 0.03;
}

// Check if week_start_date is from previous week (needs reset)
function needsWeeklyReset(weekStartDate: string): boolean {
  const start = new Date(weekStartDate);
  const now = new Date();
  
  // Calculate days since start
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Reset if 7+ days have passed
  return daysSinceStart >= 7;
}

// Get this Monday's date
function getThisMonday(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, etc.
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

// Generate new random parameters for a new week
function generateNewWeekParams() {
  // Week target: 53-77
  const weekMax = WEEK_MIN + Math.floor(Math.random() * (WEEK_MAX - WEEK_MIN + 1));
  
  return {
    max_weekly_participants: weekMax,
    base_probability: 0.08 + Math.random() * 0.07, // 0.08-0.15 for slow phase
    cooldown_minutes: 20 + Math.floor(Math.random() * 40), // 20-60 min
    virtual_orders_count: 0,
    week_start_date: getThisMonday(),
    last_increment_at: null,
  };
}

// Generate params for a newly added product (apply first-day logic)
function generateNewProductParams() {
  const weekMax = WEEK_MIN + Math.floor(Math.random() * (WEEK_MAX - WEEK_MIN + 1));
  
  return {
    max_weekly_participants: weekMax,
    base_probability: 0.08 + Math.random() * 0.07,
    cooldown_minutes: 5 + Math.floor(Math.random() * 6), // 5-10 min for first day
    virtual_orders_count: Math.floor(Math.random() * 3), // 0-2 start
    week_start_date: new Date().toISOString().split('T')[0], // Today as start
    last_increment_at: null,
  };
}

// Calculate first day target for this product
function getFirstDayTarget(): number {
  return FIRST_DAY_MIN + Math.floor(Math.random() * (FIRST_DAY_MAX - FIRST_DAY_MIN + 1));
}

Deno.serve(async (req) => {
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
      console.error('Unauthorized access attempt to increment-virtual-participants');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin or cron access required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[increment-virtual-participants] Authenticated via: ${isCronAuth ? 'cron secret' : 'admin user'}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, virtual_orders_count, max_weekly_participants, base_probability, last_increment_at, cooldown_minutes, week_start_date');

    if (fetchError) {
      throw fetchError;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const timeFactor = getTimeFactor(currentHour);
    
    const updates: Promise<any>[] = [];
    const results: { id: string; name: string; action: string; newCount?: number; phase?: string; details?: string }[] = [];

    console.log(`[increment-virtual-participants] Processing ${products?.length || 0} products at hour ${currentHour}, timeFactor=${timeFactor.toFixed(2)}`);

    for (const product of products || []) {
      const productName = product.name || product.id;
      
      // Check if weekly reset is needed (7+ days passed)
      if (product.week_start_date && needsWeeklyReset(product.week_start_date)) {
        const newParams = generateNewWeekParams();
        updates.push(
          (async () => {
            await supabase
              .from('products')
              .update(newParams)
              .eq('id', product.id);
          })()
        );
        results.push({ 
          id: product.id, 
          name: productName, 
          action: 'reset_week', 
          newCount: 0,
          details: `Reset to 0, new max: ${newParams.max_weekly_participants}`
        });
        console.log(`[${productName}] Weekly reset - new max: ${newParams.max_weekly_participants}`);
        continue;
      }

      // Initialize if no week_start_date (new product)
      if (!product.week_start_date) {
        const newParams = generateNewProductParams();
        updates.push(
          (async () => {
            await supabase
              .from('products')
              .update(newParams)
              .eq('id', product.id);
          })()
        );
        results.push({ 
          id: product.id, 
          name: productName, 
          action: 'initialized', 
          newCount: newParams.virtual_orders_count,
          details: `New product, max: ${newParams.max_weekly_participants}`
        });
        console.log(`[${productName}] Initialized - start: ${newParams.virtual_orders_count}, max: ${newParams.max_weekly_participants}`);
        continue;
      }

      const currentCount = product.virtual_orders_count || 0;
      const maxCount = product.max_weekly_participants || Math.floor((WEEK_MIN + WEEK_MAX) / 2);
      const hoursSinceStart = getHoursSinceStart(product.week_start_date);
      const inFirstDay = isFirstDay(product.week_start_date);
      
      // Determine targets and parameters based on phase
      let targetForPhase: number;
      let minCooldown: number;
      let maxCooldown: number;
      let incrementProbability: number;
      
      if (inFirstDay) {
        // FIRST 24 HOURS: Aggressive growth to 27-34
        targetForPhase = getFirstDayTarget();
        minCooldown = 3;  // 3-8 min cooldown (very fast)
        maxCooldown = 8;
        
        // Calculate how many we need and how fast
        const remainingHours = Math.max(1, 24 - hoursSinceStart);
        const needed = Math.max(0, targetForPhase - currentCount);
        const neededPerHour = needed / remainingHours;
        
        // With ~4 runs per hour, we need high probability
        // If behind schedule, increase probability
        const urgency = neededPerHour > 2 ? 1.2 : (neededPerHour > 1 ? 1.0 : 0.8);
        incrementProbability = Math.min(0.9, 0.5 * urgency + Math.random() * 0.2);
        
        console.log(`[${productName}] First day: ${currentCount}/${targetForPhase}, hours left: ${remainingHours.toFixed(1)}, need/hour: ${neededPerHour.toFixed(1)}, prob: ${incrementProbability.toFixed(2)}`);
      } else {
        // AFTER FIRST DAY: Slow growth to 53-77
        targetForPhase = maxCount;
        minCooldown = 30;  // 30-90 min cooldown
        maxCooldown = 90;
        
        // Base probability with saturation
        const baseProbability = product.base_probability || 0.12;
        const saturationFactor = getSaturationFactor(currentCount, maxCount);
        incrementProbability = baseProbability * timeFactor * saturationFactor;
        
        // Random skip for natural feel
        if (Math.random() < 0.1) {
          incrementProbability = 0;
        }
      }
      
      // Check if at target
      if (currentCount >= targetForPhase) {
        results.push({ 
          id: product.id, 
          name: productName, 
          action: inFirstDay ? 'at_first_day_target' : 'at_max', 
          phase: inFirstDay ? 'first_day' : 'slow',
          details: `${currentCount}/${targetForPhase}`
        });
        continue;
      }

      // Check cooldown
      if (product.last_increment_at) {
        const lastIncrement = new Date(product.last_increment_at);
        const minutesSinceLastIncrement = (now.getTime() - lastIncrement.getTime()) / (1000 * 60);
        
        const requiredCooldown = inFirstDay 
          ? Math.min(product.cooldown_minutes || 5, maxCooldown) 
          : (product.cooldown_minutes || 30);
        
        if (minutesSinceLastIncrement < requiredCooldown) {
          results.push({ 
            id: product.id, 
            name: productName, 
            action: 'cooldown', 
            phase: inFirstDay ? 'first_day' : 'slow',
            details: `${minutesSinceLastIncrement.toFixed(0)}/${requiredCooldown}min`
          });
          continue;
        }
      }

      // Roll the dice
      const roll = Math.random();
      if (roll < incrementProbability) {
        const newCount = currentCount + 1;
        const newCooldown = minCooldown + Math.floor(Math.random() * (maxCooldown - minCooldown + 1));
        
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
          name: productName, 
          action: 'incremented', 
          newCount, 
          phase: inFirstDay ? 'first_day' : 'slow',
          details: `${currentCount} -> ${newCount} (target: ${targetForPhase})`
        });
        console.log(`[${productName}] Incremented: ${currentCount} -> ${newCount} (target: ${targetForPhase})`);
      } else {
        results.push({ 
          id: product.id, 
          name: productName, 
          action: 'no_increment', 
          phase: inFirstDay ? 'first_day' : 'slow',
          details: `roll ${roll.toFixed(2)} > prob ${incrementProbability.toFixed(2)}`
        });
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    const incrementedCount = results.filter(r => r.action === 'incremented').length;
    const resetCount = results.filter(r => r.action === 'reset_week').length;
    const firstDayProducts = results.filter(r => r.phase === 'first_day').length;

    console.log(`[increment-virtual-participants] Summary: ${products?.length || 0} products, ${incrementedCount} incremented, ${resetCount} reset, ${firstDayProducts} in first-day phase`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: products?.length || 0,
        incremented: incrementedCount,
        reset: resetCount,
        firstDayProducts,
        hour: currentHour,
        timeFactor: timeFactor.toFixed(2),
        config: {
          firstDayTarget: `${FIRST_DAY_MIN}-${FIRST_DAY_MAX}`,
          weeklyTarget: `${WEEK_MIN}-${WEEK_MAX}`
        },
        details: results,
        timestamp: now.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('[increment-virtual-participants] Error:', error);
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
