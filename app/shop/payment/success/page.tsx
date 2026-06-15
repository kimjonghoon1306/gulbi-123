'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// 토스 은행코드 → 은행명 (가상계좌 안내용, 주요 은행)
const BANK: Record<string, string> = {
  '11':'농협','20':'우리','88':'신한','81':'하나','04':'국민','03':'기업',
  '23':'SC','27':'씨티','31':'대구','32':'부산','34':'광주','35':'제주','37':'전북','39':'경남',
  '45':'새마을','48':'신협','71':'우체국','89':'케이뱅크','90':'카카오뱅크','92':'토스뱅크',
}

type Vbank = { bank: string; account: string; due: string; holder: string }

function SuccessInner() {
  const sp = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const [state, setState] = useState<'loading' | 'ok' | 'vbank' | 'fail'>('loading')
  const [msg, setMsg] = useState('결제를 확인하고 있어요...')
  const [amount, setAmount] = useState('')
  const [vbank, setVbank] = useState<Vbank | null>(null)

  useEffect(() => {
    const paymentKey = sp.get('paymentKey')
    const orderId = sp.get('orderId')
    const amt = sp.get('amount')
    const table = sp.get('table') || 'general_orders'
    if (!paymentKey || !orderId || !amt) { setState('fail'); setMsg('결제 정보가 올바르지 않습니다.'); return }

    ;(async () => {
      try {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount: amt, table }),
        })
        const data = await res.json()
        if (!res.ok) { setState('fail'); setMsg(data.message || '결제 승인에 실패했습니다.'); return }

        // 가상계좌 = 입금대기 / 카드 = 결제완료
        const isWaiting = data.status === 'WAITING_FOR_DEPOSIT' || data.method === '가상계좌'
        const va = data.virtualAccount

        try {
          await supabase.from(table).update({
            status: isWaiting ? '입금대기' : '결제완료',
            payment_key: paymentKey,
            paid_amount: Number(amt),
          }).eq('id', orderId)

          // 재고 차감 (주문 확정 — 가상계좌는 발급 시점에 예약 차감)
          try {
            const itemTable = table === 'wholesale_orders' ? 'wholesale_order_items' : table === 'retail_orders' ? 'retail_order_items' : 'general_order_items'
            const { data: oi } = await supabase.from(itemTable).select('product_id, quantity').eq('order_id', orderId)
            if (oi && oi.length > 0) {
              await supabase.rpc('decrement_stock_bulk', { items: oi.map((x: any) => ({ id: x.product_id, qty: x.quantity })) })
            }
          } catch {}
          const { data: { user } } = await supabase.auth.getUser()
          if (user) await supabase.from('cart_items').delete().eq('user_id', user.id)
          localStorage.setItem('cart-updated', Date.now().toString())
        } catch {}

        setAmount(Number(amt).toLocaleString())
        if (isWaiting && va) {
          setVbank({
            bank: BANK[va.bankCode] ? `${BANK[va.bankCode]}은행` : (va.bank || '가상계좌'),
            account: va.accountNumber || '',
            due: va.dueDate ? new Date(va.dueDate).toLocaleString('ko-KR') : '',
            holder: va.customerName || '',
          })
          setState('vbank'); setMsg('가상계좌가 발급됐어요!')
        } else {
          setState('ok'); setMsg('결제가 완료되었습니다!')
        }
      } catch {
        setState('fail'); setMsg('결제 확인 중 오류가 발생했습니다.')
      }
    })()
  }, [sp, supabase])

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f0fdf4', padding: 20, fontFamily: '-apple-system,sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '44px 32px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px -28px rgba(0,0,0,.2)' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', margin: '0 auto 18px', display: 'grid', placeItems: 'center',
          background: state === 'ok' ? 'linear-gradient(135deg,#34d399,#16a34a)' : state === 'vbank' ? 'linear-gradient(135deg,#38bdf8,#0284c7)' : state === 'fail' ? '#fee2e2' : '#f1f5f9', fontSize: 38 }}>
          {state === 'ok' ? '✅' : state === 'vbank' ? '🏦' : state === 'fail' ? '❌' : '⏳'}
        </div>
        <h2 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>{msg}</h2>

        {state === 'ok' && <p style={{ color: '#16a34a', fontWeight: 800, fontSize: 20, margin: '6px 0 0' }}>{amount}원 결제 완료</p>}

        {state === 'vbank' && vbank && (
          <div style={{ marginTop: 18, textAlign: 'left', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 16, padding: '18px 20px' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#0369a1', fontWeight: 800 }}>아래 계좌로 입금해 주세요</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>은행</span><b style={{ fontSize: 14 }}>{vbank.bank}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>계좌번호</span><b style={{ fontSize: 15, color: '#0284c7' }}>{vbank.account}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>입금액</span><b style={{ fontSize: 15 }}>{amount}원</b>
            </div>
            {vbank.holder && <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>예금주</span><b style={{ fontSize: 14 }}>{vbank.holder}</b>
            </div>}
            {vbank.due && <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>입금기한</span><b style={{ fontSize: 13, color: '#ef4444' }}>{vbank.due}</b>
            </div>}
            <p style={{ margin: '10px 0 0', fontSize: 11.5, color: '#64748b', lineHeight: 1.5 }}>입금이 확인되면 주문이 자동으로 처리됩니다. 기한 내 미입금 시 주문이 취소돼요.</p>
          </div>
        )}

        {state !== 'loading' && (
          <button onClick={() => router.push(state === 'vbank' ? '/shop/mypage?tab=orders' : '/shop')}
            style={{ marginTop: 26, width: '100%', padding: 15, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#34d399,#16a34a)', color: '#fff', fontWeight: 800, fontSize: 16 }}>
            {state === 'vbank' ? '주문내역 보기' : '쇼핑몰로 돌아가기'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccess() {
  return <Suspense fallback={null}><SuccessInner /></Suspense>
}
