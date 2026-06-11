'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function FailInner() {
  const sp = useSearchParams()
  const router = useRouter()
  const message = sp.get('message') || '결제가 취소되었거나 실패했습니다.'
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fef2f2', padding: 20, fontFamily: '-apple-system,sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '44px 32px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px -28px rgba(0,0,0,.2)' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', margin: '0 auto 18px', display: 'grid', placeItems: 'center', background: '#fee2e2', fontSize: 38 }}>❌</div>
        <h2 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>결제에 실패했어요</h2>
        <p style={{ color: '#64748b', fontWeight: 500, margin: 0, fontSize: 15 }}>{message}</p>
        <button onClick={() => router.push('/shop/cart')}
          style={{ marginTop: 26, width: '100%', padding: 15, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: 16 }}>
          장바구니로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default function PaymentFail() {
  return <Suspense fallback={null}><FailInner /></Suspense>
}
