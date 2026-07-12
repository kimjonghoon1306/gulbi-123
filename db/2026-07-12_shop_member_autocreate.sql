-- 회원 자동생성(손님 전용) + 유령계정 백필 + 관리자/공급사 오분류 정리
-- 문제1: auth.users엔 있는데 shop_members엔 없어 회원관리 누락 + 재가입 "이미 가입" 에러.
-- 문제2: 백필이 관리자/공급사까지 손님목록에 넣어 관리자가 회원검색에 뜨던 문제.
-- 원칙: 손님 가입폼만 raw_user_meta_data.member_type 을 넣는다. 공급사/관리자는 없음.
-- Supabase SQL Editor에서 1회 실행. 여러 번 실행해도 안전(멱등).

-- 0) 잘못 들어간 관리자/공급사를 손님목록(shop_members)에서 제거
delete from shop_members
where id in (select user_id from admin_users)
   or id in (select id from suppliers);

-- 1) 가입 시 shop_members 자동 생성 — 단, '손님 가입폼'(member_type 메타 존재)만
create or replace function handle_new_shop_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 공급사/관리자 가입은 member_type 메타가 없다 → 손님목록에 넣지 않는다
  if new.raw_user_meta_data->>'member_type' is null then
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

-- 2) 기존 유령 손님계정만 백필 (관리자/공급사/메타없음 제외)
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
  and u.raw_user_meta_data->>'member_type' is not null
on conflict (id) do nothing;
