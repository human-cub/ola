-- Создаем функцию для уменьшения счетчика заказов при удалении
CREATE OR REPLACE FUNCTION public.decrement_product_orders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.product_id IS NOT NULL THEN
    UPDATE public.products
    SET 
      real_orders_count = GREATEST(real_orders_count - 1, 0),
      waiting_for_discount_count = CASE 
        WHEN OLD.waiting_for_discount THEN GREATEST(waiting_for_discount_count - 1, 0)
        ELSE waiting_for_discount_count
      END
    WHERE id = OLD.product_id;
  END IF;
  RETURN OLD;
END;
$$;

-- Создаем триггер на удаление заказов
CREATE TRIGGER decrement_orders_on_delete
AFTER DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.decrement_product_orders();