-- 온종일팜: 카드결제 환불을 위해 토스 paymentKey 저장 컬럼 추가
-- Supabase 대시보드 → SQL Editor 에서 1회 실행하세요.
--
-- 카드(토스)결제 승인 시 paymentKey/승인금액을 주문에 저장해야,
-- 나중에 관리자가 "환불" 버튼으로 토스 결제취소(/v1/payments/{paymentKey}/cancel)를 호출할 수 있습니다.

alter table general_orders   add column if not exists payment_key text;
alter table general_orders   add column if not exists paid_amount integer;

alter table retail_orders    add column if not exists payment_key text;
alter table retail_orders    add column if not exists paid_amount integer;

alter table wholesale_orders add column if not exists payment_key text;
alter table wholesale_orders add column if not exists paid_amount integer;
