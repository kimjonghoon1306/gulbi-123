// 정기배송(구독) 공용 계산 로직 — 클라/서버 공용, 결제 코어와 독립.
//   · 주기: '매주'(7일) | '격주'(14일) | '매월'(월 단위)
//   · 총액: 회차단가 × 수량 × 회차수 × (1 - 할인율/100), 원 단위 반올림
//   · 회차 스케줄: 시작일 기준으로 주기만큼 더해가며 total_cycles개 생성

export type Frequency = '매주' | '격주' | '매월'
export const FREQUENCIES: Frequency[] = ['매주', '격주', '매월']
export const CYCLE_OPTIONS = [4, 8, 12] as const

export function frequencyLabel(freq: string): string {
  return freq === '매주' ? '매주' : freq === '격주' ? '2주마다' : freq === '매월' ? '매달' : freq
}

// 날짜(YYYY-MM-DD) 문자열 유틸 — KST 자정 기준 date 컬럼용
function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addByFrequency(base: Date, freq: string, times: number): Date {
  const d = new Date(base.getTime())
  if (freq === '매월') {
    d.setMonth(d.getMonth() + times)
  } else {
    const days = freq === '격주' ? 14 : 7
    d.setDate(d.getDate() + days * times)
  }
  return d
}

// 시작일(기본: 첫 배송을 신청 다음날부터 잡음)로부터 회차별 예정일 배열
export function buildDeliverySchedule(startDate: Date, freq: string, totalCycles: number): { cycle_no: number; scheduled_date: string }[] {
  const rows: { cycle_no: number; scheduled_date: string }[] = []
  for (let i = 0; i < totalCycles; i++) {
    rows.push({ cycle_no: i + 1, scheduled_date: toISODate(addByFrequency(startDate, freq, i)) })
  }
  return rows
}

// 첫 배송 예정일(기본: 신청일 + 3일 여유). 필요 시 호출부에서 조정.
export function defaultStartDate(from: Date = new Date()): Date {
  const d = new Date(from.getTime())
  d.setDate(d.getDate() + 3)
  return d
}

export function computeSubscriptionTotal(unitPrice: number, quantity: number, totalCycles: number, discountRate: number): {
  perCycle: number; subtotal: number; discountAmount: number; total: number
} {
  const price = Math.max(0, Math.round(Number(unitPrice) || 0))
  const qty = Math.max(1, Math.round(Number(quantity) || 1))
  const cycles = Math.max(1, Math.round(Number(totalCycles) || 1))
  const rate = Math.min(100, Math.max(0, Number(discountRate) || 0))
  const perCycle = price * qty
  const subtotal = perCycle * cycles
  const discountAmount = Math.round(subtotal * (rate / 100))
  const total = Math.max(0, subtotal - discountAmount)
  return { perCycle, subtotal, discountAmount, total }
}
