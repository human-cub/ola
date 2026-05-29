CREATE TABLE public.socios_product_overrides (
  sku TEXT PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.socios_product_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.socios_product_overrides TO authenticated;
GRANT ALL ON public.socios_product_overrides TO service_role;

ALTER TABLE public.socios_product_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read socios product overrides"
ON public.socios_product_overrides FOR SELECT USING (true);

CREATE POLICY "Admins can insert socios product overrides"
ON public.socios_product_overrides FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update socios product overrides"
ON public.socios_product_overrides FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete socios product overrides"
ON public.socios_product_overrides FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER socios_product_overrides_updated_at
BEFORE UPDATE ON public.socios_product_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();