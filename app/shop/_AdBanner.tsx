'use client'

import React from 'react'

// 쇼핑몰 메인 광고 배너 슬라이더 (여러 업체 자동 순환) — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  banners: any[]
  bannerIdx: number
  setBannerIdx: (i: number) => void
  dark: boolean
}

export function AdBanner({ banners, bannerIdx, setBannerIdx, dark }: Props) {
  // 활성(켜짐+기간내) 광고가 하나도 없으면 섹션 전체를 숨김 (이미지·배지 모두 사라짐)
  if (banners.length === 0) return null
  return (
    <section style={{ background: dark ? '#0a1c13' : '#f0faf9', padding: '30px 20px 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px', color: '#ec4899', background: 'rgba(236,72,153,0.08)', border: '1.5px solid #ec4899', borderRadius: '100px', padding: '5px 13px' }}>
            <span className="ad-live-dot" style={{ fontSize: '9px', lineHeight: 1 }}>●</span> AD 추천 광고중
          </span>
        </div>
        <div className="ad-banner-box" style={{
          position: 'relative', borderRadius: '24px', overflow: 'hidden',
          boxShadow: dark ? '0 24px 55px rgba(0,0,0,0.55)' : '0 18px 45px rgba(22,163,74,0.16)',
          background: dark ? '#102a1d' : '#fff'
        }}>
          {banners.map((b, i) => {
            const active = i === (bannerIdx % banners.length)
            const href = b.product_id ? `/shop/product/${b.product_id}` : (b.link_url || null)
            const hasText = b.title || b.subtitle || b.tag
            const content = (
              <>
                <img src={b.image_url} alt={b.title || '광고'} className="ad-banner-img"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }} />
                {hasText && (
                  <div className="ad-banner-overlay" style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.34) 42%, rgba(0,0,0,0) 72%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    padding: 'clamp(20px,4vw,48px)', gap: '10px'
                  }}>
                    {b.tag && (
                      <span style={{
                        alignSelf: 'flex-start', fontSize: 'clamp(10px,1.3vw,12px)', fontWeight: 800,
                        letterSpacing: '1.5px', color: '#fff', textTransform: 'uppercase',
                        background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(6px)', padding: '5px 13px', borderRadius: '100px'
                      }}>{b.tag}</span>
                    )}
                    {b.title && (
                      <p style={{
                        margin: 0, color: '#fff', fontSize: 'clamp(20px,3.6vw,38px)', fontWeight: 900,
                        letterSpacing: '-1px', lineHeight: 1.12, maxWidth: '620px',
                        textShadow: '0 3px 18px rgba(0,0,0,0.5)'
                      }}>{b.title}</p>
                    )}
                    {b.subtitle && (
                      <p style={{
                        margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: 'clamp(13px,1.9vw,18px)',
                        fontWeight: 600, lineHeight: 1.5, maxWidth: '540px',
                        textShadow: '0 2px 10px rgba(0,0,0,0.45)'
                      }}>{b.subtitle}</p>
                    )}
                    {href && (
                      <span className="ad-banner-cta" style={{
                        alignSelf: 'flex-start', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '7px',
                        fontSize: 'clamp(13px,1.6vw,15px)', fontWeight: 800, color: '#15803d',
                        background: '#fff', padding: '11px 22px', borderRadius: '100px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.28)', transition: 'all 0.25s ease'
                      }}>{b.cta_label || '자세히 보기'} <span style={{ fontSize: '1.1em' }}>→</span></span>
                    )}
                  </div>
                )}
              </>
            )
            const slideStyle: React.CSSProperties = {
              position: 'absolute', inset: 0, opacity: active ? 1 : 0,
              transition: 'opacity 0.7s ease', pointerEvents: active ? 'auto' : 'none',
              textDecoration: 'none', display: 'block'
            }
            return href ? (
              <a key={b.id} href={href} style={slideStyle}>{content}</a>
            ) : (
              <div key={b.id} style={slideStyle}>{content}</div>
            )
          })}
        </div>
        {/* 슬라이드 점 (여러 광고일 때만) */}
        {banners.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
            {banners.map((_, i) => {
              const on = i === (bannerIdx % banners.length)
              return (
                <button key={i} onClick={() => setBannerIdx(i)} aria-label={`광고 ${i + 1}`}
                  style={{
                    width: on ? '26px' : '8px', height: '8px', borderRadius: '100px',
                    border: 'none', cursor: 'pointer', padding: 0,
                    background: on ? 'linear-gradient(135deg,#14532d,#15803d)' : (dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'),
                    transition: 'all 0.3s ease'
                  }} />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
