-- 관리자·공급업체 상품의 원산지 표시 정보
alter table products
  add column if not exists origin text;

comment on column products.origin is '상품에 표시할 원산지 국가 또는 지역';
