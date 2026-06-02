REVOKE EXECUTE ON FUNCTION public.refresh_brand_goal(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_brand_goal(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.refresh_brand_goal(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_brand_goal(text) TO service_role;