-- Add fields for virtual participants algorithm
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS max_weekly_participants integer DEFAULT 70,
ADD COLUMN IF NOT EXISTS base_probability float DEFAULT 0.005,
ADD COLUMN IF NOT EXISTS last_increment_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cooldown_minutes integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS week_start_date date DEFAULT CURRENT_DATE;

-- Initialize random values for each product
UPDATE public.products SET
  max_weekly_participants = 55 + floor(random() * 26)::integer, -- 55-80
  base_probability = 0.002 + random() * 0.006, -- 0.002-0.008
  cooldown_minutes = 30 + floor(random() * 151)::integer, -- 30-180
  virtual_orders_count = floor(random() * 6)::integer, -- 0-5 start
  week_start_date = CURRENT_DATE;