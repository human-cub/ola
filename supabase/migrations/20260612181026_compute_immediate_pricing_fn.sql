-- Server-side trusted pricing for IMMEDIATE ("Comprar ahora") orders.
-- Source of truth = frozen weekly prices in sku_price_snapshots.this_week_prices,
-- joined to order items by product_id = uuidv5(SKU) (same deterministic UUID the
-- storefront uses). Buy-now ladder [t1,t3,t4] indexed by clamp(promo_tier,0,2),
-- exactly mirroring src/hooks/useCatalogPricing.buyNowPriceFor. Cash rounding mirrors
-- src/lib/cashRounding.ts. Returns corrected {items, subtotal, discount_amount, total_amount}.
create or replace function public.compute_immediate_pricing(
  _items jsonb, _promo_tier integer, _delivery_cost numeric, _payment_method text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ns constant uuid := '8c3e6e5e-1234-4abc-8def-000000000001';
  tier_idx int := least(greatest(coalesce(_promo_tier, 0), 0), 2);
  it jsonb;
  new_items jsonb := '[]'::jsonb;
  wk jsonb;
  trusted numeric;
  retail numeric;
  qty int;
  sub numeric := 0;
  full_retail numeric := 0;
  base numeric;
  rounded numeric;
  step numeric;
  deliv numeric := greatest(coalesce(_delivery_cost, 0), 0);
begin
  if _items is null or jsonb_typeof(_items) <> 'array' then
    return null;
  end if;

  for it in select * from jsonb_array_elements(_items)
  loop
    qty := coalesce((it->>'quantity')::int, 1);
    select s.this_week_prices into wk
    from public.sku_price_snapshots s
    where s.this_week_prices is not null
      and extensions.uuid_generate_v5(ns, s.sku) = (it->>'product_id')::uuid
    limit 1;

    if wk is not null then
      trusted := case tier_idx
        when 0 then (wk->>'t1')::numeric
        when 1 then (wk->>'t3')::numeric
        else (wk->>'t4')::numeric end;
      retail := coalesce((wk->>'retail')::numeric, trusted);
      it := jsonb_set(it, '{price_per_unit}', to_jsonb(trusted));
    else
      trusted := coalesce((it->>'price_per_unit')::numeric, 0);
      retail := trusted;
    end if;

    sub := sub + trusted * qty;
    full_retail := full_retail + retail * qty;
    new_items := new_items || it;
  end loop;

  base := sub + deliv;
  if _payment_method = 'efectivo' and base >= 5000 then
    rounded := null;
    foreach step in array array[10000, 5000, 1000]::numeric[]
    loop
      if floor(base / step) * step > 0 and base - floor(base / step) * step <= base * 0.025 then
        rounded := floor(base / step) * step;
        exit;
      end if;
    end loop;
    if rounded is null then
      rounded := floor(base / 500) * 500;
      if rounded <= 0 then rounded := base; end if;
    end if;
  else
    rounded := base;
  end if;

  return jsonb_build_object(
    'items', new_items,
    'subtotal', sub,
    'discount_amount', greatest(full_retail - sub, 0),
    'total_amount', rounded);
end;
$$;

revoke all on function public.compute_immediate_pricing(jsonb, integer, numeric, text) from public;
