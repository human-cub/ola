-- Keep product.waiting_for_discount_count in sync with collective pending orders (user_orders)

-- Helper: aggregate quantities by product_id from order items JSON
CREATE OR REPLACE FUNCTION public.order_items_product_qty(_items jsonb)
RETURNS TABLE(product_id uuid, qty integer)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT (item->>'product_id')::uuid AS product_id,
         SUM(COALESCE((item->>'quantity')::int, 0)) AS qty
  FROM jsonb_array_elements(COALESCE(_items, '[]'::jsonb)) AS item
  GROUP BY 1;
$$;

-- Trigger function
CREATE OR REPLACE FUNCTION public.user_orders_waiting_for_discount_count_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
  old_in_scope boolean;
  new_in_scope boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_in_scope := (NEW.order_type = 'collective' AND NEW.status = 'pending');

    IF new_in_scope THEN
      FOR r IN SELECT * FROM public.order_items_product_qty(NEW.items) LOOP
        UPDATE public.products
        SET waiting_for_discount_count = waiting_for_discount_count + r.qty
        WHERE id = r.product_id;
      END LOOP;
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    old_in_scope := (OLD.order_type = 'collective' AND OLD.status = 'pending');
    new_in_scope := (NEW.order_type = 'collective' AND NEW.status = 'pending');

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
    old_in_scope := (OLD.order_type = 'collective' AND OLD.status = 'pending');

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
$$;

-- (Re)create triggers safely
DROP TRIGGER IF EXISTS trg_user_orders_waiting_discount_ins ON public.user_orders;
DROP TRIGGER IF EXISTS trg_user_orders_waiting_discount_upd ON public.user_orders;
DROP TRIGGER IF EXISTS trg_user_orders_waiting_discount_del ON public.user_orders;

CREATE TRIGGER trg_user_orders_waiting_discount_ins
AFTER INSERT ON public.user_orders
FOR EACH ROW
EXECUTE FUNCTION public.user_orders_waiting_for_discount_count_trg();

CREATE TRIGGER trg_user_orders_waiting_discount_upd
AFTER UPDATE ON public.user_orders
FOR EACH ROW
EXECUTE FUNCTION public.user_orders_waiting_for_discount_count_trg();

CREATE TRIGGER trg_user_orders_waiting_discount_del
AFTER DELETE ON public.user_orders
FOR EACH ROW
EXECUTE FUNCTION public.user_orders_waiting_for_discount_count_trg();

-- Helper function to force a full resync (call manually when needed)
CREATE OR REPLACE FUNCTION public.recompute_waiting_for_discount_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
BEGIN
  UPDATE public.products SET waiting_for_discount_count = 0;

  FOR r IN
    SELECT (item->>'product_id')::uuid AS product_id,
           SUM(COALESCE((item->>'quantity')::int, 0)) AS qty
    FROM public.user_orders u
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(u.items, '[]'::jsonb)) AS item
    WHERE u.order_type = 'collective'
      AND u.status = 'pending'
    GROUP BY 1
  LOOP
    UPDATE public.products
    SET waiting_for_discount_count = waiting_for_discount_count + r.qty
    WHERE id = r.product_id;
  END LOOP;
END;
$$;