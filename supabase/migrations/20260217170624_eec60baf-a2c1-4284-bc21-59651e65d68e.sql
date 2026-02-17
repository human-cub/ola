
-- Update trigger to only count current week's pending collective orders
CREATE OR REPLACE FUNCTION public.user_orders_waiting_for_discount_count_trg()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  old_in_scope boolean;
  new_in_scope boolean;
  week_start timestamptz;
BEGIN
  -- Current week starts Monday 00:00
  week_start := date_trunc('week', now());

  IF TG_OP = 'INSERT' THEN
    new_in_scope := (NEW.order_type = 'collective' AND NEW.status = 'pending' AND NEW.created_at >= week_start);

    IF new_in_scope THEN
      FOR r IN SELECT * FROM public.order_items_product_qty(NEW.items) LOOP
        UPDATE public.products
        SET waiting_for_discount_count = waiting_for_discount_count + r.qty
        WHERE id = r.product_id;
      END LOOP;
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    old_in_scope := (OLD.order_type = 'collective' AND OLD.status = 'pending' AND OLD.created_at >= week_start);
    new_in_scope := (NEW.order_type = 'collective' AND NEW.status = 'pending' AND NEW.created_at >= week_start);

    -- Remove OLD contribution
    IF old_in_scope THEN
      FOR r IN SELECT * FROM public.order_items_product_qty(OLD.items) LOOP
        UPDATE public.products
        SET waiting_for_discount_count = GREATEST(waiting_for_discount_count - r.qty, 0)
        WHERE id = r.product_id;
      END LOOP;
    END IF;

    -- Add NEW contribution
    IF new_in_scope THEN
      FOR r IN SELECT * FROM public.order_items_product_qty(NEW.items) LOOP
        UPDATE public.products
        SET waiting_for_discount_count = waiting_for_discount_count + r.qty
        WHERE id = r.product_id;
      END LOOP;
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    old_in_scope := (OLD.order_type = 'collective' AND OLD.status = 'pending' AND OLD.created_at >= week_start);

    IF old_in_scope THEN
      FOR r IN SELECT * FROM public.order_items_product_qty(OLD.items) LOOP
        UPDATE public.products
        SET waiting_for_discount_count = GREATEST(waiting_for_discount_count - r.qty, 0)
        WHERE id = r.product_id;
      END LOOP;
    END IF;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$function$;

-- Update recompute function to only count current week
CREATE OR REPLACE FUNCTION public.recompute_waiting_for_discount_counts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  week_start timestamptz;
BEGIN
  week_start := date_trunc('week', now());

  UPDATE public.products SET waiting_for_discount_count = 0;

  FOR r IN
    SELECT (item->>'product_id')::uuid AS product_id,
           SUM(COALESCE((item->>'quantity')::int, 0)) AS qty
    FROM public.user_orders u
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(u.items, '[]'::jsonb)) AS item
    WHERE u.order_type = 'collective'
      AND u.status = 'pending'
      AND u.created_at >= week_start
    GROUP BY 1
  LOOP
    UPDATE public.products
    SET waiting_for_discount_count = waiting_for_discount_count + r.qty
    WHERE id = r.product_id;
  END LOOP;
END;
$function$;

-- Recompute now to fix current counts
SELECT public.recompute_waiting_for_discount_counts();
