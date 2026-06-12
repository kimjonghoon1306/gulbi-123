import { NextRequest, NextResponse } from 'next/server'

// 토스 시크릿 키 — 실 결제 시 Vercel 환경변수 TOSS_SECRET_KEY 로 교체하세요. (테스트 키 기본값)
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_pP2YxJ4K87Z02Z904ZDJrRGZwXLO'

// 토스 결제취소(환불). 카드결제 주문의 paymentKey로 전체/부분 취소.
export async function POST(req: NextRequest) {
  try {
    const { paymentKey, cancelReason, cancelAmount } = await req.json()
    if (!paymentKey || !cancelReason) {
      return NextResponse.json({ message: 'paymentKey와 취소사유는 필수입니다.' }, { status: 400 })
    }
    // cancelAmount 미지정 시 전체취소, 지정 시 부분취소
    const body: Record<string, any> = { cancelReason }
    if (cancelAmount != null && Number(cancelAmount) > 0) body.cancelAmount = Number(cancelAmount)

    const res = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || '서버 오류' }, { status: 500 })
  }
}
