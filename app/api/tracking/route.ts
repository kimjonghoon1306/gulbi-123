import { NextRequest, NextResponse } from 'next/server'
import { fetchTracking, trackingReady } from '@/lib/tracking'

export const runtime = 'nodejs'

// 손님/관리자 배송조회 — { courier, invoice } 받아 스마트택배 조회 결과 반환
export async function POST(req: NextRequest) {
  if (!trackingReady()) {
    console.error('[tracking] SWEETTRACKER_API_KEY is not configured')
    return NextResponse.json({
      ok: false,
      error: '배송조회 서비스 연결을 확인하고 있습니다. 급하신 경우 고객센터로 문의해 주세요.',
    }, { status: 503 })
  }
  try {
    const { courier, invoice } = await req.json()
    if (!courier || !invoice) {
      return NextResponse.json({ ok: false, error: '택배사와 송장번호가 필요합니다.' }, { status: 400 })
    }
    const result = await fetchTracking(String(courier), String(invoice).replace(/[^0-9A-Za-z]/g, ''))
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[tracking] lookup failed', e)
    return NextResponse.json({ ok: false, error: '배송 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
