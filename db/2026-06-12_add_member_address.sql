-- 회원 기본 배송지 (마이페이지 > 설정에서 등록, 체크아웃 자동입력)
-- Supabase SQL Editor에서 1회 실행하세요. 기존 데이터에 영향 없습니다.

alter table shop_members add column if not exists address text;
