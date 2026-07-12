import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId')
    if (!productId) return NextResponse.json({ error: '상품 정보가 없습니다.' }, { status: 400 })

    const adminSupabase = createAdminSupabase()
    if (!adminSupabase) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.' }, { status: 500 })
    }

    const user = await getAuthUser()
    let isAdmin = false
    if (user) {
      const { data } = await adminSupabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
      isAdmin = !!data
    }

    const { data, error } = await adminSupabase
      .from('product_questions')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const questions = (data || []).map((q: any) => {
      const canRead = !q.is_secret || isAdmin || q.user_id === user?.id
      if (canRead) return { ...q, is_redacted: false }
      return {
        id: q.id,
        product_id: q.product_id,
        is_secret: true,
        is_redacted: true,
        has_answer: !!q.answer,
        answer: null,
        answered_at: q.answered_at,
        created_at: q.created_at,
      }
    })

    return NextResponse.json({ questions })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '문의 조회 중 오류가 발생했어요.' }, { status: 500 })
  }
}
