'use client'

import Link from 'next/link'
import type { Product } from './_shopConstants'

// 쇼핑몰 메인 상품 그리드의 카드 한 장 (page.tsx에서 분리 — 동작/디자인 동일)
type Props = {
  p: Product
  i: number
  dark: boolean
  card: string
  border: string
  text: string
  sub: string
  gtext: string
  memberType: string
  sortBy: string
  catIcon: string
  price: number
  rating: number
  reviewCount: number
}

export function ProductCard({ p, i, dark, card, border, text, sub, gtext, memberType, sortBy, catIcon, price, rating, reviewCount }: Props) {
  return (
    <Link href={`/shop/product/${p.id}`} style={{ textDecoration: 'none' }}>
      <div className="product-card" style={{
        background: card,
        border: `1.5px solid ${border}`,
        borderRadius: '24px', overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        animation: 'fadeInUp 0.5s ease both',
        animationDelay: `${i * 0.06}s`,
        cursor: 'pointer'
      }}>
        {/* 이미지 */}
        <div style={{
          aspectRatio: '4/3', position: 'relative', overflow: 'hidden',
          background: dark ? '#15391f' : 'linear-gradient(135deg,#e8f8f5,#dff4f8)'
        }}>
          {p.image_url ? (
            <img src={p.image_url} alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
              className="product-img" />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '72px', animation: 'floatItem 3s ease-in-out infinite',
              animationDelay: `${i * 0.3}s`
            }}>
              {catIcon}
            </div>
          )}

          {/* 품절 오버레이 */}
          {p.stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(2px)'
            }}>
              <span style={{
                background: 'rgba(0,0,0,0.75)', color: 'white',
                fontSize: '14px', fontWeight: 800,
                padding: '8px 20px', borderRadius: '100px',
                border: '2px solid rgba(255,255,255,0.2)'
              }}>품절 😢</span>
            </div>
          )}

          {/* 뱃지들 */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
            {p.stock > 0 && p.stock < 10 && (
              <span style={{
                background: 'linear-gradient(135deg,#ef4444,#f97316)',
                color: 'white', fontSize: '10px', fontWeight: 800,
                padding: '4px 10px', borderRadius: '100px',
                boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
              }}>🔥 소량</span>
            )}
            {i < 3 && p.stock > 0 && (
              <span style={{
                background: sortBy === '최신순'
                  ? 'linear-gradient(135deg,#14532d,#15803d)'
                  : 'linear-gradient(135deg,#d97706,#f59e0b)',
                color: 'white', fontSize: '10px', fontWeight: 800,
                padding: '4px 10px', borderRadius: '100px',
                boxShadow: sortBy === '최신순' ? '0 4px 12px rgba(22,163,74,0.4)' : '0 4px 12px rgba(245,158,11,0.45)'
              }}>{sortBy === '최신순' ? '✨ NEW' : '👑 인기'}</span>
            )}
          </div>
        </div>

        {/* 정보 */}
        <div className="pc-info" style={{ padding: '18px' }}>
          <p className="pc-name" style={{ fontSize: '15px', fontWeight: 800, color: text, marginBottom: '4px', lineHeight: 1.3 }}>{p.name}</p>
          {/* ⭐ 별점 + 후기수 (베이지안 랭킹 기준 노출) */}
          {reviewCount > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
              <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                ⭐ {rating.toFixed(1)}
              </span>
              <span style={{ fontSize: '12px', color: sub, fontWeight: 600 }}>후기 {reviewCount}개</span>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: sub, fontWeight: 500, marginBottom: '8px', opacity: 0.7 }}>아직 후기 없음</div>
          )}
          <p className="pc-unit" style={{ fontSize: '12px', color: sub, marginBottom: '14px', fontWeight: 500 }}>{p.unit} 단위</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="pc-price" style={{
                fontSize: '22px', fontWeight: 900, color: gtext,
                letterSpacing: '-1px', margin: 0
              }}>{price.toLocaleString()}원</p>
              {memberType === '도매업' && (
                <p style={{ fontSize: '11px', color: sub, margin: '2px 0 0', textDecoration: 'line-through' }}>
                  일반 {p.retail_price.toLocaleString()}원
                </p>
              )}
            </div>
            <div className="pc-arrow" style={{
              width: '40px', height: '40px', borderRadius: '14px',
              background: 'linear-gradient(135deg,#14532d,#15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', boxShadow: '0 6px 16px rgba(22,163,74,0.35)',
              transition: 'all 0.2s', flexShrink: 0
            }}>→</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
