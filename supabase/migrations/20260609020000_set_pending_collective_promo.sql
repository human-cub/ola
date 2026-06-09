-- Persist a customer-applied promo onto their PENDING collective order (admin visibility + price).
-- _code NULL/'' = remove (back to Garantizado). Collective promo = PG -> SP. Applied to ola-app via MCP.
CREATE OR REPLACE FUNCTION public.set_pending_collective_promo(_code text, _tier int)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  ord record;
  updated_items jsonb;
  new_subtotal numeric;
  full_price numeric;
  apply_super boolean := (_code IS NOT NULL AND length(trim(_code)) > 0);
BEGIN
  IF me IS NULL THEN RETURN false; END IF;
  SELECT id, items, delivery_cost INTO ord
    FROM public.user_orders
    WHERE user_id = me AND order_type = 'collective' AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT jsonb_agg(
    jsonb_set(item, '{price_per_unit}', to_jsonb(
      CASE WHEN apply_super
        THEN COALESCE(NULLIF(item->>'super_price_per_unit','')::numeric, NULLIF(item->>'guaranteed_price_per_unit','')::numeric, (item->>'price_per_unit')::numeric)
        ELSE COALESCE(NULLIF(item->>'guaranteed_price_per_unit','')::numeric, (item->>'price_per_unit')::numeric)
      END), true)
  ) INTO updated_items
  FROM jsonb_array_elements(COALESCE(ord.items, '[]'::jsonb)) AS item;
  SELECT COALESCE(SUM((item->>'quantity')::numeric * (item->>'price_per_unit')::numeric), 0),
         COALESCE(SUM((item->>'quantity')::numeric * COALESCE(NULLIF(item->>'retail_price_per_unit','')::numeric, (item->>'price_per_unit')::numeric)), 0)
    INTO new_subtotal, full_price
  FROM jsonb_array_elements(COALESCE(updated_items, '[]'::jsonb)) AS item;
  UPDATE public.user_orders
  SET items = COALESCE(updated_items, '[]'::jsonb),
      subtotal = new_subtotal,
      discount_amount = GREATEST(full_price - new_subtotal, 0),
      total_amount = new_subtotal + COALESCE(ord.delivery_cost, 0),
      is_promo = apply_super,
      promo_code = CASE WHEN apply_super THEN _code ELSE NULL END,
      promo_tier = CASE WHEN apply_super THEN _tier ELSE NULL END,
      updated_at = now()
  WHERE id = ord.id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.set_pending_collective_promo(text, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_pending_collective_promo(text, int) TO authenticated;
