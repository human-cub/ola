-- Add PROMO support columns to user_orders table
ALTER TABLE public.user_orders 
ADD COLUMN IF NOT EXISTS is_promo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_tier integer DEFAULT NULL;