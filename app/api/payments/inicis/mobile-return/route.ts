import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import {
  ORDER_TABLES, OrderTable,
  expectedPaymentAmount, markOrderPaid, spendOrderPoints, refundOrderPoints,
} from '@/lib/order-payment'
import { INICIS_MID, isInicisUrl } from '@/lib/inicis-server'

export const runtime = 'nodejs'

function siteOrigin(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  return `${proto}://${host}`
}

// KG이니시스 모바일 표준결제(mobile.inicis.com) 인증결과 수신 → 승인요청(P_REQ_URL) → 결제확정.
// PC용 return route와 규격이 완전히 달라(별도 필드) 분리한다.
export async function POST(req: NextRequest) {
  const base = siteOrigin(req)
  const fail = (code = 'FAIL') =>
    NextResponse.redirect(`${base}/shop/payment/fail?code=${encodeURIComponent(code)}`, 302)

  try {
    const form = await req.formData()
    const p = (k: string) => String(form.get(k) ?? '')
    const status = p('P_STATUS')
    const tid = p('P_TID')
    const reqUrl = p('P_REQ_URL')
    const noti = p('P_NOTI')
    const oid = p('P_OID')

    // 인증 실패/취소 (00=성공)
    if (status !== '00' || !tid || !reqUrl) {
      return fail(p('P_RMESG1') || 'AUTH_FAIL')
    }
    // 승인요청 URL 위변조 검증
    if (!isInicisUrl(reqUrl)) {
      console.error('[inicis/mobile-return] P_REQ_URL is not an inicis domain', reqUrl)
      return fail('BAD_REQURL')
    }

    const admin = createAdminSupabase()
    if (!admin) {
      console.error('[inicis/mobile-return] SUPABASE_SERVICE_ROLE_KEY missing')
      return fail('CONFIG')
    }

    // 주문 식별: P_NOTI(table|orderId) 우선, 없으면 pg_oid(P_OID)로 조회
    let table: OrderTable | null = null
    let orderId = ''
    const [ntTable, ntOrder] = noti.split('|')
    if (ORDER_TABLES.includes(ntTable as any) && ntOrder) {
      table = ntTable as OrderTable
      orderId = ntOrder
    }
    if (!table && oid) {
      for (const t of ORDER_TABLES) {
        const { data } = await admin.from(t).select('id').eq('pg_oid', oid).maybeSingle()
        if (data) { table = t; orderId = data.id; break }
      }
    }
    if (!table || !orderId) return fail('NO_ORDER')

    // ── 승인요청 (P_REQ_URL POST) ── 응답은 form-urlencoded(query string, P_CHARSET=utf8 지정)
    const approvalBody = new URLSearchParams({ P_MID: INICIS_MID, P_TID: tid, P_CHARSET: 'utf8' })
    const res = await fetch(reqUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: approvalBody.toString(),
    })
    const raw = await res.text()
    const r = new URLSearchParams(raw)
    const rStatus = r.get('P_STATUS') || ''
    if (rStatus !== '00') {
      console.error('[inicis/mobile-return] approval failed', { rStatus, rmesg: r.get('P_RMESG1') })
      return fail(r.get('P_RMESG1') || 'APPROVAL_FAIL')
    }

    // ── 서버측 결제금액 재검증 ──
    const expected = await expectedPaymentAmount(admin, table, orderId)
    const totPrice = Number(r.get('P_AMT') || 0)
    if (expected === null || totPrice !== expected) {
      console.error('[inicis/mobile-return] amount mismatch', { expected, totPrice, orderId, table })
      return fail('AMOUNT_MISMATCH')
    }

    const vactNum = r.get('P_VACT_NUM') || ''
    const isVbank = !!vactNum
    const approvedTid = r.get('P_TID') || tid

    // 포인트 차감 → 주문 결제완료/입금대기 반영 (공용 로직 재사용)
    const spend = await spendOrderPoints(admin, table, orderId)
    if (!spend.ok) return fail('POINT')

    const normalized = {
      method: isVbank ? '가상계좌' : '카드',
      status: isVbank ? 'WAITING_FOR_DEPOSIT' : 'DONE',
      virtualAccount: isVbank
        ? { accountNumber: vactNum, bankCode: r.get('P_VACT_BANK_CODE'), customerName: r.get('P_VACT_NAME'), dueDate: r.get('P_VACT_DATE') }
        : undefined,
      raw: Object.fromEntries(r.entries()),
    }
    const result = await markOrderPaid(admin, table, orderId, approvedTid, expected, normalized)
    if (!result.found || result.error) {
      if (spend.spent) await refundOrderPoints(admin, table, orderId, result.error || 'inicis(mobile) approved but order update failed')
      return fail('ORDER_UPDATE')
    }

    // 성공 → 결과 페이지로 (가상계좌 안내정보 쿼리 전달)
    const q = new URLSearchParams({ status: isVbank ? 'vbank' : 'paid', amount: String(expected), table, orderId })
    if (isVbank) {
      q.set('bank', String(r.get('P_VACT_BANK_CODE') || ''))
      q.set('account', String(vactNum))
      q.set('holder', String(r.get('P_VACT_NAME') || ''))
      q.set('due', String(r.get('P_VACT_DATE') || ''))
    }
    return NextResponse.redirect(`${base}/shop/payment/success?${q.toString()}`, 302)
  } catch (e) {
    console.error('[inicis/mobile-return] unexpected error', e)
    return fail('ERROR')
  }
}
