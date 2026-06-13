'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { CAT_ICONS, CAT_COLORS, getDefaultCatColor, POPUP_NAMES, POPUP_ACTIONS, type Product, type Category } from './_shopConstants'
import { ProductCard } from './_ProductCard'
import { AdBanner } from './_AdBanner'
import { PromoSection } from './_PromoSection'
import { MobileNav } from './_MobileNav'
import { HeroSection } from './_HeroSection'
import { ShopHeader } from './_ShopHeader'

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
      <ShopHeader dark={dark} setDark={setDark} scrolled={scrolled} headerBg={headerBg} border={border} card={card} inputBg={inputBg} text={text} sub={sub} gtext={gtext} cartCount={cartCount} visitorCount={visitorCount} user={user} memberType={memberType} search={search} setSearch={setSearch} searchFocus={searchFocus} setSearchFocus={setSearchFocus} suggestions={suggestions} recentSearches={recentSearches} popularTerms={popularTerms} saveRecent={saveRecent} removeRecent={removeRecent} setRecentSearches={setRecentSearches} handleLogout={handleLogout} />

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
      <HeroSection bg={bg} border={border} dark={dark} text={text} sub={sub} gtext={gtext} heroVisible={heroVisible} visitorCount={visitorCount} productCount={products.length} />

      {/* ── 광고 배너 슬라이더 (여러 업체 자동 순환) ── */}
      <AdBanner banners={banners} bannerIdx={bannerIdx} setBannerIdx={setBannerIdx} dark={dark} />

      {/* ── 프로모션 애니메이션 섹션 ── */}
      <PromoSection dark={dark} text={text} sub={sub} gtext={gtext} gulbiStep={gulbiStep} setGulbiStep={setGulbiStep} gulbiTimer={gulbiTimer} />

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
      <MobileNav headerBg={headerBg} border={border} gtext={gtext} sub={sub} dark={dark} setDark={setDark} cartCount={cartCount} user={user} handleLogout={handleLogout} />

      <style>{`
        @media (min-width: 640px) {
          .mobile-nav { display: none !important; }
          .header-user-btns { display: flex !important; align-items: center !important; gap: 8px !important; }
          .mobile-animals { display: none !important; }
        }
        .search-sg { transition: background 0.15s; }
        .search-sg:hover { background: rgba(22,163,74,0.08); }
        .ad-live-dot { animation: adBlink 1s ease-in-out infinite; }
        @keyframes adBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
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
