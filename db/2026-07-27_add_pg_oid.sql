-- 온종일팜: KG이니시스 결제 연동용 주문번호(oid) 매핑 컬럼
-- Supabase 대시보드 → SQL Editor 에서 1회 붙여넣고 RUN 하세요.
--
-- 이니시스 결제창을 열 때 생성한 oid를 주문에 저장해두고,
-- 인증결과(returnUrl)와 가상계좌 입금통보(vbank-noti)에서 이 값으로 주문을 찾습니다.

alter table general_orders   add column if not exists pg_oid text;
alter table retail_orders    add column if not exists pg_oid text;
alter table wholesale_orders add column if not exists pg_oid text;

create index if not exists general_orders_pg_oid_idx   on general_orders(pg_oid);
create index if not exists retail_orders_pg_oid_idx    on retail_orders(pg_oid);
create index if not exists wholesale_orders_pg_oid_idx on wholesale_orders(pg_oid);
