-- Admin: add 'registered' + 'rewarded' to the referral overview, and 'rewarded' to viral stats.

drop function if exists public.admin_referral_overview();
create or replace function public.admin_referral_overview()
returns table(referrer_id uuid, referrer_name text, referrer_email text,
              referrals integer, registered integer, purchasers integer, clicks integer, rewarded integer)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then raise exception 'forbidden'; end if;
  return query
  select r.user_id,
         nullif(trim(coalesce(r.first_name,'') || ' ' || coalesce(r.last_name,'')), '')::text,
         u.email::text,
         (select count(*)::int from profiles c where c.referred_by = r.user_id),
         (select count(*)::int from profiles c
            where c.referred_by = r.user_id
              and not exists (select 1 from user_roles ur where ur.user_id = c.user_id and ur.role = 'guest')),
         (select count(distinct o.user_id)::int
            from profiles c join user_orders o on o.user_id = c.user_id and o.status::text <> 'cancelled'
            where c.referred_by = r.user_id),
         (select count(*)::int from referral_clicks cl where cl.ref_code = upper(r.referral_code)),
         (select count(*)::int from profiles c where c.referred_by = r.user_id and c.referral_rewarded)
  from profiles r
  join auth.users u on u.id = r.user_id
  where r.referral_code is not null
    and (exists (select 1 from profiles c where c.referred_by = r.user_id)
         or exists (select 1 from referral_clicks cl where cl.ref_code = upper(r.referral_code)))
  order by
    (select count(*) from profiles c where c.referred_by = r.user_id)
    + (select count(*) from referral_clicks cl where cl.ref_code = upper(r.referral_code)) desc;
end;
$function$;

drop function if exists public.admin_viral_stats();
create or replace function public.admin_viral_stats()
returns table(total_users integer, referrers integer, referred_signups integer,
              unique_clicks integer, purchasers integer, rewarded integer, k_factor numeric)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then raise exception 'forbidden'; end if;
  return query
  select
    (select count(*)::int from profiles),
    (select count(distinct referred_by)::int from profiles where referred_by is not null),
    (select count(*)::int from profiles where referred_by is not null),
    (select count(*)::int from referral_clicks),
    (select count(distinct c.user_id)::int
       from profiles c join user_orders o on o.user_id = c.user_id and o.status::text <> 'cancelled'
       where c.referred_by is not null),
    (select count(*)::int from profiles where referral_rewarded),
    round(
      (select count(*)::numeric from profiles where referred_by is not null)
      / nullif((select count(*) from profiles), 0), 3);
end;
$function$;
