DROP FUNCTION IF EXISTS public.admin_referral_overview();
CREATE OR REPLACE FUNCTION public.admin_referral_overview()
RETURNS TABLE(referrer_id uuid, referrer_name text, referrer_email text, referrals int, purchasers int, clicks int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT r.user_id,
         NULLIF(trim(coalesce(r.first_name,'') || ' ' || coalesce(r.last_name,'')), '')::text,
         u.email::text,
         (SELECT count(*)::int FROM profiles c WHERE c.referred_by = r.user_id),
         (SELECT count(DISTINCT o.user_id)::int FROM profiles c JOIN user_orders o ON o.user_id = c.user_id AND o.status::text <> 'cancelled' WHERE c.referred_by = r.user_id),
         (SELECT count(*)::int FROM referral_clicks cl WHERE cl.ref_code = upper(r.referral_code))
  FROM profiles r
  JOIN auth.users u ON u.id = r.user_id
  WHERE r.referral_code IS NOT NULL
    AND (EXISTS (SELECT 1 FROM profiles c WHERE c.referred_by = r.user_id)
         OR EXISTS (SELECT 1 FROM referral_clicks cl WHERE cl.ref_code = upper(r.referral_code)))
  ORDER BY (SELECT count(*) FROM profiles c WHERE c.referred_by = r.user_id)
         + (SELECT count(*) FROM referral_clicks cl WHERE cl.ref_code = upper(r.referral_code)) DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_referral_overview() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_referral_overview() TO authenticated;
