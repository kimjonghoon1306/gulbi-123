import { createClient } from '@supabase/supabase-js'

// 서버 전용(Service Role) Supabase 클라이언트 — RLS 우회.
// 웹훅처럼 로그인 세션이 없는 서버 호출에서만 사용. (브라우저로 절대 노출 금지)
// 환경변수 SUPABASE_SERVICE_ROLE_KEY 필요 (Supabase 대시보드 > Settings > API > service_role).
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
