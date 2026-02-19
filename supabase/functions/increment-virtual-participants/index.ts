import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================================
// CONFIGURATION — 3 phases:
// Phase 1 (first 24h): Rapid growth to 15-35
// Phase 2 (Tue-Fri):   Medium growth to 45-65
// Phase 3 (Sat-Sun):   Slow growth to 72
// Reset: Every Monday at 00:00
// Virtual increments START at Monday 06:00 ART (09:00 UTC)
// ============================================================
const PHASE1_MIN = 15;
const PHASE1_MAX = 35;
const PHASE2_MIN = 45;
const PHASE2_MAX = 65;
const PHASE3_TARGET = 72;

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

// Hours since virtual increments actually started (Monday 6:00 ART = 09:00 UTC)
function getHoursSinceVirtualStart(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00Z');
  const virtualStart = new Date(start.getTime() + 9 * 60 * 60 * 1000); // 06:00 ART
  const now = new Date();
  return Math.max(0, (now.getTime() - virtualStart.getTime()) / (1000 * 60 * 60));
}

function isFirstDay(startDate: string): boolean {
  return getHoursSinceVirtualStart(startDate) < 24;
}

// Phases based on hours since virtual start (6 AM ART Monday)
// Phase 1: first 24h of active growth (Mon 6AM - Tue 6AM)
// Phase 2: next ~96h (Tue 6AM - Sat 6AM)
// Phase 3: remainder (Sat 6AM - Sun end)
function getPhase(startDate: string): 'phase1' | 'phase2' | 'phase3' {
  const hours = getHoursSinceVirtualStart(startDate);
  if (hours < 24) return 'phase1';
  if (hours < 120) return 'phase2';
  return 'phase3';
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
function getPhase1Target(productId: string): number {
  const h = productHash(productId);
  const base = PHASE1_MIN + Math.floor(h * (PHASE1_MAX - PHASE1_MIN + 1));
  const jitter = Math.floor(Math.random() * 5) - 2;
  return Math.max(PHASE1_MIN, Math.min(PHASE1_MAX, base + jitter));
}

function getPhase2Target(productId: string): number {
  const h = productHash(productId);
  const base = PHASE2_MIN + Math.floor(h * (PHASE2_MAX - PHASE2_MIN + 1));
  const jitter = Math.floor(Math.random() * 5) - 2;
  return Math.max(PHASE2_MIN, Math.min(PHASE2_MAX, base + jitter));
}

function getPhase3Target(_productId: string): number {
  // All products converge to 72 with small jitter
  const jitter = Math.floor(Math.random() * 3) - 1; // -1 to +1
  return PHASE3_TARGET + jitter; // 71-73
}

function generateNewWeekParams(productId: string) {
  const weekMax = getPhase2Target(productId);
  return {
    max_weekly_participants: weekMax,
    base_probability: 0.005,
    cooldown_minutes: 15 + Math.floor(Math.random() * 50),
    virtual_orders_count: 0,
    week_start_date: getThisMonday(),
    last_increment_at: null,
    is_manual: false,
  };
}

function generateNewProductParams(productId: string) {
  const weekMax = getPhase2Target(productId);
  return {
    max_weekly_participants: weekMax,
    base_probability: 0.005,
    cooldown_minutes: 3 + Math.floor(Math.random() * 8),
    virtual_orders_count: Math.floor(Math.random() * 3),
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
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (!userError && user?.id) {
        const userId = user.id;
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
          supabase.from('products').update(newParams).eq('id', product.id).then()
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

      // Don't start incrementing until Monday 6:00 ART (09:00 UTC)
      // This makes growth look more natural — no orders appear at midnight
      if (product.week_start_date) {
        const weekStart = new Date(product.week_start_date + 'T00:00:00Z');
        const virtualStartTime = new Date(weekStart.getTime() + 9 * 60 * 60 * 1000); // +9h = 06:00 ART
        if (now < virtualStartTime) {
          results.push({ id: product.id, name: productName, action: 'waiting_for_6am', details: `starts at ${virtualStartTime.toISOString()}` });
          continue;
        }
      }

      // Initialize new product
      if (!product.week_start_date) {
        const newParams = generateNewProductParams(product.id);
        updates.push(
          supabase.from('products').update(newParams).eq('id', product.id).then()
        );
        results.push({ id: product.id, name: productName, action: 'initialized', newCount: newParams.virtual_orders_count });
        console.log(`[${productName}] Initialized, max:${newParams.max_weekly_participants}`);
        continue;
      }

      const currentCount = product.virtual_orders_count || 0;
      const hoursSinceStart = getHoursSinceVirtualStart(product.week_start_date);
      const phase = getPhase(product.week_start_date);

      // Per-product targets for each phase
      const phase1Target = getPhase1Target(product.id);
      const phase2Target = getPhase2Target(product.id);
      const phase3Target = getPhase3Target(product.id);

      // Per-product random personality factors
      const ph = productHash(product.id);
      const productActivityBias = 0.6 + ph * 0.8; // 0.6..1.4
      const productCooldownBias = 0.7 + (1 - ph) * 0.6; // 0.7..1.3

      let targetForPhase: number;
      let minCooldown: number;
      let maxCooldown: number;
      let incrementProbability: number;
      let phaseLabel: string;

      if (phase === 'phase1') {
        // PHASE 1 (first 24h): aggressive growth to 15-35
        phaseLabel = '1d';
        targetForPhase = phase1Target;
        minCooldown = Math.round((3 + Math.floor(Math.random() * 5)) * productCooldownBias);
        maxCooldown = Math.round((8 + Math.floor(Math.random() * 5)) * productCooldownBias);

        const remainingHours = Math.max(1, 24 - hoursSinceStart);
        const needed = Math.max(0, targetForPhase - currentCount);
        const neededPerHour = needed / remainingHours;

        const urgency = neededPerHour > 2 ? 1.3 : (neededPerHour > 1 ? 1.0 : 0.7);
        incrementProbability = Math.min(0.85, 0.45 * urgency * productActivityBias + Math.random() * 0.15);

        // Random skip for natural feel
        if (Math.random() < 0.1 + ph * 0.15) {
          incrementProbability *= 0.1;
        }

        console.log(`[${productName}] Phase1: ${currentCount}/${targetForPhase}, hrs_left:${remainingHours.toFixed(1)}, prob:${incrementProbability.toFixed(3)}`);

      } else if (phase === 'phase2') {
        // PHASE 2 (Tue-Fri): medium growth to 45-65
        phaseLabel = 'p2';
        targetForPhase = phase2Target;
        minCooldown = Math.round((10 + Math.floor(Math.random() * 15)) * productCooldownBias);
        maxCooldown = Math.round((25 + Math.floor(Math.random() * 25)) * productCooldownBias);

        const baseProbability = product.base_probability || 0.005;
        const saturationFactor = getSaturationFactor(currentCount, targetForPhase);
        incrementProbability = baseProbability * 55 * timeFactor * saturationFactor * productActivityBias;
        incrementProbability = Math.min(incrementProbability, 0.6);

        // Random skip 5-15%
        if (Math.random() < 0.05 + (1 - ph) * 0.1) {
          incrementProbability = 0;
        }

      } else {
        // PHASE 3 (Sat-Sun): slow growth to 72
        phaseLabel = 'p3';
        targetForPhase = phase3Target;
        minCooldown = Math.round((30 + Math.floor(Math.random() * 30)) * productCooldownBias);
        maxCooldown = Math.round((60 + Math.floor(Math.random() * 40)) * productCooldownBias);

        const baseProbability = product.base_probability || 0.005;
        const saturationFactor = getSaturationFactor(currentCount, targetForPhase);
        // Lower multiplier for slower growth
        incrementProbability = baseProbability * 25 * timeFactor * saturationFactor * productActivityBias;
        incrementProbability = Math.min(incrementProbability, 0.35);

        // Random skip 10-20%
        if (Math.random() < 0.1 + (1 - ph) * 0.1) {
          incrementProbability = 0;
        }
      }

      // At target?
      if (currentCount >= targetForPhase) {
        results.push({ id: product.id, name: productName, action: 'at_target', phase: phaseLabel, details: `${currentCount}/${targetForPhase}` });
        continue;
      }

      // Cooldown check
      if (product.last_increment_at) {
        const lastIncrement = new Date(product.last_increment_at);
        const minutesSinceLast = (now.getTime() - lastIncrement.getTime()) / (1000 * 60);
        const requiredCooldown = phase === 'phase1'
          ? Math.min(product.cooldown_minutes || 5, maxCooldown)
          : (product.cooldown_minutes || 30);

        if (minutesSinceLast < requiredCooldown) {
          results.push({ id: product.id, name: productName, action: 'cooldown', phase: phaseLabel, details: `${minutesSinceLast.toFixed(0)}/${requiredCooldown}min` });
          continue;
        }
      }

      // Roll dice
      const roll = Math.random();
      if (roll < incrementProbability) {
        let incrementBy = 1;
        // In phase 1, hot products can sometimes jump by 2
        if (phase === 'phase1' && productActivityBias > 1.0 && Math.random() < 0.25) {
          incrementBy = 2;
        }
        const newCount = Math.min(currentCount + incrementBy, targetForPhase);
        const newCooldown = minCooldown + Math.floor(Math.random() * (maxCooldown - minCooldown + 1));

        updates.push(
          supabase.from('products').update({
            virtual_orders_count: newCount,
            last_increment_at: now.toISOString(),
            cooldown_minutes: newCooldown
          }).eq('id', product.id).then()
        );
        results.push({ id: product.id, name: productName, action: 'incremented', newCount, phase: phaseLabel, details: `${currentCount}->${newCount} (target:${targetForPhase})` });
        console.log(`[${productName}] +${incrementBy}: ${currentCount}->${newCount} (target:${targetForPhase}) [${phaseLabel}]`);
      } else {
        results.push({ id: product.id, name: productName, action: 'skip', phase: phaseLabel, details: `roll:${roll.toFixed(2)} > prob:${incrementProbability.toFixed(3)}` });
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
        config: {
          phase1: `${PHASE1_MIN}-${PHASE1_MAX}`,
          phase2: `${PHASE2_MIN}-${PHASE2_MAX}`,
          phase3: `${PHASE3_TARGET}`,
        },
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
