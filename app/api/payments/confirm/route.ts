import { NextRequest, NextResponse } from 'next/server'

// 토스 시크릿 키 — 실 결제 시 Vercel 환경변수 TOSS_SECRET_KEY 로 교체하세요. (테스트 키 기본값)
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_pP2YxJ4K87Z02Z904ZDJrRGZwXLO'

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json()
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ message: '필수 값 누락' }, { status: 400 })
    }
    const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || '서버 오류' }, { status: 500 })
  }
}
