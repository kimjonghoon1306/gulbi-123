import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId')
    if (!productId) return NextResponse.json({ error: '상품 정보가 없습니다.' }, { status: 400 })

    const adminSupabase = createAdminSupabase()
    if (!adminSupabase) {
      console.error('[product-questions] admin supabase is not configured')
      return NextResponse.json({ error: '문의 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
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

    if (error) {
      console.error('[product-questions] load failed', error)
      return NextResponse.json({ error: '문의 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
    }

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
    console.error('[product-questions] unexpected error', e)
    return NextResponse.json({ error: '문의 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
