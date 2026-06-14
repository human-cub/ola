-- Instagram social reward (Phase A, step 2): capture the user's handle on claim.
alter table public.profiles
  add column if not exists instagram_handle text;

drop function if exists public.claim_social_reward();

create or replace function public.claim_social_reward(_handle text default null)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_enabled boolean;
  v_uid uuid := auth.uid();
  v_handle text := nullif(regexp_replace(lower(btrim(coalesce(_handle, ''))), '^@+', ''), '');
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
         instagram_handle = coalesce(v_handle, instagram_handle),
         updated_at = now()
   where user_id = v_uid;
  return true;
end;
$$;

revoke all on function public.claim_social_reward(text) from public, anon;
grant execute on function public.claim_social_reward(text) to authenticated;
