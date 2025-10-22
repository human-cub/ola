-- Добавить счетчик ожидающих к продуктам
ALTER TABLE public.products 
ADD COLUMN waiting_for_discount_count INTEGER NOT NULL DEFAULT 0;

-- Добавить поле в заказы для отслеживания тех, кто ждет
ALTER TABLE public.orders
ADD COLUMN waiting_for_discount BOOLEAN NOT NULL DEFAULT false;

-- Обновить триггер для учета ожидающих
CREATE OR REPLACE FUNCTION public.increment_product_orders()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET 
      real_orders_count = real_orders_count + 1,
      waiting_for_discount_count = CASE 
        WHEN NEW.waiting_for_discount THEN waiting_for_discount_count + 1
        ELSE waiting_for_discount_count
      END
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;