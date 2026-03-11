CREATE OR REPLACE FUNCTION public.sync_collective_close_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.order_type = 'collective' AND NEW.status = 'pending' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.collective_close_date := COALESCE(
        NEW.collective_close_date,
        public.get_collective_cycle_close(public.get_server_time())
      );
    ELSIF NEW.collective_close_date IS NULL THEN
      NEW.collective_close_date := COALESCE(
        OLD.collective_close_date,
        public.get_collective_cycle_close(public.get_server_time())
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_collective_stage_debug_state_for_product(_product_id UUID)
RETURNS TABLE(
  total_pending_orders INTEGER,
  completed_pending_orders INTEGER,
  waiting_stage_complete BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  server_now TIMESTAMPTZ := public.get_server_time();
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_pending_orders,
    COUNT(*) FILTER (
      WHERE collective_close_date IS NOT NULL
        AND collective_close_date <= server_now
    )::INTEGER AS completed_pending_orders,
    COUNT(*) > 0
      AND COUNT(*) FILTER (
        WHERE collective_close_date IS NOT NULL
          AND collective_close_date <= server_now
      ) = COUNT(*) AS waiting_stage_complete
  FROM public.user_orders
  WHERE order_type = 'collective'
    AND status = 'pending'
    AND items @> jsonb_build_array(jsonb_build_object('product_id', _product_id::TEXT));
END;
$$;

CREATE OR REPLACE FUNCTION public.set_collective_stage_complete_for_product(
  _product_id UUID,
  _complete BOOLEAN
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_close TIMESTAMPTZ;
  affected_count INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  target_close := CASE
    WHEN _complete THEN public.get_server_time() - INTERVAL '1 minute'
    ELSE public.get_collective_cycle_close(public.get_server_time())
  END;

  UPDATE public.user_orders
  SET collective_close_date = target_close
  WHERE order_type = 'collective'
    AND status = 'pending'
    AND items @> jsonb_build_array(jsonb_build_object('product_id', _product_id::TEXT));

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_collective_stage_debug_state_for_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_collective_stage_complete_for_product(UUID, BOOLEAN) TO authenticated;