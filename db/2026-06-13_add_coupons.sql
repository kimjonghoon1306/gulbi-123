-- 쿠폰/할인코드 (관리자·공급사가 발급, 손님이 장바구니에서 코드 입력해 사용)
-- Supabase SQL Editor에서 1회 실행. 안 써도 되는 선택 기능.

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- 쿠폰 코드 (대문자 권장)
  description text,                            -- 쿠폰 설명/이름
  discount_type text not null default 'percent' check (discount_type in ('percent','amount')),
  discount_value int not null,                -- percent=%(10), amount=원(5000)
  min_amount int not null default 0,          -- 최소 주문금액
  max_discount int,                           -- 정률 할인 시 최대 할인액(원). null=무제한
  usage_limit int,                            -- 총 사용 가능 횟수. null=무제한
  used_count int not null default 0,          -- 누적 사용 횟수
  starts_at timestamptz,                       -- 사용 시작(없으면 즉시)
  expires_at timestamptz,                      -- 만료(없으면 무기한)
  is_active boolean not null default true,
  created_by uuid,                             -- 발급자(관리자/공급사 user id)
  created_by_role text default 'admin',        -- 'admin' | 'supplier'
  created_at timestamptz not null default now()
);

create index if not exists coupons_code_idx on coupons(code);

-- RLS: 누구나 코드로 조회 가능(검증용), 발급/수정은 로그인 사용자(발급자 본인)
alter table coupons enable row level security;

drop policy if exists "coupons_select_all" on coupons;
create policy "coupons_select_all" on coupons for select using (true);

drop policy if exists "coupons_insert_auth" on coupons;
create policy "coupons_insert_auth" on coupons for insert with check (auth.uid() = created_by);

drop policy if exists "coupons_update_own" on coupons;
create policy "coupons_update_own" on coupons for update using (auth.uid() = created_by);

drop policy if exists "coupons_delete_own" on coupons;
create policy "coupons_delete_own" on coupons for delete using (auth.uid() = created_by);

-- 사용 횟수 1 증가 (주문 확정 시 호출). 한도 초과면 false 반환
create or replace function increment_coupon_usage(coupon_code text)
returns boolean language plpgsql security definer as $$
declare c coupons%rowtype;
begin
  select * into c from coupons where code = coupon_code for update;
  if not found then return false; end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then return false; end if;
  update coupons set used_count = used_count + 1 where id = c.id;
  return true;
end; $$;
