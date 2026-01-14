-- Drop the generated column and recreate with correct formula including waiting_for_discount_count
ALTER TABLE public.products DROP COLUMN total_orders_count;

ALTER TABLE public.products 
ADD COLUMN total_orders_count integer 
GENERATED ALWAYS AS (real_orders_count + virtual_orders_count + waiting_for_discount_count) STORED;