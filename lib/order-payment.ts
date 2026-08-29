export const ORDER_TABLES = ['general_orders', 'retail_orders', 'wholesale_orders'] as const
export type OrderTable = (typeof ORDER_TABLES)[number]

type PaymentResult = {
  found: boolean
  alreadyProcessed: boolean
  error?: string
}

type PointSpendResult = {
  ok: boolean
  alreadyProcessed: boolean
  spent: boolean
  message?: string
  userId?: string
  pointUsed?: number
}

// 회원유형별 판매가 — 클라이언트 priceFor(_shopConstants)와 반드시 동일한 폴백 규칙을 써야 한다.
// 소매/도매 회원이라도 member_price·wholesale_price가 비어 있으면 retail_price로 폴백한다.
// (서버가 단일 컬럼만 보면 클라 표시가와 어긋나 '결제 금액을 확인할 수 없습니다'가 발생)
const priceFor = (row: any, table: OrderTable): number => {
  if (table === 'wholesale_orders') return (Number(row?.wholesale_price) || Number(row?.retail_price)) || 0
  if (table === 'retail_orders') return (Number(row?.member_price) || Number(row?.retail_price)) || 0
  return Number(row?.retail_price) || 0
}

const orderItemTable = (table: OrderTable) =>
  table === 'wholesale_orders'
    ? 'wholesale_order_items'
    : table === 'retail_orders'
      ? 'retail_order_items'
      : 'general_order_items'

const calcDiscount = (coupon: any, base: number) => {
  if (!coupon) return 0
  let discount = coupon.discount_type === 'percent'
    ? Math.floor(base * coupon.discount_value / 100)
    : coupon.discount_value
  if (coupon.discount_type === 'percent' && coupon.max_discount) {
    discount = Math.min(discount, coupon.max_discount)
  }
  return Math.min(discount, base)
}

export async function expectedPaymentAmount(supabase: any, table: OrderTable, orderId: string): Promise<number | null> {
  const { data: order } = await supabase
    .from(table)
    .select('coupon_code, point_used')
    .eq('id', orderId)
    .single()
  if (!order) return null

  const { data: items } = await supabase
    .from(orderItemTable(table))
    .select('product_id, option_id, quantity, supplier_id, applied_shipping_fee')
    .eq('order_id', orderId)
  if (!items || items.length === 0) return null

  // 세 가격 컬럼을 모두 읽어 클라이언트와 동일한 폴백(priceFor)으로 계산
  const { data: products } = await supabase
    .from('products')
    .select('id, wholesale_price, member_price, retail_price')
    .in('id', items.map((item: any) => item.product_id))
  const priceMap = new Map<string, number>((products || []).map((product: any) => [product.id, priceFor(product, table)]))

  const optionIds = items.flatMap((item: any) => item.option_id ? [item.option_id] : [])
  const { data: options } = optionIds.length
    ? await supabase.from('product_options').select('id, wholesale_price, member_price, retail_price').in('id', optionIds)
    : { data: [] }
  const optionPriceMap = new Map<string, number>((options || []).map((option: any) => [option.id, priceFor(option, table)]))

  const lineTotal = (item: any) => (item.option_id ? (optionPriceMap.get(item.option_id) || 0) : (priceMap.get(item.product_id) || 0)) * item.quantity
  const subtotal = items.reduce((sum: number, item: any) => sum + lineTotal(item), 0)
  const shippingTotal = items.reduce((sum: number, item: any) => sum + Math.max(0, Number(item.applied_shipping_fee || 0)), 0)

  let discount = 0
  if ((order as any).coupon_code) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', (order as any).coupon_code)
      .maybeSingle()
    if (coupon) {
      const base = coupon.created_by_role === 'supplier'
        ? items
          .filter((item: any) => item.supplier_id === coupon.created_by)
          .reduce((sum: number, item: any) => sum + lineTotal(item), 0)
        : subtotal
      if (base >= (coupon.min_amount || 0)) discount = calcDiscount(coupon, base)
    }
  }

  const pointUsed = Number((order as any).point_used || 0)
  const discountedAmount = Math.max(0, subtotal - discount) + shippingTotal
  if (pointUsed < 0 || pointUsed > discountedAmount) return null

  return Math.max(0, discountedAmount - pointUsed)
}

export async function getOrderPointInfo(supabase: any, table: OrderTable, orderId: string) {
  const { data: order } = await supabase
    .from(table)
    .select('id, user_id, status, payment_key, point_used')
    .eq('id', orderId)
    .maybeSingle()
  return order
}

export async function spendOrderPoints(supabase: any, table: OrderTable, orderId: string): Promise<PointSpendResult> {
  const order = await getOrderPointInfo(supabase, table, orderId)
  if (!order) return { ok: false, alreadyProcessed: false, spent: false, message: '주문 내역을 확인할 수 없습니다.' }

  const alreadyProcessed = ['결제완료', '입금완료'].includes(order.status) || (order.status === '입금대기' && !!order.payment_key)
  const pointUsed = Number(order.point_used || 0)
  if (alreadyProcessed || pointUsed <= 0) return { ok: true, alreadyProcessed, spent: false, userId: order.user_id, pointUsed }
  if (!order.user_id) return { ok: false, alreadyProcessed: false, spent: false, message: '주문 회원 정보를 확인할 수 없습니다.' }

  const { error } = await supabase.rpc('cp_spend_point', {
    p_user: order.user_id,
    p_amount: pointUsed,
    p_ref_type: 'order',
    p_ref_id: orderId,
  })
  if (error) {
    console.error('[order-payment] point spend failed', { table, orderId, error })
    return { ok: false, alreadyProcessed: false, spent: false, message: '포인트 차감에 실패했습니다. 보유 포인트를 확인해 주세요.' }
  }
  return { ok: true, alreadyProcessed: false, spent: true, userId: order.user_id, pointUsed }
}

export async function refundOrderPoints(supabase: any, table: OrderTable, orderId: string, reason = 'order payment rollback') {
  const order = await getOrderPointInfo(supabase, table, orderId)
  const pointUsed = Number(order?.point_used || 0)
  if (!order?.user_id || pointUsed <= 0) return { ok: true }

  const { error } = await supabase.rpc('cp_refund_point', {
    p_user: order.user_id,
    p_amount: pointUsed,
    p_ref_type: 'order_refund',
    p_ref_id: orderId,
  })
  if (error) {
    console.error('[order-payment] point refund failed', { table, orderId, reason, error })
    return { ok: false, message: '포인트 환불에 실패했습니다. 고객센터 확인이 필요합니다.' }
  }
  return { ok: true }
}

export async function markOrderPaid(
  supabase: any,
  table: OrderTable,
  orderId: string,
  paymentKey: string,
  amount: number,
  payment: any
): Promise<PaymentResult> {
  const { data: order } = await supabase.from(table).select('id, status, payment_key').eq('id', orderId).maybeSingle()
  if (!order) return { found: false, alreadyProcessed: false }

  const alreadyProcessed = ['결제완료', '입금완료'].includes(order.status) || (order.status === '입금대기' && !!order.payment_key)
  if (alreadyProcessed) return { found: true, alreadyProcessed: true }

  const isWaiting = payment.status === 'WAITING_FOR_DEPOSIT' || payment.method === '가상계좌'
  const status = isWaiting ? '입금대기' : '결제완료'
  const virtualAccount = payment.virtualAccount

  const { data: updatedOrder, error: updateError } = await supabase
    .from(table)
    .update({
      status,
      payment_key: paymentKey,
      paid_amount: amount,
      ...(virtualAccount?.secret ? { vbank_secret: virtualAccount.secret } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .not('status', 'in', '("결제완료","입금완료")')
    .or('status.neq.입금대기,payment_key.is.null')
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error('[order-payment] mark paid failed', { table, orderId, updateError })
    return { found: true, alreadyProcessed: false, error: '주문 결제 상태 반영에 실패했습니다.' }
  }
  if (!updatedOrder) return { found: true, alreadyProcessed: true }

  if (!isWaiting) await decrementOrderStock(supabase, table, orderId)

  return { found: true, alreadyProcessed: false }
}

export async function decrementOrderStock(supabase: any, table: OrderTable, orderId: string) {
  const { data: items } = await supabase
    .from(orderItemTable(table))
    .select('product_id, option_id, quantity')
    .eq('order_id', orderId)
  if (items && items.length > 0) {
    // products.stock은 목록 카드용 대표 합계이므로 기존처럼 함께 차감하고,
    // 옵션 주문은 실제 재고 원장인 product_options.stock도 별도로 차감한다.
    const productQuantities = new Map<string, number>()
    items.forEach((item: any) => productQuantities.set(item.product_id, (productQuantities.get(item.product_id) || 0) + item.quantity))
    await supabase.rpc('decrement_stock_bulk', {
      items: Array.from(productQuantities, ([id, qty]) => ({ id, qty })),
    })
    for (const item of items.filter((row: any) => row.option_id)) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { data: option } = await supabase.from('product_options').select('stock').eq('id', item.option_id).maybeSingle()
        if (option?.stock == null) break
        const { data: updated } = await supabase.from('product_options')
          .update({ stock: Math.max(0, option.stock - item.quantity) })
          .eq('id', item.option_id).eq('stock', option.stock).select('id').maybeSingle()
        if (updated) break
      }
    }
  }
}
