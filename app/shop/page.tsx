'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { CAT_ICONS, CAT_COLORS, getDefaultCatColor, POPUP_NAMES, POPUP_ACTIONS, type Product, type Category } from './_shopConstants'
import { ProductCard } from './_ProductCard'

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [reviewStats, setReviewStats] = useState<Record<string, { sum: number; count: number }>>({})
  const [sortBy, setSortBy] = useState<'추천순' | '평점순' | '최신순'>('추천순')
  const [banners, setBanners] = useState<any[]>([])
  const [bannerIdx, setBannerIdx] = useState(0)
  const bannerTimer = useRef<any>(null)
  const PAGE_SIZE = 24
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedCat, setSelectedCat] = useState('전체')
  const [search, setSearch] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [memberType, setMemberType] = useState('일반')
  const [dark, setDark] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [popup, setPopup] = useState<{ show: boolean; name: string; action: string; product: string }>({ show: false, name: '', action: '', product: '' })
  const [visitorCount, setVisitorCount] = useState(0)
  const [heroVisible, setHeroVisible] = useState(false)
  const [gulbiStep, setGulbiStep] = useState(0)
  const gulbiTimer = useRef<any>(null)
  const popupTimer = useRef<any>(null)
  const supabase = createClient()

  // 최근 검색어 (localStorage)
  const saveRecent = (term: string) => {
    const t = term.trim()
    if (!t) return
    setRecentSearches(prev => {
      const next = [t, ...prev.filter(x => x !== t)].slice(0, 8)
      try { localStorage.setItem('recent-searches', JSON.stringify(next)) } catch {}
      return next
    })
  }
  const removeRecent = (term: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(x => x !== term)
      try { localStorage.setItem('recent-searches', JSON.stringify(next)) } catch {}
      return next
    })
  }

  // 입력 중 상품명 추천 (상위 6개)
  const sq = search.trim().toLowerCase()
  const suggestions = sq
    ? products.filter(p => p.name.toLowerCase().includes(sq)).slice(0, 6)
    : []
  // 인기 검색어 = 등록 상품명 앞부분(간이) 최대 6개
  const popularTerms = Array.from(new Set(products.map(p => p.name.split(' ')[0]).filter(Boolean))).slice(0, 6)

  const fetchData = async () => {
    setLoading(true)
    const [{ data: p }, { data: c }, { data: rv }, { data: bn }] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('reviews').select('product_id, rating'),
      supabase.from('ad_banners').select('*').eq('is_active', true).order('sort_order')
    ])
    setProducts(p || [])
    setCategories(c || [])
    // 광고 배너: 시작/종료 일시 기준 현재 노출 가능한 것만 슬라이더에 (여러 업체 동시 순환)
    const now = Date.now()
    const liveBanners = (bn || []).filter((b: any) => {
      const s = b.starts_at ? new Date(b.starts_at).getTime() : -Infinity
      const e = b.ends_at ? new Date(b.ends_at).getTime() : Infinity
      return now >= s && now <= e
    })
    setBanners(liveBanners)
    setBannerIdx(0)
    // 리뷰 통계 집계 (상품별 별점합/개수) → 베이지안 상위노출 랭킹에 사용
    const stats: Record<string, { sum: number; count: number }> = {}
    for (const r of (rv || []) as any[]) {
      if (!r.product_id) continue
      const s = stats[r.product_id] || { sum: 0, count: 0 }
      s.sum += r.rating || 0
      s.count += 1
      stats[r.product_id] = s
    }
    setReviewStats(stats)
    setLoading(false)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data: member } = await supabase.from('shop_members').select('member_type').eq('id', user.id).single()
      if (member) setMemberType(member.member_type)
      const { count } = await supabase.from('cart_items').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setCartCount(count || 0)
    }
  }

  const startPopupCycle = () => {
    if (popupTimer.current) clearTimeout(popupTimer.current)
    const show = () => {
      setProducts(cur => {
        if (cur.length === 0) return cur
        const randomProduct = cur[Math.floor(Math.random() * cur.length)]
        const name = POPUP_NAMES[Math.floor(Math.random() * POPUP_NAMES.length)]
        const action = POPUP_ACTIONS[Math.floor(Math.random() * POPUP_ACTIONS.length)]
        setPopup({ show: true, name, action, product: randomProduct.name })
        popupTimer.current = setTimeout(() => {
          setPopup(p => ({ ...p, show: false }))
          popupTimer.current = setTimeout(show, 15000)
        }, 4000)
        return cur
      })
    }
    popupTimer.current = setTimeout(show, 5000)
  }

  useEffect(() => {
    fetchData()
    checkUser()
    try { const r = localStorage.getItem('recent-searches'); if (r) setRecentSearches(JSON.parse(r)) } catch {}
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    setTimeout(() => setHeroVisible(true), 100)
    setVisitorCount(Math.floor(Math.random() * 80) + 40)

    // 🛒 장바구니 카운트 실시간 동기화
    // 상품 상세에서 담고 돌아올 때 / 탭 전환 후 돌아올 때 자동 갱신
    const refreshCart = () => {
      if (document.visibilityState === 'visible') checkUser()
    }
    const refreshCartOnStorage = (e: StorageEvent) => {
      if (e.key === 'cart-updated') checkUser()
    }
    document.addEventListener('visibilitychange', refreshCart)
    window.addEventListener('focus', refreshCart)
    window.addEventListener('storage', refreshCartOnStorage)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('visibilitychange', refreshCart)
      window.removeEventListener('focus', refreshCart)
      window.removeEventListener('storage', refreshCartOnStorage)
      if (popupTimer.current) clearTimeout(popupTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { localStorage.setItem('shop-theme', dark ? 'dark' : 'light') }, [dark])

  // 프로모 자동 슬라이드
  useEffect(() => {
    gulbiTimer.current = setInterval(() => {
      setGulbiStep(prev => (prev + 1) % 4)
    }, 4000)
    return () => clearInterval(gulbiTimer.current)
  }, [])

  // 광고 배너 자동 순환 (여러 업체 번갈아 노출)
  useEffect(() => {
    if (banners.length <= 1) return
    bannerTimer.current = setInterval(() => {
      setBannerIdx(i => (i + 1) % banners.length)
    }, 4500)
    return () => clearInterval(bannerTimer.current)
  }, [banners.length])

  // 검색·카테고리·정렬 바뀌면 다시 첫 페이지부터 (페이지네이션)
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [search, selectedCat, sortBy])

  useEffect(() => {
    if (products.length > 0) startPopupCycle()
    return () => { if (popupTimer.current) clearTimeout(popupTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products])

  const getPrice = (product: Product) => {
    if (memberType === '도매업') return product.wholesale_price
    return product.retail_price
  }

  const getPriceLabel = () => {
    if (memberType === '도매업') return '도매가'
    if (memberType === '소매업') return '소매가'
    return ''
  }

  const q = search.trim().toLowerCase()
  const filtered = products.filter(p => {
    const matchCat = selectedCat === '전체' || categories.find(c => c.id === p.category_id)?.name === selectedCat
    const matchSearch = !q
      || p.name.toLowerCase().includes(q)
      || (p.description || '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  // ── 리뷰 별점 + 후기수 기반 베이지안 상위노출 랭킹 (네이버식) ──
  // score = (별점합 + 전체평균*C) / (후기수 + C)
  // 후기 1개 만점보다, 후기 많은 4점대가 위로. C=신뢰상수(후기 적을수록 전체평균 쪽으로 끌림)
  const C = 5
  const ratingOf = (id: string) => { const s = reviewStats[id]; return s && s.count > 0 ? s.sum / s.count : 0 }
  const countOf = (id: string) => reviewStats[id]?.count || 0
  const allStats = Object.values(reviewStats)
  const gSum = allStats.reduce((a, s) => a + s.sum, 0)
  const gCount = allStats.reduce((a, s) => a + s.count, 0)
  const globalMean = gCount > 0 ? gSum / gCount : 4.5
  const bayes = (id: string) => {
    const s = reviewStats[id]
    const sum = s?.sum || 0
    const n = s?.count || 0
    return (sum + globalMean * C) / (n + C)
  }
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === '최신순') return 0 // products는 이미 created_at 역순
    if (sortBy === '평점순') return (ratingOf(b.id) - ratingOf(a.id)) || (countOf(b.id) - countOf(a.id))
    return bayes(b.id) - bayes(a.id) // 추천순(베이지안)
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMemberType('일반')
  }

  const bg = dark ? '#0a1c13' : '#f0faf9'
  const card = dark ? '#102a1d' : '#ffffff'
  const text = dark ? '#eaf5ee' : '#0f172a'
  const sub = dark ? '#86a394' : '#64748b'
  const border = dark ? 'rgba(52,211,153,0.13)' : 'rgba(0,0,0,0.07)'
  const headerBg = dark ? 'rgba(10,28,19,0.95)' : 'rgba(240,250,249,0.95)'
  const inputBg = dark ? '#15391f' : '#e8f5f3'
  const gtext = dark ? '#4ade80' : '#14532d'  // 다크 배경에서도 보이는 강조 녹색 텍스트

  return (
    <div style={{ background: bg, color: text, minHeight: '100vh', fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", overflowX: 'hidden' }}>

      {/* ── 구매 팝업 ── */}
      <div style={{
        position: 'fixed', bottom: '90px', left: '20px', zIndex: 999,
        transform: popup.show ? 'translateX(0) scale(1)' : 'translateX(-120%) scale(0.8)',
        opacity: popup.show ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        background: card, borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        border: `1.5px solid ${border}`,
        padding: '14px 18px', maxWidth: '260px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
          background: 'linear-gradient(135deg,#14532d,#15803d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
        }}>🧺</div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 800, color: text, margin: 0, lineHeight: 1.3 }}>
            {popup.name}님이
          </p>
          <p style={{ fontSize: '11px', color: gtext, fontWeight: 700, margin: '2px 0' }}>
            {popup.action}
          </p>
          <p style={{ fontSize: '11px', color: sub, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
            {popup.product}
          </p>
        </div>
      </div>

      {/* ── 헤더 ── */}
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
                <button onClick={() => { const n = !dark; setDark(n); localStorage.setItem('shop-theme', n ? 'dark' : 'light') }}
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

      {/* 회원 배너 */}
      {user && memberType !== '일반' && (
        <div style={{
          background: memberType === '도매업'
            ? 'linear-gradient(90deg,#7c3aed,#6366f1)'
            : 'linear-gradient(90deg,#14532d,#15803d)',
          padding: '10px 24px', textAlign: 'center',
          fontSize: '13px', fontWeight: 700, color: 'white',
          letterSpacing: '0.3px'
        }}>
          {memberType === '도매업' ? '🏭 도매업 회원 — 특별 도매가 적용 중이에요!' : '🏪 소매업 회원 — 소매가 적용 중이에요!'}
        </div>
      )}

      {/* ── 히어로 섹션 ── */}
      <section style={{
        background: dark
          ? 'linear-gradient(160deg,#0d2a1d 0%,#103024 50%,#0a1c13 100%)'
          : 'linear-gradient(160deg,#e8f8f5 0%,#dff4f8 50%,#e8f8f5 100%)',
        padding: '60px 20px 80px', position: 'relative', overflow: 'hidden'
      }}>
        {/* 배경 물결 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 80" style={{ width: '100%', display: 'block' }}>
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,80 L0,80 Z"
              fill={bg} />
          </svg>
        </div>

        {/* 떠다니는 이모지 */}
        {['🌾','🥩','🧺','🥬','🍎','🧺'].map((em, i) => (
          <div key={i} style={{
            position: 'absolute', fontSize: '32px', opacity: 0.15,
            left: `${8 + i * 16}%`, top: `${15 + (i % 3) * 25}%`,
            animation: `floatItem ${4 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.6}s`,
            pointerEvents: 'none', userSelect: 'none'
          }}>{em}</div>
        ))}

        <div style={{
          maxWidth: '1280px', margin: '0 auto', position: 'relative',
          display: 'flex', alignItems: 'center', gap: '40px',
          transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(30px)'
        }}>

          {/* ── 왼쪽: 텍스트 ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(22,163,74,0.12)', border: '1.5px solid rgba(22,163,74,0.25)',
              borderRadius: '100px', padding: '6px 16px', marginBottom: '20px'
            }}>
              <span style={{ fontSize: '12px' }}>🌿</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: gtext }}>산지에서 매일 직송</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px,4vw,60px)', fontWeight: 900,
              letterSpacing: '-2px', lineHeight: 1.1, marginBottom: '16px'
            }}>
              신선함이 다른<br />
              <span style={{
                background: 'linear-gradient(135deg,#14532d,#15803d)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>농축수산물 직거래</span>
            </h1>
            <p style={{ fontSize: '16px', color: sub, marginBottom: '32px', lineHeight: 1.7, wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
              중간 유통 없이 어민에서 바로<br />더 신선하게, 더 저렴하게
            </p>
            <div className="hero-stats" style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap' }}>
              {[
                { num: products.length + '+', label: '등록 상품', icon: '📦' },
                { num: visitorCount + '명', label: '지금 쇼핑중', icon: '👥' },
                { num: '당일', label: '신선 배송', icon: '🚚' },
              ].map(s => (
                <div key={s.label} style={{
                  background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)',
                  borderRadius: '14px', padding: '12px 14px',
                  border: `1.5px solid ${border}`, backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', gap: '8px', flex: 1
                }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '18px', fontWeight: 900, color: gtext, margin: 0, letterSpacing: '-1px' }}>{s.num}</p>
                    <p style={{ fontSize: '10px', color: sub, margin: '1px 0 0', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 모바일 전용 동물 컬럼 ── */}
          <div className="mobile-animals" style={{
            display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:'12px', flexShrink:0,
            width:'80px', paddingTop:'8px'
          }}>
            <div style={{ fontSize:'42px', animation:'floatItem 3s ease-in-out infinite' }}>🌾</div>
            <div style={{ fontSize:'36px', animation:'floatItem 4s ease-in-out infinite', animationDelay:'0.8s' }}>🥩</div>
            <div style={{ fontSize:'32px', animation:'floatItem 3.5s ease-in-out infinite', animationDelay:'1.5s' }}>🥬</div>
            <div style={{
              background:'white', borderRadius:'12px', padding:'5px 8px',
              fontSize:'9px', fontWeight:800, color:gtext,
              boxShadow:'0 4px 12px rgba(0,0,0,0.12)',
              animation:'bounce 2s ease-in-out infinite', whiteSpace:'nowrap',
              textAlign:'center'
            }}>신선해요!<br/>🌿</div>
          </div>

          {/* ── 오른쪽: 바다 마을 애니메이션 (PC only) ── */}
          <div className="hero-scene" style={{
            width: '560px', height: '400px', flexShrink: 0, position: 'relative',
            borderRadius: '32px', overflow: 'hidden',
            background: dark
              ? 'linear-gradient(180deg,#071428 0%,#0a2a4a 55%,#0d3320 100%)'
              : 'linear-gradient(180deg,#a8e4ff 0%,#60c8f0 50%,#6ee7a0 100%)',
            boxShadow: '0 32px 80px rgba(22,163,74,0.3)',
            border: `2px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'}`,
          }}>

            {/* 구름들 */}
            {[
              { left:'5%',  top:'8%',  w:'70px',  delay:'0s',  dur:'9s'  },
              { left:'35%', top:'5%',  w:'90px',  delay:'2s',  dur:'11s' },
              { left:'62%', top:'12%', w:'60px',  delay:'1s',  dur:'8s'  },
              { left:'78%', top:'4%',  w:'50px',  delay:'3s',  dur:'7s'  },
            ].map((c,i) => (
              <div key={i} style={{
                position:'absolute', left:c.left, top:c.top,
                width:c.w, height:'22px',
                background:'rgba(255,255,255,0.75)', borderRadius:'20px',
                animation:`cloudFloat ${c.dur} ease-in-out infinite`,
                animationDelay:c.delay, filter:'blur(2px)'
              }}/>
            ))}

            {/* 태양 */}
            <div style={{
              position:'absolute', right:'8%', top:'7%',
              width:'48px', height:'48px', borderRadius:'50%',
              background:'linear-gradient(135deg,#fde68a,#f59e0b)',
              boxShadow:'0 0 40px rgba(251,191,36,0.7)',
              animation:'sunPulse 3s ease-in-out infinite'
            }}/>

            {/* 새 두마리 */}
            {[{l:'22%',t:'14%',d:'0s'},{l:'38%',t:'9%',d:'0.5s'}].map((b,i)=>(
              <div key={i} style={{
                position:'absolute',left:b.l,top:b.t,
                fontSize:'14px',
                animation:`cloudFloat 5s ease-in-out infinite`,
                animationDelay:b.d
              }}>🕊️</div>
            ))}

            {/* 바다 물결 */}
            {['32%','27%','22%'].map((b,i)=>(
              <div key={i} style={{
                position:'absolute', bottom:b, left:0, right:0,
                height: i===0?'5px':'3px',
                background:`rgba(255,255,255,${0.35-i*0.08})`,
                borderRadius:'3px',
                animation:`wave ${2+i*0.5}s ease-in-out infinite`,
                animationDelay:`${i*0.4}s`
              }}/>
            ))}

            {/* 땅 */}
            <div style={{
              position:'absolute', bottom:0, left:0, right:0, height:'32%',
              background: dark
                ? 'linear-gradient(180deg,#1a5c38,#0d3320)'
                : 'linear-gradient(180deg,#6ee7a0,#22c55e)',
            }}/>

            {/* 가게 본체 */}
            <div style={{
              position:'absolute', bottom:'30%', left:'48%', transform:'translateX(-50%)',
              width:'130px', height:'80px',
              background: dark ? '#1e3a5f' : '#fffbf0',
              borderRadius:'10px 10px 0 0',
              border:'2px solid rgba(0,0,0,0.08)',
              boxShadow:'0 8px 24px rgba(0,0,0,0.2)'
            }}>
              {/* 지붕 */}
              <div style={{
                position:'absolute', top:'-28px', left:'-10px', right:'-10px', height:'32px',
                background:'linear-gradient(135deg,#ef4444,#b91c1c)',
                clipPath:'polygon(0% 100%, 50% 0%, 100% 100%)',
              }}/>
              {/* 굴뚝 */}
              <div style={{
                position:'absolute', top:'-44px', right:'18%',
                width:'12px', height:'20px',
                background:'#78716c', borderRadius:'3px 3px 0 0'
              }}/>
              {/* 연기 */}
              <div style={{
                position:'absolute', top:'-58px', right:'18%',
                fontSize:'14px', animation:'coinFloat 2s ease-in-out infinite',
                opacity:0.6
              }}>💨</div>
              {/* 간판 */}
              <div style={{
                position:'absolute', top:'10px', left:'50%', transform:'translateX(-50%)',
                background:'linear-gradient(135deg,#14532d,#15803d)',
                borderRadius:'8px', padding:'4px 10px',
                fontSize:'9px', fontWeight:900, color:'white', whiteSpace:'nowrap',
                boxShadow:'0 3px 8px rgba(22,163,74,0.4)'
              }}>🧺 신선 농축수산</div>
              {/* 창문 */}
              <div style={{display:'flex',gap:'8px',position:'absolute',top:'30px',left:'10px'}}>
                {[0,1].map(i=>(
                  <div key={i} style={{
                    width:'20px',height:'20px',
                    background:'linear-gradient(135deg,#bae6fd,#7dd3f0)',
                    borderRadius:'3px', border:'1.5px solid rgba(0,0,0,0.1)'
                  }}/>
                ))}
              </div>
              {/* 문 */}
              <div style={{
                position:'absolute', bottom:0, right:'14px',
                width:'26px', height:'38px',
                background:'linear-gradient(180deg,#60a5fa,#3b82f6)',
                borderRadius:'5px 5px 0 0',
                border:'1.5px solid rgba(0,0,0,0.1)'
              }}/>
            </div>

            {/* 판매자 할머니 */}
            <div style={{
              position:'absolute', bottom:'30%', left:'22%',
              animation:'bounce 2s ease-in-out infinite',
              fontSize:'34px', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}>👵</div>

            {/* 판매자 요리사 */}
            <div style={{
              position:'absolute', bottom:'30%', left:'34%',
              animation:'bounce 1.8s ease-in-out infinite',
              animationDelay:'0.3s',
              fontSize:'30px', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}>🧑‍🍳</div>

            {/* 구매자 1 */}
            <div style={{
              position:'absolute', bottom:'30%', right:'14%',
              animation:'shopperWalk 4s ease-in-out infinite',
              fontSize:'30px', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}>🛒</div>

            {/* 구매자 2 */}
            <div style={{
              position:'absolute', bottom:'30%', right:'28%',
              animation:'shopperWalk 5s ease-in-out infinite',
              animationDelay:'1s',
              fontSize:'26px', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}>🧑‍💼</div>

            {/* 배달 트럭 */}
            <div style={{
              position:'absolute', bottom:'30%', left:'4%',
              animation:'shopperWalk 6s ease-in-out infinite',
              animationDelay:'2s',
              fontSize:'28px', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}>🚚</div>

            {/* 바다 캐릭터들 */}
            {[
              { em:'🌾', left:'7%',  top:'28%', delay:'0s',   dur:'4s',   size:'32px' },
              { em:'🥩', left:'18%', top:'42%', delay:'0.5s', dur:'3.5s', size:'26px' },
              { em:'🥬', left:'68%', top:'22%', delay:'1s',   dur:'5s',   size:'30px' },
              { em:'🍎', left:'78%', top:'52%', delay:'1.5s', dur:'3s',   size:'28px' },
              { em:'🐡', left:'55%', top:'35%', delay:'0.8s', dur:'4.5s', size:'26px' },
              { em:'🦑', left:'88%', top:'30%', delay:'2s',   dur:'4s',   size:'24px' },
              { em:'🐠', left:'42%', top:'20%', delay:'1.2s', dur:'3.8s', size:'24px' },
              { em:'🦞', left:'10%', top:'55%', delay:'0.3s', dur:'4.2s', size:'22px' },
            ].map((f,i) => (
              <div key={i} style={{
                position:'absolute', left:f.left, top:f.top,
                fontSize:f.size,
                animation:`floatItem ${f.dur} ease-in-out infinite`,
                animationDelay:f.delay,
                filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.15))'
              }}>{f.em}</div>
            ))}

            {/* 말풍선들 */}
            <div style={{
              position:'absolute', bottom:'56%', left:'16%',
              background:'white', borderRadius:'12px 12px 12px 2px',
              padding:'5px 10px', fontSize:'9px', fontWeight:800, color:gtext,
              boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
              animation:'bounce 2.2s ease-in-out infinite', animationDelay:'0.4s',
              whiteSpace:'nowrap'
            }}>오늘도 신선 직송! 🌾</div>

            <div style={{
              position:'absolute', bottom:'56%', right:'8%',
              background:'white', borderRadius:'12px 12px 2px 12px',
              padding:'5px 10px', fontSize:'9px', fontWeight:800, color:'#ec4899',
              boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
              animation:'bounce 2s ease-in-out infinite', animationDelay:'1s',
              whiteSpace:'nowrap'
            }}>5개 주문할게요! 💳</div>

            <div style={{
              position:'absolute', bottom:'68%', left:'52%',
              background:'white', borderRadius:'12px 12px 12px 2px',
              padding:'4px 8px', fontSize:'8px', fontWeight:800, color:'#7c3aed',
              boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
              animation:'bounce 2.5s ease-in-out infinite', animationDelay:'1.5s',
              whiteSpace:'nowrap'
            }}>당일배송 🚀</div>

            {/* 코인 이펙트 */}
            {['15%','42%','65%','82%'].map((l,i) => (
              <div key={i} style={{
                position:'absolute', left:l, bottom:'38%',
                fontSize:'16px',
                animation:`coinFloat ${2.5+i*0.4}s ease-in-out infinite`,
                animationDelay:`${i * 0.6}s`,
                opacity:0.85
              }}>💰</div>
            ))}

            {/* 별점 이펙트 */}
            {['25%','75%'].map((l,i)=>(
              <div key={i} style={{
                position:'absolute', left:l, bottom:'60%',
                fontSize:'12px',
                animation:`coinFloat ${3+i}s ease-in-out infinite`,
                animationDelay:`${1+i*1.2}s`, opacity:0.7
              }}>⭐</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 광고 배너 슬라이더 (여러 업체 자동 순환) ── */}
      {banners.length > 0 && (
        <section style={{ background: dark ? '#0a1c13' : '#f0faf9', padding: '30px 20px 0' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span className="ad-live-badge" style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '1px', color: '#ec4899', background: 'transparent', border: '1px solid #ec4899', borderRadius: '100px', padding: '4px 12px' }}>● AD 추천 광고중</span>
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
      )}

      {/* ── 프로모션 애니메이션 섹션 ── */}
      <section style={{
        padding: '80px 20px 60px',
        background: dark ? '#0a1c13' : '#f0faf9',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: dark ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.08)',
            border: '1px solid rgba(22,163,74,0.25)',
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '12px', fontWeight: 700, color: gtext, letterSpacing: '1px',
          }}>✦ 이렇게 이용하세요</div>

          <h2 style={{
            fontSize: 'clamp(28px,4.5vw,48px)', fontWeight: 900,
            letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '48px', color: text
          }}>
            신선한 농축수산물을<br />
            <span style={{ background: 'linear-gradient(135deg,#14532d,#15803d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>집 앞까지 직배송</span>
          </h2>

          <div style={{
            background: dark ? '#102a1d' : 'white',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: '28px', overflow: 'hidden',
            boxShadow: dark ? '0 40px 80px rgba(0,0,0,0.5)' : '0 20px 60px rgba(22,163,74,0.12)',
          }}>

            {/* 탭 */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`, background: dark ? '#0d1525' : '#f8fcfc' }}>
              {['선택하기','신선 보장','주문하기','문앞 배송'].map((label, i) => (
                <button key={i} onClick={() => { setGulbiStep(i); clearInterval(gulbiTimer.current); gulbiTimer.current = setInterval(() => setGulbiStep(p => (p+1)%4), 4000) }}
                  style={{
                    flex: 1, padding: '14px 8px', fontSize: '13px', fontFamily: 'inherit',
                    fontWeight: gulbiStep === i ? 700 : 500, cursor: 'pointer',
                    color: gulbiStep === i ? '#14532d' : (dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'),
                    background: 'transparent', border: 'none',
                    borderBottom: `2px solid ${gulbiStep === i ? '#14532d' : 'transparent'}`,
                    transition: 'all 0.2s',
                  }}>{label}</button>
              ))}
            </div>

            {/* 진행 바 */}
            <div style={{ height: '2px', background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#14532d,#15803d)', width: `${(gulbiStep + 1) * 25}%`, transition: 'width 0.4s ease', borderRadius: '0 2px 2px 0' }} />
            </div>

            {/* STEP 0: 상품 선택 */}
            {gulbiStep === 0 && (
              <div className="promo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', padding: '40px 48px', alignItems: 'center', textAlign: 'left', animation: 'promoIn 0.4s ease' }}>
                <div>
                  <div style={{ fontSize: '56px', fontWeight: 900, color: dark ? 'rgba(22,163,74,0.1)' : 'rgba(22,163,74,0.07)', lineHeight: 1, marginBottom: '12px', letterSpacing: '-2px' }}>01</div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '12px', color: text }}>원하는 농축수산물 고르기</h3>
                  <p style={{ fontSize: '15px', color: sub, lineHeight: 1.7 }}>카테고리별로 농산물, 축산물, 농축수산물 등<br />다양한 신선 상품을 직접 고르세요.</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' as const }}>
                    {['🥬 채소','🍎 과일','🥩 한우','🧺 농축수산물','🌾 곡물'].map((item, i) => (
                      <span key={i} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, background: dark ? 'rgba(22,163,74,0.15)' : 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', color: gtext }}>{item}</span>
                    ))}
                  </div>
                </div>
                <div style={{ background: dark ? 'rgba(22,163,74,0.08)' : 'rgba(22,163,74,0.05)', border: `1px solid ${dark ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.15)'}`, borderRadius: '20px', padding: '24px' }}>
                  {[
                    { name: '온종일팜 신선상품', price: '₩125,000', unit: '1kg', fresh: '오늘 입고', icon: '🧺' },
                    { name: '제주 갈치 특대', price: '₩68,000', unit: '1마리', fresh: '새벽 직송', icon: '🐠' },
                    { name: '동해 홍게', price: '₩45,000', unit: '1kg', fresh: '살아있음', icon: '🦀' },
                  ].map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: i < 2 ? `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` : 'none' }}>
                      <span style={{ fontSize: '28px' }}>{p.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: text }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: gtext, fontWeight: 600, marginTop: '2px' }}>✅ {p.fresh}</div>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: gtext }}>{p.price}</div>
                        <div style={{ fontSize: '11px', color: sub }}>{p.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1: 신선 보장 */}
            {gulbiStep === 1 && (
              <div className="promo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', padding: '40px 48px', alignItems: 'center', textAlign: 'left', animation: 'promoIn 0.4s ease' }}>
                <div>
                  <div style={{ fontSize: '56px', fontWeight: 900, color: dark ? 'rgba(22,163,74,0.1)' : 'rgba(22,163,74,0.07)', lineHeight: 1, marginBottom: '12px', letterSpacing: '-2px' }}>02</div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '12px', color: text }}>100% 신선함 보장</h3>
                  <p style={{ fontSize: '15px', color: sub, lineHeight: 1.7 }}>매일 아침 어민에서 직접 수령한<br />신선한 농축수산물만 취급합니다.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                  {[
                    { icon: '🚚', title: '산지 직송', desc: '전국 산지에서 당일 출발' },
                    { icon: '❄️', title: '냉장 포장', desc: '아이스팩 + 스티로폼 이중 보냉 포장' },
                    { icon: '✅', title: '품질 검수', desc: '출고 전 100% 신선도 검수 완료' },
                    { icon: '💯', title: '환불 보장', desc: '신선하지 않으면 100% 전액 환불' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px', background: dark ? 'rgba(22,163,74,0.08)' : 'rgba(22,163,74,0.05)', border: `1px solid ${dark ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.12)'}`, borderRadius: '14px' }}>
                      <span style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '2px' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: sub }}>{item.desc}</div>
                      </div>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#14532d', flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: 주문하기 */}
            {gulbiStep === 2 && (
              <div className="promo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', padding: '40px 48px', alignItems: 'center', textAlign: 'left', animation: 'promoIn 0.4s ease' }}>
                <div>
                  <div style={{ fontSize: '56px', fontWeight: 900, color: dark ? 'rgba(22,163,74,0.1)' : 'rgba(22,163,74,0.07)', lineHeight: 1, marginBottom: '12px', letterSpacing: '-2px' }}>03</div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '12px', color: text }}>간편하게 주문하기</h3>
                  <p style={{ fontSize: '15px', color: sub, lineHeight: 1.7 }}>도매·소매·일반구매 중 내 등급에 맞는<br />가격으로 손쉽게 주문하세요.</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' as const }}>
                    {[
                      { label: '도매가', color: '#7c3aed', bg: dark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)' },
                      { label: '소매가', color: '#15803d', bg: dark ? 'rgba(21,128,61,0.12)' : 'rgba(21,128,61,0.08)' },
                      { label: '일반구매', color: gtext, bg: dark ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.08)' },
                    ].map((p, i) => (
                      <span key={i} style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, background: p.bg, color: p.color, border: `1px solid ${p.color}40` }}>{p.label}</span>
                    ))}
                  </div>
                </div>
                <div style={{ background: dark ? 'rgba(22,163,74,0.08)' : 'rgba(22,163,74,0.05)', border: `1px solid ${dark ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.15)'}`, borderRadius: '20px', padding: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: text, marginBottom: '16px' }}>🛒 주문 요약</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ color: sub }}>온종일팜 신선상품 1kg</span>
                    <span style={{ color: text, fontWeight: 600 }}>₩125,000</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ color: sub }}>배송비</span>
                    <span style={{ color: gtext, fontWeight: 700 }}>무료</span>
                  </div>
                  <div style={{ height: '1px', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900 }}>
                    <span style={{ color: text }}>합계</span>
                    <span style={{ color: gtext }}>₩125,000</span>
                  </div>
                  <div style={{ marginTop: '16px', padding: '12px', borderRadius: '12px', textAlign: 'center' as const, background: 'linear-gradient(135deg,#14532d,#15803d)', color: 'white', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>결제하기 →</div>
                </div>
              </div>
            )}

            {/* STEP 3: 문앞 배송 */}
            {gulbiStep === 3 && (
              <div className="promo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', padding: '40px 48px', alignItems: 'center', textAlign: 'left', animation: 'promoIn 0.4s ease' }}>
                <div>
                  <div style={{ fontSize: '56px', fontWeight: 900, color: dark ? 'rgba(22,163,74,0.1)' : 'rgba(22,163,74,0.07)', lineHeight: 1, marginBottom: '12px', letterSpacing: '-2px' }}>04</div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '12px', color: text }}>문 앞까지 신선 배송</h3>
                  <p style={{ fontSize: '15px', color: sub, lineHeight: 1.7 }}>오전 주문 시 당일 배송.<br />아이스팩 냉장 포장으로 신선하게 도착.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0' }}>
                  {[
                    { time: '오전 10시', label: '주문 완료', icon: '✅', done: true },
                    { time: '오전 11시', label: '산지 출발', icon: '🚀', done: true },
                    { time: '오후 2시',  label: '포장·검수', icon: '📦', done: true },
                    { time: '오후 4시',  label: '배송 출발', icon: '🚚', done: false },
                    { time: '당일 도착', label: '문 앞 배달', icon: '🏠', done: false },
                  ].map((step, i, arr) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0', position: 'relative' as const }}>
                      {i < arr.length - 1 && <div style={{ position: 'absolute', left: '15px', top: '40px', width: '2px', height: '28px', background: step.done ? '#14532d' : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }} />}
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step.done ? 'linear-gradient(135deg,#14532d,#15803d)' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'), border: `2px solid ${step.done ? '#14532d' : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`, fontSize: '14px', zIndex: 1 }}>{step.icon}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: step.done ? text : sub }}>{step.label}</div>
                        <div style={{ fontSize: '11px', color: step.done ? '#14532d' : sub }}>{step.time}</div>
                      </div>
                      {step.done && <div style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: gtext, background: dark ? 'rgba(22,163,74,0.15)' : 'rgba(22,163,74,0.08)', padding: '3px 8px', borderRadius: '20px' }}>완료 ✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 하단 점 네비 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '20px', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
              {[0,1,2,3].map(i => (
                <div key={i} onClick={() => { setGulbiStep(i); clearInterval(gulbiTimer.current); gulbiTimer.current = setInterval(() => setGulbiStep(p => (p+1)%4), 4000) }}
                  style={{ width: gulbiStep === i ? '22px' : '7px', height: '7px', borderRadius: '4px', cursor: 'pointer', background: gulbiStep === i ? '#14532d' : (dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'), transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px 120px' }}>

        {/* ── 카테고리 ── */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' }}>
            🏷️ 카테고리
          </h2>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
            {['전체', ...categories.map(c => c.name)].map((cat, idx) => {
              const active = selectedCat === cat
              const color = CAT_COLORS[cat] || getDefaultCatColor(idx)
              return (
                <button key={cat} onClick={() => setSelectedCat(cat)} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 22px', borderRadius: '16px', flexShrink: 0,
                  border: active ? 'none' : `2px solid ${border}`,
                  background: active ? color.bg : card,
                  color: active ? 'white' : sub,
                  fontSize: '14px', fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? `0 6px 16px ${color.shadow}` : '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <span style={{ fontSize: '20px' }}>{CAT_ICONS[cat] || '🧺'}</span>
                  <span>{cat}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 상품 수 & 필터 ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '10px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '15px', color: sub, fontWeight: 600 }}>
            총 <strong style={{ color: text, fontSize: '18px' }}>{filtered.length}</strong>개 상품
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {getPriceLabel() && (
              <span style={{
                fontSize: '12px', fontWeight: 800, padding: '6px 14px',
                borderRadius: '100px',
                background: 'linear-gradient(135deg,#14532d,#15803d)',
                color: 'white'
              }}>{getPriceLabel()} 기준 💰</span>
            )}
            {/* 정렬 선택 — 추천순(별점+후기수 베이지안) 기본 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                fontSize: '14px', fontWeight: 800, color: text,
                padding: '9px 14px', borderRadius: '12px',
                border: `2px solid ${border}`, background: card,
                cursor: 'pointer', fontFamily: 'inherit', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2315803d' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px'
              }}
            >
              <option value="추천순">⭐ 추천순</option>
              <option value="평점순">평점 높은순</option>
              <option value="최신순">최신순</option>
            </select>
          </div>
        </div>

        {/* ── 상품 그리드 ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '20px' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                background: card, borderRadius: '24px', height: '340px',
                animation: 'shimmer 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px', animation: 'floatItem 3s ease-in-out infinite' }}>{q ? '🔍' : '🧺'}</div>
            {q ? (
              <>
                <p style={{ fontSize: '20px', fontWeight: 800, color: text, marginBottom: '8px' }}>&lsquo;{search.trim()}&rsquo; 검색 결과가 없어요</p>
                <p style={{ color: sub, fontSize: '14px', marginBottom: '20px' }}>다른 검색어로 찾아보거나 카테고리를 둘러보세요.</p>
                <button onClick={() => { setSearch(''); setSelectedCat('전체') }} style={{
                  padding: '11px 22px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#14532d,#15803d)', color: 'white',
                  fontSize: '14px', fontWeight: 800, fontFamily: 'inherit'
                }}>전체 상품 보기</button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '20px', fontWeight: 800, color: text, marginBottom: '8px' }}>아직 상품이 없어요</p>
                <p style={{ color: sub, fontSize: '14px' }}>곧 신선한 농축수산물이 올라올 예정이에요!</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '20px' }}>
            {sorted.slice(0, visibleCount).map((p, i) => (
              <ProductCard
                key={p.id}
                p={p} i={i} dark={dark}
                card={card} border={border} text={text} sub={sub} gtext={gtext}
                memberType={memberType} sortBy={sortBy}
                catIcon={CAT_ICONS[categories.find(c => c.id === p.category_id)?.name || ''] || '🧺'}
                price={getPrice(p)} rating={ratingOf(p.id)} reviewCount={countOf(p.id)}
              />
            ))}
          </div>
        )}

        {/* 더 보기 (페이지네이션) */}
        {!loading && sorted.length > visibleCount && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} style={{
              padding: '14px 32px', borderRadius: '100px', cursor: 'pointer',
              border: `2px solid ${border}`, background: card, color: text,
              fontSize: '15px', fontWeight: 800, fontFamily: 'inherit',
              transition: 'all 0.2s ease', boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
            }}>
              상품 더 보기 ({sorted.length - visibleCount}개 남음) ↓
            </button>
          </div>
        )}
      </div>

      {/* ── 모바일 하단 네비 ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: headerBg, backdropFilter: 'blur(24px)',
        borderTop: `1px solid ${border}`,
        padding: '10px 0 24px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 40, boxShadow: '0 -8px 32px rgba(0,0,0,0.08)'
      }} className="mobile-nav">

        {/* 홈 */}
        <Link href="/shop" className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: gtext, flex: 1 }}>
          <span style={{ fontSize: '24px' }}>🏠</span>
          <span style={{ fontSize: '10px', fontWeight: 800 }}>홈</span>
        </Link>

        {/* 장바구니 */}
        <Link href="/shop/cart" className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: gtext, flex: 1 }}>
          <span style={{ fontSize: '24px', position: 'relative' }}>
            🛒
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-10px', minWidth: '16px', height: '16px', padding: '0 4px', borderRadius: '8px', background: '#ec4899', color: 'white', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, boxSizing: 'border-box' }}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 800 }}>장바구니</span>
        </Link>

        {/* 테마 */}
        <button onClick={() => setDark(!dark)} className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: sub, flex: 1 }}>
          <span style={{ fontSize: '24px' }}>{dark ? '🌙' : '☀️'}</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>테마</span>
        </button>

        {/* 마이페이지 / 로그인 */}
        {user ? (
          <Link href="/shop/mypage" className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: gtext, flex: 1 }}>
            <span style={{ fontSize: '24px' }}>👤</span>
            <span style={{ fontSize: '10px', fontWeight: 800 }}>마이</span>
          </Link>
        ) : (
          <Link href="/shop/login" className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: sub, flex: 1 }}>
            <span style={{ fontSize: '24px' }}>👤</span>
            <span style={{ fontSize: '10px', fontWeight: 700 }}>로그인</span>
          </Link>
        )}

        {/* 로그아웃 (로그인 시에만) */}
        {user ? (
          <button onClick={handleLogout} className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: sub, flex: 1 }}>
            <span style={{ fontSize: '24px' }}>🚪</span>
            <span style={{ fontSize: '10px', fontWeight: 700 }}>로그아웃</span>
          </button>
        ) : (
          <div style={{ flex: 1 }} />
        )}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .mobile-nav { display: none !important; }
          .header-user-btns { display: flex !important; align-items: center !important; gap: 8px !important; }
          .mobile-animals { display: none !important; }
        }
        .search-sg { transition: background 0.15s; }
        .search-sg:hover { background: rgba(22,163,74,0.08); }
        .ad-live-badge { animation: adBlink 1.1s ease-in-out infinite; }
        @keyframes adBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        .ad-banner-box { aspect-ratio: 1000 / 340; }
        .ad-banner-box:hover .ad-banner-img { transform: scale(1.04); }
        .ad-banner-box:hover .ad-banner-cta { background: #15803d !important; color: #fff !important; transform: translateY(-2px); box-shadow: 0 12px 30px rgba(21,128,61,0.45) !important; }
        @media (max-width: 639px) {
          .ad-banner-box { aspect-ratio: 16 / 9; border-radius: 18px !important; }
        }
        .header-btn {
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important;
        }
        .header-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(22,163,74,0.25) !important;
          border-color: #14532d !important;
          color: #14532d !important;
        }
        .header-mypage-btn:hover {
          background: rgba(22,163,74,0.08) !important;
        }
        .header-logout-btn:hover {
          border-color: #ef4444 !important;
          color: #ef4444 !important;
          box-shadow: 0 6px 20px rgba(239,68,68,0.2) !important;
        }
        @media (max-width: 639px) {
          .hero-scene { display: none !important; }
          .mobile-animals { display: flex !important; }
          .header-user-btns { display: none !important; }
        }

        /* 네비 버튼 터치 반응 */
        .nav-btn {
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .nav-btn:active {
          transform: scale(0.82) translateY(2px) !important;
          opacity: 0.7;
        }

        /* 상품 카드 호버/터치 */
        .product-card {
          transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .product-card:hover {
          transform: translateY(-10px) scale(1.02) !important;
          box-shadow: 0 30px 60px rgba(0,0,0,0.15) !important;
          border-color: rgba(22,163,74,0.3) !important;
        }
        .product-card:active {
          transform: scale(0.97) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .product-card:hover .product-img { transform: scale(1.08); }

        /* 카테고리 버튼 클릭 반응 */
        .cat-btn-active {
          -webkit-tap-highlight-color: transparent;
        }
        button, a {
          -webkit-tap-highlight-color: transparent;
        }

        /* 페이지 진입 애니메이션 */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes promoIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .promo-grid { grid-template-columns: 1fr !important; gap: 20px !important; padding: 20px 16px !important; }
          .hero-stats { gap: 8px !important; }
          .hero-stats > div { padding: 10px 10px !important; border-radius: 12px !important; }
        }
        @media (max-width: 768px) {
          .promo-grid { grid-template-columns: 1fr !important; gap: 24px !important; padding: 24px 16px !important; }
        }
        @keyframes floatItem {
          0%,100% { transform: translateY(0) rotate(-3deg); }
          50%      { transform: translateY(-14px) rotate(3deg); }
        }
        @keyframes shimmer {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 0.7; }
        }
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes cloudFloat {
          0%,100% { transform: translateX(0); opacity:0.7; }
          50%      { transform: translateX(12px); opacity:1; }
        }
        @keyframes sunPulse {
          0%,100% { box-shadow: 0 0 30px rgba(251,191,36,0.6); }
          50%      { box-shadow: 0 0 50px rgba(251,191,36,0.9); transform: scale(1.08); }
        }
        @keyframes shopperWalk {
          0%,100% { transform: translateX(0); }
          50%      { transform: translateX(-20px); }
        }
        @keyframes coinFloat {
          0%      { transform: translateY(0); opacity:0.8; }
          50%     { transform: translateY(-20px); opacity:1; }
          100%    { transform: translateY(-40px); opacity:0; }
        }
        @keyframes wave {
          0%,100% { transform: scaleX(1) translateX(0); }
          50%      { transform: scaleX(1.05) translateX(5px); }
        }
        @keyframes popIn {
          0%   { transform: scale(0.8); opacity: 0; }
          70%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        /* 모바일: 하단 고정 네비바에 푸터(사업자정보)가 가리지 않도록 여백 */
        @media (max-width: 639px) {
          .shop-footer { padding-bottom: calc(100px + env(safe-area-inset-bottom)) !important; }
        }
      `}</style>
      <footer className="shop-footer" style={{ background: '#0f172a', color: '#94a3b8', padding: '34px 20px', textAlign: 'center', fontSize: '12px', lineHeight: 1.8 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '10px', fontSize: '14px' }}>온종일팜 · 주식회사 유안에프앤비</div>
          상호: 주식회사 유안에프앤비 &nbsp;|&nbsp; 대표: 오준영 &nbsp;|&nbsp; 사업자등록번호: 692-88-03600 &nbsp;|&nbsp; 통신판매업신고: 제2026-전남영광-0027호<br />
          주소: 전라남도 영광군 법성면 굴비로1길 112-4 &nbsp;|&nbsp; 전화: 010-7432-3888<br />
          <div style={{ margin: '12px 0 10px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop/terms" style={{ color: '#cbd5e1', fontWeight: 700, textDecoration: 'none' }}>이용약관</Link>
            <Link href="/shop/privacy" style={{ color: '#cbd5e1', fontWeight: 700, textDecoration: 'none' }}>개인정보처리방침</Link>
          </div>
          <span style={{ color: '#475569' }}>© 2026 주식회사 유안에프앤비. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
