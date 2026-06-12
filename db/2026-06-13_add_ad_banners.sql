-- 광고 배너 (본사 광고비 입금 → 관리자가 등록 → 쇼핑몰 메인 상단 슬라이더)
-- Supabase SQL Editor에서 1회 실행하세요.
-- 여러 광고가 한 슬라이더에서 자동 순환. 광고마다 시작/종료 일시 설정 → 기간 내 광고만 노출.

create table if not exists ad_banners (
  id uuid primary key default gen_random_uuid(),
  title text,                                          -- 배너 제목(선택, 이미지 위 표시)
  image_url text not null,                             -- 배너 이미지
  product_id uuid references products(id) on delete set null,  -- 클릭 시 이동할 상품(선택)
  link_url text,                                       -- 상품 대신 직접 링크(선택)
  sort_order int not null default 0,                   -- 슬라이드 순서(작을수록 먼저)
  starts_at timestamptz,                               -- 노출 시작 일시(null이면 즉시)
  ends_at timestamptz,                                 -- 노출 종료 일시(null이면 무기한)
  is_active boolean not null default true,             -- 수동 on/off
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists ad_banners_active_idx on ad_banners(is_active, sort_order);

-- RLS: 누구나 읽기(쇼핑몰 노출), 쓰기는 로그인 사용자(관리자 페이지는 middleware로 보호)
alter table ad_banners enable row level security;

drop policy if exists "ad_banners_select_all" on ad_banners;
create policy "ad_banners_select_all" on ad_banners for select using (true);

drop policy if exists "ad_banners_insert_auth" on ad_banners;
create policy "ad_banners_insert_auth" on ad_banners for insert with check (auth.uid() is not null);

drop policy if exists "ad_banners_update_auth" on ad_banners;
create policy "ad_banners_update_auth" on ad_banners for update using (auth.uid() is not null);

drop policy if exists "ad_banners_delete_auth" on ad_banners;
create policy "ad_banners_delete_auth" on ad_banners for delete using (auth.uid() is not null);
