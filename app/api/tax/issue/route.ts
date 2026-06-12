import { NextRequest, NextResponse } from 'next/server'
import { issueTaxinvoice, issueCashbill, cancelTaxinvoice, cancelCashbill, popbillReady } from '@/lib/popbill'

// 팝빌 SDK는 Node 런타임 필요(Edge 불가)
export const runtime = 'nodejs'

// 관리자 '발행완료' 클릭 시 호출 → 팝빌로 세금계산서/현금영수증 국세청 발행
export async function POST(req: NextRequest) {
  if (!popbillReady()) {
    return NextResponse.json({
      message: '팝빌 환경변수가 설정되지 않았습니다. POPBILL_LINK_ID / POPBILL_SECRET_KEY / POPBILL_CORP_NUM(및 공급자 정보)를 Vercel에 등록하세요.',
    }, { status: 500 })
  }
  try {
    const { type, record } = await req.json()
    if (!record) return NextResponse.json({ message: '발행할 레코드가 없습니다.' }, { status: 400 })

    if (type === 'invoice') {
      const { mgtKey, result } = await issueTaxinvoice(record)
      return NextResponse.json({ ok: true, mgtKey, result })
    }
    if (type === 'receipt') {
      const { mgtKey, result } = await issueCashbill(record)
      return NextResponse.json({ ok: true, mgtKey, result })
    }
    // 환불 시 취소발행 — record.invoice_number / record.receipt_number 에 발행 mgtKey 저장돼 있음
    if (type === 'cancel-invoice') {
      const mgtKey = record.invoice_number || record.mgtKey
      if (!mgtKey) return NextResponse.json({ message: '취소할 세금계산서 관리번호(invoice_number)가 없습니다.' }, { status: 400 })
      const result = await cancelTaxinvoice(mgtKey, record.cancel_memo)
      return NextResponse.json({ ok: true, mgtKey, result })
    }
    if (type === 'cancel-receipt') {
      const mgtKey = record.receipt_number || record.mgtKey
      if (!mgtKey) return NextResponse.json({ message: '취소할 현금영수증 관리번호(receipt_number)가 없습니다.' }, { status: 400 })
      const result = await cancelCashbill(mgtKey, record.cancel_memo)
      return NextResponse.json({ ok: true, mgtKey, result })
    }
    return NextResponse.json({ message: 'type은 invoice / receipt / cancel-invoice / cancel-receipt 여야 합니다.' }, { status: 400 })
  } catch (e: any) {
    // 팝빌 에러는 { code, message } 형태
    return NextResponse.json({ message: e?.message || e?.code || '팝빌 발행 실패' }, { status: 500 })
  }
}
