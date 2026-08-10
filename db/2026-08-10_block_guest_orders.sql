-- 비회원·회원정보 없는 계정·다른 회원 ID로 주문을 생성하는 것을 DB에서 차단합니다.
create or replace function public.enforce_registered_order_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- 결제 웹훅 등 service_role 작업은 허용합니다.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception '로그인한 회원만 주문할 수 있습니다.';
  end if;

  if new.user_id is null or new.user_id::text <> auth.uid()::text then
    raise exception '주문 회원 정보가 로그인 사용자와 일치하지 않습니다.';
  end if;

  if not exists (select 1 from public.shop_members where id = auth.uid()) then
    raise exception '가입된 쇼핑몰 회원만 주문할 수 있습니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_registered_owner_general on public.general_orders;
create trigger enforce_registered_owner_general
before insert or update of user_id on public.general_orders
for each row execute function public.enforce_registered_order_owner();

drop trigger if exists enforce_registered_owner_retail on public.retail_orders;
create trigger enforce_registered_owner_retail
before insert or update of user_id on public.retail_orders
for each row execute function public.enforce_registered_order_owner();

drop trigger if exists enforce_registered_owner_wholesale on public.wholesale_orders;
create trigger enforce_registered_owner_wholesale
before insert or update of user_id on public.wholesale_orders
for each row execute function public.enforce_registered_order_owner();
