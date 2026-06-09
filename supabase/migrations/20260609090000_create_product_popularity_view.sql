-- Popularidad real por producto, agregada desde los pedidos (sin PII).
-- security_invoker=false => corre con permisos del owner (bypassa RLS de user_orders),
-- igual que brand_collection_public. Sólo expone agregados (product_id -> conteo).
create or replace view public.product_popularity
with (security_invoker = false) as
select
  (item->>'product_id') as product_id,
  count(*)::int as orders_count
from public.user_orders uo
cross join lateral jsonb_array_elements(uo.items) as item
where uo.status <> 'cancelled'
  and (item->>'product_id') is not null
group by 1;

grant select on public.product_popularity to anon, authenticated;
