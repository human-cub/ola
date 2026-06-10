-- Hourly anon smoke test of the storefront's critical reads. Alerts to Telegram
-- on any failure (the function itself decides). Auth uses the project's PUBLIC
-- anon key (safe to commit). Catches silent regressions like a lost SELECT grant.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $do$
begin
  if exists (select 1 from cron.job where jobname = 'anon-smoke-hourly') then
    perform cron.unschedule('anon-smoke-hourly');
  end if;
end
$do$;

select cron.schedule(
  'anon-smoke-hourly',
  '7 * * * *',
  $cron$
  select net.http_post(
    url := 'https://hqrnddgpnxwdcowsmpem.supabase.co/functions/v1/anon-smoke',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxcm5kZGdwbnh3ZGNvd3NtcGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTI0OTcsImV4cCI6MjA5NjMyODQ5N30.P3W67EAWaoLDqT01M_tlZza4WYf3FzE_a42kxWvAcw4'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
