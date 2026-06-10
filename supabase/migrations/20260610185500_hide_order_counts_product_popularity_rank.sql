-- product_popularity is used by the catalog ONLY as a sort key (never displayed), so expose a
-- relative popularity RANK instead of the raw per-product order count. Ordering preserved; real
-- counts no longer exposed to anon. Applied to prod via MCP.
create or replace view public.product_popularity with (security_invoker = false) as
with counts as (
  select (item.value ->> 'product_id') as product_id, count(*)::int as cnt
  from public.user_orders uo
  cross join lateral jsonb_array_elements(uo.items) item(value)
  where uo.status <> 'cancelled'::extended_order_status
    and (item.value ->> 'product_id') is not null
  group by (item.value ->> 'product_id')
)
select product_id, dense_rank() over (order by cnt)::int as orders_count
from counts;
