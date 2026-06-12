-- 온종일팜: 세금계산서 공급받는자 정보 보강 (대표자명·주소·이메일)
-- Supabase 대시보드 → SQL Editor 에서 1회 실행하세요.
--
-- 사업자 회원이 가입 시 대표자명/사업장주소를 입력 → shop_members에 저장
-- 계좌이체 주문 시 tax_invoices에 자동 복사 → 팝빌 세금계산서 공급받는자란에 채워짐

alter table shop_members add column if not exists business_ceo text;
alter table shop_members add column if not exists business_address text;

alter table tax_invoices add column if not exists invoicee_ceo_name text;
alter table tax_invoices add column if not exists invoicee_addr text;
alter table tax_invoices add column if not exists invoicee_email text;
