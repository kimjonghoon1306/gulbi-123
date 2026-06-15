import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { issueTaxinvoice, issueCashbill, popbillReady } from '@/lib/popbill'

// 토스 가상계좌 입금통보(웹훅) — 토스 서버가 호출(로그인 세션 없음 → service role 사용)
// 토스 대시보드 > 웹훅에 등록: https://app.yuanfnb.com/api/payments/webhook
export const runtime = 'nodejs'

const ORDER_TABLES = ['general_orders', 'retail_orders', 'wholesale_orders'] as const

export async function POST(req: NextRequest) {
  const supabase = createAdminSupabase()
  if (!supabase) {
    // 키 없으면 토스가 재시도하지 않도록 200으로 응답(로그만 남김)
    console.error('[webhook] SUPABASE_SERVICE_ROLE_KEY 미설정')
    return NextResponse.json({ ok: false, reason: 'no-service-key' })
  }

  let body: any = {}
  try { body = await req.json() } catch {}

  // 토스 가상계좌 입금통보 형식: { status: 'DONE'|'CANCELED'|'WAITING_FOR_DEPOSIT', orderId, secret, ... }
  const status: string = body?.status || body?.data?.status || ''
  const orderId: string = String(body?.orderId || body?.data?.orderId || '')
  const secret: string = body?.secret || body?.data?.secret || ''
  if (!orderId) return NextResponse.json({ ok: true, skip: 'no-orderId' })

  // 주문 찾기 (3개 테이블 중)
  let table: (typeof ORDER_TABLES)[number] | null = null
  let order: any = null
  for (const t of ORDER_TABLES) {
    const { data } = await supabase.from(t).select('*').eq('id', orderId).maybeSingle()
    if (data) { table = t; order = data; break }
  }
  if (!table || !order) return NextResponse.json({ ok: true, skip: 'order-not-found' })

  // 위변조 검증: 발급 시 저장해 둔 secret과 일치해야 함
  if (order.vbank_secret && secret && order.vbank_secret !== secret) {
    return NextResponse.json({ ok: false, reason: 'secret-mismatch' }, { status: 403 })
  }

  // 입금 취소/만료 → 주문 취소
  if (status === 'CANCELED') {
    await supabase.from(table).update({ status: '취소', updated_at: new Date().toISOString() }).eq('id', orderId)
    return NextResponse.json({ ok: true, status: '취소' })
  }

  // 입금 완료(DONE)만 처리
  if (status !== 'DONE') return NextResponse.json({ ok: true, skip: `status=${status}` })

  // 이미 입금완료 처리된 주문이면 중복 방지
  if (order.status === '입금완료' || order.status === '결제완료') {
    return NextResponse.json({ ok: true, skip: 'already-paid' })
  }

  // 1) 주문 입금완료 처리
  await supabase.from(table).update({ status: '입금완료', updated_at: new Date().toISOString() }).eq('id', orderId)

  // 2) 자동발행 설정 확인 (system_settings.auto_issue === 'on')
  const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'auto_issue').maybeSingle()
  const autoIssue = setting?.value === 'on'

  let issued: string | null = null
  if (autoIssue && popbillReady()) {
    // 이 주문에 연결된 미발행 증빙 찾기 (note에 "{table} #{id}" 기록됨)
    try {
      const tag = `${table} #${orderId}`
      // 세금계산서
      const { data: invs } = await supabase.from('tax_invoices').select('*').ilike('note', `%${tag}%`).eq('status', '미발행')
      for (const inv of invs || []) {
        try {
          const { mgtKey } = await issueTaxinvoice(inv)
          await supabase.from('tax_invoices').update({ status: '발행완료', issued_at: new Date().toISOString(), invoice_number: mgtKey }).eq('id', inv.id)
          issued = 'invoice'
        } catch (e) { console.error('[webhook] 세금계산서 자동발행 실패', e) } // 실패 시 미발행 유지(관리자 수동)
      }
      // 현금영수증
      const { data: recs } = await supabase.from('cash_receipts').select('*').ilike('note', `%${tag}%`).eq('status', '미발행')
      for (const rec of recs || []) {
        try {
          const { mgtKey } = await issueCashbill(rec)
          await supabase.from('cash_receipts').update({ status: '발행완료', issued_at: new Date().toISOString(), receipt_number: mgtKey }).eq('id', rec.id)
          issued = 'receipt'
        } catch (e) { console.error('[webhook] 현금영수증 자동발행 실패', e) }
      }
    } catch (e) { console.error('[webhook] 자동발행 처리 오류', e) }
  }

  return NextResponse.json({ ok: true, status: '입금완료', autoIssue, issued })
}
