-- 결제 금액 서버 검증(2번 무결성)용: 주문에 적용된 쿠폰 코드를 컬럼으로 보관
-- (기존엔 note 텍스트에만 있어 서버가 할인액을 재계산할 수 없었음)
-- Supabase SQL Editor에서 1회 실행하세요.

alter table general_orders   add column if not exists coupon_code text;
alter table retail_orders    add column if not exists coupon_code text;
alter table wholesale_orders add column if not exists coupon_code text;
