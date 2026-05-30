
ALTER TABLE public.brand_overrides
  ADD COLUMN IF NOT EXISTS target_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booster_mode text NOT NULL DEFAULT 'off',
  ADD COLUMN IF NOT EXISTS booster_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS virtual_score numeric NOT NULL DEFAULT 0;

ALTER TABLE public.brand_overrides
  DROP CONSTRAINT IF EXISTS brand_overrides_booster_mode_check;
ALTER TABLE public.brand_overrides
  ADD CONSTRAINT brand_overrides_booster_mode_check
  CHECK (booster_mode IN ('off','active','first_24h'));
