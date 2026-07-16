-- 관리자 허용목록 및 유령회원 보안 강화
-- Supabase SQL Editor에서 전체를 실행하세요. 여러 번 실행해도 안전합니다.
-- 계정(auth.users)은 삭제하지 않습니다.

begin;

-- 1) admin_users는 읽기조차 본인 행만, 쓰기는 Dashboard/SQL Editor(service role)만 허용.
alter table public.admin_users enable row level security;

drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
  on public.admin_users for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

-- SECURITY DEFINER 함수는 고정 search_path와 완전 수식 이름을 사용한다.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select (select auth.uid()) is not null
     and exists (
       select 1
       from public.admin_users as a
       where a.user_id = (select auth.uid())
     )
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- 2) 세 역할이 겹치는 새 쓰기를 DB 경계에서 차단한다.
create or replace function public.guard_account_role_overlap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'admin_users' then
    if exists (select 1 from public.shop_members where id = new.user_id)
       or exists (select 1 from public.suppliers where id = new.user_id) then
      raise exception 'admin user must not already be a shop member or supplier';
    end if;
  elsif tg_table_name = 'shop_members' then
    if exists (select 1 from public.admin_users where user_id = new.id)
       or exists (select 1 from public.suppliers where id = new.id) then
      raise exception 'shop member must not be an admin or supplier';
    end if;
  elsif tg_table_name = 'suppliers' then
    if exists (select 1 from public.admin_users where user_id = new.id)
       or exists (select 1 from public.shop_members where id = new.id) then
      raise exception 'supplier must not be an admin or shop member';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_admin_user_role_overlap on public.admin_users;
create trigger guard_admin_user_role_overlap
  before insert or update on public.admin_users
  for each row execute function public.guard_account_role_overlap();

drop trigger if exists guard_shop_member_role_overlap on public.shop_members;
create trigger guard_shop_member_role_overlap
  before insert or update on public.shop_members
  for each row execute function public.guard_account_role_overlap();

drop trigger if exists guard_supplier_role_overlap on public.suppliers;
create trigger guard_supplier_role_overlap
  before insert or update on public.suppliers
  for each row execute function public.guard_account_role_overlap();

-- 3) 신규 auth 계정: 공급사 표식만 제외하고 메타가 없어도 일반 손님으로 생성.
create or replace function public.handle_new_shop_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.raw_user_meta_data->>'account_type', '') = 'supplier'
     or exists (select 1 from public.admin_users where user_id = new.id)
     or exists (select 1 from public.suppliers where id = new.id) then
    return new;
  end if;

  insert into public.shop_members (
    id, email, name, contact, member_type,
    business_name, business_number, business_ceo, business_address, status
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'contact', ''),
    coalesce(nullif(new.raw_user_meta_data->>'member_type', ''), '일반'),
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'business_number',
    new.raw_user_meta_data->>'business_ceo',
    new.raw_user_meta_data->>'business_address',
    case
      when coalesce(nullif(new.raw_user_meta_data->>'member_type', ''), '일반') = '일반'
      then '승인' else '대기중'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_shop_member on auth.users;
create trigger on_auth_user_created_shop_member
  after insert on auth.users
  for each row execute function public.handle_new_shop_member();

-- 4) 기존 미분류 계정은 삭제하지 않고 일반 손님으로 안전하게 편입한다.
-- 이미 명시된 관리자/공급사는 절대 편입하지 않는다.
insert into public.shop_members (id, email, name, contact, member_type, status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'name', ''),
  coalesce(u.raw_user_meta_data->>'contact', ''),
  coalesce(nullif(u.raw_user_meta_data->>'member_type', ''), '일반'),
  case
    when coalesce(nullif(u.raw_user_meta_data->>'member_type', ''), '일반') = '일반'
    then '승인' else '대기중'
  end
from auth.users as u
where not exists (select 1 from public.shop_members as m where m.id = u.id)
  and not exists (select 1 from public.suppliers as s where s.id = u.id)
  and not exists (select 1 from public.admin_users as a where a.user_id = u.id)
on conflict (id) do nothing;

commit;

-- 5) 실행 후 점검 결과. 첫 두 결과(미분류/역할 중복)는 0행이어야 정상입니다.
select u.id, u.email, u.created_at
from auth.users as u
where not exists (select 1 from public.shop_members as m where m.id = u.id)
  and not exists (select 1 from public.suppliers as s where s.id = u.id)
  and not exists (select 1 from public.admin_users as a where a.user_id = u.id)
order by u.created_at;

select u.id, u.email, 'admin_and_member' as overlap
from auth.users as u
join public.admin_users as a on a.user_id = u.id
join public.shop_members as m on m.id = u.id
union all
select u.id, u.email, 'admin_and_supplier'
from auth.users as u
join public.admin_users as a on a.user_id = u.id
join public.suppliers as s on s.id = u.id
union all
select u.id, u.email, 'supplier_and_member'
from auth.users as u
join public.suppliers as s on s.id = u.id
join public.shop_members as m on m.id = u.id;

-- 세 번째 결과는 관리자 허용목록입니다(확인된 관리자만 있어야 합니다).
select u.id, u.email, a.created_at
from public.admin_users as a
join auth.users as u on u.id = a.user_id
order by a.created_at;
