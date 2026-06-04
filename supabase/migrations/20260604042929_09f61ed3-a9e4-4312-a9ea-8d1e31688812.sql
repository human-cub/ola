
DROP POLICY IF EXISTS "Authenticated can read brand overrides safe" ON public.brand_overrides;
-- Админская SELECT-политика уже существует (Admins can view all brand overrides добавляется через has_role). 
-- Если её нет — создаём явно.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='brand_overrides' AND policyname='Admins can view brand overrides'
  ) THEN
    CREATE POLICY "Admins can view brand overrides"
    ON public.brand_overrides
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;
