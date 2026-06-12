'use client'

import { useEffect } from 'react'

// 루트 레이아웃에서 에러가 났을 때 (자체 html/body 필요)
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[onjongil] global error:', error) }, [error])

  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f0faf9', padding: 20 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: 76, marginBottom: 12 }}>🛠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#14532d', margin: '0 0 8px' }}>잠시 문제가 생겼어요</h1>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
              일시적인 오류일 수 있어요. 다시 시도해 주세요.
            </p>
            <button onClick={() => reset()} style={{
              padding: '14px 28px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', fontWeight: 800, fontSize: 15,
              fontFamily: 'inherit', boxShadow: '0 8px 22px rgba(22,163,74,0.3)',
            }}>🔄 다시 시도</button>
          </div>
        </div>
      </body>
    </html>
  )
}
