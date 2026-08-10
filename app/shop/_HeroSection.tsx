'use client'

import React from 'react'

// 쇼핑몰 메인 히어로(바다마을) 섹션 — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  bg: string
  border: string
  dark: boolean
  text: string
  sub: string
  gtext: string
  heroVisible: boolean
  visitorCount: number
  productCount: number
  statsReady: boolean
}

export function HeroSection({ bg, border, dark, text, sub, gtext, heroVisible, visitorCount, productCount, statsReady }: Props) {
  const stats = [
    { num: statsReady ? `${productCount}+` : '', label: '등록 상품' },
    { num: statsReady ? `${visitorCount}명` : '', label: '지금 쇼핑중' },
    { num: '신선', label: '포장 배송' },
  ]
  return (
      <section style={{
        background: dark ? '#0f1f16' : '#f5f8f5',
        borderBottom: `1px solid ${border}`,
        padding: '28px 20px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '24px', flexWrap: 'wrap',
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'none' : 'translateY(12px)',
          transition: 'all 0.6s ease',
        }}>
          {/* 왼쪽: 카피 */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'inline-block', fontSize: '12px', fontWeight: 600, color: gtext,
              border: `1px solid ${border}`, borderRadius: '6px', padding: '4px 11px',
              marginBottom: '12px', background: dark ? 'transparent' : '#fff',
            }}>산지에서 매일 직송</div>
            <h1 style={{
              fontSize: 'clamp(24px,3.2vw,38px)', fontWeight: 800,
              letterSpacing: '-1.2px', lineHeight: 1.2, margin: '0 0 8px', color: text,
              wordBreak: 'keep-all',
            }}>
              신선함이 다른 <span style={{ color: '#15803d' }}>농축수산물 직거래</span>
            </h1>
            <p style={{ fontSize: '15px', color: sub, margin: 0, lineHeight: 1.5, wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
              중간 유통 없이 산지에서 바로. 더 신선하게, 더 합리적으로.
            </p>
          </div>

          {/* 오른쪽: 통계 가로 */}
          <div className="hero-compact-stats" style={{ display: 'flex', gap: '28px', flexShrink: 0 }}>
            {stats.map(s => (
              <div key={s.label}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: text, margin: 0, letterSpacing: '-1px', minHeight: '26px' }}>{s.num}</p>
                <p style={{ fontSize: '12px', color: sub, margin: '2px 0 0', fontWeight: 500, whiteSpace: 'nowrap' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          @media (max-width: 639px) {
            .hero-compact-stats {
              width: 100%;
              justify-content: flex-start;
              padding-top: 2px;
            }
          }
        `}</style>
      </section>
  )
}
