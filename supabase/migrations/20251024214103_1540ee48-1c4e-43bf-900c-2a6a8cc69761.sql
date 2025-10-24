-- Enable required extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly reset every Sunday at 23:59
SELECT cron.schedule(
  'reset-weekly-virtual-orders',
  '59 23 * * 0',
  $$
  SELECT
    net.http_post(
        url:='https://vczrkqwnokjuxehvbrbx.supabase.co/functions/v1/reset-weekly-orders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjenJrcXdub2tqdXhlaHZicmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjE3NTEsImV4cCI6MjA3NjczNzc1MX0.C2YbxHoTZiX2qx4a1IaGENVI9wv3uKLQV5_8ignR1uc"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);