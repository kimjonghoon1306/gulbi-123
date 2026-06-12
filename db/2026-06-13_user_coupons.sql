-- 쿠폰함(쿠팡식): 회원이 쿠폰을 '받기' 하면 여기에 보관 → 결제 시 선택해서 사용
-- Supabase SQL Editor에서 1회 실행하세요.

create table if not exists user_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coupon_id uuid not null references coupons(id) on delete cascade,
  used boolean not null default false,
  used_at timestamptz,
  order_ref text,                              -- 사용된 주문 식별(예: general_orders#123)
  created_at timestamptz not null default now(),
  unique (user_id, coupon_id)                  -- 한 쿠폰은 회원당 1번만 받기
);

create index if not exists user_coupons_user_idx on user_coupons(user_id);

alter table user_coupons enable row level security;

-- 본인 것만 읽기/받기/사용표시
drop policy if exists "user_coupons_select_own" on user_coupons;
create policy "user_coupons_select_own" on user_coupons for select using (auth.uid() = user_id);

drop policy if exists "user_coupons_insert_own" on user_coupons;
create policy "user_coupons_insert_own" on user_coupons for insert with check (auth.uid() = user_id);

drop policy if exists "user_coupons_update_own" on user_coupons;
create policy "user_coupons_update_own" on user_coupons for update using (auth.uid() = user_id);
