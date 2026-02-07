import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================================
// CONFIGURATION
// First 24 hours: Rapid growth to 15-35 units
// After: Slow growth to 45-75 units per week
// Reset: Every Monday at 00:00
// Key: Each product gets a unique random "personality" 
//      derived from its ID to ensure diversity
// ============================================================
const FIRST_DAY_MIN = 15;
const FIRST_DAY_MAX = 35;
const WEEK_MIN = 45;
const WEEK_MAX = 75;

// Simple hash from product ID to get a stable per-product random factor [0..1)
function productHash(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

// Get time factor based on hour (simulates user activity patterns)
function getTimeFactor(hour: number): number {
  if (hour >= 0 && hour < 8) return 0.2 + Math.random() * 0.3;
  if (hour >= 8 && hour < 12) return 0.6 + Math.random() * 0.3;
  if (hour >= 12 && hour < 22) return 0.9 + Math.random() * 0.3;
  return 0.3 + Math.random() * 0.3;
}

function getHoursSinceStart(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  return (now.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function isFirstDay(startDate: string): boolean {
  return getHoursSinceStart(startDate) < 24;
}

function getSaturationFactor(current: number, max: number): number {
  const ratio = current / max;
  if (ratio < 0.4) return 1.0;
  if (ratio < 0.6) return 0.7;
  if (ratio < 0.75) return 0.45;
  if (ratio < 0.85) return 0.2;
  if (ratio < 0.95) return 0.08;
  return 0.02;
}

function needsWeeklyReset(weekStartDate: string): boolean {
  const start = new Date(weekStartDate);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceStart >= 7;
}

function getThisMonday(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

// Generate unique per-product targets using product hash for diversity
function getFirstDayTarget(productId: string): number {
  const h = productHash(productId);
  // Map hash across the full range, then add small jitter each run
  const base = FIRST_DAY_MIN + Math.floor(h * (FIRST_DAY_MAX - FIRST_DAY_MIN + 1));
  const jitter = Math.floor(Math.random() * 5) - 2; // -2 to +2
  return Math.max(FIRST_DAY_MIN, Math.min(FIRST_DAY_MAX, base + jitter));
}

function getWeekTarget(productId: string): number {
  const h = productHash(productId);
  const base = WEEK_MIN + Math.floor(h * (WEEK_MAX - WEEK_MIN + 1));
  const jitter = Math.floor(Math.random() * 7) - 3; // -3 to +3
  return Math.max(WEEK_MIN, Math.min(WEEK_MAX, base + jitter));
}

function generateNewWeekParams(productId: string) {
  const weekMax = getWeekTarget(productId);
  return {
    max_weekly_participants: weekMax,
    base_probability: 0.005,
    cooldown_minutes: 15 + Math.floor(Math.random() * 50), // 15-64 min
    virtual_orders_count: 0,
    week_start_date: getThisMonday(),
    last_increment_at: null,
    is_manual: false,
  };
}

function generateNewProductParams(productId: string) {
  const weekMax = getWeekTarget(productId);
  return {
    max_weekly_participants: weekMax,
    base_probability: 0.005,
    cooldown_minutes: 3 + Math.floor(Math.random() * 8), // 3-10 min for first day
    virtual_orders_count: Math.floor(Math.random() * 3), // 0-2 start
    week_start_date: new Date().toISOString().split('T')[0],
    last_increment_at: null,
    is_manual: false,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate: cron secret, service role, or admin JWT
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const isCronAuth = cronSecret && expectedCronSecret && cronSecret === expectedCronSecret;
    const isServiceRoleAuth = authHeader === `Bearer ${supabaseServiceKey}`;

    let isAdminAuth = false;
    if (!isCronAuth && !isServiceRoleAuth && authHeader && authHeader.startsWith('Bearer ')) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      if (!claimsError && claimsData?.claims?.sub) {
        const userId = claimsData.claims.sub;
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

    if (!isCronAuth && !isServiceRoleAuth && !isAdminAuth) {
      console.error('Unauthorized access attempt to increment-virtual-participants');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authMethod = isCronAuth ? 'cron' : (isServiceRoleAuth ? 'service_role' : 'admin');
    console.log(`[increment] Auth: ${authMethod}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, virtual_orders_count, max_weekly_participants, base_probability, last_increment_at, cooldown_minutes, week_start_date, is_manual');

    if (fetchError) throw fetchError;

    const allProducts = products || [];
    const now = new Date();
    const currentHour = now.getHours();
    const timeFactor = getTimeFactor(currentHour);

    const updates: Promise<unknown>[] = [];
    const results: { id: string; name: string; action: string; newCount?: number; phase?: string; details?: string }[] = [];

    console.log(`[increment] ${allProducts.length} products, hour=${currentHour}, timeFactor=${timeFactor.toFixed(2)}`);

    for (const product of allProducts) {
      const productName = product.name || product.id;

      // Weekly reset check
      if (product.week_start_date && needsWeeklyReset(product.week_start_date)) {
        const newParams = generateNewWeekParams(product.id);
        updates.push(
          supabase.from('products').update(newParams).eq('id', product.id)
        );
        results.push({ id: product.id, name: productName, action: 'reset_week', newCount: 0, details: `max:${newParams.max_weekly_participants}` });
        console.log(`[${productName}] Weekly reset -> max:${newParams.max_weekly_participants}`);
        continue;
      }

      // Skip inactive
      if (product.is_manual === true) {
        results.push({ id: product.id, name: productName, action: 'inactive' });
        continue;
      }

      // Initialize new product
      if (!product.week_start_date) {
        const newParams = generateNewProductParams(product.id);
        updates.push(
          supabase.from('products').update(newParams).eq('id', product.id)
        );
        results.push({ id: product.id, name: productName, action: 'initialized', newCount: newParams.virtual_orders_count });
        console.log(`[${productName}] Initialized, max:${newParams.max_weekly_participants}`);
        continue;
      }

      const currentCount = product.virtual_orders_count || 0;
      const hoursSinceStart = getHoursSinceStart(product.week_start_date);
      const inFirstDay = isFirstDay(product.week_start_date);

      // Per-product targets for diversity
      const firstDayTarget = getFirstDayTarget(product.id);
      const weekTarget = getWeekTarget(product.id);
      const maxCount = inFirstDay ? firstDayTarget : Math.max(weekTarget, product.max_weekly_participants || weekTarget);

      // Per-product random personality factors
      const ph = productHash(product.id);
      const productActivityBias = 0.6 + ph * 0.8; // 0.6..1.4 — some products are "hotter"
      const productCooldownBias = 0.7 + (1 - ph) * 0.6; // 0.7..1.3 — inverse of activity

      let targetForPhase: number;
      let minCooldown: number;
      let maxCooldown: number;
      let incrementProbability: number;

      if (inFirstDay) {
        // FIRST 24H: aggressive growth to 15-35
        targetForPhase = firstDayTarget;
        minCooldown = Math.round((3 + Math.floor(Math.random() * 5)) * productCooldownBias);
        maxCooldown = Math.round((8 + Math.floor(Math.random() * 5)) * productCooldownBias);

        const remainingHours = Math.max(1, 24 - hoursSinceStart);
        const needed = Math.max(0, targetForPhase - currentCount);
        const neededPerHour = needed / remainingHours;

        const urgency = neededPerHour > 2 ? 1.3 : (neededPerHour > 1 ? 1.0 : 0.7);
        incrementProbability = Math.min(0.85, 0.45 * urgency * productActivityBias + Math.random() * 0.15);

        // Random skip for natural feel (10-25% chance depending on product)
        if (Math.random() < 0.1 + ph * 0.15) {
          incrementProbability *= 0.1;
        }

        console.log(`[${productName}] 1stDay: ${currentCount}/${targetForPhase}, hrs_left:${remainingHours.toFixed(1)}, prob:${incrementProbability.toFixed(3)}, bias:${productActivityBias.toFixed(2)}`);
      } else {
        // SLOW PHASE: growth to 45-75
        targetForPhase = weekTarget;
        minCooldown = Math.round((15 + Math.floor(Math.random() * 20)) * productCooldownBias);
        maxCooldown = Math.round((30 + Math.floor(Math.random() * 30)) * productCooldownBias);

        const baseProbability = product.base_probability || 0.005;
        const saturationFactor = getSaturationFactor(currentCount, targetForPhase);
        // Increased multiplier from 18 to 55 for more visible growth
        incrementProbability = baseProbability * 55 * timeFactor * saturationFactor * productActivityBias;
        // Clamp to reasonable max
        incrementProbability = Math.min(incrementProbability, 0.6);

        // Random skip only 5-15% of runs (reduced from 10-30%)
        if (Math.random() < 0.05 + (1 - ph) * 0.1) {
          incrementProbability = 0;
        }
      }

      // At target?
      if (currentCount >= targetForPhase) {
        results.push({ id: product.id, name: productName, action: 'at_target', phase: inFirstDay ? '1d' : 'slow', details: `${currentCount}/${targetForPhase}` });
        continue;
      }

      // Cooldown check
      if (product.last_increment_at) {
        const lastIncrement = new Date(product.last_increment_at);
        const minutesSinceLast = (now.getTime() - lastIncrement.getTime()) / (1000 * 60);
        const requiredCooldown = inFirstDay
          ? Math.min(product.cooldown_minutes || 5, maxCooldown)
          : (product.cooldown_minutes || 30);

        if (minutesSinceLast < requiredCooldown) {
          results.push({ id: product.id, name: productName, action: 'cooldown', phase: inFirstDay ? '1d' : 'slow', details: `${minutesSinceLast.toFixed(0)}/${requiredCooldown}min` });
          continue;
        }
      }

      // Roll dice — sometimes increment by 2 for faster products in first day
      const roll = Math.random();
      if (roll < incrementProbability) {
        let incrementBy = 1;
        // In first day, hot products can sometimes jump by 2
        if (inFirstDay && productActivityBias > 1.0 && Math.random() < 0.25) {
          incrementBy = 2;
        }
        const newCount = Math.min(currentCount + incrementBy, targetForPhase);
        const newCooldown = minCooldown + Math.floor(Math.random() * (maxCooldown - minCooldown + 1));

        updates.push(
          supabase.from('products').update({
            virtual_orders_count: newCount,
            last_increment_at: now.toISOString(),
            cooldown_minutes: newCooldown
          }).eq('id', product.id)
        );
        results.push({ id: product.id, name: productName, action: 'incremented', newCount, phase: inFirstDay ? '1d' : 'slow', details: `${currentCount}->${newCount} (target:${targetForPhase})` });
        console.log(`[${productName}] +${incrementBy}: ${currentCount}->${newCount} (target:${targetForPhase})`);
      } else {
        results.push({ id: product.id, name: productName, action: 'skip', phase: inFirstDay ? '1d' : 'slow', details: `roll:${roll.toFixed(2)} > prob:${incrementProbability.toFixed(3)}` });
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    const incrementedCount = results.filter(r => r.action === 'incremented').length;
    const resetCount = results.filter(r => r.action === 'reset_week').length;

    console.log(`[increment] Done: ${incrementedCount} incremented, ${resetCount} reset`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: allProducts.length,
        incremented: incrementedCount,
        reset: resetCount,
        config: { firstDay: `${FIRST_DAY_MIN}-${FIRST_DAY_MAX}`, week: `${WEEK_MIN}-${WEEK_MAX}` },
        details: results,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[increment] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
