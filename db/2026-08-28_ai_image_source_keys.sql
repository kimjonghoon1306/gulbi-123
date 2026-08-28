-- 온종일팜 AI 상세페이지: 이미지 소스 키 3개(Pexels/Pixabay/Replicate) 저장 컬럼 추가
-- Supabase 대시보드 → SQL Editor 에서 1회 실행.
-- 암호화 키는 base64 text로 저장(openai/gemini와 동일 패턴). 힌트는 마스킹 표시용.

alter table user_api_keys add column if not exists pexels_key_enc     text;
alter table user_api_keys add column if not exists pexels_key_hint    text;
alter table user_api_keys add column if not exists pixabay_key_enc    text;
alter table user_api_keys add column if not exists pixabay_key_hint   text;
alter table user_api_keys add column if not exists replicate_key_enc  text;
alter table user_api_keys add column if not exists replicate_key_hint text;
