import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const ORDER_TABLES = ['general_orders', 'retail_orders', 'wholesale_orders'] as const
type OrderTable = (typeof ORDER_TABLES)[number]

// 주문 테이블별 적용 단가 컬럼 (cart의 getPrice와 동일)
const priceField = (table: OrderTable): 'retail_price' | 'member_price' | 'wholesale_price' =>
  table === 'wholesale_orders' ? 'wholesale_price' : table === 'retail_orders' ? 'member_price' : 'retail_price'

// cart의 calcDiscount와 동일한 할인 공식
const calcDiscount = (c: any, base: number) => {
  if (!c) return 0
  let d = c.discount_type === 'percent' ? Math.floor(base * c.discount_value / 100) : c.discount_value
  if (c.discount_type === 'percent' && c.max_discount) d = Math.min(d, c.max_discount)
  return Math.min(d, base)
}

// 서버에서 DB 실가격으로 주문의 정당한 결제금액을 재계산
async function expectedAmount(supabase: any, table: OrderTable, orderId: string): Promise<number | null> {
  const { data: order } = await supabase.from(table).select('coupon_code').eq('id', orderId).single()
  if (!order) return null

  const itemTable = `${table.replace('_orders', '')}_order_items`
  const { data: items } = await supabase.from(itemTable).select('product_id, quantity, supplier_id').eq('order_id', orderId)
  if (!items || items.length === 0) return null

  const ids = items.map((i: any) => i.product_id)
  const field = priceField(table)
  const { data: products } = await supabase.from('products').select(`id, ${field}`).in('id', ids)
  const priceMap = new Map<string, number>((products || []).map((p: any) => [p.id, Number(p[field]) || 0]))

  const lineTotal = (i: any) => (priceMap.get(i.product_id) || 0) * i.quantity
  const subtotal = items.reduce((s: number, i: any) => s + lineTotal(i), 0)

  let discount = 0
  if ((order as any).coupon_code) {
    const { data: coupon } = await supabase.from('coupons').select('*').eq('code', (order as any).coupon_code).maybeSingle()
    if (coupon) {
      // 방식 A: 공급사 쿠폰은 그 공급사 상품 합계에만 적용 / 본사 쿠폰은 주문 전체
      const base = coupon.created_by_role === 'supplier'
        ? items.filter((i: any) => i.supplier_id === coupon.created_by).reduce((s: number, i: any) => s + lineTotal(i), 0)
        : subtotal
      if (base >= (coupon.min_amount || 0)) discount = calcDiscount(coupon, base)
    }
  }
  return Math.max(0, subtotal - discount)
}

async function markOrderPaid(supabase: any, table: OrderTable, orderId: string, paymentKey: string, amount: number, payment: any) {
  const { data: order } = await supabase.from(table).select('id, status').eq('id', orderId).maybeSingle()
  if (!order) return

  const alreadyProcessed = ['결제완료', '입금대기', '입금완료'].includes(order.status)
  const isWaiting = payment.status === 'WAITING_FOR_DEPOSIT' || payment.method === '가상계좌'
  const status = isWaiting ? '입금대기' : '결제완료'
  const virtualAccount = payment.virtualAccount

  await supabase.from(table).update({
    status,
    payment_key: paymentKey,
    paid_amount: amount,
    ...(virtualAccount?.secret ? { vbank_secret: virtualAccount.secret } : {}),
    updated_at: new Date().toISOString(),
  }).eq('id', orderId)

  if (alreadyProcessed) return

  const itemTable = table === 'wholesale_orders'
    ? 'wholesale_order_items'
    : table === 'retail_orders'
      ? 'retail_order_items'
      : 'general_order_items'
  const { data: items } = await supabase.from(itemTable).select('product_id, quantity').eq('order_id', orderId)
  if (items && items.length > 0) {
    await supabase.rpc('decrement_stock_bulk', {
      items: items.map((x: any) => ({ id: x.product_id, qty: x.quantity })),
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY
    if (!TOSS_SECRET_KEY) {
      return NextResponse.json({ message: 'TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.' }, { status: 500 })
    }

    const { paymentKey, orderId, amount, table } = await req.json()
    if (!paymentKey || !orderId || !amount || !ORDER_TABLES.includes(table)) {
      return NextResponse.json({ message: '필수 값 누락' }, { status: 400 })
    }

    const adminSupabase = createAdminSupabase()
    if (!adminSupabase) {
      return NextResponse.json({ message: 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.' }, { status: 500 })
    }

    // ── 서버 측 결제금액 검증: 클라이언트가 보낸 금액을 그대로 믿지 않고 DB 실가격으로 재계산 ──
    const expected = await expectedAmount(adminSupabase, table as OrderTable, String(orderId))
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
      await markOrderPaid(adminSupabase, table as OrderTable, String(orderId), String(paymentKey), Number(amount), data)
    }
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || '서버 오류' }, { status: 500 })
  }
}
