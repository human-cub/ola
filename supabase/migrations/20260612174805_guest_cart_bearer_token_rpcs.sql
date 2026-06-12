-- Guest cart bearer-token model: anon manages ONLY its own session via SECURITY DEFINER
-- RPCs scoped by session_id (unguessable UUID). Direct anon table access is removed,
-- so an anon can no longer read/modify other guests' cart rows.

drop policy if exists "Anon can insert session cart items" on public.cart_items;
drop policy if exists "Anon can view session cart items" on public.cart_items;
drop policy if exists "Anon can update session cart items" on public.cart_items;
drop policy if exists "Anon can delete session cart items" on public.cart_items;

create or replace function public.guest_cart_list(_session_id text)
returns setof public.cart_items
language sql security definer set search_path = public stable as $$
  select * from public.cart_items
  where session_id = _session_id and user_id is null and mode = 'retail'
  order by created_at asc;
$$;

create or replace function public.guest_cart_find(_session_id text, _product_id uuid, _flavor text)
returns table(id uuid, quantity integer)
language sql security definer set search_path = public stable as $$
  select id, quantity from public.cart_items
  where session_id = _session_id and user_id is null and mode = 'retail'
    and product_id = _product_id and flavor is not distinct from _flavor
  order by created_at asc;
$$;

create or replace function public.guest_cart_insert(
  _session_id text, _product_id uuid, _product_name text, _flavor text,
  _quantity integer, _price_per_unit numeric, _product_image text, _product_link text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare _id uuid;
begin
  insert into public.cart_items(session_id, user_id, product_id, product_name, flavor,
    quantity, price_per_unit, product_image, product_link, mode)
  values(_session_id, null, _product_id, _product_name, _flavor,
    greatest(1, least(_quantity, 99)), _price_per_unit, _product_image, _product_link, 'retail')
  returning id into _id;
  return _id;
end; $$;

create or replace function public.guest_cart_set_quantity(_session_id text, _id uuid, _quantity integer)
returns void language sql security definer set search_path = public as $$
  update public.cart_items set quantity = greatest(1, least(_quantity, 99))
  where id = _id and session_id = _session_id and user_id is null and mode = 'retail';
$$;

create or replace function public.guest_cart_set_flavor(_session_id text, _id uuid, _flavor text)
returns void language sql security definer set search_path = public as $$
  update public.cart_items set flavor = _flavor
  where id = _id and session_id = _session_id and user_id is null and mode = 'retail';
$$;

create or replace function public.guest_cart_delete(_session_id text, _ids uuid[])
returns void language sql security definer set search_path = public as $$
  delete from public.cart_items
  where id = any(_ids) and session_id = _session_id and user_id is null and mode = 'retail';
$$;

create or replace function public.guest_cart_clear(_session_id text)
returns void language sql security definer set search_path = public as $$
  delete from public.cart_items
  where session_id = _session_id and user_id is null and mode = 'retail';
$$;

grant execute on function public.guest_cart_list(text) to anon, authenticated;
grant execute on function public.guest_cart_find(text, uuid, text) to anon, authenticated;
grant execute on function public.guest_cart_insert(text, uuid, text, text, integer, numeric, text, text) to anon, authenticated;
grant execute on function public.guest_cart_set_quantity(text, uuid, integer) to anon, authenticated;
grant execute on function public.guest_cart_set_flavor(text, uuid, text) to anon, authenticated;
grant execute on function public.guest_cart_delete(text, uuid[]) to anon, authenticated;
grant execute on function public.guest_cart_clear(text) to anon, authenticated;
