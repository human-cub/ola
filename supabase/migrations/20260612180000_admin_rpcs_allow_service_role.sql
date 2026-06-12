-- Allow service_role (curator worker server fns) to call admin analytics/referral RPCs.
-- Human admins keep working via has_role; service_role is server-side only.
-- Rewrites the role gate in-place from the live function definitions.

do $$
declare
  fn record;
  src text;
  old_gate text := 'if not public.has_role(auth.uid(), ''admin''::app_role) then raise exception ''forbidden''; end if;';
  new_gate text := 'if not (public.has_role(auth.uid(), ''admin''::app_role) or coalesce(auth.jwt()->>''role'','''') = ''service_role'') then raise exception ''forbidden''; end if;';
begin
  for fn in
    select p.oid, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('admin_analytics_report','admin_referral_overview',
                        'admin_referral_weekly','admin_share_breakdown','admin_viral_stats')
  loop
    src := pg_get_functiondef(fn.oid);
    if position(old_gate in src) = 0 then
      raise exception 'gate not found in %', fn.proname;
    end if;
    execute replace(src, old_gate, new_gate);
  end loop;
end $$;
