-- Enforce trusted server-side prices on IMMEDIATE ("Comprar ahora") orders.
-- Only order_type='immediate' is touched (collective is governed by pending+sync;
-- mayorista/socios use their own PM prices and are skipped). Legit orders recompute to
-- the same values (same frozen snapshot source); tampered client prices are overwritten.
create or replace function public.enforce_immediate_order_prices()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb;
begin
  if NEW.order_type <> 'immediate' then
    return NEW;
  end if;
  r := public.compute_immediate_pricing(NEW.items, NEW.promo_tier, NEW.delivery_cost, NEW.payment_method);
  if r is null then
    return NEW;
  end if;
  NEW.items := r->'items';
  NEW.subtotal := (r->>'subtotal')::numeric;
  NEW.discount_amount := (r->>'discount_amount')::numeric;
  NEW.total_amount := (r->>'total_amount')::numeric;
  return NEW;
end;
$$;

drop trigger if exists trg_enforce_immediate_order_prices on public.user_orders;
create trigger trg_enforce_immediate_order_prices
  before insert on public.user_orders
  for each row execute function public.enforce_immediate_order_prices();
