import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { issueTaxinvoice, issueCashbill, popbillReady } from '@/lib/popbill'

// KG이니시스 가상계좌 입금통보(노티).
// 이니시스 상점관리자 > 가상계좌 입금통보 URL 에 등록:  https://app.yuanfnb.com/api/payments/inicis/vbank-noti
// 이니시스 서버가 form-urlencoded 로 POST → 성공 시 반드시 "OK" 텍스트로 응답해야 재전송이 멈춘다.
export const runtime = 'nodejs'

const ORDER_TABLES = ['general_orders', 'retail_orders', 'wholesale_orders'] as const
const OK = () => new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })

export async function POST(req: NextRequest) {
  const supabase = createAdminSupabase()
  if (!supabase) {
    console.error('[inicis/vbank-noti] SUPABASE_SERVICE_ROLE_KEY 미설정')
    return OK() // 재전송 방지
  }

  // 입금통보 파싱 (form-urlencoded)
  let f: URLSearchParams
  try {
    f = new URLSearchParams(await req.text())
  } catch {
    return OK()
  }
  const g = (...keys: string[]) => { for (const k of keys) { const v = f.get(k); if (v) return v } return '' }
  const tid = g('tid', 'TID')
  const oid = g('oid', 'MOID', 'orderNumber', 'P_OID')
  const amount = Number(g('price', 'TotPrice', 'P_AMT', 'No_Deposit') || 0)
  const status = (g('status', 'P_STATUS', 'resultCode') || '').toUpperCase()

  const stamp = async (note: string) => {
    try {
      await supabase.from('system_settings').delete().eq('key', 'webhook_last')
      await supabase.from('system_settings').insert({ key: 'webhook_last', value: `${new Date().toISOString()}|${note}`, updated_at: new Date().toISOString() })
    } catch {}
  }
  await stamp(`이니시스 입금통보 tid=${tid || '?'} oid=${oid || '?'}`)

  // 주문 찾기: payment_key(=tid) 우선, 없으면 pg_oid
  let table: (typeof ORDER_TABLES)[number] | null = null
  let order: any = null
  if (tid) {
    for (const t of ORDER_TABLES) {
      const { data } = await supabase.from(t).select('*').eq('payment_key', tid).maybeSingle()
      if (data) { table = t; order = data; break }
    }
  }
  if (!order && oid) {
    for (const t of ORDER_TABLES) {
      const { data } = await supabase.from(t).select('*').eq('pg_oid', oid).maybeSingle()
      if (data) { table = t; order = data; break }
    }
  }
  if (!table || !order) { await stamp(`입금통보 주문 못찾음 tid=${tid} oid=${oid}`); return OK() }

  // 위변조 방지: 통보 금액이 주문 결제금액과 일치해야 함
  const orderAmount = Number(order.paid_amount || order.total_amount || 0)
  if (amount > 0 && orderAmount > 0 && amount !== orderAmount) {
    await stamp(`입금액 불일치 주문#${order.id} (통보 ${amount} ≠ 주문 ${orderAmount})`)
    return OK()
  }

  // 취소/실패 통보 → 주문 취소 (resultCode 0000 아님 또는 명시적 취소)
  const isCancel = /CANCEL|FAIL/.test(status) || (status && status !== '0000' && status !== 'DONE' && status !== 'PAID')
  if (isCancel) {
    await supabase.from(table).update({ status: '취소', updated_at: new Date().toISOString() }).eq('id', order.id)
    return OK()
  }

  // 중복 방지
  if (order.status === '입금완료' || order.status === '결제완료') return OK()

  // 가상계좌 자동확인 설정 — off면 신호만 기록, 주문은 관리자 수동처리
  const { data: autoChk } = await supabase.from('system_settings').select('value').eq('key', 'auto_deposit').maybeSingle()
  if (autoChk?.value === 'off') { await stamp(`입금신호 수신(수동모드) 주문#${order.id}`); return OK() }

  // 1) 입금완료 처리
  await supabase.from(table).update({ status: '입금완료', updated_at: new Date().toISOString() }).eq('id', order.id)
  await stamp(`입금완료 주문#${order.id}`)

  // 2) 증빙 자동발행 (auto_issue === 'on' + 팝빌 준비됨)
  const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'auto_issue').maybeSingle()
  if (setting?.value === 'on' && popbillReady()) {
    const tag = `${table} #${order.id}`
    try {
      const { data: invs } = await supabase.from('tax_invoices').select('*').ilike('note', `%${tag}%`).eq('status', '미발행')
      for (const inv of invs || []) {
        try {
          const { mgtKey } = await issueTaxinvoice(inv)
          await supabase.from('tax_invoices').update({ status: '발행완료', issued_at: new Date().toISOString(), invoice_number: mgtKey }).eq('id', inv.id)
        } catch (e) { console.error('[inicis/vbank-noti] 세금계산서 자동발행 실패', e) }
      }
      const { data: recs } = await supabase.from('cash_receipts').select('*').ilike('note', `%${tag}%`).eq('status', '미발행')
      for (const rec of recs || []) {
        try {
          const { mgtKey } = await issueCashbill(rec)
          await supabase.from('cash_receipts').update({ status: '발행완료', issued_at: new Date().toISOString(), receipt_number: mgtKey }).eq('id', rec.id)
        } catch (e) { console.error('[inicis/vbank-noti] 현금영수증 자동발행 실패', e) }
      }
    } catch (e) { console.error('[inicis/vbank-noti] 자동발행 처리 오류', e) }
  }

  return OK()
}
