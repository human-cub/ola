-- product_popularity lost SELECT for anon/authenticated (likely a blanket REVOKE
-- during the user_orders security pass). The view is an aggregate (product_id +
-- count only, security_invoker=false) — safe for public read. Storefront sorting
-- "Más populares" depends on it.
grant select on public.product_popularity to anon, authenticated;
-- Drop the leftover write grants that make no sense on a view.
revoke insert, update, delete, truncate, references, trigger on public.product_popularity from anon, authenticated;
