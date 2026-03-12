ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_qa_only BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_qa_only
ON public.products (is_qa_only);

DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

CREATE POLICY "Public can view non-QA products"
  ON public.products FOR SELECT
  USING (NOT is_qa_only);

CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));