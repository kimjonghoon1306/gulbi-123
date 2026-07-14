import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { ORDER_TABLES, OrderTable, expectedPaymentAmount, getOrderPointInfo, markOrderPaid, refundOrderPoints, spendOrderPoints } from '@/lib/order-payment'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { orderId, table } = await req.json()
    if (!orderId || !ORDER_TABLES.includes(table)) {
      return NextResponse.json({ message: '주문 정보가 올바르지 않습니다.' }, { status: 400 })
    }

    const adminSupabase = createAdminSupabase()
    if (!adminSupabase) {
      console.error('[orders/point-pay] SUPABASE_SERVICE_ROLE_KEY missing')
      return NextResponse.json({ message: '주문 확인 중 문제가 발생했습니다. 고객센터로 문의해 주세요.' }, { status: 500 })
    }
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
    }

    const order = await getOrderPointInfo(adminSupabase, table as OrderTable, String(orderId))
    if (!order) {
      return NextResponse.json({ message: '주문 내역을 확인할 수 없습니다.' }, { status: 400 })
    }
    if (String(order.user_id) !== user.id) {
      return NextResponse.json({ message: '본인 주문만 결제할 수 있습니다.' }, { status: 403 })
    }

    const expected = await expectedPaymentAmount(adminSupabase, table as OrderTable, String(orderId))
    if (expected === null) {
      return NextResponse.json({ message: '주문 내역을 확인할 수 없습니다.' }, { status: 400 })
    }
    if (expected !== 0) {
      return NextResponse.json({ message: '포인트 전액 결제 주문이 아닙니다.' }, { status: 400 })
    }

    const pointSpend = await spendOrderPoints(adminSupabase, table as OrderTable, String(orderId))
    if (!pointSpend.ok) {
      return NextResponse.json({ message: pointSpend.message || '포인트 차감에 실패했습니다.' }, { status: 400 })
    }

    const result = await markOrderPaid(adminSupabase, table as OrderTable, String(orderId), 'POINT_ONLY', 0, {
      status: 'DONE',
      method: '쇼핑포인트',
    })
    if (!result.found) {
      if (pointSpend.spent) await refundOrderPoints(adminSupabase, table as OrderTable, String(orderId), 'point-only order not found')
      return NextResponse.json({ message: '주문 내역을 확인할 수 없습니다.' }, { status: 400 })
    }
    if (result.error) {
      if (pointSpend.spent) await refundOrderPoints(adminSupabase, table as OrderTable, String(orderId), result.error)
      return NextResponse.json({ message: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[orders/point-pay] unexpected error', e)
    return NextResponse.json({ message: '포인트 결제 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
