import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { requireAdminUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const USER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const RESIDUAL_TABLES = ['cart_items', 'wishlists', 'shop_members'] as const

async function cleanupResidualRows(adminSupabase: NonNullable<ReturnType<typeof createAdminSupabase>>, userId: string) {
  for (const table of RESIDUAL_TABLES) {
    const column = table === 'shop_members' ? 'id' : 'user_id'
    const { error } = await adminSupabase.from(table).delete().eq(column, userId)
    if (error) {
      console.error('[admin/delete-member] residual cleanup failed', { table, userId, error })
      throw error
    }
  }
}

async function deleteAuthUser(adminSupabase: NonNullable<ReturnType<typeof createAdminSupabase>>, userId: string) {
  const { error } = await adminSupabase.auth.admin.deleteUser(userId)
  if (error) throw error
}

function isMissingAuthUserError(error: unknown) {
  const e = error as { status?: number; code?: string; message?: string }
  return e?.status === 404 || e?.code === 'user_not_found' || /not found|not exist|no user/i.test(e?.message || '')
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminUser()
  if (!auth.ok) {
    console.error('[admin/delete-member] admin check failed', auth.error)
    return NextResponse.json({ error: '관리자 권한을 확인할 수 없습니다. 다시 로그인해 주세요.' }, { status: auth.status })
  }

  try {
    const { userId } = await req.json().catch(() => ({}))
    if (!userId || typeof userId !== 'string' || !USER_ID_RE.test(userId)) {
      return NextResponse.json({ error: '삭제할 회원 정보가 올바르지 않습니다.' }, { status: 400 })
    }

    const adminSupabase = createAdminSupabase()
    if (!adminSupabase) {
      console.error('[admin/delete-member] SUPABASE_SERVICE_ROLE_KEY missing')
      return NextResponse.json({ error: '회원 삭제 설정을 확인할 수 없습니다. 서버 설정을 확인해 주세요.' }, { status: 500 })
    }

    let authDeleted = false
    try {
      await deleteAuthUser(adminSupabase, userId)
      authDeleted = true
    } catch (firstError) {
      console.error('[admin/delete-member] auth delete first attempt failed', { userId, error: firstError })
      await cleanupResidualRows(adminSupabase, userId)
      try {
        await deleteAuthUser(adminSupabase, userId)
        authDeleted = true
      } catch (secondError) {
        if (!isMissingAuthUserError(secondError)) throw secondError
        console.error('[admin/delete-member] auth user already missing after cleanup', { userId, error: secondError })
      }
    }

    await cleanupResidualRows(adminSupabase, userId)

    return NextResponse.json({ ok: true, authDeleted })
  } catch (e) {
    console.error('[admin/delete-member] delete failed', e)
    return NextResponse.json({ error: '회원 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
