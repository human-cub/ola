CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS TIMESTAMPTZ
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT now();
$$;

CREATE OR REPLACE FUNCTION public.get_collective_cycle_close(_reference TIMESTAMPTZ DEFAULT now())
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  local_reference TIMESTAMP;
  local_close TIMESTAMP;
  days_until_sunday INTEGER;
  collective_timezone CONSTANT TEXT := 'America/Argentina/Buenos_Aires';
BEGIN
  local_reference := _reference AT TIME ZONE collective_timezone;
  days_until_sunday := (7 - EXTRACT(DOW FROM local_reference)::INTEGER) % 7;

  IF days_until_sunday = 0
    AND local_reference < date_trunc('day', local_reference) + INTERVAL '23 hours 59 minutes 59.999 seconds'
  THEN
    local_close := date_trunc('day', local_reference) + INTERVAL '23 hours 59 minutes 59.999 seconds';
  ELSE
    local_close := date_trunc(
      'day',
      local_reference + make_interval(days => CASE WHEN days_until_sunday = 0 THEN 7 ELSE days_until_sunday END)
    ) + INTERVAL '23 hours 59 minutes 59.999 seconds';
  END IF;

  RETURN local_close AT TIME ZONE collective_timezone;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_collective_clock()
RETURNS TABLE(server_now TIMESTAMPTZ, next_collective_close TIMESTAMPTZ)
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT public.get_server_time(), public.get_collective_cycle_close(public.get_server_time());
$$;

CREATE OR REPLACE FUNCTION public.sync_collective_close_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.order_type = 'collective' AND NEW.status = 'pending' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.collective_close_date := public.get_collective_cycle_close(public.get_server_time());
    ELSIF OLD.collective_close_date IS NULL THEN
      NEW.collective_close_date := COALESCE(
        NEW.collective_close_date,
        public.get_collective_cycle_close(public.get_server_time())
      );
    ELSE
      NEW.collective_close_date := OLD.collective_close_date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

ALTER TABLE public.user_orders
ALTER COLUMN collective_close_date SET DEFAULT public.get_collective_cycle_close(public.get_server_time());

DROP TRIGGER IF EXISTS sync_collective_close_date_on_user_orders ON public.user_orders;

CREATE TRIGGER sync_collective_close_date_on_user_orders
  BEFORE INSERT OR UPDATE ON public.user_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_collective_close_date();

UPDATE public.user_orders
SET collective_close_date = public.get_collective_cycle_close(created_at)
WHERE order_type = 'collective'
  AND status = 'pending'
  AND collective_close_date IS NULL;

GRANT EXECUTE ON FUNCTION public.get_server_time() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_collective_cycle_close(TIMESTAMPTZ) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_collective_clock() TO anon, authenticated;