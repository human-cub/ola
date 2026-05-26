CREATE TABLE public.brand_overrides (
  slug TEXT PRIMARY KEY,
  emoji TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read brand overrides"
  ON public.brand_overrides FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert brand overrides"
  ON public.brand_overrides FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update brand overrides"
  ON public.brand_overrides FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete brand overrides"
  ON public.brand_overrides FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_brand_overrides_updated_at
  BEFORE UPDATE ON public.brand_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();