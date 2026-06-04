-- Fix: brand_collection_public and products_public were created WITH (security_invoker = true),
-- but anon's SELECT on the base tables (brand_overrides, products) was revoked in the same
-- lockdown migration. With security_invoker=true the view runs as the CALLER (anon), so anon
-- hit "permission denied for table brand_overrides/products" through the views — breaking the
-- brand progress bars and any public read of the views.
--
-- Switch both views to SECURITY DEFINER (security_invoker = false): the view then runs with the
-- view owner's privileges, reads the base tables, and exposes ONLY the safe projected columns to
-- anon/authenticated (who already hold GRANT SELECT on the views). The base-table lockdown
-- (REVOKE SELECT FROM anon + admin-only RLS) stays fully intact — anon still cannot read the
-- base tables directly, only the curated views.
ALTER VIEW public.brand_collection_public SET (security_invoker = false);
ALTER VIEW public.products_public      SET (security_invoker = false);
