-- Добавляем новое поле для подсчета заказов "Comprar Ahora"
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS buynow_count integer NOT NULL DEFAULT 0;

-- Пересчитываем buynow_count для существующих продуктов
UPDATE public.products p
SET buynow_count = (
  SELECT COUNT(*)
  FROM public.orders o
  WHERE o.product_id = p.id
  AND o.waiting_for_discount = false
);

-- Обновляем функцию инкремента, чтобы учитывать buynow_count
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
      END,
      buynow_count = CASE
        WHEN NOT NEW.waiting_for_discount THEN buynow_count + 1
        ELSE buynow_count
      END
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Обновляем функцию декремента, чтобы учитывать buynow_count
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
      END,
      buynow_count = CASE
        WHEN NOT OLD.waiting_for_discount THEN GREATEST(buynow_count - 1, 0)
        ELSE buynow_count
      END
    WHERE id = OLD.product_id;
  END IF;
  RETURN OLD;
END;
$$;