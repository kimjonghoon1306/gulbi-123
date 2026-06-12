-- 온종일팜: 상품 과세/면세 구분 컬럼 추가
-- Supabase 대시보드 → SQL Editor 에서 1회 실행하세요.
--
-- 미가공 농·축·수산물(생선/정육/채소/쌀 등)은 부가가치세 "면세" → is_taxable = false (기본값)
-- 가공식품(젓갈/조미김/통조림/밀키트 등)은 "과세"        → is_taxable = true
-- 세금계산서 발행 시 과세분에만 부가세 10%가 계산됩니다.

alter table products
  add column if not exists is_taxable boolean not null default false;

-- (참고) 이미 등록된 가공식품이 있다면 아래처럼 일괄 과세 처리할 수 있습니다.
-- update products set is_taxable = true where category_id in ('<가공식품 카테고리 id>');
