-- 주문 시 재고 자동 차감 (원자적 — 동시 주문에도 재고 음수 방지)
-- Supabase SQL Editor에서 1회 실행.

-- 단일 상품 재고 차감. 재고 부족이면 false, 성공이면 true
create or replace function decrement_stock(p_product_id uuid, p_qty int)
returns boolean language plpgsql security definer as $$
declare cur int;
begin
  select stock into cur from products where id = p_product_id for update;
  if not found then return false; end if;
  if cur < p_qty then return false; end if;
  update products set stock = stock - p_qty where id = p_product_id;
  return true;
end; $$;

-- 여러 상품 한 번에 차감 (장바구니 주문용). items = [{"id":"uuid","qty":3}, ...]
-- 하나라도 재고 부족이면 전체 롤백하고 부족 상품명 배열 반환. 성공 시 빈 배열
create or replace function decrement_stock_bulk(items jsonb)
returns jsonb language plpgsql security definer as $$
declare
  it jsonb;
  pid uuid;
  q int;
  cur int;
  pname text;
  fails text[] := '{}';
begin
  -- 1차: 전부 재고 확인 (잠금)
  for it in select * from jsonb_array_elements(items) loop
    pid := (it->>'id')::uuid;
    q := (it->>'qty')::int;
    select stock, name into cur, pname from products where id = pid for update;
    if not found or cur < q then
      fails := array_append(fails, coalesce(pname, '상품'));
    end if;
  end loop;

  if array_length(fails, 1) is not null then
    return jsonb_build_object('ok', false, 'fails', to_jsonb(fails));
  end if;

  -- 2차: 전부 차감
  for it in select * from jsonb_array_elements(items) loop
    pid := (it->>'id')::uuid;
    q := (it->>'qty')::int;
    update products set stock = stock - q where id = pid;
  end loop;

  return jsonb_build_object('ok', true);
end; $$;
