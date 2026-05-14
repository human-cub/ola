
-- 1. Promo codes: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;
CREATE POLICY "Authenticated users can view active promo codes"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2. Revoke EXECUTE on admin-only SECURITY DEFINER functions from anon
REVOKE EXECUTE ON FUNCTION public.assign_admin_role(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_collective_stage_complete_for_product(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_collective_stage_debug_state_for_product(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recompute_waiting_for_discount_counts() FROM anon, authenticated;

-- 3. Realtime: restrict channel subscriptions to authenticated users only
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='realtime' AND tablename='messages' AND policyname='Authenticated users can receive realtime') THEN
    DROP POLICY "Authenticated users can receive realtime" ON realtime.messages;
  END IF;
END $$;

CREATE POLICY "Authenticated users can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
