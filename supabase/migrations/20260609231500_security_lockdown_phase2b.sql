-- alaola ola-app security lockdown phase 2b (2026-06-09) — applied to prod via MCP.
-- Hide weekly price history (current_prices/last_week_prices + timestamps) from anon.
-- Catalog uses sku_prices_public; anon keeps column-level read of (sku, this_week_prices) on base
-- so cached/older bundles still render (no breakage). Admin keeps full access via existing policy.
revoke select on public.sku_price_snapshots from anon;
grant select (sku, this_week_prices) on public.sku_price_snapshots to anon;
