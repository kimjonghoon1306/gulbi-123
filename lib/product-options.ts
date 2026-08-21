export type ProductOptionForm = {
  client_id: string
  label: string
  unit: string
  weight: string
  wholesale_price: string
  member_price: string
  retail_price: string
  stock: string
}

export type ProductOptionApprovalForm = ProductOptionForm & {
  id: string
  suggested_wholesale_price: number
  suggested_retail_price: number
}

export const PRODUCT_OPTION_UNITS = ['kg', 'g', '박스', '마리', '개', '묶음']

export const emptyProductOption = (): ProductOptionForm => ({
  client_id: `option-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  label: '', unit: 'kg', weight: '', wholesale_price: '', member_price: '', retail_price: '', stock: '',
})

export function optionLabelError(options: ProductOptionForm[]) {
  if (!options.length || options.some(option => !option.label.trim())) {
    return '모든 옵션의 옵션명을 직접 입력해 주세요.'
  }
  const normalized = options.map(option => option.label.trim().normalize('NFKC').toLocaleLowerCase('ko-KR'))
  if (new Set(normalized).size !== normalized.length) {
    return '옵션명은 중복될 수 없습니다. 서로 다른 옵션명을 입력해 주세요.'
  }
  return null
}

export const digitsOnly = (value: string) => value.replace(/[^\d]/g, '')

export const formatWon = (value: string) => {
  const digits = digitsOnly(value)
  return digits ? Number(digits).toLocaleString('ko-KR') : ''
}

export type ProductOptionMode = 'admin' | 'supplier'

export function optionRepresentative(options: ProductOptionForm[], mode: ProductOptionMode = 'admin') {
  const priceKey = mode === 'supplier' ? 'member_price' : 'retail_price'
  const cheapest = options.reduce((best, option) =>
    Number(option[priceKey]) < Number(best[priceKey]) ? option : best)
  const unlimited = options.some(option => option.stock.trim() === '')
  return {
    wholesale_price: mode === 'supplier' ? 0 : (Number(cheapest.wholesale_price) || 0),
    member_price: mode === 'supplier' ? 0 : (Number(cheapest.member_price) || 0),
    retail_price: mode === 'supplier' ? 0 : Number(cheapest.retail_price),
    stock: unlimited ? null : options.reduce((sum, option) => sum + Number(option.stock), 0),
    unit: cheapest.unit,
    weight: cheapest.weight.trim() === '' ? null : Number(cheapest.weight),
  }
}

export function optionsForInsert(productId: string, options: ProductOptionForm[], mode: ProductOptionMode = 'admin') {
  return options.map((option, sort_order) => ({
    product_id: productId,
    label: option.label.trim(),
    unit: option.unit || null,
    weight: option.weight.trim() === '' ? null : Number(option.weight),
    ...(mode === 'supplier' ? {
      suggested_wholesale_price: Number(option.wholesale_price) || 0,
      suggested_retail_price: Number(option.member_price) || 0,
    } : {}),
    wholesale_price: mode === 'supplier' ? 0 : (Number(option.wholesale_price) || 0),
    member_price: mode === 'supplier' ? 0 : (Number(option.member_price) || 0),
    retail_price: mode === 'supplier' ? 0 : Number(option.retail_price),
    stock: option.stock.trim() === '' ? null : Number(option.stock),
    sort_order,
    is_active: true,
  }))
}
