-- alaola ola-app (hqrnddgpnxwdcowsmpem) security lockdown phase 1 (2026-06-09)
-- Applied to prod via Supabase MCP as version 20260609224158; mirrored here for DB<->repo parity.

-- 1) product_popularity view leaks per-product order counts to anon/authenticated; not used by client.
revoke select on public.product_popularity from anon, authenticated;

-- 2) Revoke EXECUTE from anon/authenticated on internal email-queue (pgmq) + trigger functions.
do $$
declare r record;
begin
  for r in
    select format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as sig
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in (
      'enqueue_email','read_email_batch','delete_email','move_to_dlq',
      'assign_referral_code_on_insert','sync_brand_active_from_override','handle_new_user',
      'increment_product_orders','decrement_product_orders','update_updated_at_column',
      'clear_waiting_list_on_order_close','restore_waiting_list_on_revert_to_pending',
      'user_orders_waiting_for_discount_count_trg')
  loop
    execute 'revoke execute on function '||r.sig||' from anon, authenticated';
  end loop;
end $$;

-- 3) Harden mutable search_path on flagged functions.
do $$
declare r record;
begin
  for r in
    select format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as sig
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('enqueue_email','read_email_batch','delete_email','move_to_dlq','generate_referral_code')
  loop
    execute 'alter function '||r.sig||' set search_path = public';
  end loop;
end $$;

-- 4) socios_product_overrides: was public SELECT true (wholesale data). Restrict to authenticated.
drop policy if exists "Public can read socios product overrides" on public.socios_product_overrides;
create policy "Authenticated can read socios product overrides"
  on public.socios_product_overrides for select to authenticated using (true);

-- 5) Additive safe projection of weekly prices (hides current_prices/last_week_prices history).
drop view if exists public.sku_prices_public;
create view public.sku_prices_public with (security_invoker = false) as
  select sku, this_week_prices from public.sku_price_snapshots where this_week_prices is not null;
grant select on public.sku_prices_public to anon, authenticated;
