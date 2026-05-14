
-- 1. Restrict promo_codes table reads (remove blanket authenticated SELECT)
DROP POLICY IF EXISTS "Authenticated users can view active promo codes" ON public.promo_codes;

-- Server-side validation RPC (returns valid code + tier_bonus, or nothing)
CREATE OR REPLACE FUNCTION public.validate_promo_code(_code text)
RETURNS TABLE(code text, tier_bonus integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pc.code, pc.tier_bonus
  FROM public.promo_codes pc
  WHERE pc.is_active = true
    AND upper(pc.code) = upper(_code)
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_promo_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text) TO authenticated;

-- 2. Revoke anon EXECUTE on remaining SECURITY DEFINER functions in public schema.
-- Trigger functions are invoked by Postgres internally and do not require EXECUTE grants.
REVOKE EXECUTE ON FUNCTION public.clear_waiting_list_on_order_close() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_orders_waiting_for_discount_count_trg() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_product_orders() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_product_orders() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.restore_waiting_list_on_revert_to_pending() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_collective_stage_debug_state_for_product(uuid) FROM PUBLIC, anon;

-- has_role is referenced inside RLS policies; keep accessible to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
