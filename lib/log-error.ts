// 통합 에러 로거 — 어디서든 호출해 error_logs에 기록.
// 서버(route)에서는 supabase 직접 insert, 클라이언트에서는 /api/log로 보낸다.
// ★ 로깅 실패가 원래 로직을 막으면 안 됨 → 항상 조용히 삼킨다(try/catch).

export type LogArea =
  | 'ai-generate' | 'ai-image' | 'shop-order' | 'shop-checkout' | 'supplier'
  | 'payment' | 'admin' | 'auth' | 'product' | 'unknown'

export type LogInput = {
  area: LogArea
  message: string
  severity?: 'error' | 'warning'
  detail?: string
  path?: string
  userEmail?: string
}

// ── 클라이언트용: /api/log로 전송 ──
export function logClientError(input: LogInput) {
  try {
    const body = JSON.stringify({
      ...input,
      severity: input.severity || 'error',
      path: input.path || (typeof location !== 'undefined' ? location.pathname : ''),
    })
    // sendBeacon이 있으면 페이지 이탈에도 안전, 없으면 fetch
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/log', new Blob([body], { type: 'application/json' }))
    } else {
      void fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
    }
  } catch { /* 로깅 실패는 무시 */ }
}

// ── 서버용: supabase로 직접 insert ──
// (route handler에서 createServerSupabase를 넘겨 호출)
export async function logServerError(
  supabase: { from: (t: string) => any; auth?: any },
  input: LogInput,
) {
  try {
    let userId: string | null = null
    let userEmail = input.userEmail || ''
    try {
      const { data } = await supabase.auth.getUser()
      userId = data?.user?.id || null
      userEmail = userEmail || data?.user?.email || ''
    } catch { /* 인증 없어도 로그는 남김 */ }
    await supabase.from('error_logs').insert({
      area: input.area,
      severity: input.severity || 'error',
      message: (input.message || '').slice(0, 500),
      detail: (input.detail || '').slice(0, 4000),
      user_id: userId,
      user_email: userEmail,
      path: input.path || '',
    })
  } catch { /* 로깅 실패는 무시 */ }
}
