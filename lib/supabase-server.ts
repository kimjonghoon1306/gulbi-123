import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { decryptKey } from './crypto-keys'

// ─────────────────────────────────────────────────────────────
// 서버사이드 Supabase 클라이언트
// (route handler / server component에서 사용)
// ─────────────────────────────────────────────────────────────
export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // route handler에서는 set 실패할 수 있음 (무시)
          }
        },
      },
    }
  )
}

// ─────────────────────────────────────────────────────────────
// 인증된 사용자의 OpenAI 키 가져오기
// 로그인 안 됐거나 키 등록 안 했으면 null 반환
// ─────────────────────────────────────────────────────────────
export type AuthAndKey =
  | { ok: true; userId: string; openaiKey: string }
  | { ok: false; status: number; error: string }

export async function getAuthAndOpenAIKey(): Promise<AuthAndKey> {
  const supabase = await createServerSupabase()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return { ok: false, status: 401, error: '로그인이 필요합니다.' }
  }

  const { data: row, error: dbErr } = await supabase
    .from('user_api_keys')
    .select('openai_key_enc')
    .eq('user_id', user.id)
    .maybeSingle()

  if (dbErr) {
    return { ok: false, status: 500, error: `키 조회 실패: ${dbErr.message}` }
  }
  if (!row?.openai_key_enc) {
    return { ok: false, status: 400, error: '설정에서 OpenAI API 키를 먼저 등록해주세요.' }
  }

  try {
    const openaiKey = decryptKey(row.openai_key_enc as any)
    return { ok: true, userId: user.id, openaiKey }
  } catch (e: any) {
    return { ok: false, status: 500, error: `키 복호화 실패: ${e.message}` }
  }
}

// ─────────────────────────────────────────────────────────────
// 인증된 사용자의 Gemini 키 가져오기
// ─────────────────────────────────────────────────────────────
export type AuthAndGeminiKey =
  | { ok: true; userId: string; geminiKey: string }
  | { ok: false; status: number; error: string }

export async function getAuthAndGeminiKey(): Promise<AuthAndGeminiKey> {
  const supabase = await createServerSupabase()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return { ok: false, status: 401, error: '로그인이 필요합니다.' }
  }

  const { data: row, error: dbErr } = await supabase
    .from('user_api_keys')
    .select('gemini_key_enc')
    .eq('user_id', user.id)
    .maybeSingle()

  if (dbErr) {
    return { ok: false, status: 500, error: `키 조회 실패: ${dbErr.message}` }
  }
  if (!row?.gemini_key_enc) {
    return { ok: false, status: 400, error: '설정에서 Gemini API 키를 먼저 등록해주세요.' }
  }

  try {
    const geminiKey = decryptKey(row.gemini_key_enc as any)
    return { ok: true, userId: user.id, geminiKey }
  } catch (e: any) {
    return { ok: false, status: 500, error: `키 복호화 실패: ${e.message}` }
  }
}

// ─────────────────────────────────────────────────────────────
// 인증만 (키 조회 없이)
// ─────────────────────────────────────────────────────────────
export async function getAuthUser() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAdminUser() {
  const supabase = await createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return { ok: false as const, status: 401, error: '로그인이 필요합니다.', supabase, user: null }
  }

  const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin')
  if (adminErr || isAdmin !== true) {
    return { ok: false as const, status: 403, error: '관리자 권한이 필요합니다.', supabase, user }
  }

  return { ok: true as const, supabase, user }
}
