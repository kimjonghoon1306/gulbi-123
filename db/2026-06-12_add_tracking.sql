-- 통합 배송추적: 주문에 택배사 코드 + 송장번호
-- Supabase SQL Editor에서 1회 실행. 기존 데이터 영향 없음.

alter table general_orders   add column if not exists courier_code text;
alter table general_orders   add column if not exists tracking_number text;
alter table retail_orders    add column if not exists courier_code text;
alter table retail_orders    add column if not exists tracking_number text;
alter table wholesale_orders add column if not exists courier_code text;
alter table wholesale_orders add column if not exists tracking_number text;
