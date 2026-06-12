-- 광고 배너 (본사 광고비 입금 → 관리자가 등록 → 쇼핑몰 메인 상단 슬라이더)
-- Supabase SQL Editor에서 1회 실행하세요.
-- 여러 광고가 한 슬라이더에서 자동 순환. 광고마다 시작/종료 일시 설정 → 기간 내 광고만 노출.

create table if not exists ad_banners (
  id uuid primary key default gen_random_uuid(),
  tag text,                                            -- 작은 라벨(선택, 예: 이벤트/신상품/브랜드명)
  title text,                                          -- 배너 제목(선택, 큰 헤드라인)
  subtitle text,                                       -- 부제 한 줄 설명(선택)
  cta_label text,                                      -- 버튼 문구(선택, 비우면 '자세히 보기')
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

-- 이미 ad_banners를 만든 경우 문구 컬럼 보강 (재실행 안전)
alter table ad_banners add column if not exists tag text;
alter table ad_banners add column if not exists subtitle text;
alter table ad_banners add column if not exists cta_label text;

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
