-- One-time referrer reward: a pending Super-price discount on the referrer's next group order.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_referral_reward boolean DEFAULT false;

CREATE OR REPLACE FUNCTION public.set_referred_by(_ref_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); referrer uuid;
BEGIN
  IF me IS NULL OR _ref_code IS NULL OR length(trim(_ref_code)) = 0 THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = me AND referred_by IS NOT NULL) THEN RETURN false; END IF;
  SELECT user_id INTO referrer FROM public.profiles WHERE lower(referral_code) = lower(trim(_ref_code)) LIMIT 1;
  IF referrer IS NULL OR referrer = me THEN RETURN false; END IF;
  UPDATE public.profiles SET referred_by = referrer, updated_at = now() WHERE user_id = me;
  UPDATE public.profiles SET has_referral_reward = true, updated_at = now() WHERE user_id = referrer;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.consume_referral_reward()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  UPDATE public.profiles SET has_referral_reward = false, updated_at = now()
    WHERE user_id = auth.uid() AND has_referral_reward = true;
  RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.consume_referral_reward() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.consume_referral_reward() TO authenticated;
