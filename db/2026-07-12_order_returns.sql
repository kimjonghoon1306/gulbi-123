-- 반품·교환 셀프 접수
-- Supabase SQL Editor에서 1회 실행하세요.
-- 실제 PG 환불/결제취소는 연결하지 않고 요청 접수·상태관리만 처리합니다.

create table if not exists order_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  order_type text not null check (order_type in ('general', 'retail', 'wholesale')),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('반품', '교환')),
  reason text not null,
  image_urls text[] not null default '{}',
  status text not null default '접수' check (status in ('접수', '처리중', '완료', '반려')),
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, order_type, user_id)
);

create index if not exists order_returns_user_id_idx on order_returns(user_id);
create index if not exists order_returns_order_idx on order_returns(order_type, order_id);
create index if not exists order_returns_status_idx on order_returns(status, created_at desc);

alter table order_returns enable row level security;

drop policy if exists "order_returns_select_owner_or_admin" on order_returns;
create policy "order_returns_select_owner_or_admin" on order_returns
  for select using (is_admin() or auth.uid() = user_id);

drop policy if exists "order_returns_insert_own" on order_returns;
create policy "order_returns_insert_own" on order_returns
  for insert with check (auth.uid() = user_id);

drop policy if exists "order_returns_update_admin" on order_returns;
create policy "order_returns_update_admin" on order_returns
  for update using (is_admin()) with check (is_admin());

drop policy if exists "order_returns_delete_admin" on order_returns;
create policy "order_returns_delete_admin" on order_returns
  for delete using (is_admin());

-- 반품/교환 사진 저장용 공개 버킷
insert into storage.buckets (id, name, public)
values ('return-images', 'return-images', true)
on conflict (id) do nothing;

drop policy if exists "return_img_read" on storage.objects;
create policy "return_img_read" on storage.objects
  for select using (bucket_id = 'return-images');

drop policy if exists "return_img_insert" on storage.objects;
create policy "return_img_insert" on storage.objects
  for insert with check (bucket_id = 'return-images' and auth.uid() is not null);

drop policy if exists "return_img_delete" on storage.objects;
create policy "return_img_delete" on storage.objects
  for delete using (bucket_id = 'return-images' and auth.uid() is not null);
