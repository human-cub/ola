-- Drop the internal categories table (will be sourced from external DB)
DROP TABLE IF EXISTS public.categories CASCADE;

-- Create overrides table keyed by external category slug
CREATE TABLE public.category_overrides (
  slug TEXT PRIMARY KEY,
  emoji TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.category_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read category overrides"
ON public.category_overrides FOR SELECT
USING (true);

CREATE POLICY "Admins can insert category overrides"
ON public.category_overrides FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update category overrides"
ON public.category_overrides FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete category overrides"
ON public.category_overrides FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_category_overrides_updated_at
BEFORE UPDATE ON public.category_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();