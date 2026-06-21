'use client'

import Link from 'next/link'
import { priceFor } from './_shopConstants'

// 쇼핑몰 메인 헤더(검색바 포함) — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  dark: boolean
  setDark: (v: boolean) => void
  scrolled: boolean
  headerBg: string
  border: string
  card: string
  inputBg: string
  text: string
  sub: string
  gtext: string
  cartCount: number
  visitorCount: number
  user: any
  memberType: string
  search: string
  setSearch: (v: string) => void
  searchFocus: boolean
  setSearchFocus: (v: boolean) => void
  suggestions: any[]
  recentSearches: string[]
  popularTerms: string[]
  saveRecent: (t: string) => void
  removeRecent: (t: string) => void
  setRecentSearches: (v: string[]) => void
  handleLogout: () => void
}

export function ShopHeader({ dark, setDark, scrolled, headerBg, border, card, inputBg, text, sub, gtext, cartCount, visitorCount, user, memberType, search, setSearch, searchFocus, setSearchFocus, suggestions, recentSearches, popularTerms, saveRecent, removeRecent, setRecentSearches, handleLogout }: Props) {
  const sq = search.trim().toLowerCase()
  const getPrice = (product: any) => priceFor(product, memberType)
  return (
      <header style={{
        background: headerBg, backdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${scrolled ? border : 'transparent'}`,
        position: 'sticky', top: 0, zIndex: 50,
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.08)' : 'none'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '68px' }}>

            {/* 로고 */}
            <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '14px',
                background: 'linear-gradient(135deg,#14532d,#15803d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', boxShadow: '0 6px 16px rgba(22,163,74,0.35)'
              }}>🧺</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 900, color: text, letterSpacing: '-0.5px', lineHeight: 1, margin: 0 }}>온종일팜</p>
                <p style={{ fontSize: '9px', color: gtext, letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1.5, margin: 0, fontWeight: 700 }}>FRESH FARM</p>
              </div>
            </Link>

            {/* 검색 */}
            <div style={{ flex: 1, maxWidth: '520px', margin: '0 auto' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="어떤 상품을 찾으세요?"
                  onKeyDown={e => { if (e.key === 'Enter' && search.trim()) { saveRecent(search); (e.target as HTMLInputElement).blur() } }}
                  style={{
                    width: '100%', background: inputBg,
                    border: `2px solid transparent`,
                    borderRadius: '14px', padding: '12px 16px 12px 46px',
                    fontSize: '14px', color: text, outline: 'none',
                    transition: 'all 0.2s', boxSizing: 'border-box',
                    fontWeight: 500
                  }}
                  onFocus={e => { setSearchFocus(true); e.target.style.borderColor = '#14532d'; e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.12)' }}
                  onBlur={e => { setTimeout(() => setSearchFocus(false), 180); e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="검색어 지우기"
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      width: '26px', height: '26px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', color: sub,
                      fontSize: '14px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>✕</button>
                )}

                {/* 검색 자동완성 드롭다운 */}
                {searchFocus && (suggestions.length > 0 || (!sq && (recentSearches.length > 0 || popularTerms.length > 0))) && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 100,
                    background: card, borderRadius: '16px', border: `1px solid ${border}`,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.18)', overflow: 'hidden', padding: '8px'
                  }}>
                    {/* 입력 중 → 상품 추천 */}
                    {sq && suggestions.map(p => (
                      <Link key={p.id} href={`/shop/product/${p.id}`} onMouseDown={() => saveRecent(p.name)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: text }}
                        className="search-sg">
                        <span style={{ fontSize: '15px' }}>🔍</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: gtext }}>{getPrice(p).toLocaleString()}원</span>
                      </Link>
                    ))}

                    {/* 입력 전 → 최근/인기 검색어 */}
                    {!sq && recentSearches.length > 0 && (
                      <div style={{ padding: '4px 4px 8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: sub }}>🕘 최근 검색어</span>
                          <button onMouseDown={() => { setRecentSearches([]); try { localStorage.removeItem('recent-searches') } catch {} }}
                            style={{ fontSize: '10px', color: sub, background: 'none', border: 'none', cursor: 'pointer' }}>전체삭제</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 8px' }}>
                          {recentSearches.map(t => (
                            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: inputBg, borderRadius: '100px', padding: '5px 10px' }}>
                              <button onMouseDown={() => { setSearch(t); saveRecent(t) }} style={{ fontSize: '12px', fontWeight: 600, color: text, background: 'none', border: 'none', cursor: 'pointer' }}>{t}</button>
                              <button onMouseDown={() => removeRecent(t)} style={{ fontSize: '11px', color: sub, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!sq && popularTerms.length > 0 && (
                      <div style={{ padding: '4px 4px 4px' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: sub, padding: '4px 8px' }}>🔥 인기 검색어</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 8px 4px' }}>
                          {popularTerms.map(t => (
                            <button key={t} onMouseDown={() => { setSearch(t); saveRecent(t) }}
                              style={{ fontSize: '12px', fontWeight: 700, color: gtext, background: dark ? 'rgba(74,222,128,0.12)' : 'rgba(22,163,74,0.08)', border: `1px solid ${dark ? 'rgba(74,222,128,0.25)' : 'rgba(22,163,74,0.2)'}`, borderRadius: '100px', padding: '5px 12px', cursor: 'pointer' }}>{t}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 우측 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* 방문자 */}
              {visitorCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: 'rgba(22,163,74,0.1)', borderRadius: '20px',
                  padding: '5px 12px', border: '1px solid rgba(22,163,74,0.2)'
                }}>
                  <span style={{ fontSize: '8px', color: '#22c55e' }}>●</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: gtext }}>{visitorCount}명 쇼핑중</span>
                </div>
              )}



              {/* PC에서만 보이는 로그인/회원등급 */}
              <div className="header-user-btns">
                {/* PC 토글 버튼 */}
                <button onClick={() => { const n = !dark; setDark(n); localStorage.setItem('shop-theme', n ? 'dark' : 'light'); window.dispatchEvent(new Event('shop-theme-change')) }}
                  style={{ width:'44px', height:'44px', borderRadius:'12px', border:'none', cursor:'pointer',
                    background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
                    fontSize:'22px', display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all 0.2s', flexShrink:0 }}>
                  {dark ? '☀️' : '🌙'}
                </button>
                {user ? (
                  <>
                    <Link href="/shop/cart" className="header-btn" style={{
                      position: 'relative', width: '40px', height: '40px', borderRadius: '12px',
                      background: 'transparent', border: `1.5px solid ${border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      textDecoration: 'none', fontSize: '18px', flexShrink: 0
                    }}>
                      🛒
                      {cartCount > 0 && (
                        <span style={{ position:'absolute', top:'-6px', right:'-6px', width:'18px', height:'18px', borderRadius:'50%', background:'#ec4899', color:'white', fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>
                          {cartCount > 9 ? '9+' : cartCount}
                        </span>
                      )}
                    </Link>
                    <Link href="/shop/mypage" className="header-btn header-mypage-btn" style={{
                      fontSize: '13px', fontWeight: 700, padding: '9px 16px',
                      borderRadius: '12px', background: 'transparent',
                      border: `1.5px solid ${border}`, color: text,
                      textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px'
                    }}>👤 마이페이지</Link>
                    <button onClick={handleLogout} className="header-btn header-logout-btn" style={{
                      fontSize: '13px', fontWeight: 600, padding: '9px 16px',
                      borderRadius: '12px', background: 'transparent',
                      border: `1.5px solid ${border}`, color: sub, cursor: 'pointer'
                    }}>로그아웃</button>
                  </>
                ) : (
                  <>
                    <Link href="/shop/login" className="header-btn" style={{
                      fontSize: '13px', fontWeight: 600, padding: '9px 16px',
                      borderRadius: '12px', background: 'transparent',
                      border: `1.5px solid ${border}`, color: text,
                      textDecoration: 'none'
                    }}>로그인</Link>
                    <Link href="/shop/register" className="header-btn" style={{
                      fontSize: '13px', fontWeight: 800, padding: '10px 20px',
                      borderRadius: '12px', background: 'linear-gradient(135deg,#14532d,#15803d)',
                      color: 'white', textDecoration: 'none',
                      boxShadow: '0 6px 20px rgba(22,163,74,0.35)'
                    }}>무료 가입 🎉</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
  )
}
