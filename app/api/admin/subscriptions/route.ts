import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { requireAdminUser } from '@/lib/supabase-server'
import { buildDeliverySchedule, computeSubscriptionTotal, defaultStartDate, FREQUENCIES, CYCLE_OPTIONS } from '@/lib/subscription'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// 관리자가 전화/현장 주문 손님을 위해 정기배송을 직접 등록 (선결제 완료 가정 → 바로 '진행중')
export async function POST(req: NextRequest) {
  const auth = await requireAdminUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const admin = createAdminSupabase()
  if (!admin) return NextResponse.json({ error: '서버 설정 오류(SERVICE_ROLE_KEY).' }, { status: 500 })

  try {
    const body = await req.json().catch(() => ({}))
    const { user_id, product_id, quantity, frequency, total_cycles } = body

    if (!UUID_RE.test(String(user_id || ''))) return NextResponse.json({ error: '손님(회원)을 선택해 주세요.' }, { status: 400 })
    if (!UUID_RE.test(String(product_id || ''))) return NextResponse.json({ error: '상품을 선택해 주세요.' }, { status: 400 })
    if (!FREQUENCIES.includes(frequency)) return NextResponse.json({ error: '배송 주기가 올바르지 않습니다.' }, { status: 400 })
    const cycles = Number(total_cycles)
    if (!CYCLE_OPTIONS.includes(cycles as any)) return NextResponse.json({ error: '회차를 선택해 주세요.' }, { status: 400 })
    const qty = Math.max(1, Math.round(Number(quantity) || 1))

    // 상품 정보(가격·단위·할인) 서버에서 조회 — 클라 입력 신뢰하지 않음
    const { data: product } = await admin
      .from('products')
      .select('id, name, image_url, unit, retail_price, subscribe_discount, subscribable')
      .eq('id', product_id)
      .maybeSingle()
    if (!product) return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 })

    const unitPrice = Math.max(0, Math.round(Number((body.unit_price ?? product.retail_price)) || 0))
    const discountRate = body.discount_rate != null ? Number(body.discount_rate) : Number(product.subscribe_discount || 0)
    const { total } = computeSubscriptionTotal(unitPrice, qty, cycles, discountRate)

    const start = defaultStartDate()
    const schedule = buildDeliverySchedule(start, frequency, cycles)

    const { data: sub, error: subErr } = await admin.from('subscriptions').insert({
      user_id,
      product_id,
      product_name: product.name,
      image_url: product.image_url,
      quantity: qty,
      unit: product.unit,
      unit_price: unitPrice,
      frequency,
      total_cycles: cycles,
      discount_rate: discountRate,
      total_amount: total,
      payment_mode: '선결제',
      status: '진행중',
      next_delivery_date: schedule[0]?.scheduled_date || null,
      recipient: body.recipient || null,
      phone: body.phone || null,
      address: body.address || null,
      address_detail: body.address_detail || null,
      zipcode: body.zipcode || null,
      request_memo: body.request_memo || null,
      order_ref: '관리자 수동등록',
    }).select().single()

    if (subErr || !sub) {
      console.error('[admin/subscriptions] insert failed', subErr)
      return NextResponse.json({ error: '구독 등록에 실패했습니다.' }, { status: 500 })
    }

    const { error: delErr } = await admin.from('subscription_deliveries').insert(
      schedule.map(s => ({ subscription_id: sub.id, cycle_no: s.cycle_no, scheduled_date: s.scheduled_date, status: '예정' }))
    )
    if (delErr) {
      console.error('[admin/subscriptions] deliveries insert failed', delErr)
      // 구독은 만들어졌으니 롤백보다 경고. 회차는 관리자가 재생성 가능하도록 안내.
      return NextResponse.json({ subscription: sub, warning: '구독은 등록됐지만 회차 생성에 실패했습니다.' })
    }

    return NextResponse.json({ subscription: sub })
  } catch (e) {
    console.error('[admin/subscriptions] error', e)
    return NextResponse.json({ error: '구독 등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
