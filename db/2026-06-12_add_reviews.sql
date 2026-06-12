-- 상품 리뷰/별점 (실제 구매자 작성)
-- Supabase SQL Editor에서 1회 실행하세요.
-- social_proof_comments(관리자용 소셜프루프)와 별개로, 로그인 회원이 직접 남기는 리뷰입니다.

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  rating int not null check (rating between 1 and 5),
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)   -- 1인 1상품 1리뷰 (재작성 시 수정)
);

create index if not exists reviews_product_id_idx on reviews(product_id);

-- RLS: 누구나 읽기, 작성/수정/삭제는 본인만
alter table reviews enable row level security;

drop policy if exists "reviews_select_all" on reviews;
create policy "reviews_select_all" on reviews
  for select using (true);

drop policy if exists "reviews_insert_own" on reviews;
create policy "reviews_insert_own" on reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on reviews;
create policy "reviews_update_own" on reviews
  for update using (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on reviews;
create policy "reviews_delete_own" on reviews
  for delete using (auth.uid() = user_id);
