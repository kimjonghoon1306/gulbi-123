import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { ORDER_TABLES, OrderTable, expectedPaymentAmount, getOrderPointInfo } from '@/lib/order-payment'
import { INICIS_MID, INICIS_SIGN_KEY, sha256 } from '@/lib/inicis-server'

export const runtime = 'nodejs'

const PREFIX: Record<OrderTable, string> = { general_orders: 'G', retail_orders: 'R', wholesale_orders: 'W' }

function siteOrigin(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  return `${proto}://${host}`
}

export async function POST(req: NextRequest) {
  try {
    const { table, orderId, method, goodname, buyername, buyertel, buyeremail } = await req.json()
    if (!ORDER_TABLES.includes(table) || !orderId) {
      return NextResponse.json({ message: '결제 정보가 올바르지 않습니다.' }, { status: 400 })
    }

    const admin = createAdminSupabase()
    if (!admin) {
      console.error('[inicis/prepare] SUPABASE_SERVICE_ROLE_KEY missing')
      return NextResponse.json({ message: '결제 설정을 확인할 수 없습니다. 고객센터로 문의해 주세요.' }, { status: 500 })
    }

    // 로그인 사용자 본인 주문만 결제 준비
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
    }

    const order = await getOrderPointInfo(admin, table as OrderTable, String(orderId))
    if (!order) return NextResponse.json({ message: '주문 내역을 확인할 수 없습니다.' }, { status: 400 })
    if (String(order.user_id) !== user.id) {
      return NextResponse.json({ message: '본인 주문만 결제할 수 있습니다.' }, { status: 403 })
    }

    // 서버측 실가격 재계산(클라이언트 금액 신뢰 안 함)
    const expected = await expectedPaymentAmount(admin, table as OrderTable, String(orderId))
    if (expected === null || expected <= 0) {
      return NextResponse.json({ message: '결제 금액을 확인할 수 없습니다.' }, { status: 400 })
    }

    const price = String(expected)
    const timestamp = String(Date.now())
    // oid: 결제 시도별 고유값. 접두어(G/R/W)로 주문 테이블 구분. pg_oid에 저장해 인증결과/입금통보에서 주문 식별.
    const oid = `${PREFIX[table as OrderTable]}${Date.now()}${Math.random().toString(36).slice(2, 8)}`
    await admin.from(table).update({ pg_oid: oid }).eq('id', orderId)

    const signature = sha256(`oid=${oid}&price=${price}&timestamp=${timestamp}`)
    const verification = sha256(`oid=${oid}&price=${price}&signKey=${INICIS_SIGN_KEY}&timestamp=${timestamp}`)
    const mKey = sha256(INICIS_SIGN_KEY)
    const origin = siteOrigin(req)
    const gopaymethod = method === '가상계좌' ? 'VBank' : 'Card'

    const fields: Record<string, string> = {
      version: '1.0',
      mid: INICIS_MID,
      oid,
      price,
      timestamp,
      signature,
      verification,
      mKey,
      currency: 'WON',
      goodname: String(goodname || '온종일팜 주문').slice(0, 40),
      buyername: String(buyername || '고객').slice(0, 40),
      buyertel: String(buyertel || '').replace(/[^0-9]/g, ''),
      buyeremail: String(buyeremail || ''),
      gopaymethod,
      returnUrl: `${origin}/api/payments/inicis/return`,
      closeUrl: `${origin}/shop/payment/fail?closed=1`,
      acceptmethod: 'below1000:centerCd(Y)',
      merchantData: `${table}|${orderId}`,
      use_chkfake: 'Y',
    }
    return NextResponse.json({ fields })
  } catch (e) {
    console.error('[inicis/prepare] unexpected error', e)
    return NextResponse.json({ message: '결제 준비 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
