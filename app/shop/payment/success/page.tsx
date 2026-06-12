'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function SuccessInner() {
  const sp = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading')
  const [msg, setMsg] = useState('결제를 확인하고 있어요...')
  const [amount, setAmount] = useState('')

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
          body: JSON.stringify({ paymentKey, orderId, amount: amt }),
        })
        const data = await res.json()
        if (!res.ok) { setState('fail'); setMsg(data.message || '결제 승인에 실패했습니다.'); return }
        // 주문 상태 업데이트 + 장바구니 비우기
        try {
          // paymentKey/승인금액 저장 → 나중에 관리자 환불(토스 결제취소)에 사용
          await supabase.from(table).update({ status: '결제완료', payment_key: paymentKey, paid_amount: Number(amt) }).eq('id', orderId)
          // 결제 완료된 주문의 상품 재고 차감
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
        setState('ok'); setMsg('결제가 완료되었습니다!')
      } catch {
        setState('fail'); setMsg('결제 확인 중 오류가 발생했습니다.')
      }
    })()
  }, [sp, supabase])

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f0fdf4', padding: 20, fontFamily: '-apple-system,sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '44px 32px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px -28px rgba(0,0,0,.2)' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', margin: '0 auto 18px', display: 'grid', placeItems: 'center',
          background: state === 'ok' ? 'linear-gradient(135deg,#34d399,#16a34a)' : state === 'fail' ? '#fee2e2' : '#f1f5f9', fontSize: 38 }}>
          {state === 'ok' ? '✅' : state === 'fail' ? '❌' : '⏳'}
        </div>
        <h2 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>{msg}</h2>
        {state === 'ok' && <p style={{ color: '#16a34a', fontWeight: 800, fontSize: 20, margin: '6px 0 0' }}>{amount}원 결제 완료</p>}
        {state !== 'loading' && (
          <button onClick={() => router.push('/shop')}
            style={{ marginTop: 26, width: '100%', padding: 15, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#34d399,#16a34a)', color: '#fff', fontWeight: 800, fontSize: 16 }}>
            쇼핑몰로 돌아가기
          </button>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccess() {
  return <Suspense fallback={null}><SuccessInner /></Suspense>
}
