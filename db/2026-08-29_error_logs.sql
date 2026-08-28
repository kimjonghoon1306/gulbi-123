-- 온종일팜 통합 에러 로그: 어디서 무슨 문제가 생기는지 관리자가 한눈에 본다.
-- Supabase 대시보드 → SQL Editor 에서 1회 실행.

create table if not exists public.error_logs (
  id bigint generated always as identity primary key,
  area text not null default 'unknown',      -- ai-generate / shop-order / supplier / payment / admin ...
  severity text not null default 'error',     -- error / warning
  message text not null default '',           -- 요약 메시지(예: "Gemini 키 만료 (429)")
  detail text default '',                      -- 상세(스택·응답코드·컨텍스트)
  user_id uuid,                                -- 발생시킨 사용자(있으면)
  user_email text default '',
  path text default '',                        -- 발생 위치(URL/함수)
  created_at timestamptz not null default now()
);

create index if not exists error_logs_created_idx on public.error_logs(created_at desc);
create index if not exists error_logs_area_idx on public.error_logs(area, created_at desc);
create index if not exists error_logs_severity_idx on public.error_logs(severity, created_at desc);

-- RLS: 익명키로 INSERT는 허용(어디서든 로그 기록), SELECT는 관리자만.
alter table public.error_logs enable row level security;

drop policy if exists error_logs_insert on public.error_logs;
create policy error_logs_insert on public.error_logs
  for insert to anon, authenticated with check (true);

-- 조회는 관리자만. 기존 is_admin() 함수 사용(security definer).
drop policy if exists error_logs_select on public.error_logs;
create policy error_logs_select on public.error_logs
  for select to authenticated
  using ( public.is_admin() );

-- 관리자만 삭제(로그 정리)
drop policy if exists error_logs_delete on public.error_logs;
create policy error_logs_delete on public.error_logs
  for delete to authenticated
  using ( public.is_admin() );
