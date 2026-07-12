import { NextRequest, NextResponse } from 'next/server'
import { issueTaxinvoice, issueCashbill, cancelTaxinvoice, cancelCashbill, popbillReady } from '@/lib/popbill'
import { requireAdminUser } from '@/lib/supabase-server'

// 팝빌 SDK는 Node 런타임 필요(Edge 불가)
export const runtime = 'nodejs'

async function loadRecord(supabase: any, table: 'tax_invoices' | 'cash_receipts', id: string) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

// 관리자 '발행완료' 클릭 시 호출 → 팝빌로 세금계산서/현금영수증 국세청 발행
export async function POST(req: NextRequest) {
  const auth = await requireAdminUser()
  if (!auth.ok) {
    console.error('[tax/issue] auth failed', auth.error)
    return NextResponse.json({ message: '관리자 권한을 확인할 수 없습니다. 다시 로그인해 주세요.' }, { status: auth.status })
  }

  if (!popbillReady()) {
    console.error('[tax/issue] popbill env missing')
    return NextResponse.json({
      message: '팝빌 설정을 확인할 수 없습니다. 서버 설정을 확인해 주세요.',
    }, { status: 500 })
  }
  try {
    const { type, id, record } = await req.json()
    const recordId = id || record?.id
    if (!recordId) return NextResponse.json({ message: '발행할 레코드 ID가 없습니다.' }, { status: 400 })

    if (type === 'invoice') {
      const invoice = await loadRecord(auth.supabase, 'tax_invoices', recordId)
      if (!invoice) return NextResponse.json({ message: '세금계산서 레코드를 찾을 수 없습니다.' }, { status: 404 })
      if (invoice.status === '발행완료') return NextResponse.json({ message: '이미 발행완료된 세금계산서입니다.' }, { status: 409 })
      const { mgtKey, result } = await issueTaxinvoice(invoice)
      await auth.supabase.from('tax_invoices').update({
        status: '발행완료',
        issued_at: new Date().toISOString(),
        invoice_number: mgtKey,
      }).eq('id', recordId)
      return NextResponse.json({ ok: true, mgtKey, result })
    }
    if (type === 'receipt') {
      const receipt = await loadRecord(auth.supabase, 'cash_receipts', recordId)
      if (!receipt) return NextResponse.json({ message: '현금영수증 레코드를 찾을 수 없습니다.' }, { status: 404 })
      if (receipt.status === '발행완료') return NextResponse.json({ message: '이미 발행완료된 현금영수증입니다.' }, { status: 409 })
      const { mgtKey, result } = await issueCashbill(receipt)
      await auth.supabase.from('cash_receipts').update({
        status: '발행완료',
        issued_at: new Date().toISOString(),
        receipt_number: mgtKey,
      }).eq('id', recordId)
      return NextResponse.json({ ok: true, mgtKey, result })
    }
    // 환불 시 취소발행 — record.invoice_number / record.receipt_number 에 발행 mgtKey 저장돼 있음
    if (type === 'cancel-invoice') {
      const invoice = await loadRecord(auth.supabase, 'tax_invoices', recordId)
      if (!invoice) return NextResponse.json({ message: '세금계산서 레코드를 찾을 수 없습니다.' }, { status: 404 })
      const mgtKey = invoice.invoice_number
      if (!mgtKey) return NextResponse.json({ message: '취소할 세금계산서 관리번호(invoice_number)가 없습니다.' }, { status: 400 })
      const result = await cancelTaxinvoice(mgtKey, invoice.cancel_memo)
      await auth.supabase.from('tax_invoices').update({ status: '발행취소' }).eq('id', recordId)
      return NextResponse.json({ ok: true, mgtKey, result })
    }
    if (type === 'cancel-receipt') {
      const receipt = await loadRecord(auth.supabase, 'cash_receipts', recordId)
      if (!receipt) return NextResponse.json({ message: '현금영수증 레코드를 찾을 수 없습니다.' }, { status: 404 })
      const mgtKey = receipt.receipt_number
      if (!mgtKey) return NextResponse.json({ message: '취소할 현금영수증 관리번호(receipt_number)가 없습니다.' }, { status: 400 })
      const result = await cancelCashbill(mgtKey, receipt.cancel_memo)
      await auth.supabase.from('cash_receipts').update({ status: '발행취소' }).eq('id', recordId)
      return NextResponse.json({ ok: true, mgtKey, result })
    }
    return NextResponse.json({ message: 'type은 invoice / receipt / cancel-invoice / cancel-receipt 여야 합니다.' }, { status: 400 })
  } catch (e: any) {
    // 팝빌 에러는 { code, message } 형태
    console.error('[tax/issue] popbill failed', e)
    return NextResponse.json({ message: '팝빌 처리에 실패했습니다. 서버 로그를 확인해 주세요.' }, { status: 500 })
  }
}
