-- Allow cart_items to store external (wholesale) products by SKU instead of local UUID
ALTER TABLE public.cart_items
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS external_sku TEXT;

-- Ensure at least one identifier exists per row
ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_identifier_check
  CHECK (product_id IS NOT NULL OR external_sku IS NOT NULL);
