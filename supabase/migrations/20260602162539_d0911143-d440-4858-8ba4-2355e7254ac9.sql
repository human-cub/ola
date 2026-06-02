ALTER TABLE public.waiting_list_items
  ADD COLUMN IF NOT EXISTS brand_slug text,
  ADD COLUMN IF NOT EXISTS retail_price_per_unit numeric,
  ADD COLUMN IF NOT EXISTS guaranteed_price_per_unit numeric,
  ADD COLUMN IF NOT EXISTS super_price_per_unit numeric,
  ADD COLUMN IF NOT EXISTS product_link text;

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS product_link text;

CREATE INDEX IF NOT EXISTS idx_waiting_list_items_brand_slug
  ON public.waiting_list_items (brand_slug);

CREATE OR REPLACE FUNCTION public.refresh_brand_goal(_brand_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  brand_target numeric;
  brand_virtual numeric;
  already_reached boolean;
  real_total numeric;
  should_be_reached boolean;
  week_start timestamptz;
  order_row record;
  recalculated_items jsonb;
  recalculated_subtotal numeric;
  recalculated_full_price numeric;
BEGIN
  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF _brand_slug IS NULL OR length(trim(_brand_slug)) = 0 THEN
    RETURN false;
  END IF;

  week_start := date_trunc('week', now());

  SELECT target_amount, virtual_score, goal_reached
    INTO brand_target, brand_virtual, already_reached
  FROM public.brand_overrides
  WHERE slug = _brand_slug
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT COALESCE(SUM(
    COALESCE((item->>'quantity')::numeric, 0) *
    COALESCE(
      NULLIF(item->>'guaranteed_price_per_unit', '')::numeric,
      NULLIF(item->>'price_per_unit', '')::numeric,
      0
    )
  ), 0)
    INTO real_total
  FROM public.user_orders u
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(u.items, '[]'::jsonb)) AS item
  WHERE u.order_type = 'collective'
    AND u.status = 'pending'
    AND u.created_at >= week_start
    AND item->>'brand_slug' = _brand_slug;

  should_be_reached := COALESCE(already_reached, false)
    OR (COALESCE(brand_target, 0) > 0 AND (COALESCE(brand_virtual, 0) + real_total) >= brand_target);

  IF should_be_reached THEN
    UPDATE public.brand_overrides
    SET goal_reached = true,
        goal_reached_at = COALESCE(goal_reached_at, now())
    WHERE slug = _brand_slug;

    UPDATE public.waiting_list_items
    SET current_price_per_unit = super_price_per_unit
    WHERE brand_slug = _brand_slug
      AND super_price_per_unit IS NOT NULL;

    FOR order_row IN
      SELECT id, items, delivery_cost
      FROM public.user_orders
      WHERE order_type = 'collective'
        AND status = 'pending'
        AND created_at >= week_start
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(items, '[]'::jsonb)) AS item
          WHERE item->>'brand_slug' = _brand_slug
        )
    LOOP
      SELECT jsonb_agg(
        CASE
          WHEN item->>'brand_slug' = _brand_slug
               AND item ? 'super_price_per_unit'
               AND NULLIF(item->>'super_price_per_unit', '') IS NOT NULL
          THEN jsonb_set(item, '{price_per_unit}', to_jsonb((item->>'super_price_per_unit')::numeric), true)
          ELSE item
        END
      )
      INTO recalculated_items
      FROM jsonb_array_elements(COALESCE(order_row.items, '[]'::jsonb)) AS item;

      SELECT COALESCE(SUM(
        COALESCE((item->>'quantity')::numeric, 0) *
        COALESCE(NULLIF(item->>'price_per_unit', '')::numeric, 0)
      ), 0)
      INTO recalculated_subtotal
      FROM jsonb_array_elements(COALESCE(recalculated_items, '[]'::jsonb)) AS item;

      SELECT COALESCE(SUM(
        COALESCE((item->>'quantity')::numeric, 0) *
        COALESCE(
          NULLIF(item->>'retail_price_per_unit', '')::numeric,
          NULLIF(item->>'price_per_unit', '')::numeric,
          0
        )
      ), 0)
      INTO recalculated_full_price
      FROM jsonb_array_elements(COALESCE(recalculated_items, '[]'::jsonb)) AS item;

      UPDATE public.user_orders
      SET items = COALESCE(recalculated_items, '[]'::jsonb),
          subtotal = recalculated_subtotal,
          total_amount = recalculated_subtotal + COALESCE(order_row.delivery_cost, 0),
          discount_amount = GREATEST(recalculated_full_price - recalculated_subtotal, 0)
      WHERE id = order_row.id;
    END LOOP;
  END IF;

  RETURN should_be_reached;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_brand_goal(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_brand_goal(text) TO service_role;