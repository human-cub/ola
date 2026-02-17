
-- Trigger: restore waiting_list_items when a collective order is reverted to 'pending'
CREATE OR REPLACE FUNCTION public.restore_waiting_list_on_revert_to_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item RECORD;
BEGIN
  -- Only act when status changes TO pending from a non-pending status
  -- and the order is collective
  IF NEW.order_type = 'collective' 
     AND NEW.status = 'pending' 
     AND OLD.status <> 'pending' THEN
    
    -- First, remove any existing waiting list items for this user to avoid duplicates
    DELETE FROM public.waiting_list_items WHERE user_id = NEW.user_id;
    
    -- Restore items from the order's items JSON
    FOR item IN 
      SELECT 
        (i->>'product_id')::uuid AS product_id,
        i->>'product_name' AS product_name,
        i->>'flavor' AS flavor,
        COALESCE((i->>'quantity')::int, 1) AS quantity,
        COALESCE((i->>'price_per_unit')::numeric, 0) AS price_per_unit,
        i->>'product_image' AS product_image
      FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb)) AS i
    LOOP
      INSERT INTO public.waiting_list_items (
        user_id, product_id, product_name, flavor, quantity, 
        current_price_per_unit, product_image
      ) VALUES (
        NEW.user_id, item.product_id, item.product_name, item.flavor, 
        item.quantity, item.price_per_unit, item.product_image
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER restore_waiting_list_on_revert
  AFTER UPDATE ON public.user_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_waiting_list_on_revert_to_pending();
