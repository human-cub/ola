-- alaola ola-app security lockdown phase 2a (2026-06-09) — applied to prod via MCP.
do $$
begin
  if exists (select 1 from storage.buckets where id='product-images' and public = true) then
    drop policy if exists "Product images are publicly accessible" on storage.objects;
  end if;
end $$;
do $$
declare r record;
begin
  for r in
    select format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as sig
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('assign_referral_code_on_insert','sync_brand_active_from_override')
  loop
    execute 'revoke execute on function '||r.sig||' from public, anon, authenticated';
  end loop;
end $$;
