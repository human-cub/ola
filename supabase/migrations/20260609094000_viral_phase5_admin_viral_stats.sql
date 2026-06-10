-- K-factor / viral funnel computed from our own data (admin-only).
CREATE OR REPLACE FUNCTION public.admin_viral_stats()
RETURNS TABLE(total_users int, referrers int, referred_signups int, unique_clicks int, purchasers int, k_factor numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT
    (SELECT count(*)::int FROM profiles),
    (SELECT count(DISTINCT referred_by)::int FROM profiles WHERE referred_by IS NOT NULL),
    (SELECT count(*)::int FROM profiles WHERE referred_by IS NOT NULL),
    (SELECT count(*)::int FROM referral_clicks),
    (SELECT count(DISTINCT c.user_id)::int FROM profiles c JOIN user_orders o ON o.user_id = c.user_id AND o.status::text <> 'cancelled' WHERE c.referred_by IS NOT NULL),
    ROUND((SELECT count(*)::numeric FROM profiles WHERE referred_by IS NOT NULL) / NULLIF((SELECT count(*) FROM profiles), 0), 3);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_viral_stats() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_viral_stats() TO authenticated;
