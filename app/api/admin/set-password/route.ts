import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { requireAdminUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const USER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const auth = await requireAdminUser()
  if (!auth.ok) {
    return NextResponse.json({ error: '관리자 권한을 확인할 수 없습니다. 다시 로그인해 주세요.' }, { status: auth.status })
  }

  try {
    const { userId, password } = await req.json().catch(() => ({}))
    if (!userId || typeof userId !== 'string' || !USER_ID_RE.test(userId)) {
      return NextResponse.json({ error: '회원 정보가 올바르지 않습니다.' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
    }

    const adminSupabase = createAdminSupabase()
    if (!adminSupabase) {
      return NextResponse.json({ error: '서버 설정(service_role)을 확인할 수 없습니다.' }, { status: 500 })
    }

    const { error } = await adminSupabase.auth.admin.updateUserById(userId, { password })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = (e as { message?: string })?.message || '알 수 없는 오류'
    console.error('[admin/set-password]', e)
    return NextResponse.json({ error: '비밀번호 변경 실패: ' + msg }, { status: 500 })
  }
}
