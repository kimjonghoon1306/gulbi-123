-- 상품별 배송비 정책 + 주문 시점 배송비 스냅샷
alter table products
  add column if not exists shipping_type text not null default 'free',
  add column if not exists shipping_fee integer not null default 0,
  add column if not exists free_shipping_threshold integer;

alter table products drop constraint if exists products_shipping_type_check;
alter table products add constraint products_shipping_type_check
  check (shipping_type in ('free', 'paid'));
alter table products drop constraint if exists products_shipping_fee_check;
alter table products add constraint products_shipping_fee_check
  check (shipping_fee >= 0);
alter table products drop constraint if exists products_free_shipping_threshold_check;
alter table products add constraint products_free_shipping_threshold_check
  check (free_shipping_threshold is null or free_shipping_threshold > 0);

comment on column products.shipping_type is '상품별 배송 정책: free 무료 / paid 유료';
comment on column products.shipping_fee is '유료배송 기본 배송비';
comment on column products.free_shipping_threshold is '해당 상품 가격×수량 기준 무료배송 최소금액, null이면 조건부 무료 없음';

do $$
declare t text;
begin
  foreach t in array array['general_order_items','retail_order_items','wholesale_order_items'] loop
    execute format('alter table %I add column if not exists shipping_type text', t);
    execute format('alter table %I add column if not exists shipping_fee integer not null default 0', t);
    execute format('alter table %I add column if not exists free_shipping_threshold integer', t);
    execute format('alter table %I add column if not exists shipping_discount integer not null default 0', t);
    execute format('alter table %I add column if not exists applied_shipping_fee integer not null default 0', t);
  end loop;
end $$;
