import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================================
// NEW ALGORITHM — linear daily growth
// Start: Monday 10:00 ART (13:00 UTC)
// Day 1 (first 24h): 4-7 units total
// Day 2 (24-48h):    +2-4 units
// Day 3+ (each 24h): +1-3 units
// ============================================================

function productHash(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

function getHoursSinceVirtualStart(weekStartDate: string): number {
  const start = new Date(weekStartDate + 'T00:00:00Z');
  // 10:00 ART = 13:00 UTC
  const virtualStart = new Date(start.getTime() + 13 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(0, (now.getTime() - virtualStart.getTime()) / (1000 * 60 * 60));
}

function getDayNumber(weekStartDate: string): number {
  const hours = getHoursSinceVirtualStart(weekStartDate);
  return Math.floor(hours / 24) + 1; // day 1, 2, 3...
}

function getDailyTarget(productId: string, day: number): { min: number; max: number } {
  const ph = productHash(productId);
  if (day === 1) return { min: 4, max: 7 };
  if (day === 2) return { min: 2, max: 4 };
  return { min: 1, max: 3 };
}

function getCumulativeTarget(productId: string, day: number): number {
  let total = 0;
  const ph = productHash(productId);
  for (let d = 1; d <= day; d++) {
    const { min, max } = getDailyTarget(productId, d);
    // Use product hash to get a stable per-product target within range
    total += min + Math.round(ph * (max - min));
  }
  return total;
}

function needsWeeklyReset(weekStartDate: string): boolean {
  const start = new Date(weekStartDate);
  const now = new Date();
  return (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) >= 7;
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

function generateNewProductParams(productId: string) {
  return {
    base_probability: 0.005,
    cooldown_minutes: 10 + Math.floor(Math.random() * 20),
    virtual_orders_count: 0,
    week_start_date: getThisMonday(),
    last_increment_at: null,
    is_manual: false,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const isCronAuth = cronSecret && expectedCronSecret && cronSecret === expectedCronSecret;
    const isServiceRoleAuth = authHeader === `Bearer ${supabaseServiceKey}`;

    let isAdminAuth = false;
    if (!isCronAuth && !isServiceRoleAuth && authHeader?.startsWith('Bearer ')) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (!userError && user?.id) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        isAdminAuth = !!roleData;
      }
    }

    if (!isCronAuth && !isServiceRoleAuth && !isAdminAuth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, virtual_orders_count, last_increment_at, cooldown_minutes, week_start_date, is_manual');

    if (fetchError) throw fetchError;

    const allProducts = products || [];
    const now = new Date();
    const updates: Promise<unknown>[] = [];
    const results: { id: string; name: string; action: string; details?: string }[] = [];

    console.log(`[increment] ${allProducts.length} products`);

    for (const product of allProducts) {
      const pName = product.name || product.id;

      // Skip if awaiting weekly reset
      if (product.week_start_date && needsWeeklyReset(product.week_start_date)) {
        results.push({ id: product.id, name: pName, action: 'awaiting_reset' });
        continue;
      }

      // Skip manual/inactive
      if (product.is_manual === true) {
        results.push({ id: product.id, name: pName, action: 'inactive' });
        continue;
      }

      // Wait until 10:00 ART (13:00 UTC)
      if (product.week_start_date) {
        const weekStart = new Date(product.week_start_date + 'T00:00:00Z');
        const virtualStartTime = new Date(weekStart.getTime() + 13 * 60 * 60 * 1000);
        if (now < virtualStartTime) {
          results.push({ id: product.id, name: pName, action: 'waiting_10am', details: `starts ${virtualStartTime.toISOString()}` });
          continue;
        }
      }

      // Initialize new product
      if (!product.week_start_date) {
        const params = generateNewProductParams(product.id);
        updates.push(supabase.from('products').update(params).eq('id', product.id));
        results.push({ id: product.id, name: pName, action: 'initialized' });
        continue;
      }

      const currentCount = product.virtual_orders_count || 0;
      const hoursSinceStart = getHoursSinceVirtualStart(product.week_start_date);
      const day = getDayNumber(product.week_start_date);
      const targetForDay = getCumulativeTarget(product.id, day);

      // Already at or above target for this day
      if (currentCount >= targetForDay) {
        results.push({ id: product.id, name: pName, action: 'at_target', details: `${currentCount}/${targetForDay} day${day}` });
        continue;
      }

      // Cooldown check
      if (product.last_increment_at) {
        const minutesSinceLast = (now.getTime() - new Date(product.last_increment_at).getTime()) / (1000 * 60);
        const cooldown = product.cooldown_minutes || 15;
        if (minutesSinceLast < cooldown) {
          results.push({ id: product.id, name: pName, action: 'cooldown', details: `${minutesSinceLast.toFixed(0)}/${cooldown}min` });
          continue;
        }
      }

      // Calculate probability based on urgency
      const hoursIntoDay = hoursSinceStart % 24;
      const hoursLeftInDay = Math.max(1, 24 - hoursIntoDay);
      const needed = Math.max(0, targetForDay - currentCount);
      const neededPerHour = needed / hoursLeftInDay;

      // Time-based activity factor (higher during daytime ART)
      const artHour = (now.getUTCHours() - 3 + 24) % 24;
      let timeFactor = 0.3;
      if (artHour >= 8 && artHour < 12) timeFactor = 0.7;
      else if (artHour >= 12 && artHour < 22) timeFactor = 1.0;
      else if (artHour >= 22) timeFactor = 0.4;

      let probability = Math.min(0.8, 0.3 * neededPerHour * timeFactor + Math.random() * 0.1);

      // Random skip for natural feel (5-10%)
      const ph = productHash(product.id);
      if (Math.random() < 0.05 + ph * 0.05) {
        probability *= 0.05;
      }

      const roll = Math.random();
      if (roll < probability) {
        const newCount = Math.min(currentCount + 1, targetForDay);
        const newCooldown = 10 + Math.floor(Math.random() * 30); // 10-40 min

        updates.push(
          supabase.from('products').update({
            virtual_orders_count: newCount,
            last_increment_at: now.toISOString(),
            cooldown_minutes: newCooldown,
          }).eq('id', product.id)
        );
        results.push({ id: product.id, name: pName, action: 'incremented', details: `${currentCount}->${newCount} (target:${targetForDay}, day${day})` });
        console.log(`[${pName}] +1: ${currentCount}->${newCount} (target:${targetForDay}, day${day})`);
      } else {
        results.push({ id: product.id, name: pName, action: 'skip', details: `roll:${roll.toFixed(2)} > prob:${probability.toFixed(3)}` });
      }
    }

    if (updates.length > 0) await Promise.all(updates);

    const incrementedCount = results.filter(r => r.action === 'incremented').length;
    console.log(`[increment] Done: ${incrementedCount} incremented`);

    return new Response(
      JSON.stringify({ success: true, processed: allProducts.length, incremented: incrementedCount, details: results, timestamp: now.toISOString() }),
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
