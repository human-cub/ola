ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

ALTER TABLE public.waiting_list_items
  DROP CONSTRAINT IF EXISTS waiting_list_items_product_id_fkey;

ALTER TABLE public.brand_overrides
  ADD COLUMN IF NOT EXISTS goal_reached boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS goal_reached_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_brand_overrides_goal_reached
  ON public.brand_overrides (slug, goal_reached);