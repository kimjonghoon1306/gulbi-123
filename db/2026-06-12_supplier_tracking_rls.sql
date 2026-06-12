-- 공급업체가 '자기 상품이 포함된 주문'의 송장(courier_code/tracking_number)을 입력할 수 있게 허용
-- (관리자/고객과 같은 칸을 공유 → 공급업체가 넣으면 관리자·고객 화면에 자동 연동)
-- Supabase SQL Editor에서 1회 실행. 먼저 2026-06-12_add_tracking.sql(송장 컬럼)이 실행돼 있어야 함.

-- general_orders
drop policy if exists "supplier_update_general_order" on general_orders;
create policy "supplier_update_general_order" on general_orders
  for update
  using (exists (select 1 from general_order_items i where i.order_id = general_orders.id and i.supplier_id = auth.uid()))
  with check (exists (select 1 from general_order_items i where i.order_id = general_orders.id and i.supplier_id = auth.uid()));

-- retail_orders
drop policy if exists "supplier_update_retail_order" on retail_orders;
create policy "supplier_update_retail_order" on retail_orders
  for update
  using (exists (select 1 from retail_order_items i where i.order_id = retail_orders.id and i.supplier_id = auth.uid()))
  with check (exists (select 1 from retail_order_items i where i.order_id = retail_orders.id and i.supplier_id = auth.uid()));

-- wholesale_orders
drop policy if exists "supplier_update_wholesale_order" on wholesale_orders;
create policy "supplier_update_wholesale_order" on wholesale_orders
  for update
  using (exists (select 1 from wholesale_order_items i where i.order_id = wholesale_orders.id and i.supplier_id = auth.uid()))
  with check (exists (select 1 from wholesale_order_items i where i.order_id = wholesale_orders.id and i.supplier_id = auth.uid()));
