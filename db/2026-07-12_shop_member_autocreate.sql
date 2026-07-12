-- 회원 자동생성 트리거 + 기존 유령계정 백필
-- 문제: auth.users(인증계정)엔 있는데 shop_members(회원정보)엔 없어
--       회원관리에 안 뜨고 재가입 시 "이미 가입" 에러가 나던 계정 구제 + 재발방지.
-- Supabase SQL Editor에서 1회 실행. 여러 번 실행해도 안전(멱등).

-- 1) 가입(auth.users insert) 시 shop_members 자동 생성
create or replace function handle_new_shop_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into shop_members (id, email, name, contact, member_type,
    business_name, business_number, business_ceo, business_address, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'contact', ''),
    coalesce(new.raw_user_meta_data->>'member_type', '일반'),
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'business_number',
    new.raw_user_meta_data->>'business_ceo',
    new.raw_user_meta_data->>'business_address',
    case when coalesce(new.raw_user_meta_data->>'member_type', '일반') = '일반'
         then '승인' else '대기중' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_shop_member on auth.users;
create trigger on_auth_user_created_shop_member
  after insert on auth.users
  for each row execute function handle_new_shop_member();

-- 2) 기존 유령계정(auth엔 있는데 shop_members 없음) 백필 → 회원관리에 다시 뜸
insert into shop_members (id, email, name, contact, member_type, status)
select u.id, u.email,
  coalesce(u.raw_user_meta_data->>'name', ''),
  coalesce(u.raw_user_meta_data->>'contact', ''),
  coalesce(u.raw_user_meta_data->>'member_type', '일반'),
  case when coalesce(u.raw_user_meta_data->>'member_type', '일반') = '일반'
       then '승인' else '대기중' end
from auth.users u
where u.id not in (select id from shop_members)
on conflict (id) do nothing;
