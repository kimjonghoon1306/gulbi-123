-- 리뷰 구매인증 배지
-- Supabase SQL Editor에서 1회 실행하세요.
-- 완료된 주문에 포함된 상품 리뷰만 verified_purchase=true로 저장합니다.
-- 주의: 주문 테이블의 user_id/product_id 타입이 text일 수 있어 전부 ::text 로 비교합니다.

alter table reviews add column if not exists verified_purchase boolean not null default false;

drop function if exists review_has_completed_purchase(uuid, uuid);

create or replace function review_has_completed_purchase(p_user_id text, p_product_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from general_order_items i
      join general_orders o on o.id = i.order_id
      where o.user_id::text = p_user_id
        and o.status = '완료'
        and i.product_id::text = p_product_id
    )
    or exists (
      select 1
      from retail_order_items i
      join retail_orders o on o.id = i.order_id
      where o.user_id::text = p_user_id
        and o.status = '완료'
        and i.product_id::text = p_product_id
    )
    or exists (
      select 1
      from wholesale_order_items i
      join wholesale_orders o on o.id = i.order_id
      where o.user_id::text = p_user_id
        and o.status = '완료'
        and i.product_id::text = p_product_id
    );
$$;

create or replace function set_review_verified_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.verified_purchase := review_has_completed_purchase(new.user_id::text, new.product_id::text);
  return new;
end;
$$;

drop trigger if exists reviews_set_verified_purchase on reviews;
create trigger reviews_set_verified_purchase
  before insert or update on reviews
  for each row execute function set_review_verified_purchase();

update reviews
set verified_purchase = review_has_completed_purchase(user_id::text, product_id::text);
