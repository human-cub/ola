UPDATE public.user_orders
SET items = items || jsonb_build_array(jsonb_build_object(
  'product_id', '63de2b22-9a0a-4221-bdd5-0b630834fbbd',
  'product_name', 'ENA Creatina 1 Kg',
  'flavor', NULL,
  'quantity', 1,
  'price_per_unit', 70400,
  'product_image', 'https://vczrkqwnokjuxehvbrbx.supabase.co/storage/v1/object/public/product-images/products/1769817088572-vxkfnq.webp',
  'participants_count', 20
)),
subtotal = 135872,
total_amount = 135872 + delivery_cost,
discount_amount = 50952,
updated_at = now()
WHERE order_number = 'OLA-20260505-2C50';