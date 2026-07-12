-- 회원 주소록 (복수 배송지)
-- Supabase SQL Editor에서 1회 실행하세요. 기존 shop_members.address는 유지합니다.

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default '배송지',
  recipient text,
  phone text,
  postcode text,
  address1 text not null,
  address2 text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on addresses(user_id);
create unique index if not exists addresses_one_default_per_user_idx
  on addresses(user_id)
  where is_default = true;

alter table addresses enable row level security;

drop policy if exists "addresses_select_own" on addresses;
create policy "addresses_select_own" on addresses
  for select using (auth.uid() = user_id);

drop policy if exists "addresses_insert_own" on addresses;
create policy "addresses_insert_own" on addresses
  for insert with check (auth.uid() = user_id);

drop policy if exists "addresses_update_own" on addresses;
create policy "addresses_update_own" on addresses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "addresses_delete_own" on addresses;
create policy "addresses_delete_own" on addresses
  for delete using (auth.uid() = user_id);
