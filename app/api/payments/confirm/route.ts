import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { ORDER_TABLES, OrderTable, expectedPaymentAmount, getOrderPointInfo, markOrderPaid, spendOrderPoints } from '@/lib/order-payment'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY
    if (!TOSS_SECRET_KEY) {
      console.error('[payments/confirm] TOSS_SECRET_KEY missing')
      return NextResponse.json({ message: '결제 설정을 확인할 수 없습니다. 고객센터로 문의해 주세요.' }, { status: 500 })
    }

    const { paymentKey, orderId, amount, table } = await req.json()
    if (!paymentKey || !orderId || !amount || !ORDER_TABLES.includes(table)) {
      console.error('[payments/confirm] invalid request', { hasPaymentKey: !!paymentKey, hasOrderId: !!orderId, hasAmount: !!amount, table })
      return NextResponse.json({ message: '결제 정보가 올바르지 않습니다. 다시 주문해 주세요.' }, { status: 400 })
    }

    const adminSupabase = createAdminSupabase()
    if (!adminSupabase) {
      console.error('[payments/confirm] SUPABASE_SERVICE_ROLE_KEY missing')
      return NextResponse.json({ message: '주문 확인 중 문제가 발생했습니다. 고객센터로 문의해 주세요.' }, { status: 500 })
    }

    // ── 서버 측 결제금액 검증: 클라이언트가 보낸 금액을 그대로 믿지 않고 DB 실가격으로 재계산 ──
    const expected = await expectedPaymentAmount(adminSupabase, table as OrderTable, String(orderId))
    if (expected === null) {
      return NextResponse.json({ message: '주문 내역을 확인할 수 없습니다.' }, { status: 400 })
    }
    // 정당한 금액보다 적게 결제 시도 → 승인 거부(결제는 자동 취소됨)
    if (Number(amount) < expected) {
      return NextResponse.json(
        { message: '결제 금액이 주문 내역과 일치하지 않습니다. 다시 시도해주세요.' },
        { status: 400 }
      )
    }
    const order = await getOrderPointInfo(adminSupabase, table as OrderTable, String(orderId))
    if (!order) {
      return NextResponse.json({ message: '주문 내역을 확인할 수 없습니다.' }, { status: 400 })
    }
    const pointUsed = Number(order.point_used || 0)
    const alreadyProcessed = ['결제완료', '입금완료'].includes(order.status) || (order.status === '입금대기' && !!order.payment_key)
    if (!alreadyProcessed && pointUsed > 0) {
      if (!order.user_id) {
        return NextResponse.json({ message: '주문 회원 정보를 확인할 수 없습니다.' }, { status: 400 })
      }
      const { data: account } = await adminSupabase
        .from('cash_accounts')
        .select('point_balance')
        .eq('user_id', order.user_id)
        .maybeSingle()
      if (Number(account?.point_balance || 0) < pointUsed) {
        return NextResponse.json({ message: '보유 포인트가 부족합니다.' }, { status: 400 })
      }
    }

    const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
    const data = await res.json()
    if (res.ok) {
      const pointSpend = await spendOrderPoints(adminSupabase, table as OrderTable, String(orderId))
      if (!pointSpend.ok) {
        return NextResponse.json({ message: pointSpend.message || '포인트 차감에 실패했습니다.' }, { status: 400 })
      }
      await markOrderPaid(adminSupabase, table as OrderTable, String(orderId), String(paymentKey), Number(amount), data)
      return NextResponse.json(data, { status: res.status })
    }
    console.error('[payments/confirm] toss confirm failed', { status: res.status, data, orderId, table })
    return NextResponse.json(
      { message: '결제 승인에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: res.status }
    )
  } catch (e: any) {
    console.error('[payments/confirm] unexpected error', e)
    return NextResponse.json({ message: '결제 확인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
