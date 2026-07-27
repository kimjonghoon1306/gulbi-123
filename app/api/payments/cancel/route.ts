import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireAdminUser } from '@/lib/supabase-server'
import { INICIS_MID } from '@/lib/inicis-server'

export const runtime = 'nodejs'

const ORDER_TABLES = ['general_orders', 'retail_orders', 'wholesale_orders'] as const

// 이니시스 결제취소(환불)는 별도 서비스인 INIAPI 키가 필요하다(상점관리자에서 발급).
//   INICIS_API_KEY  INIAPI 발급 key (server-only)
// ⚠️ 아래 취소요청/해시 규격은 이니시스 INIAPI 명세 기준으로 작성했으나, 실제 키로 1회 검증 후 운영 권장.
const INICIS_API_KEY = process.env.INICIS_API_KEY || ''
const REFUND_URL = 'https://iniapi.inicis.com/api/v1/refund'

async function findOrderByPaymentKey(supabase: any, tid: string) {
  for (const table of ORDER_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('id, payment_key, payment_method, status, total_amount, paid_amount')
      .eq('payment_key', tid)
      .maybeSingle()
    if (error) throw error
    if (data) return { table, order: data }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) {
      console.error('[payments/cancel] auth failed', auth.error)
      return NextResponse.json({ message: '관리자 권한을 확인할 수 없습니다. 다시 로그인해 주세요.' }, { status: auth.status })
    }

    // paymentKey = 이니시스 승인 tid (기존 인터페이스 유지)
    const { paymentKey, cancelReason } = await req.json()
    if (!paymentKey || !cancelReason) {
      return NextResponse.json({ message: 'tid와 취소사유는 필수입니다.' }, { status: 400 })
    }

    const found = await findOrderByPaymentKey(auth.supabase, String(paymentKey))
    if (!found) {
      return NextResponse.json({ message: '해당 거래번호의 주문을 찾을 수 없습니다.' }, { status: 404 })
    }
    const { table, order } = found
    if (!(order.payment_method || '').includes('카드')) {
      return NextResponse.json({ message: '카드결제 주문만 자동 취소할 수 있습니다.' }, { status: 400 })
    }
    if (order.status === '환불') {
      return NextResponse.json({ message: '이미 환불 처리된 주문입니다.' }, { status: 409 })
    }

    if (!INICIS_API_KEY) {
      // 자동취소 키 미설정 → 돈이 실제로 환불되지 않으므로 상태를 바꾸지 않고 수동취소 안내
      return NextResponse.json(
        { message: '이니시스 자동환불(INIAPI) 키가 설정되지 않았습니다. 이니시스 상점관리자에서 직접 취소해 주세요.' },
        { status: 501 }
      )
    }

    // ── INIAPI 환불 요청 ──
    const type = 'Refund'
    const paymethod = 'Card'
    const timestamp = String(Date.now())
    const clientIp = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '0.0.0.0'
    const data = { tid: String(paymentKey), msg: String(cancelReason) }
    // hashData = SHA512(key + mid + type + timestamp + clientIp + data(JSON))
    const hashData = crypto.createHash('sha512')
      .update(INICIS_API_KEY + INICIS_MID + type + timestamp + clientIp + JSON.stringify(data), 'utf8')
      .digest('hex')

    const res = await fetch(REFUND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mid: INICIS_MID, type, paymethod, timestamp, clientIp, data, hashData }),
    })
    const resData: any = await res.json().catch(() => ({}))
    if (res.ok && (resData.resultCode === '00' || resData.resultCode === '0000')) {
      await auth.supabase
        .from(table)
        .update({ status: '환불', updated_at: new Date().toISOString() })
        .eq('id', order.id)
      return NextResponse.json(resData, { status: 200 })
    }
    console.error('[payments/cancel] inicis refund failed', { status: res.status, resData })
    return NextResponse.json(
      { message: resData.resultMsg || '이니시스 환불 처리에 실패했습니다. 상점관리자에서 직접 취소해 주세요.' },
      { status: 502 }
    )
  } catch (e: any) {
    console.error('[payments/cancel] unexpected error', e)
    return NextResponse.json({ message: '환불 처리 중 오류가 발생했습니다. 서버 로그를 확인해 주세요.' }, { status: 500 })
  }
}
