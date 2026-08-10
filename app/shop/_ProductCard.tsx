'use client'

import Link from 'next/link'
import type { Product } from './_shopConstants'
import { weightLabel } from './_shopConstants'

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
        border: `1px solid ${border}`,
        borderRadius: '12px', overflow: 'hidden',
        transition: 'all 0.2s ease',
        animation: 'fadeInUp 0.4s ease both',
        animationDelay: `${i * 0.04}s`,
        cursor: 'pointer'
      }}>
        {/* 이미지 */}
        <div style={{
          aspectRatio: '4/3', position: 'relative', overflow: 'hidden',
          background: dark ? '#1a2e20' : '#f4f4f4'
        }}>
          {p.image_url ? (
            <img src={p.image_url} alt={p.name}
              loading={i < 8 ? 'eager' : 'lazy'}
              fetchPriority={i < 4 ? 'high' : 'auto'}
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
              className="product-img" />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', color: sub
            }}>
              이미지 준비중
            </div>
          )}

          {/* 품절 오버레이 */}
          {p.stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                background: 'rgba(0,0,0,0.72)', color: 'white',
                fontSize: '13px', fontWeight: 600,
                padding: '7px 18px', borderRadius: '8px',
              }}>품절</span>
            </div>
          )}

          {/* 뱃지들 */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
            {p.stock > 0 && p.stock < 10 && (
              <span style={{
                background: '#dc2626', color: 'white', fontSize: '11px', fontWeight: 600,
                padding: '3px 9px', borderRadius: '6px',
              }}>품절임박</span>
            )}
            {i < 3 && p.stock > 0 && (
              <span style={{
                background: sortBy === '최신순' ? '#14532d' : '#b45309',
                color: 'white', fontSize: '11px', fontWeight: 600,
                padding: '3px 9px', borderRadius: '6px',
              }}>{sortBy === '최신순' ? 'NEW' : '인기'}</span>
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
                ★ {rating.toFixed(1)}
              </span>
              <span style={{ fontSize: '12px', color: sub, fontWeight: 600 }}>후기 {reviewCount}개</span>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: sub, fontWeight: 500, marginBottom: '8px', opacity: 0.7 }}>아직 후기 없음</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <p className="pc-unit" style={{ fontSize: '12px', color: sub, margin: 0, fontWeight: 500 }}>{p.unit} 단위</p>
            {weightLabel(p) && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: gtext, border: `1px solid ${border}`, padding: '2px 7px', borderRadius: '6px' }}>중량 {weightLabel(p)}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <p className="pc-price" style={{
                fontSize: '21px', fontWeight: 800, color: text,
                letterSpacing: '-0.5px', margin: 0
              }}>{price.toLocaleString()}<span style={{ fontSize: '14px', fontWeight: 600, marginLeft: '1px' }}>원</span></p>
              {memberType === '도매업' && (
                <p style={{ fontSize: '11px', color: sub, margin: '2px 0 0', textDecoration: 'line-through' }}>
                  일반 {p.retail_price.toLocaleString()}원
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
