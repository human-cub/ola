-- Snapshots of per-SKU prices across weekly cycles.
-- current_prices  : latest snapshot pulled from the external source (updated Sunday)
-- this_week_prices: frozen on Monday 02:59 UTC, shown on the site for the whole week
-- last_week_prices: previous week's snapshot, kept for admin reference
CREATE TABLE public.sku_price_snapshots (
  sku TEXT PRIMARY KEY,
  current_prices JSONB,
  this_week_prices JSONB,
  last_week_prices JSONB,
  current_updated_at TIMESTAMPTZ,
  snapshotted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public read so the catalog can use this_week_prices; writes only via service_role/admin.
GRANT SELECT ON public.sku_price_snapshots TO anon;
GRANT SELECT ON public.sku_price_snapshots TO authenticated;
GRANT ALL ON public.sku_price_snapshots TO service_role;

ALTER TABLE public.sku_price_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read sku price snapshots"
ON public.sku_price_snapshots FOR SELECT
USING (true);

CREATE POLICY "Admins can insert sku price snapshots"
ON public.sku_price_snapshots FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update sku price snapshots"
ON public.sku_price_snapshots FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete sku price snapshots"
ON public.sku_price_snapshots FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER sku_price_snapshots_set_updated_at
BEFORE UPDATE ON public.sku_price_snapshots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();