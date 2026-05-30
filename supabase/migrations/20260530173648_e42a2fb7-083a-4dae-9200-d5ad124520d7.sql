
-- Sync brand_overrides.is_active -> brands.is_active by matching slug
CREATE OR REPLACE FUNCTION public.sync_brand_active_from_override()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE public.brands
    SET is_active = COALESCE(NEW.is_active, true)
    WHERE slug = NEW.slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_brand_active ON public.brand_overrides;
CREATE TRIGGER trg_sync_brand_active
AFTER INSERT OR UPDATE OF is_active ON public.brand_overrides
FOR EACH ROW
EXECUTE FUNCTION public.sync_brand_active_from_override();

-- Backfill: apply current overrides to brands
UPDATE public.brands b
SET is_active = COALESCE(o.is_active, true)
FROM public.brand_overrides o
WHERE b.slug = o.slug;
