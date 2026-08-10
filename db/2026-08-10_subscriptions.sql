-- ────────────────────────────────────────────────────────────
-- 정기배송 / 구독 (1번 선결제 패키지형)
--   · 손님이 주기(매주/격주/매월) + 회차(4/8/12) 선택 → 총액 1회 선결제
--   · 회차마다 배송(subscription_deliveries) — 관리자가 발송 처리
--   · payment_mode = '선결제' | '자동결제'(빌링, 승인 후 확장)  ← 지금은 선결제만 동작
-- RLS는 기존 패턴(is_admin() / auth.uid()=user_id) 그대로 따름
-- ────────────────────────────────────────────────────────────

-- 상품에 정기배송 설정 (관리자 토글 + 회차 할인율)
alter table products add column if not exists subscribable boolean default false;
alter table products add column if not exists subscribe_discount numeric default 0;  -- 구독 할인율(%)

-- 구독 본체
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid references products(id),
  product_name text,
  image_url text,
  quantity int not null default 1,
  unit text,
  unit_price int not null,                       -- 구독 시점 회차당 단가(스냅샷)
  frequency text not null,                       -- '매주' | '격주' | '매월'
  total_cycles int not null,                     -- 총 회차 (4/8/12)
  completed_cycles int not null default 0,       -- 완료(발송)된 회차 수
  discount_rate numeric not null default 0,      -- 적용 할인율(%)
  total_amount int not null,                     -- 선결제 총액(할인 적용 후)
  payment_mode text not null default '선결제',    -- '선결제' | '자동결제'(빌링)
  bill_key text,                                 -- 빌링키(자동결제용, 추후)
  status text not null default '진행중',          -- '진행중' | '일시정지' | '완료' | '취소'
  next_delivery_date date,                       -- 다음 배송 예정일
  recipient text, phone text, zipcode text, address text, address_detail text,
  request_memo text,
  order_ref text,                                -- 결제 주문 참조
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 회차별 배송
create table if not exists subscription_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions(id) on delete cascade,
  cycle_no int not null,                         -- 회차 번호 (1..total_cycles)
  scheduled_date date not null,                  -- 배송 예정일
  status text not null default '예정',            -- '예정' | '발송' | '완료' | '취소'
  tracking_no text,
  shipped_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_sub_user on subscriptions(user_id);
create index if not exists idx_sub_status on subscriptions(status);
create index if not exists idx_sub_del_sub on subscription_deliveries(subscription_id);

-- ── RLS ──
alter table subscriptions enable row level security;
alter table subscription_deliveries enable row level security;

-- 구독: 본인 것만 조회, 본인 것만 생성/수정(정지·취소), 삭제·전체관리는 관리자
drop policy if exists "sub_select_owner_or_admin" on subscriptions;
drop policy if exists "sub_insert_own" on subscriptions;
drop policy if exists "sub_update_owner_or_admin" on subscriptions;
drop policy if exists "sub_delete_admin" on subscriptions;
create policy "sub_select_owner_or_admin" on subscriptions
  for select using (is_admin() or auth.uid() = user_id);
create policy "sub_insert_own" on subscriptions
  for insert with check (auth.uid() = user_id);
create policy "sub_update_owner_or_admin" on subscriptions
  for update using (is_admin() or auth.uid() = user_id) with check (is_admin() or auth.uid() = user_id);
create policy "sub_delete_admin" on subscriptions
  for delete using (is_admin());

-- 회차배송: 소유 구독 기준 조회, 생성은 소유자/관리자, 발송처리(수정)·삭제는 관리자
drop policy if exists "subdel_select_owner_or_admin" on subscription_deliveries;
drop policy if exists "subdel_insert_owner_or_admin" on subscription_deliveries;
drop policy if exists "subdel_update_admin" on subscription_deliveries;
drop policy if exists "subdel_delete_admin" on subscription_deliveries;
create policy "subdel_select_owner_or_admin" on subscription_deliveries
  for select using (
    is_admin() or exists (
      select 1 from subscriptions s
      where s.id = subscription_deliveries.subscription_id and s.user_id = auth.uid()
    )
  );
create policy "subdel_insert_owner_or_admin" on subscription_deliveries
  for insert with check (
    is_admin() or exists (
      select 1 from subscriptions s
      where s.id = subscription_deliveries.subscription_id and s.user_id = auth.uid()
    )
  );
create policy "subdel_update_admin" on subscription_deliveries
  for update using (is_admin()) with check (is_admin());
create policy "subdel_delete_admin" on subscription_deliveries
  for delete using (is_admin());
