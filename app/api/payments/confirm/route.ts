import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// 토스 시크릿 키 — 실 결제 시 Vercel 환경변수 TOSS_SECRET_KEY 로 교체하세요. (테스트 키 기본값)
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_pP2YxJ4K87Z02Z904ZDJrRGZwXLO'

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
async function expectedAmount(table: OrderTable, orderId: string): Promise<number | null> {
  const supabase = await createServerSupabase()

  const { data: order } = await supabase.from(table).select('coupon_code').eq('id', orderId).single()
  if (!order) return null

  const itemTable = `${table.replace('_orders', '')}_order_items`
  const { data: items } = await supabase.from(itemTable).select('product_id, quantity').eq('order_id', orderId)
  if (!items || items.length === 0) return null

  const ids = items.map((i: any) => i.product_id)
  const field = priceField(table)
  const { data: products } = await supabase.from('products').select(`id, ${field}`).in('id', ids)
  const priceMap = new Map<string, number>((products || []).map((p: any) => [p.id, Number(p[field]) || 0]))

  const subtotal = items.reduce((s: number, i: any) => s + (priceMap.get(i.product_id) || 0) * i.quantity, 0)

  let discount = 0
  if ((order as any).coupon_code) {
    const { data: coupon } = await supabase.from('coupons').select('*').eq('code', (order as any).coupon_code).maybeSingle()
    if (coupon && subtotal >= (coupon.min_amount || 0)) discount = calcDiscount(coupon, subtotal)
  }
  return Math.max(0, subtotal - discount)
}

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount, table } = await req.json()
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ message: '필수 값 누락' }, { status: 400 })
    }

    // ── 서버 측 결제금액 검증: 클라이언트가 보낸 금액을 그대로 믿지 않고 DB 실가격으로 재계산 ──
    if (ORDER_TABLES.includes(table)) {
      const expected = await expectedAmount(table as OrderTable, String(orderId))
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
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || '서버 오류' }, { status: 500 })
  }
}
