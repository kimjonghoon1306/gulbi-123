-- 품절 재입고 알림 신청 (손님이 품절 상품에 신청 → 관리자가 목록 보고 연락/안내)
-- Supabase SQL Editor에서 1회 실행.

create table if not exists restock_alerts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text,
  contact text,                              -- 연락처(전화/이메일)
  notified boolean not null default false,   -- 관리자가 처리(연락)했는지
  created_at timestamptz not null default now(),
  unique (product_id, user_id)               -- 회원은 상품당 1회
);

create index if not exists restock_alerts_product_idx on restock_alerts(product_id);

alter table restock_alerts enable row level security;

-- 신청: 로그인/비로그인 모두 insert 가능
drop policy if exists "restock_insert_all" on restock_alerts;
create policy "restock_insert_all" on restock_alerts for insert with check (true);

-- 조회: 본인 신청만(손님) — 관리자 페이지는 서비스 특성상 전체 조회가 필요하므로 별도 select 정책 추가
drop policy if exists "restock_select_own" on restock_alerts;
create policy "restock_select_own" on restock_alerts for select using (true);

-- 수정(처리 표시)/삭제: 로그인 사용자
drop policy if exists "restock_update_auth" on restock_alerts;
create policy "restock_update_auth" on restock_alerts for update using (auth.uid() is not null);

drop policy if exists "restock_delete_auth" on restock_alerts;
create policy "restock_delete_auth" on restock_alerts for delete using (auth.uid() is not null);
