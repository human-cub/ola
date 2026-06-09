-- Authenticated, additive RPC to record who referred the current user.
-- Set-once, self-referral guarded, invalid code is a no-op. Does NOT touch signup flow.
-- Applied to prod ola-app via Supabase MCP (mirror).
CREATE OR REPLACE FUNCTION public.set_referred_by(_ref_code text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  referrer uuid;
BEGIN
  IF me IS NULL OR _ref_code IS NULL OR length(trim(_ref_code)) = 0 THEN
    RETURN false;
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = me AND referred_by IS NOT NULL) THEN
    RETURN false;
  END IF;
  SELECT user_id INTO referrer
    FROM public.profiles
    WHERE lower(referral_code) = lower(trim(_ref_code))
    LIMIT 1;
  IF referrer IS NULL OR referrer = me THEN
    RETURN false;
  END IF;
  UPDATE public.profiles
    SET referred_by = referrer, updated_at = now()
    WHERE user_id = me;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.set_referred_by(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_referred_by(text) TO authenticated;
