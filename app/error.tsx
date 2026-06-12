'use client'

import { useEffect } from 'react'
import { brand, gradient, surface } from '@/lib/theme'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // 운영 중 에러를 콘솔에 남김 (추후 Sentry 등 외부 모니터링 연동 지점)
    console.error('[onjongil] page error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: surface.light.bg, padding: 20, fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 76, marginBottom: 12 }}>🛠️</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: brand.green900, margin: '0 0 8px' }}>잠시 문제가 생겼어요</h1>
        <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
          일시적인 오류일 수 있어요.<br />아래 버튼으로 다시 시도해 주세요.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => reset()} style={{
            padding: '14px 28px', borderRadius: 100, border: 'none', cursor: 'pointer',
            background: gradient.greenBtn, color: '#fff', fontWeight: 800, fontSize: 15,
            fontFamily: 'inherit', boxShadow: '0 8px 22px rgba(22,163,74,0.3)',
          }}>🔄 다시 시도</button>
          <a href="/shop" style={{
            padding: '14px 28px', borderRadius: 100, cursor: 'pointer',
            background: '#fff', color: brand.green800, fontWeight: 800, fontSize: 15,
            textDecoration: 'none', border: `2px solid ${surface.light.border}`,
          }}>🛒 쇼핑몰로</a>
        </div>
      </div>
    </div>
  )
}
