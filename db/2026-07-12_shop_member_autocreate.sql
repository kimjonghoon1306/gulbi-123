-- 회원 자동생성(손님 전용) + 유령계정 백필 + 관리자/공급사 오분류 정리
-- 문제1: auth.users엔 있는데 shop_members엔 없어 회원관리 누락 + 재가입 "이미 가입" 에러.
-- 문제2: 백필이 관리자/공급사까지 손님목록에 넣어 관리자가 회원검색에 뜨던 문제.
-- 원칙: 공급사 표식(account_type=supplier) 또는 명시적 관리자만 제외하고 나머지는 손님으로 잡는다.
-- Supabase SQL Editor에서 1회 실행. 여러 번 실행해도 안전(멱등).

-- 0) 잘못 들어간 관리자/공급사를 손님목록(shop_members)에서 제거
delete from shop_members
where id in (select user_id from admin_users)
   or id in (select id from suppliers);

-- 1) 가입 시 shop_members 자동 생성 — 메타 없는 일반 가입도 유령으로 남기지 않는다.
create or replace function handle_new_shop_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 공급사 가입은 가입 코드가 account_type=supplier를 명시한다.
  if coalesce(new.raw_user_meta_data->>'account_type', '') = 'supplier'
     or exists (select 1 from admin_users where user_id = new.id)
     or exists (select 1 from suppliers where id = new.id) then
    return new;
  end if;

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

-- 2) 기존 유령계정 백필 (관리자/공급사는 제외, 메타 없음은 일반 손님)
insert into shop_members (id, email, name, contact, member_type, status)
select u.id, u.email,
  coalesce(u.raw_user_meta_data->>'name', ''),
  coalesce(u.raw_user_meta_data->>'contact', ''),
  coalesce(u.raw_user_meta_data->>'member_type', '일반'),
  case when coalesce(u.raw_user_meta_data->>'member_type', '일반') = '일반'
       then '승인' else '대기중' end
from auth.users u
where u.id not in (select id from shop_members)
  and u.id not in (select user_id from admin_users)
  and u.id not in (select id from suppliers)
on conflict (id) do nothing;
