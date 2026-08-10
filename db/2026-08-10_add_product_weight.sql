-- 상품 중량/수량 수치 컬럼 추가 (단위는 기존 unit 컬럼 사용: 예 1.5 + kg = "1.5kg")
alter table products add column if not exists weight numeric;
