-- 리뷰 사진 첨부
-- Supabase SQL Editor에서 1회 실행. (Storage 버킷도 함께 생성)

-- 1) reviews에 이미지 URL 배열 컬럼
alter table reviews add column if not exists image_urls text[] not null default '{}';

-- 2) 리뷰 이미지 저장용 공개 버킷 생성
insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do nothing;

-- 3) 버킷 접근 정책 (storage.objects)
drop policy if exists "review_img_read" on storage.objects;
create policy "review_img_read" on storage.objects
  for select using (bucket_id = 'review-images');

drop policy if exists "review_img_insert" on storage.objects;
create policy "review_img_insert" on storage.objects
  for insert with check (bucket_id = 'review-images' and auth.uid() is not null);

drop policy if exists "review_img_delete" on storage.objects;
create policy "review_img_delete" on storage.objects
  for delete using (bucket_id = 'review-images' and auth.uid() is not null);
