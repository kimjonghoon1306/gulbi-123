import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { ORDER_TABLES, OrderTable, expectedPaymentAmount, getOrderPointInfo, markOrderPaid, refundOrderPoints, spendOrderPoints } from '@/lib/order-payment'

export const runtime = 'nodejs'

async function cancelTossPayment(secretKey: string, paymentKey: string, cancelReason: string) {
  try {
    const res = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(secretKey + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancelReason }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error('[payments/confirm] toss cancel failed', { status: res.status, data })
      return false
    }
    return true
  } catch (error) {
    console.error('[payments/confirm] toss cancel unexpected error', error)
    return false
  }
}

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
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
    }

    // ── 서버 측 결제금액 검증: 클라이언트가 보낸 금액을 그대로 믿지 않고 DB 실가격으로 재계산 ──
    const expected = await expectedPaymentAmount(adminSupabase, table as OrderTable, String(orderId))
    if (expected === null) {
      return NextResponse.json({ message: '주문 내역을 확인할 수 없습니다.' }, { status: 400 })
    }
    // 정당한 금액과 정확히 일치하는 결제만 승인한다. 0원 주문은 point-pay API만 허용한다.
    if (Number(amount) !== expected || expected <= 0) {
      return NextResponse.json(
        { message: '결제 금액이 주문 내역과 일치하지 않습니다. 다시 시도해주세요.' },
        { status: 400 }
      )
    }
    const order = await getOrderPointInfo(adminSupabase, table as OrderTable, String(orderId))
    if (!order) {
      return NextResponse.json({ message: '주문 내역을 확인할 수 없습니다.' }, { status: 400 })
    }
    if (String(order.user_id) !== user.id) {
      return NextResponse.json({ message: '본인 주문만 결제할 수 있습니다.' }, { status: 403 })
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
        await cancelTossPayment(TOSS_SECRET_KEY, String(paymentKey), pointSpend.message || '포인트 차감 실패')
        return NextResponse.json({ message: pointSpend.message || '포인트 차감에 실패했습니다.' }, { status: 400 })
      }
      const result = await markOrderPaid(adminSupabase, table as OrderTable, String(orderId), String(paymentKey), Number(amount), data)
      if (!result.found || result.error) {
        await cancelTossPayment(TOSS_SECRET_KEY, String(paymentKey), result.error || '주문 확인 실패')
        if (pointSpend.spent) await refundOrderPoints(adminSupabase, table as OrderTable, String(orderId), result.error || 'toss confirmed but order update failed')
        return NextResponse.json({ message: result.error || '주문 내역을 확인할 수 없습니다.' }, { status: 500 })
      }
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
