
-- BRANDS
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  emoji text,
  logo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_sort ON public.brands(sort_order) WHERE is_active = true;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active brands"
  ON public.brands FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert brands"
  ON public.brands FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update brands"
  ON public.brands FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete brands"
  ON public.brands FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_sort ON public.categories(sort_order) WHERE is_active = true;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRODUCTS: add FKs
ALTER TABLE public.products
  ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX idx_products_brand_id ON public.products(brand_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);

-- SEED categories (matching current hardcoded list)
INSERT INTO public.categories (name, slug, emoji, sort_order) VALUES
  ('Proteínas', 'proteinas', '💪', 10),
  ('Creatinas', 'creatinas', '⚡', 20),
  ('Aminoácidos', 'aminoacidos', '🧬', 30),
  ('Ganadores de masa', 'aumentadores', '🚀', 40),
  ('Barras y snacks', 'barras', '🍫', 50),
  ('Pre-entrenos', 'pre-entrenos', '🔥', 60),
  ('Colágeno', 'colageno', '✨', 70),
  ('Vitaminas y minerales', 'vitaminas', '💊', 80);

-- Link existing products by matching old text category to new slug
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE p.category IS NOT NULL AND p.category = c.slug;
