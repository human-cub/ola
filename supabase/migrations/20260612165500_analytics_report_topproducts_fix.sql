-- top_products: cart adds carry only product name (no sku) → group by coalesce(sku, name).
create or replace function public.admin_analytics_report(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  result jsonb;
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then raise exception 'forbidden'; end if;

  with ev as (
    select * from analytics_events
    where created_at >= p_from and created_at < p_to
      and (path is null or path not like '/admin%')
  ),
  sess as (
    select session_id,
           min(created_at) as started_at,
           max(created_at) as ended_at,
           (array_agg(visitor_id order by created_at))[1] as visitor_id,
           (array_agg(user_id) filter (where user_id is not null))[1] as user_id,
           (array_agg(utm order by created_at) filter (where utm is not null))[1] as utm,
           (array_agg(referrer order by created_at) filter (where referrer is not null and referrer <> ''))[1] as referrer,
           count(*) filter (where event = 'Page View') as page_views
    from ev group by session_id
  ),
  sess_ch as (
    select s.*,
      coalesce(
        nullif(s.utm->>'utm_source',''),
        case
          when s.referrer is null then 'direct'
          when s.referrer ilike '%instagram%' then 'instagram'
          when s.referrer ilike '%wa.me%' or s.referrer ilike '%whatsapp%' then 'whatsapp'
          when s.referrer ilike '%google%' then 'google'
          when s.referrer ilike '%facebook%' or s.referrer ilike '%fb.%' then 'facebook'
          when s.referrer ilike '%alaola%' then 'direct'
          else split_part(regexp_replace(s.referrer, '^https?://(www\.)?', ''), '/', 1)
        end,
        'direct') as channel,
      nullif(s.utm->>'utm_medium','') as medium,
      nullif(s.utm->>'utm_campaign','') as campaign
    from sess s
  ),
  firsts as (
    select visitor_id, min(created_at) as first_seen
    from analytics_events group by visitor_id
  ),
  orders_p as (
    select * from user_orders
    where created_at >= p_from and created_at < p_to and status::text <> 'cancelled'
  ),
  order_attr as (
    select o.id, o.user_id, o.total_amount, o.order_type::text as order_type,
      coalesce((select sc.channel from sess_ch sc
                 where sc.user_id = o.user_id and sc.started_at <= o.created_at
                 order by sc.started_at desc limit 1), 'unknown') as channel
    from orders_p o
  ),
  signups_p as (
    select p.user_id, p.created_at,
      coalesce((select sc.channel from sess_ch sc
                 where sc.user_id = p.user_id
                 order by sc.started_at asc limit 1), 'unknown') as channel
    from profiles p
    where p.created_at >= p_from and p.created_at < p_to
  )
  select jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'traffic', (
      select jsonb_build_object(
        'visitors', count(distinct visitor_id),
        'sessions', count(*),
        'page_views', coalesce(sum(page_views), 0),
        'new_visitors', (select count(*) from firsts f
                          where f.first_seen >= p_from and f.first_seen < p_to),
        'avg_pageviews_per_session', round(coalesce(avg(page_views), 0), 2),
        'sessions_per_visitor', round(count(*)::numeric / nullif(count(distinct visitor_id), 0), 2)
      ) from sess_ch
    ),
    'channels', coalesce((
      select jsonb_agg(row order by (row->>'sessions')::int desc) from (
        select jsonb_build_object(
          'channel', sc.channel,
          'sessions', count(*),
          'visitors', count(distinct sc.visitor_id),
          'signups', (select count(*) from signups_p sp where sp.channel = sc.channel),
          'orders', (select count(*) from order_attr oa where oa.channel = sc.channel),
          'revenue', (select coalesce(sum(oa.total_amount), 0) from order_attr oa where oa.channel = sc.channel)
        ) as row
        from sess_ch sc group by sc.channel
      ) t
    ), '[]'::jsonb),
    'campaigns', coalesce((
      select jsonb_agg(row order by (row->>'sessions')::int desc) from (
        select jsonb_build_object(
          'source', sc.channel, 'medium', sc.medium, 'campaign', sc.campaign,
          'sessions', count(*)) as row
        from sess_ch sc
        where sc.utm is not null
        group by sc.channel, sc.medium, sc.campaign
      ) t
    ), '[]'::jsonb),
    'funnel', (
      select jsonb_build_object(
        'visitors', (select count(distinct visitor_id) from ev),
        'product_viewers', (select count(distinct visitor_id) from ev where event = 'Product View'),
        'cart_adders', (select count(distinct visitor_id) from ev
                         where event in ('Add to Cart', 'Group Joined', 'List Joined')),
        'signups', (select count(*) from signups_p),
        'checkouts', (select count(distinct visitor_id) from ev where event = 'Checkout Complete'),
        'orders', (select count(*) from orders_p)
      )
    ),
    'top_products', coalesce((
      select jsonb_agg(row order by (row->>'views')::int desc) from (
        select jsonb_build_object(
          'name', coalesce(max(nullif(props->>'name','')), max(nullif(props->>'sku','')), '—'),
          'sku', max(props->>'sku'),
          'views', count(*) filter (where event = 'Product View'),
          'adds', count(*) filter (where event in ('Add to Cart', 'Group Joined', 'List Joined'))
        ) as row
        from ev
        where event in ('Product View', 'Add to Cart', 'Group Joined', 'List Joined')
          and coalesce(nullif(props->>'sku',''), nullif(props->>'name','')) is not null
        group by coalesce(nullif(props->>'sku',''), nullif(props->>'name',''))
        order by count(*) filter (where event = 'Product View') desc
        limit 20
      ) t
    ), '[]'::jsonb),
    'searches', jsonb_build_object(
      'top', coalesce((
        select jsonb_agg(row order by (row->>'count')::int desc) from (
          select jsonb_build_object(
            'query', lower(props->>'query'),
            'count', count(*),
            'results', max((props->>'results')::int)) as row
          from ev where event = 'Search' and nullif(props->>'query','') is not null
          group by lower(props->>'query')
          order by count(*) desc limit 20
        ) t
      ), '[]'::jsonb),
      'zero_results', coalesce((
        select jsonb_agg(row order by (row->>'count')::int desc) from (
          select jsonb_build_object('query', lower(props->>'query'), 'count', count(*)) as row
          from ev where event = 'Search' and (props->>'results')::int = 0
            and nullif(props->>'query','') is not null
          group by lower(props->>'query')
          order by count(*) desc limit 20
        ) t
      ), '[]'::jsonb)
    ),
    'exit_pages', coalesce((
      select jsonb_agg(row order by (row->>'exits')::int desc) from (
        select jsonb_build_object('path', last_path, 'exits', count(*)) as row from (
          select (array_agg(path order by created_at desc))[1] as last_path
          from ev where event = 'Page View'
          group by session_id
        ) lp
        group by last_path
        order by count(*) desc limit 15
      ) t
    ), '[]'::jsonb),
    'shares', coalesce((
      select jsonb_agg(row order by (row->>'count')::int desc) from (
        select jsonb_build_object(
          'method', coalesce(props->>'method', '—'),
          'source', coalesce(props->>'source', '—'),
          'count', count(*)) as row
        from ev where event = 'Referral Shared'
        group by props->>'method', props->>'source'
      ) t
    ), '[]'::jsonb),
    'contact_gate', coalesce((
      select jsonb_agg(row) from (
        select jsonb_build_object('method', coalesce(props->>'method', '—'), 'count', count(*)) as row
        from ev where event = 'Contact Gate Clicked'
        group by props->>'method'
      ) t
    ), '[]'::jsonb),
    'carts', (
      select jsonb_build_object(
        'visitors_with_add', (select count(distinct visitor_id) from ev
                               where event in ('Add to Cart', 'Group Joined', 'List Joined')),
        'visitors_converted', (select count(distinct visitor_id) from ev where event = 'Checkout Complete'),
        'abandoned_visitors', (
          select count(*) from (
            select visitor_id from ev
            where event in ('Add to Cart', 'Group Joined', 'List Joined')
            group by visitor_id
          ) a where not exists (
            select 1 from ev c where c.event = 'Checkout Complete' and c.visitor_id = a.visitor_id)
        )
      )
    ),
    'orders', (
      select jsonb_build_object(
        'count', count(*),
        'revenue', coalesce(sum(total_amount), 0),
        'aov', round(coalesce(avg(total_amount), 0), 0),
        'by_type', coalesce((
          select jsonb_object_agg(order_type::text, cnt) from (
            select order_type, count(*) as cnt from orders_p group by order_type) bt
        ), '{}'::jsonb)
      ) from orders_p
    ),
    'referral', (
      select jsonb_build_object(
        'clicks', (select count(*) from referral_clicks
                    where created_at >= p_from and created_at < p_to),
        'referred_signups', (select count(*) from profiles
                              where referred_by is not null
                                and created_at >= p_from and created_at < p_to),
        'shares', (select count(*) from ev where event = 'Referral Shared')
      )
    )
  ) into result;

  return result;
end;
$function$;
