-- 공급업체가 자기 상품의 재고만 원자적으로 입출고 처리합니다.
create or replace function public.supplier_adjust_inventory(
  p_product_id uuid,
  p_type text,
  p_quantity integer,
  p_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_new_stock integer;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if p_type not in ('입고', '출고') then raise exception '입출고 구분이 올바르지 않습니다.'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception '수량은 1 이상이어야 합니다.'; end if;

  select * into v_product from products
  where id = p_product_id and supplier_id = auth.uid()
  for update;
  if not found then raise exception '본인 상품만 변경할 수 있습니다.'; end if;

  v_new_stock := case when p_type = '입고' then v_product.stock + p_quantity else v_product.stock - p_quantity end;
  if v_new_stock < 0 then raise exception '재고가 부족합니다.'; end if;

  update products set stock = v_new_stock where id = p_product_id and supplier_id = auth.uid();
  insert into inventory_logs (product_id, product_name, type, quantity, note)
  values (p_product_id, v_product.name, p_type, p_quantity, coalesce(p_note, ''));
end;
$$;

revoke execute on function public.supplier_adjust_inventory(uuid, text, integer, text) from public, anon;
grant execute on function public.supplier_adjust_inventory(uuid, text, integer, text) to authenticated;

-- 입출고 이력은 관리자 또는 해당 상품의 공급업체만 조회합니다.
alter table public.inventory_logs enable row level security;

drop policy if exists "inventory_logs_select_admin_or_owner" on public.inventory_logs;
create policy "inventory_logs_select_admin_or_owner" on public.inventory_logs
for select using (
  is_admin()
  or exists (
    select 1 from public.products
    where products.id = inventory_logs.product_id
      and products.supplier_id = auth.uid()
  )
);

drop policy if exists "inventory_logs_insert_admin" on public.inventory_logs;
create policy "inventory_logs_insert_admin" on public.inventory_logs
for insert with check (is_admin());

drop policy if exists "inventory_logs_update_admin" on public.inventory_logs;
create policy "inventory_logs_update_admin" on public.inventory_logs
for update using (is_admin()) with check (is_admin());

drop policy if exists "inventory_logs_delete_admin" on public.inventory_logs;
create policy "inventory_logs_delete_admin" on public.inventory_logs
for delete using (is_admin());
