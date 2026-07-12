import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const ORDER_TABLES = [
  { orders: 'general_orders', items: 'general_order_items' },
  { orders: 'retail_orders', items: 'retail_order_items' },
  { orders: 'wholesale_orders', items: 'wholesale_order_items' },
] as const

async function hasCompletedPurchase(supabase: any, userId: string, productId: string) {
  for (const { orders, items } of ORDER_TABLES) {
    const { data: orderItems, error: itemsError } = await supabase
      .from(items)
      .select('order_id')
      .eq('product_id', productId)

    if (itemsError) throw itemsError
    const orderIds = Array.from(new Set((orderItems || []).map((item: any) => item.order_id).filter(Boolean)))
    if (orderIds.length === 0) continue

    const { data: completed, error: ordersError } = await supabase
      .from(orders)
      .select('id')
      .eq('user_id', userId)
      .eq('status', '완료')
      .in('id', orderIds)
      .limit(1)

    if (ordersError) throw ordersError
    if (completed && completed.length > 0) return true
  }

  return false
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const body = await req.json()
    const productId = String(body.product_id || '').trim()
    const rating = Number(body.rating)
    const content = String(body.content || '').trim()
    const imageUrls = Array.isArray(body.image_urls)
      ? body.image_urls.filter((url: unknown) => typeof url === 'string' && url.trim()).slice(0, 3)
      : []

    if (!productId) return NextResponse.json({ error: '상품 정보가 없습니다.' }, { status: 400 })
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '별점은 1점부터 5점까지 입력해주세요.' }, { status: 400 })
    }
    if (!content) return NextResponse.json({ error: '리뷰 내용을 입력해주세요.' }, { status: 400 })

    const adminSupabase = createAdminSupabase()
    if (!adminSupabase) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.' }, { status: 500 })
    }

    const { data: member } = await adminSupabase
      .from('shop_members')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    const verifiedPurchase = await hasCompletedPurchase(adminSupabase, user.id, productId)
    const now = new Date().toISOString()

    const { data: review, error } = await adminSupabase
      .from('reviews')
      .upsert({
        product_id: productId,
        user_id: user.id,
        author_name: member?.name || body.author_name || '익명',
        rating,
        content: content.slice(0, 500),
        image_urls: imageUrls,
        verified_purchase: verifiedPurchase,
        updated_at: now,
      }, { onConflict: 'product_id,user_id' })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: `리뷰 저장 실패: ${error.message}` }, { status: 500 })

    return NextResponse.json({ ok: true, review })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '리뷰 저장 중 오류가 발생했어요.' }, { status: 500 })
  }
}
