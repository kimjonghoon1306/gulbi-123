-- ONDA 관제 대시보드용 온종일팜 통계 RPC (강화판 v2)
-- 기존 jarvis_stats({orders, products}) 에 today_orders, revenue 추가.
-- 소매/도매/일반 3개 주문 테이블 합산. anon 공개 호출(security definer로 RLS 우회, 집계 숫자만).
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.

create or replace function jarvis_stats()
returns json
language sql
security definer
stable
as $$
  select json_build_object(
    'orders',
        (select count(*) from retail_orders)
      + (select count(*) from wholesale_orders)
      + (select count(*) from general_orders),
    'today_orders',
        (select count(*) from retail_orders    where (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date)
      + (select count(*) from wholesale_orders  where (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date)
      + (select count(*) from general_orders    where (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date),
    'revenue',
        coalesce((select sum(total_amount) from retail_orders    where status in ('결제완료','완료')), 0)
      + coalesce((select sum(total_amount) from wholesale_orders  where status in ('결제완료','완료')), 0)
      + coalesce((select sum(total_amount) from general_orders    where status in ('결제완료','완료')), 0),
    'products', (select count(*) from products)
  );
$$;

grant execute on function jarvis_stats() to anon;
