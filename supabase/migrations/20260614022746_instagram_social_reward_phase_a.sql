-- Instagram social reward (Phase A: honor-system follow @ola.unity).
-- Separate flag from referral reward, same effect (Súper on group order).
-- One reward active at a time; one grant per account (antifraud).

alter table public.profiles
  add column if not exists has_social_reward boolean not null default false,
  add column if not exists social_reward_granted_at timestamptz;

create or replace function public.claim_social_reward()
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_enabled boolean;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return false; end if;
  select (value #>> '{}')::boolean into v_enabled from app_settings where key = 'viral_enabled';
  if v_enabled is not true then return false; end if;
  if exists (select 1 from user_roles where user_id = v_uid and role = 'guest') then
    return false;
  end if;
  if exists (select 1 from profiles where user_id = v_uid and social_reward_granted_at is not null) then
    return false;
  end if;
  update profiles
     set has_social_reward = true,
         social_reward_granted_at = now(),
         updated_at = now()
   where user_id = v_uid;
  return true;
end;
$$;

revoke all on function public.claim_social_reward() from public, anon;
grant execute on function public.claim_social_reward() to authenticated;

create or replace function public.consume_referral_reward()
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then return false; end if;
  update public.profiles
     set has_referral_reward = false,
         has_social_reward = false,
         updated_at = now()
   where user_id = auth.uid()
     and (has_referral_reward = true or has_social_reward = true);
  return found;
end;
$$;
