export type ShippingProduct = {
  shipping_type?: 'free' | 'paid' | string | null
  shipping_fee?: number | null
  free_shipping_threshold?: number | null
}

export type ShippingCalculation = {
  type: 'free' | 'paid'
  productAmount: number
  configuredFee: number
  freeThreshold: number | null
  appliedFee: number
  discount: number
  isFree: boolean
  reason: 'product_free' | 'threshold_met' | 'paid'
}

// 배송비는 장바구니 전체가 아니라 상품별 (단가 × 해당 상품 수량) 기준으로 계산한다.
// 기존 상품은 배송 설정이 없으므로 이전 정책과 동일하게 무료배송으로 취급한다.
export function calculateProductShipping(
  product: ShippingProduct,
  unitPrice: number,
  quantity: number,
): ShippingCalculation {
  const productAmount = Math.max(0, Number(unitPrice) || 0) * Math.max(1, Math.floor(Number(quantity) || 1))
  const type = product.shipping_type === 'paid' ? 'paid' : 'free'
  const configuredFee = type === 'paid' ? Math.max(0, Number(product.shipping_fee) || 0) : 0
  const thresholdValue = Number(product.free_shipping_threshold)
  const freeThreshold = type === 'paid' && Number.isFinite(thresholdValue) && thresholdValue > 0
    ? thresholdValue
    : null
  const thresholdMet = freeThreshold !== null && productAmount >= freeThreshold
  const appliedFee = type === 'paid' && !thresholdMet ? configuredFee : 0
  const reason = type === 'free' ? 'product_free' : thresholdMet ? 'threshold_met' : 'paid'

  return {
    type,
    productAmount,
    configuredFee,
    freeThreshold,
    appliedFee,
    discount: Math.max(0, configuredFee - appliedFee),
    isFree: appliedFee === 0,
    reason,
  }
}

export function shippingPolicyLabel(product: ShippingProduct): string {
  if (product.shipping_type !== 'paid') return '무료배송'
  const fee = Math.max(0, Number(product.shipping_fee) || 0)
  const threshold = Math.max(0, Number(product.free_shipping_threshold) || 0)
  return threshold > 0
    ? `배송비 ${fee.toLocaleString()}원 · ${threshold.toLocaleString()}원 이상 무료`
    : `배송비 ${fee.toLocaleString()}원`
}
