
-- =========================================================================
-- 1) brand_collection_public — безопасная проекция brand_overrides
-- =========================================================================
DROP VIEW IF EXISTS public.brand_collection_public;
CREATE VIEW public.brand_collection_public
WITH (security_invoker = true)
AS
SELECT
  slug,
  emoji,
  sort_order,
  is_active,
  target_amount,
  (COALESCE(virtual_score,0) + COALESCE(real_score,0))::numeric AS collected_total,
  goal_reached,
  goal_reached_at
FROM public.brand_overrides;

GRANT SELECT ON public.brand_collection_public TO anon, authenticated;

-- Закрываем анонимам прямой доступ к base table
DROP POLICY IF EXISTS "Public can read brand overrides" ON public.brand_overrides;
CREATE POLICY "Authenticated can read brand overrides safe"
ON public.brand_overrides
FOR SELECT
TO authenticated
USING (true);
-- (полный набор колонок виден только authenticated; анон → только через view)

REVOKE SELECT ON public.brand_overrides FROM anon;

-- =========================================================================
-- 2) products_public — безопасная проекция products (4 цены, без ladder/счётчиков)
-- =========================================================================
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  description,
  weight,
  category,
  category_id,
  brand_id,
  link,
  images,
  flavors,
  variants,
  -- 4 числа цены, без people-порогов
  COALESCE(NULLIF((prices->0->>'price'),'')::numeric, 0) AS price_retail,
  COALESCE(NULLIF((prices->1->>'price'),'')::numeric, 0) AS price_buy_now,
  COALESCE(NULLIF((prices->2->>'price'),'')::numeric, 0) AS price_guaranteed,
  COALESCE(NULLIF((prices->3->>'price'),'')::numeric, 0) AS price_super
FROM public.products
WHERE is_qa_only = false;

GRANT SELECT ON public.products_public TO anon, authenticated;

-- Закрываем анонимам прямой доступ к products
DROP POLICY IF EXISTS "Public can view non-QA products" ON public.products;
CREATE POLICY "Authenticated can view non-QA products"
ON public.products
FOR SELECT
TO authenticated
USING (NOT is_qa_only);

REVOKE SELECT ON public.products FROM anon;

-- =========================================================================
-- 3) Lockdown sensitive RPCs: запретить анонимам исполнение
-- =========================================================================
REVOKE EXECUTE ON FUNCTION public.generate_wholesale_invite(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_wholesale_invite(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.validate_wholesale_invite(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.validate_wholesale_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_wholesale_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_wholesale_invite(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.set_collective_stage_complete_for_product(uuid, boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_collective_stage_complete_for_product(uuid, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_collective_stage_debug_state_for_product(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_collective_stage_debug_state_for_product(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.assign_admin_role(text) FROM anon, public;

REVOKE EXECUTE ON FUNCTION public.refresh_brand_goal(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.refresh_brand_goal(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recompute_waiting_for_discount_counts() FROM anon, public;
