-- Add new columns for manual product management
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS link text,
ADD COLUMN IF NOT EXISTS flavors jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_manual boolean DEFAULT false;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Add index for manual products
CREATE INDEX IF NOT EXISTS idx_products_is_manual ON public.products(is_manual);