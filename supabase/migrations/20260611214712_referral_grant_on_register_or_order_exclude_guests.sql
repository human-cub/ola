-- Referral reward grant rules: grant to referrer on registration OR registered order;
-- guests never grant (anti-fraud). One grant per invitee. Click-based reward unchanged.

alter table public.profiles add column if not exists referral_rewarded boolean not null default false;
update public.profiles set referral_rewarded = true where referred_by is not null and referral_rewarded = false;

create or replace function public.maybe_grant_referral(_invitee uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_enabled boolean;
  v_referrer uuid;
  v_rewarded boolean;
begin
  if _invitee is null then return; end if;
  select (value #>> '{}')::boolean into v_enabled from app_settings where key = 'viral_enabled';
  if v_enabled is not true then return; end if;
  select referred_by, referral_rewarded into v_referrer, v_rewarded
    from profiles where user_id = _invitee;
  if v_referrer is null or v_rewarded is true or v_referrer = _invitee then return; end if;
  if exists (select 1 from user_roles where user_id = _invitee and role = 'guest') then return; end if;
  update profiles set has_referral_reward = true, updated_at = now() where user_id = v_referrer;
  update profiles set referral_rewarded = true, updated_at = now() where user_id = _invitee;
end;
$function$;

create or replace function public.set_referred_by(_ref_code text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me uuid := auth.uid();
  referrer uuid;
begin
  if me is null or _ref_code is null or length(trim(_ref_code)) = 0 then return false; end if;
  if exists (select 1 from public.profiles where user_id = me and referred_by is not null) then return false; end if;
  select user_id into referrer from public.profiles where lower(referral_code) = lower(trim(_ref_code)) limit 1;
  if referrer is null or referrer = me then return false; end if;
  update public.profiles set referred_by = referrer, updated_at = now() where user_id = me;
  perform public.maybe_grant_referral(me);
  return true;
end;
$function$;

create or replace function public.trg_referral_on_order()
returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  perform public.maybe_grant_referral(new.user_id);
  return new;
end;
$function$;
drop trigger if exists referral_on_order on public.user_orders;
create trigger referral_on_order after insert on public.user_orders
  for each row execute function public.trg_referral_on_order();

create or replace function public.trg_referral_on_role()
returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  perform public.maybe_grant_referral(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$function$;
drop trigger if exists referral_on_role on public.user_roles;
create trigger referral_on_role after insert or update or delete on public.user_roles
  for each row execute function public.trg_referral_on_role();
