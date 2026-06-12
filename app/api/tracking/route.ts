import { NextRequest, NextResponse } from 'next/server'
import { fetchTracking, trackingReady } from '@/lib/tracking'

export const runtime = 'nodejs'

// 손님/관리자 배송조회 — { courier, invoice } 받아 스마트택배 조회 결과 반환
export async function POST(req: NextRequest) {
  if (!trackingReady()) {
    return NextResponse.json({
      ok: false,
      error: '배송조회 서비스가 아직 연결되지 않았어요. (관리자: SWEETTRACKER_API_KEY 환경변수 등록 필요)',
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
    return NextResponse.json({ ok: false, error: e?.message || '배송조회 중 오류가 발생했어요.' }, { status: 500 })
  }
}
