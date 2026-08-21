export type ProductOptionForm = {
  label: string
  unit: string
  weight: string
  wholesale_price: string
  member_price: string
  retail_price: string
  stock: string
}

export const PRODUCT_OPTION_UNITS = ['kg', 'g', '박스', '마리', '개', '묶음']

export const emptyProductOption = (): ProductOptionForm => ({
  label: '', unit: 'kg', weight: '', wholesale_price: '', member_price: '', retail_price: '', stock: '',
})

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
    wholesale_price: Number(cheapest.wholesale_price) || 0,
    member_price: Number(cheapest.member_price) || 0,
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
    wholesale_price: Number(option.wholesale_price) || 0,
    member_price: Number(option.member_price) || 0,
    retail_price: mode === 'supplier' ? 0 : Number(option.retail_price),
    stock: option.stock.trim() === '' ? null : Number(option.stock),
    sort_order,
    is_active: true,
  }))
}
