-- 상품 Q&A / 1:1 문의
-- Supabase SQL Editor에서 1회 실행하세요.
-- 공개 질문은 전체 조회, 비밀글은 작성자 본인과 관리자만 조회합니다.

create table if not exists product_questions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  question text not null,
  answer text,
  answered_at timestamptz,
  is_secret boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_questions_product_id_idx on product_questions(product_id);
create index if not exists product_questions_created_at_idx on product_questions(created_at desc);
create index if not exists product_questions_unanswered_idx on product_questions(answered_at)
  where answered_at is null;

alter table product_questions enable row level security;

drop policy if exists "product_questions_select_visible" on product_questions;
create policy "product_questions_select_visible" on product_questions
  for select using (
    is_admin()
    or auth.uid() = user_id
    or is_secret = false
  );

drop policy if exists "product_questions_insert_own" on product_questions;
create policy "product_questions_insert_own" on product_questions
  for insert with check (auth.uid() = user_id);

drop policy if exists "product_questions_answer_admin" on product_questions;
create policy "product_questions_answer_admin" on product_questions
  for update using (is_admin()) with check (is_admin());

drop policy if exists "product_questions_delete_admin" on product_questions;
create policy "product_questions_delete_admin" on product_questions
  for delete using (is_admin());
