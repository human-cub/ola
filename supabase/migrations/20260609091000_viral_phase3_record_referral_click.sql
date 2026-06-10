CREATE OR REPLACE FUNCTION public.record_referral_click(_ref_code text, _visitor_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_enabled boolean;
  v_code text := upper(trim(coalesce(_ref_code, '')));
  v_referrer uuid;
  v_has_reward boolean;
  v_rewarded_at int;
  v_threshold int;
  v_clicks int;
BEGIN
  IF length(v_code) = 0 OR _visitor_hash IS NULL OR length(trim(_visitor_hash)) = 0 THEN RETURN; END IF;
  SELECT (value #>> '{}')::boolean INTO v_enabled FROM app_settings WHERE key = 'viral_enabled';
  IF v_enabled IS NOT TRUE THEN RETURN; END IF;
  SELECT user_id, has_referral_reward, COALESCE(referral_clicks_rewarded_at, 0)
    INTO v_referrer, v_has_reward, v_rewarded_at
    FROM profiles WHERE lower(referral_code) = lower(v_code) LIMIT 1;
  IF v_referrer IS NULL THEN RETURN; END IF;
  IF auth.uid() = v_referrer THEN RETURN; END IF;
  INSERT INTO referral_clicks (ref_code, visitor_hash)
  VALUES (v_code, trim(_visitor_hash))
  ON CONFLICT (ref_code, visitor_hash) DO NOTHING;
  SELECT GREATEST(COALESCE((value #>> '{}')::int, 1), 1) INTO v_threshold
    FROM app_settings WHERE key = 'referral_unlock_clicks';
  v_threshold := COALESCE(v_threshold, 1);
  SELECT count(*) INTO v_clicks FROM referral_clicks WHERE ref_code = v_code;
  IF v_has_reward IS NOT TRUE AND (v_clicks - v_rewarded_at) >= v_threshold THEN
    UPDATE profiles SET has_referral_reward = true, referral_clicks_rewarded_at = v_clicks, updated_at = now()
      WHERE user_id = v_referrer;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.record_referral_click(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_referral_click(text, text) TO anon, authenticated;
