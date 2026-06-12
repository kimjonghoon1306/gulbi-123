-- 온종일팜: AI 키 저장 컬럼을 text로 (암호화 키는 base64 문자열로 저장)
-- Supabase 대시보드 → SQL Editor 에서 1회 실행하세요.
--
-- 기존 컬럼이 bytea였거나 깨진 값이 들어있으면 키를 못 읽습니다.
-- 어차피 정상 동작하던 키가 없으므로 두 컬럼을 text로 새로 만듭니다(기존 깨진 값 제거).

alter table user_api_keys drop column if exists openai_key_enc;
alter table user_api_keys add  column openai_key_enc text;

alter table user_api_keys drop column if exists gemini_key_enc;
alter table user_api_keys add  column gemini_key_enc text;
