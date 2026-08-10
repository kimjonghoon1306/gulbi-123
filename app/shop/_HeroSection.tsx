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
}

export function HeroSection({ bg, border, dark, text, sub, gtext, heroVisible, visitorCount, productCount }: Props) {
  const stats = [
    { num: `${productCount}+`, label: '등록 상품' },
    { num: `${visitorCount}명`, label: '지금 쇼핑중' },
    { num: '당일', label: '신선 배송' },
  ]
  return (
      <section style={{
        background: dark ? '#0f1f16' : '#f5f8f5',
        borderBottom: `1px solid ${border}`,
        padding: '56px 20px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'none' : 'translateY(16px)',
          transition: 'all 0.6s ease',
        }}>
          <div style={{
            display: 'inline-block', fontSize: '12px', fontWeight: 600, color: gtext,
            border: `1px solid ${border}`, borderRadius: '6px', padding: '5px 12px',
            marginBottom: '18px', background: dark ? 'transparent' : '#fff',
          }}>산지에서 매일 직송</div>
          <h1 style={{
            fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800,
            letterSpacing: '-1.5px', lineHeight: 1.15, margin: '0 0 14px', color: text,
          }}>
            신선함이 다른<br />
            <span style={{ color: '#15803d' }}>농축수산물 직거래</span>
          </h1>
          <p style={{ fontSize: '16px', color: sub, margin: '0 0 30px', lineHeight: 1.6, wordBreak: 'keep-all', overflowWrap: 'break-word', maxWidth: '520px' }}>
            중간 유통 없이 산지에서 바로. 더 신선하게, 더 합리적으로.
          </p>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label}>
                <p style={{ fontSize: '24px', fontWeight: 800, color: text, margin: 0, letterSpacing: '-1px' }}>{s.num}</p>
                <p style={{ fontSize: '12px', color: sub, margin: '2px 0 0', fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
  )
}
