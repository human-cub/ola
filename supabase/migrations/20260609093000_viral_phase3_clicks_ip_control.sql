-- IP-based anti-fraud: a "unique click" = a distinct IP. Recording moves to an edge
-- function (only it sees the real IP); the anon-callable 2-arg RPC is removed. Threshold -> 5.
ALTER TABLE public.referral_clicks ADD COLUMN IF NOT EXISTS ip_hash text;
ALTER TABLE public.referral_clicks ALTER COLUMN visitor_hash DROP NOT NULL;
ALTER TABLE public.referral_clicks DROP CONSTRAINT IF EXISTS referral_clicks_ref_code_visitor_hash_key;
ALTER TABLE public.referral_clicks ADD CONSTRAINT referral_clicks_ref_ip_key UNIQUE (ref_code, ip_hash);
DROP FUNCTION IF EXISTS public.record_referral_click(text, text);
CREATE OR REPLACE FUNCTION public.record_referral_click(_ref_code text, _visitor_hash text, _ip_hash text, _caller uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_enabled boolean; v_code text := upper(trim(coalesce(_ref_code, ''))); v_ip text := trim(coalesce(_ip_hash, ''));
  v_referrer uuid; v_has_reward boolean; v_rewarded_at int; v_threshold int; v_clicks int;
BEGIN
  IF length(v_code) = 0 OR length(v_ip) = 0 THEN RETURN; END IF;
  SELECT (value #>> '{}')::boolean INTO v_enabled FROM app_settings WHERE key = 'viral_enabled';
  IF v_enabled IS NOT TRUE THEN RETURN; END IF;
  SELECT user_id, has_referral_reward, COALESCE(referral_clicks_rewarded_at, 0)
    INTO v_referrer, v_has_reward, v_rewarded_at FROM profiles WHERE lower(referral_code) = lower(v_code) LIMIT 1;
  IF v_referrer IS NULL THEN RETURN; END IF;
  IF _caller IS NOT NULL AND _caller = v_referrer THEN RETURN; END IF;
  INSERT INTO referral_clicks (ref_code, visitor_hash, ip_hash)
  VALUES (v_code, NULLIF(trim(coalesce(_visitor_hash, '')), ''), v_ip) ON CONFLICT (ref_code, ip_hash) DO NOTHING;
  SELECT GREATEST(COALESCE((value #>> '{}')::int, 1), 1) INTO v_threshold FROM app_settings WHERE key = 'referral_unlock_clicks';
  v_threshold := COALESCE(v_threshold, 1);
  SELECT count(*) INTO v_clicks FROM referral_clicks WHERE ref_code = v_code;
  IF v_has_reward IS NOT TRUE AND (v_clicks - v_rewarded_at) >= v_threshold THEN
    UPDATE profiles SET has_referral_reward = true, referral_clicks_rewarded_at = v_clicks, updated_at = now() WHERE user_id = v_referrer;
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.record_referral_click(text, text, text, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_referral_click(text, text, text, uuid) TO service_role;
UPDATE public.app_settings SET value = '5'::jsonb WHERE key = 'referral_unlock_clicks';
