ALTER TABLE public.user_orders ADD COLUMN IF NOT EXISTS promo_code text;
CREATE INDEX IF NOT EXISTS idx_user_orders_user_promo ON public.user_orders(user_id, promo_code) WHERE promo_code IS NOT NULL;