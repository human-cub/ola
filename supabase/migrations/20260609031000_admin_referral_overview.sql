-- Admin-only referral overview (per referrer: invited + how many purchased). email cast to text.
CREATE OR REPLACE FUNCTION public.admin_referral_overview()
RETURNS TABLE(referrer_id uuid, referrer_name text, referrer_email text, referrals int, purchasers int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
    SELECT r.user_id,
           NULLIF(trim(coalesce(r.first_name,'') || ' ' || coalesce(r.last_name,'')), '')::text,
           u.email::text,
           count(c.user_id)::int,
           count(DISTINCT o.user_id)::int
    FROM public.profiles r
    JOIN auth.users u ON u.id = r.user_id
    JOIN public.profiles c ON c.referred_by = r.user_id
    LEFT JOIN public.user_orders o ON o.user_id = c.user_id AND o.status::text <> 'cancelled'
    GROUP BY r.user_id, r.first_name, r.last_name, u.email
    HAVING count(c.user_id) > 0
    ORDER BY count(c.user_id) DESC;
END; $$;
REVOKE ALL ON FUNCTION public.admin_referral_overview() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_referral_overview() TO authenticated;
