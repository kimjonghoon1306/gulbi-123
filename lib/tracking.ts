// 통합 배송추적 — 스마트택배(SweetTracker) API 래퍼
// 환경변수(Vercel): SWEETTRACKER_API_KEY  (https://tracking.sweettracker.co.kr 에서 무료 발급)
// 미설정 시 /api/tracking 이 안내 메시지를 반환합니다.

// 자주 쓰는 택배사 코드 (SweetTracker company code)
export const COURIERS: { code: string; name: string }[] = [
  { code: '04', name: 'CJ대한통운' },
  { code: '01', name: '우체국택배' },
  { code: '05', name: '한진택배' },
  { code: '08', name: '롯데택배' },
  { code: '06', name: '로젠택배' },
  { code: '46', name: 'CU 편의점택배' },
  { code: '24', name: 'GS Postbox 택배' },
  { code: '23', name: '경동택배' },
  { code: '11', name: '일양로지스' },
  { code: '22', name: '대신택배' },
  { code: '32', name: '합동택배' },
  { code: '18', name: '한덱스' },
]

export const courierName = (code: string) => COURIERS.find(c => c.code === code)?.name || code

export function trackingReady() {
  return !!process.env.SWEETTRACKER_API_KEY
}

export type TrackStep = { time: string; where: string; kind: string }
export type TrackResult = {
  ok: boolean
  completed: boolean
  level: number              // 1 배송준비 ~ 6 배송완료
  invoiceNo: string
  courierName: string
  itemName?: string
  receiverName?: string
  lastWhere?: string
  lastKind?: string
  steps: TrackStep[]
  error?: string
}

// SweetTracker trackingInfo 호출 → 정규화
export async function fetchTracking(courierCode: string, invoice: string): Promise<TrackResult> {
  const key = process.env.SWEETTRACKER_API_KEY || ''
  const url = `http://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=${encodeURIComponent(key)}&t_code=${encodeURIComponent(courierCode)}&t_invoice=${encodeURIComponent(invoice)}`
  const res = await fetch(url, { cache: 'no-store' })
  const data: any = await res.json().catch(() => ({}))

  // 에러 응답: { status:false, msg:'...' } 또는 code 포함
  if (data.status === false || data.code) {
    return {
      ok: false, completed: false, level: 0, invoiceNo: invoice,
      courierName: courierName(courierCode), steps: [],
      error: data.msg || '배송 정보를 찾을 수 없습니다. 송장번호/택배사를 확인해주세요.',
    }
  }

  const details: any[] = Array.isArray(data.trackingDetails) ? data.trackingDetails : []
  const steps: TrackStep[] = details.map(d => ({
    time: d.timeString || d.time || '',
    where: d.where || '',
    kind: d.kind || '',
  }))

  return {
    ok: true,
    completed: data.completeYN === 'Y' || Number(data.level) >= 6,
    level: Number(data.level) || 0,
    invoiceNo: data.invoiceNo || invoice,
    courierName: data.company || courierName(courierCode),
    itemName: data.itemName || '',
    receiverName: data.receiverName || '',
    lastWhere: data.lastDetail?.where || (steps[steps.length - 1]?.where ?? ''),
    lastKind: data.lastDetail?.kind || (steps[steps.length - 1]?.kind ?? ''),
    steps,
  }
}
