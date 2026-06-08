-- Weekly rollover schedule for ola-app, all pivoting at Monday 00:00 ART (UTC-3).
-- Times in UTC (ART + 3h). Jobs are upserted by name via cron.schedule.
--
-- NOTE: the live jobs are configured via Supabase MCP with the real CRON_SECRET,
-- which is kept in the project's edge-function secrets and is intentionally NOT
-- committed here. The token below is a placeholder so this file documents the
-- schedule without leaking the secret. Re-applying this file requires substituting
-- the real value (or re-running the cron.schedule calls through the dashboard/MCP).

-- Close the week (snapshot order prices + emails) — Sun 23:59 ART = Mon 02:59 UTC
SELECT cron.schedule('reset-weekly-orders', '59 2 * * 1',
  $$SELECT net.http_post(url:='https://hqrnddgpnxwdcowsmpem.supabase.co/functions/v1/reset-weekly-orders', headers:='{"Content-Type":"application/json","x-cron-secret":"REPLACE_WITH_CRON_SECRET"}'::jsonb, body:='{}'::jsonb)$$);

-- Refresh catalog prices before freeze — Sun 23:58 ART = Mon 02:58 UTC
SELECT cron.schedule('sync-sku-prices', '58 2 * * 1',
  $$SELECT net.http_post(url:='https://hqrnddgpnxwdcowsmpem.supabase.co/functions/v1/sync-sku-prices', headers:='{"Content-Type":"application/json","x-cron-secret":"REPLACE_WITH_CRON_SECRET"}'::jsonb, body:='{}'::jsonb)$$);

-- Full counter reset (virtual + real + goal flags) — Mon 00:00 ART = Mon 03:00 UTC
SELECT cron.schedule('weekly-brand-counter-reset', '0 3 * * 1',
  $$UPDATE public.brand_overrides SET virtual_score=0, real_score=0, goal_reached=false, goal_reached_at=null, booster_started_at=now(), updated_at=now()$$);

-- Freeze this week's prices — Mon 00:00 ART = Mon 03:00 UTC
SELECT cron.schedule('freeze-weekly-prices', '0 3 * * 1',
  $$SELECT net.http_post(url:='https://hqrnddgpnxwdcowsmpem.supabase.co/functions/v1/freeze-weekly-prices', headers:='{"Content-Type":"application/json","x-cron-secret":"REPLACE_WITH_CRON_SECRET"}'::jsonb, body:='{}'::jsonb)$$);

-- Virtual-counter accruer — every 30 minutes
SELECT cron.schedule('boost-brand-targets', '*/30 * * * *',
  $$SELECT net.http_post(url:='https://hqrnddgpnxwdcowsmpem.supabase.co/functions/v1/boost-brand-targets', headers:='{"Content-Type":"application/json","x-cron-secret":"REPLACE_WITH_CRON_SECRET"}'::jsonb, body:='{}'::jsonb)$$);
