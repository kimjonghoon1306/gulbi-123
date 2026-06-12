-- 관리자 권한 분리 (보안 1순위)
-- 문제: 그동안 /admin 은 "로그인만 하면" 통과했음 → 일반 손님도 관리자 화면 접근 가능.
-- 해결: admin_users 허용목록 + is_admin() 함수. 미들웨어와 RLS가 이걸로 진짜 관리자만 허용.
-- Supabase SQL Editor에서 1회 실행하세요.

create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

-- 본인 행만 읽기(미들웨어가 자기 관리자 여부 확인용). 쓰기 정책 없음 = SQL로만 추가 가능.
drop policy if exists "admin_users_select_self" on admin_users;
create policy "admin_users_select_self" on admin_users for select using (auth.uid() = user_id);

-- 현재 로그인 사용자가 관리자인지 (security definer = RLS 우회해 admin_users 조회)
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public
as $$ select exists (select 1 from admin_users where user_id = auth.uid()) $$;

-- ── 초기 관리자 등록 ─────────────────────────────────────────────
-- 방법A(자동): 손님(shop_members)도 공급사(suppliers)도 아닌 기존 계정 = 관리자로 간주.
--   현재 관리자 계정이 손님/공급사로도 가입돼 있지 않다면 이걸로 자동 등록됨.
insert into admin_users (user_id)
select u.id from auth.users u
where u.id not in (select id from shop_members)
  and u.id not in (select id from suppliers)
on conflict (user_id) do nothing;

-- ✅ 실행 후 아래 줄을 따로 실행해 "본인 관리자 이메일"이 목록에 있는지 꼭 확인하세요:
--   select u.email from admin_users a join auth.users u on u.id = a.user_id;
--
-- 방법B(수동, 방법A에서 누락됐을 때만): 본인 관리자 이메일을 넣고 실행
-- insert into admin_users (user_id)
-- select id from auth.users where email = '관리자이메일@example.com'
-- on conflict (user_id) do nothing;

-- ── 광고 배너: 쓰기를 관리자에게만 (읽기는 쇼핑몰 노출 위해 전체 유지) ──
drop policy if exists "ad_banners_insert_auth" on ad_banners;
drop policy if exists "ad_banners_update_auth" on ad_banners;
drop policy if exists "ad_banners_delete_auth" on ad_banners;
create policy "ad_banners_insert_admin" on ad_banners for insert with check (is_admin());
create policy "ad_banners_update_admin" on ad_banners for update using (is_admin());
create policy "ad_banners_delete_admin" on ad_banners for delete using (is_admin());
