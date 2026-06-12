-- 방식 A: 쿠폰 부담주체/할인액 기록 (공급사 정산 차감용)
-- coupon_owner: 공급사 쿠폰이면 그 공급사 user_id, 본사 쿠폰이면 null(=본사 부담)
-- coupon_discount: 그 주문에서 쿠폰으로 깎인 금액
-- Supabase SQL Editor에서 1회 실행하세요.

alter table general_orders   add column if not exists coupon_owner uuid;
alter table general_orders   add column if not exists coupon_discount int not null default 0;
alter table retail_orders    add column if not exists coupon_owner uuid;
alter table retail_orders    add column if not exists coupon_discount int not null default 0;
alter table wholesale_orders add column if not exists coupon_owner uuid;
alter table wholesale_orders add column if not exists coupon_discount int not null default 0;
