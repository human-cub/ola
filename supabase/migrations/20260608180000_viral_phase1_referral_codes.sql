-- Viral referral system — Phase 1 foundation (ADDITIVE, dormant until app_settings.viral_enabled=true).
-- Adds a permanent personal referral code + referrer link to profiles. Touches no existing behavior.
-- Applied to prod ola-app via Supabase MCP (mirror).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid;

-- unique non-null code (case-insensitive); referrer lookup index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_ukey
  ON public.profiles (lower(referral_code)) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles (referred_by);

-- 7-char uppercase code, no ambiguous chars (no I/L/O/0/1)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  i int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..7 LOOP
      code := code || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(referral_code) = lower(code));
  END LOOP;
  RETURN code;
END;
$$;

-- every new profile auto-gets a code
CREATE OR REPLACE FUNCTION public.assign_referral_code_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_profiles_referral_code ON public.profiles;
CREATE TRIGGER trg_profiles_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_referral_code_on_insert();

-- backfill existing profiles
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT user_id FROM public.profiles WHERE referral_code IS NULL LOOP
    UPDATE public.profiles SET referral_code = public.generate_referral_code(), updated_at = now()
      WHERE user_id = r.user_id;
  END LOOP;
END $$;

-- feature flags (dormant; all viral UI gated on viral_enabled)
INSERT INTO public.app_settings (key, value) VALUES
  ('viral_enabled', 'false'::jsonb),
  ('referral_unlock_clicks', '1'::jsonb)
ON CONFLICT (key) DO NOTHING;
