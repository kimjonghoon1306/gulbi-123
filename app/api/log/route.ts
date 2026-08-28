import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { logServerError, type LogArea } from '@/lib/log-error'

// POST /api/log — 클라이언트 에러를 받아 error_logs에 기록.
// sendBeacon으로도 오므로 인증이 없을 수 있음(그래도 기록). 로깅 실패해도 200 반환.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const supabase = await createServerSupabase()
    await logServerError(supabase, {
      area: (body.area || 'unknown') as LogArea,
      message: String(body.message || '').slice(0, 500),
      severity: body.severity === 'warning' ? 'warning' : 'error',
      detail: String(body.detail || '').slice(0, 4000),
      path: String(body.path || ''),
      userEmail: String(body.userEmail || ''),
    })
  } catch { /* 무시 */ }
  return NextResponse.json({ ok: true })
}
