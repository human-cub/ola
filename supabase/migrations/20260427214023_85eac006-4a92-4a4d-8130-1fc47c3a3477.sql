ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS pending_prices jsonb;