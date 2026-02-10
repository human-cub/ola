
-- When an order status changes to 'delivered' or 'cancelled', clear waiting list items for that user
CREATE OR REPLACE FUNCTION public.clear_waiting_list_on_order_close()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only act when status changes TO delivered or cancelled
  IF (NEW.status IN ('delivered', 'cancelled')) AND (OLD.status NOT IN ('delivered', 'cancelled')) THEN
    DELETE FROM public.waiting_list_items
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER clear_waiting_list_on_order_close_trigger
AFTER UPDATE ON public.user_orders
FOR EACH ROW
EXECUTE FUNCTION public.clear_waiting_list_on_order_close();
