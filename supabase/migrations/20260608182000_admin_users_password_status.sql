-- Admin-only: per-user "password set?" flag (reads auth metadata). Returns only a boolean, never the hash.
-- password_set=false => migrated account that hasn't set a password yet (claim-password not done).
-- Applied to prod ola-app via Supabase MCP (mirror).
CREATE OR REPLACE FUNCTION public.admin_users_password_status()
RETURNS TABLE(user_id uuid, password_set boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT u.id AS user_id,
           COALESCE((u.raw_user_meta_data->>'password_set')::boolean, true) AS password_set
    FROM auth.users u;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_users_password_status() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_users_password_status() TO authenticated;
