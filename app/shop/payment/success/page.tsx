'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// 이니시스 가상계좌 은행명은 승인응답 vactBankName 을 그대로 전달받아 표시한다(코드→이름 매핑 불필요).
// yyyyMMdd(HHmmss) 형식의 입금기한을 사람이 읽기 쉬운 형태로 변환
function formatDue(raw: string): string {
  if (!raw) return ''
  const d = raw.replace(/[^0-9]/g, '')
  if (d.length < 8) return raw
  const y = d.slice(0, 4), mo = d.slice(4, 6), da = d.slice(6, 8)
  const hh = d.slice(8, 10), mm = d.slice(10, 12)
  return `${y}.${mo}.${da}` + (hh ? ` ${hh}:${mm || '00'}` : '')
}

function SuccessInner() {
  const sp = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)

  const status = sp.get('status') || 'paid'   // 'paid'(카드/결제완료) | 'vbank'(가상계좌 발급)
  const isVbank = status === 'vbank'
  const amount = Number(sp.get('amount') || 0).toLocaleString()
  const table = sp.get('table') || 'general_orders'
  const orderId = sp.get('orderId') || ''
  const vbank = {
    bank: sp.get('bank') || '가상계좌',
    account: sp.get('account') || '',
    holder: sp.get('holder') || '',
    due: formatDue(sp.get('due') || ''),
  }
  const msg = isVbank ? '가상계좌가 발급됐어요!' : '결제가 완료되었습니다!'

  // 결제 성공 → 장바구니 비우기 + 온파트너 전환추적 (결제 확정은 서버 /return 에서 이미 처리됨)
  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) await supabase.from('cart_items').delete().eq('user_id', user.id)
        localStorage.setItem('cart-updated', Date.now().toString())
      } catch {}
      if (!isVbank && orderId) {
        try {
          ;(window as any).Partnering?.track({
            orderId,
            amount: Number(sp.get('amount') || 0),
            orderType: table.replace('_orders', ''),
          })
        } catch {}
      }
      setReady(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f0fdf4', padding: 20, fontFamily: '-apple-system,sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '44px 32px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px -28px rgba(0,0,0,.2)' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', margin: '0 auto 18px', display: 'grid', placeItems: 'center',
          background: isVbank ? 'linear-gradient(135deg,#38bdf8,#0284c7)' : 'linear-gradient(135deg,#34d399,#16a34a)', fontSize: 38 }}>
          {isVbank ? '🏦' : '✅'}
        </div>
        <h2 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>{msg}</h2>

        {!isVbank && <p style={{ color: '#16a34a', fontWeight: 800, fontSize: 20, margin: '6px 0 0' }}>{amount}원 결제 완료</p>}

        {isVbank && (
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

        <button onClick={() => router.push(isVbank ? '/shop/mypage?tab=orders' : '/shop')} disabled={!ready}
          style={{ marginTop: 26, width: '100%', padding: 15, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#34d399,#16a34a)', color: '#fff', fontWeight: 800, fontSize: 16, opacity: ready ? 1 : 0.7 }}>
          {isVbank ? '주문내역 보기' : '쇼핑몰로 돌아가기'}
        </button>
      </div>
    </div>
  )
}

export default function PaymentSuccess() {
  return <Suspense fallback={null}><SuccessInner /></Suspense>
}
