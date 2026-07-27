import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import {
  ORDER_TABLES, OrderTable,
  expectedPaymentAmount, markOrderPaid, spendOrderPoints, refundOrderPoints,
} from '@/lib/order-payment'
import { INICIS_MID, INICIS_SIGN_KEY, sha256, isInicisUrl } from '@/lib/inicis-server'

export const runtime = 'nodejs'

function siteOrigin(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  return `${proto}://${host}`
}

// 이니시스는 결제창 인증 후 브라우저가 이 URL로 form POST → 서버가 다시 승인요청을 보내야 최종 결제 확정.
export async function POST(req: NextRequest) {
  const base = siteOrigin(req)
  const fail = (code = 'FAIL') =>
    NextResponse.redirect(`${base}/shop/payment/fail?code=${encodeURIComponent(code)}`, 302)

  try {
    const form = await req.formData()
    const p = (k: string) => String(form.get(k) ?? '')
    const resultCode = p('resultCode')
    const authToken = p('authToken')
    const authUrl = p('authUrl')
    const merchantData = p('merchantData')
    const oid = p('orderNumber') || p('oid')

    // 인증 실패/취소
    if (resultCode !== '0000' || !authToken || !authUrl) {
      return fail(p('resultMsg') || 'AUTH_FAIL')
    }
    // 승인요청 URL 위변조 검증
    if (!isInicisUrl(authUrl)) {
      console.error('[inicis/return] authUrl is not an inicis domain', authUrl)
      return fail('BAD_AUTHURL')
    }

    const admin = createAdminSupabase()
    if (!admin) {
      console.error('[inicis/return] SUPABASE_SERVICE_ROLE_KEY missing')
      return fail('CONFIG')
    }

    // 주문 식별: merchantData(table|orderId) 우선, 없으면 pg_oid로 조회
    let table: OrderTable | null = null
    let orderId = ''
    const [mdTable, mdOrder] = merchantData.split('|')
    if (ORDER_TABLES.includes(mdTable as any) && mdOrder) {
      table = mdTable as OrderTable
      orderId = mdOrder
    }
    if (!table && oid) {
      for (const t of ORDER_TABLES) {
        const { data } = await admin.from(t).select('id').eq('pg_oid', oid).maybeSingle()
        if (data) { table = t; orderId = data.id; break }
      }
    }
    if (!table || !orderId) return fail('NO_ORDER')

    // ── 승인요청 (authUrl POST) ──
    const timestamp = String(Date.now())
    const signature = sha256(`authToken=${authToken}&timestamp=${timestamp}`)
    const verification = sha256(`authToken=${authToken}&signKey=${INICIS_SIGN_KEY}&timestamp=${timestamp}`)
    const approvalBody = new URLSearchParams({
      mid: INICIS_MID,
      authToken,
      timestamp,
      signature,
      verification,
      charset: 'UTF-8',
      format: 'JSON',
    })
    const res = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: approvalBody.toString(),
    })
    const data: any = await res.json().catch(() => ({}))
    if (data.resultCode !== '0000') {
      console.error('[inicis/return] approval failed', { resultCode: data.resultCode, resultMsg: data.resultMsg })
      return fail(data.resultMsg || 'APPROVAL_FAIL')
    }

    // ── 서버측 결제금액 재검증 ──
    const expected = await expectedPaymentAmount(admin, table, orderId)
    const totPrice = Number(data.TotPrice || data.price || 0)
    if (expected === null || totPrice !== expected) {
      console.error('[inicis/return] amount mismatch', { expected, totPrice, orderId, table })
      return fail('AMOUNT_MISMATCH')
    }

    const payMethod = String(data.payMethod || '')
    const isVbank = /vbank|vb/i.test(payMethod) || !!data.VACT_Num
    const tid = String(data.tid || '')

    // 포인트 차감 → 주문 결제완료/입금대기 반영 (기존 공용 로직 재사용)
    const spend = await spendOrderPoints(admin, table, orderId)
    if (!spend.ok) return fail('POINT')

    const normalized = {
      method: isVbank ? '가상계좌' : '카드',
      status: isVbank ? 'WAITING_FOR_DEPOSIT' : 'DONE',
      virtualAccount: isVbank
        ? { accountNumber: data.VACT_Num, bankCode: data.VACT_BankCode, customerName: data.VACT_Name, dueDate: data.VACT_Date }
        : undefined,
      raw: data,
    }
    const result = await markOrderPaid(admin, table, orderId, tid, expected, normalized)
    if (!result.found || result.error) {
      if (spend.spent) await refundOrderPoints(admin, table, orderId, result.error || 'inicis approved but order update failed')
      return fail('ORDER_UPDATE')
    }

    // 성공 → 결과 페이지로 리다이렉트 (가상계좌 안내정보 쿼리 전달)
    const q = new URLSearchParams({ status: isVbank ? 'vbank' : 'paid', amount: String(expected), table, orderId })
    if (isVbank) {
      q.set('bank', String(data.vactBankName || data.VACT_BankCode || ''))
      q.set('account', String(data.VACT_Num || ''))
      q.set('holder', String(data.VACT_Name || ''))
      q.set('due', String(data.VACT_Date || ''))
    }
    return NextResponse.redirect(`${base}/shop/payment/success?${q.toString()}`, 302)
  } catch (e) {
    console.error('[inicis/return] unexpected error', e)
    return fail('ERROR')
  }
}
