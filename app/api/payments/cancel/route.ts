import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const ORDER_TABLES = ['general_orders', 'retail_orders', 'wholesale_orders'] as const

async function findOrderByPaymentKey(supabase: any, paymentKey: string) {
  for (const table of ORDER_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('id, payment_key, payment_method, status, total_amount, paid_amount')
      .eq('payment_key', paymentKey)
      .maybeSingle()
    if (error) throw error
    if (data) return { table, order: data }
  }
  return null
}

// 토스 결제취소(환불). 카드결제 주문의 paymentKey로 전체/부분 취소.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return NextResponse.json({ message: auth.error }, { status: auth.status })

    const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY
    if (!TOSS_SECRET_KEY) {
      return NextResponse.json({ message: 'TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.' }, { status: 500 })
    }

    const { paymentKey, cancelReason, cancelAmount } = await req.json()
    if (!paymentKey || !cancelReason) {
      return NextResponse.json({ message: 'paymentKey와 취소사유는 필수입니다.' }, { status: 400 })
    }

    const found = await findOrderByPaymentKey(auth.supabase, String(paymentKey))
    if (!found) {
      return NextResponse.json({ message: '해당 결제키의 주문을 찾을 수 없습니다.' }, { status: 404 })
    }
    const { table, order } = found
    if (!(order.payment_method || '').includes('카드')) {
      return NextResponse.json({ message: '카드결제 주문만 자동 취소할 수 있습니다.' }, { status: 400 })
    }
    if (order.status === '환불') {
      return NextResponse.json({ message: '이미 환불 처리된 주문입니다.' }, { status: 409 })
    }
    if (cancelAmount != null && Number(cancelAmount) > Number(order.paid_amount || order.total_amount || 0)) {
      return NextResponse.json({ message: '취소 금액이 결제 금액보다 큽니다.' }, { status: 400 })
    }

    // cancelAmount 미지정 시 전체취소, 지정 시 부분취소
    const body: Record<string, any> = { cancelReason }
    if (cancelAmount != null && Number(cancelAmount) > 0) body.cancelAmount = Number(cancelAmount)

    const res = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) {
      await auth.supabase
        .from(table)
        .update({ status: '환불', updated_at: new Date().toISOString() })
        .eq('id', order.id)
    }
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || '서버 오류' }, { status: 500 })
  }
}
