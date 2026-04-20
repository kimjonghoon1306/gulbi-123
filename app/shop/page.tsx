'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type Product = {
  id: string; name: string; description: string; image_url: string
  wholesale_price: number; retail_price: number; stock: number; unit: string
  category_id: string; is_active: boolean
}
type Category = { id: string; name: string }

const CAT_ICONS: Record<string, string> = {
  '어류': '🐟', '갑각류': '🦀', '패류': '🦪', '해조류': '🌿',
  '건어물/염장류': '🐠', '기타': '🐙', '전체': '🛒'
}

const CAT_COLORS: Record<string, { bg: string; border: string; shadow: string }> = {
  '전체':           { bg: 'linear-gradient(135deg,#0f766e,#0891b2)', border: '#0f766e', shadow: 'rgba(15,118,110,0.4)' },
  '어류':           { bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: '#3b82f6', shadow: 'rgba(59,130,246,0.4)' },
  '갑각류':         { bg: 'linear-gradient(135deg,#f97316,#ef4444)', border: '#f97316', shadow: 'rgba(249,115,22,0.4)' },
  '패류':           { bg: 'linear-gradient(135deg,#ec4899,#f43f5e)', border: '#ec4899', shadow: 'rgba(236,72,153,0.4)' },
  '해조류':         { bg: 'linear-gradient(135deg,#22c55e,#10b981)', border: '#22c55e', shadow: 'rgba(34,197,94,0.4)' },
  '건어물/염장류':  { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', border: '#f59e0b', shadow: 'rgba(245,158,11,0.4)' },
  '기타':           { bg: 'linear-gradient(135deg,#8b5cf6,#a855f7)', border: '#8b5cf6', shadow: 'rgba(139,92,246,0.4)' },
}

const getDefaultCatColor = (index: number) => {
  const colors = [
    { bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: '#3b82f6', shadow: 'rgba(59,130,246,0.4)' },
    { bg: 'linear-gradient(135deg,#f97316,#ef4444)', border: '#f97316', shadow: 'rgba(249,115,22,0.4)' },
    { bg: 'linear-gradient(135deg,#ec4899,#f43f5e)', border: '#ec4899', shadow: 'rgba(236,72,153,0.4)' },
    { bg: 'linear-gradient(135deg,#22c55e,#10b981)', border: '#22c55e', shadow: 'rgba(34,197,94,0.4)' },
    { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', border: '#f59e0b', shadow: 'rgba(245,158,11,0.4)' },
    { bg: 'linear-gradient(135deg,#8b5cf6,#a855f7)', border: '#8b5cf6', shadow: 'rgba(139,92,246,0.4)' },
  ]
  return colors[index % colors.length]
}

const POPUP_NAMES = ['김민준','이서연','박지훈','최유나','정성호','강미래','윤도현','임하은','신준서','오채원','한동욱','배수아']
const POPUP_ACTIONS = ['방금 구매했어요 🛒','장바구니에 담았어요 💚','찜했어요 ❤️','구매 완료했어요 ✅','리뷰를 남겼어요 ⭐']

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState('전체')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [memberType, setMemberType] = useState('일반')
  const [dark, setDark] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [popup, setPopup] = useState<{ show: boolean; name: string; action: string; product: string }>({ show: false, name: '', action: '', product: '' })
  const [visitorCount, setVisitorCount] = useState(0)
  const [heroVisible, setHeroVisible] = useState(false)
  const popupTimer = useRef<any>(null)
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order')
    ])
    setProducts(p || [])
    setCategories(c || [])
    setLoading(false)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data: member } = await supabase.from('shop_members').select('member_type').eq('id', user.id).single()
      if (member) setMemberType(member.member_type)
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
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    setTimeout(() => setHeroVisible(true), 100)
    setVisitorCount(Math.floor(Math.random() * 80) + 40)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (popupTimer.current) clearTimeout(popupTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { localStorage.setItem('shop-theme', dark ? 'dark' : 'light') }, [dark])

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

  const filtered = products.filter(p => {
    const matchCat = selectedCat === '전체' || categories.find(c => c.id === p.category_id)?.name === selectedCat
    const matchSearch = p.name.includes(search)
    return matchCat && matchSearch
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMemberType('일반')
  }

  const bg = dark ? '#0a0e1a' : '#f0faf9'
  const card = dark ? '#111827' : '#ffffff'
  const text = dark ? '#f0f0ee' : '#0f172a'
  const sub = dark ? '#6b7280' : '#64748b'
  const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const headerBg = dark ? 'rgba(10,14,26,0.95)' : 'rgba(240,250,249,0.95)'
  const inputBg = dark ? '#1a2235' : '#e8f5f3'

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
          background: 'linear-gradient(135deg,#0f766e,#0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
        }}>🐟</div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 800, color: text, margin: 0, lineHeight: 1.3 }}>
            {popup.name}님이
          </p>
          <p style={{ fontSize: '11px', color: '#0f766e', fontWeight: 700, margin: '2px 0' }}>
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
                background: 'linear-gradient(135deg,#0f766e,#0891b2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', boxShadow: '0 6px 16px rgba(15,118,110,0.35)'
              }}>🐟</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 900, color: text, letterSpacing: '-0.5px', lineHeight: 1, margin: 0 }}>굴비가게</p>
                <p style={{ fontSize: '9px', color: '#0f766e', letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1.5, margin: 0, fontWeight: 700 }}>FRESH SEAFOOD</p>
              </div>
            </Link>

            {/* 검색 */}
            <div style={{ flex: 1, maxWidth: '520px', margin: '0 auto' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="어떤 수산물을 찾으세요?"
                  style={{
                    width: '100%', background: inputBg,
                    border: `2px solid transparent`,
                    borderRadius: '14px', padding: '12px 16px 12px 46px',
                    fontSize: '14px', color: text, outline: 'none',
                    transition: 'all 0.2s', boxSizing: 'border-box',
                    fontWeight: 500
                  }}
                  onFocus={e => { e.target.style.borderColor = '#0f766e'; e.target.style.boxShadow = '0 0 0 4px rgba(15,118,110,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* 우측 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* 방문자 */}
              {visitorCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: 'rgba(15,118,110,0.1)', borderRadius: '20px',
                  padding: '5px 12px', border: '1px solid rgba(15,118,110,0.2)'
                }}>
                  <span style={{ fontSize: '8px', color: '#22c55e' }}>●</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e' }}>{visitorCount}명 쇼핑중</span>
                </div>
              )}



              {/* PC에서만 보이는 로그인/회원등급 */}
              <div className="header-user-btns">
                {user ? (
                  <>
                    <span style={{
                      fontSize: '12px', fontWeight: 700, padding: '5px 12px',
                      borderRadius: '20px',
                      background: memberType === '도매업' ? 'rgba(124,58,237,0.12)' : memberType === '소매업' ? 'rgba(15,118,110,0.12)' : 'rgba(0,0,0,0.06)',
                      color: memberType === '도매업' ? '#7c3aed' : memberType === '소매업' ? '#0f766e' : sub
                    }}>{memberType}</span>
                    <Link href="/shop/mypage" style={{
                      fontSize: '13px', fontWeight: 700, padding: '9px 16px',
                      borderRadius: '12px', background: 'transparent',
                      border: `1.5px solid ${border}`, color: text,
                      textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px'
                    }}>👤 마이페이지</Link>
                    <button onClick={handleLogout} style={{
                      fontSize: '13px', fontWeight: 600, padding: '9px 16px',
                      borderRadius: '12px', background: 'transparent',
                      border: `1.5px solid ${border}`, color: sub, cursor: 'pointer'
                    }}>로그아웃</button>
                  </>
                ) : (
                  <>
                    <Link href="/shop/login" style={{
                      fontSize: '13px', fontWeight: 600, padding: '9px 16px',
                      borderRadius: '12px', background: 'transparent',
                      border: `1.5px solid ${border}`, color: text,
                      textDecoration: 'none'
                    }}>로그인</Link>
                    <Link href="/shop/register" style={{
                      fontSize: '13px', fontWeight: 800, padding: '10px 20px',
                      borderRadius: '12px', background: 'linear-gradient(135deg,#0f766e,#0891b2)',
                      color: 'white', textDecoration: 'none',
                      boxShadow: '0 6px 20px rgba(15,118,110,0.35)'
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
            : 'linear-gradient(90deg,#0f766e,#0891b2)',
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
          ? 'linear-gradient(160deg,#0a1628 0%,#0d2137 50%,#0a1628 100%)'
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
        {['🐟','🦀','🦪','🐙','🦐','🌊'].map((em, i) => (
          <div key={i} style={{
            position: 'absolute', fontSize: '32px', opacity: 0.15,
            left: `${8 + i * 16}%`, top: `${15 + (i % 3) * 25}%`,
            animation: `floatFish ${4 + i * 0.5}s ease-in-out infinite`,
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
              background: 'rgba(15,118,110,0.12)', border: '1.5px solid rgba(15,118,110,0.25)',
              borderRadius: '100px', padding: '6px 16px', marginBottom: '20px'
            }}>
              <span style={{ fontSize: '12px' }}>🌊</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e' }}>매일 아침 영광 앞바다에서 직송</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px,4vw,60px)', fontWeight: 900,
              letterSpacing: '-2px', lineHeight: 1.1, marginBottom: '16px'
            }}>
              신선함이 다른<br />
              <span style={{
                background: 'linear-gradient(135deg,#0f766e,#0891b2)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>수산물 직거래</span>
            </h1>
            <p style={{ fontSize: '16px', color: sub, marginBottom: '32px', lineHeight: 1.7, wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
              중간 유통 없이 어민에서 바로<br />더 신선하게, 더 저렴하게
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { num: products.length + '+', label: '등록 상품', icon: '📦' },
                { num: visitorCount + '명', label: '지금 쇼핑중', icon: '👥' },
                { num: '당일', label: '신선 배송', icon: '🚚' },
              ].map(s => (
                <div key={s.label} style={{
                  background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)',
                  borderRadius: '18px', padding: '16px 20px',
                  border: `1.5px solid ${border}`, backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <span style={{ fontSize: '24px' }}>{s.icon}</span>
                  <div>
                    <p style={{ fontSize: '22px', fontWeight: 900, color: '#0f766e', margin: 0, letterSpacing: '-1px' }}>{s.num}</p>
                    <p style={{ fontSize: '11px', color: sub, margin: '2px 0 0', fontWeight: 600 }}>{s.label}</p>
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
            <div style={{ fontSize:'42px', animation:'floatFish 3s ease-in-out infinite' }}>🐟</div>
            <div style={{ fontSize:'36px', animation:'floatFish 4s ease-in-out infinite', animationDelay:'0.8s' }}>🦀</div>
            <div style={{ fontSize:'32px', animation:'floatFish 3.5s ease-in-out infinite', animationDelay:'1.5s' }}>🐙</div>
            <div style={{
              background:'white', borderRadius:'12px', padding:'5px 8px',
              fontSize:'9px', fontWeight:800, color:'#0f766e',
              boxShadow:'0 4px 12px rgba(0,0,0,0.12)',
              animation:'bounce 2s ease-in-out infinite', whiteSpace:'nowrap',
              textAlign:'center'
            }}>신선해요!<br/>🌊</div>
          </div>

          {/* ── 오른쪽: 바다 마을 애니메이션 (PC only) ── */}
          <div className="hero-scene" style={{
            width: '560px', height: '400px', flexShrink: 0, position: 'relative',
            borderRadius: '32px', overflow: 'hidden',
            background: dark
              ? 'linear-gradient(180deg,#071428 0%,#0a2a4a 55%,#0d3320 100%)'
              : 'linear-gradient(180deg,#a8e4ff 0%,#60c8f0 50%,#6ee7a0 100%)',
            boxShadow: '0 32px 80px rgba(15,118,110,0.3)',
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
                background:'linear-gradient(135deg,#0f766e,#0891b2)',
                borderRadius:'8px', padding:'4px 10px',
                fontSize:'9px', fontWeight:900, color:'white', whiteSpace:'nowrap',
                boxShadow:'0 3px 8px rgba(15,118,110,0.4)'
              }}>🐟 신선 수산시장</div>
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
              { em:'🐟', left:'7%',  top:'28%', delay:'0s',   dur:'4s',   size:'32px' },
              { em:'🦐', left:'18%', top:'42%', delay:'0.5s', dur:'3.5s', size:'26px' },
              { em:'🐙', left:'68%', top:'22%', delay:'1s',   dur:'5s',   size:'30px' },
              { em:'🦀', left:'78%', top:'52%', delay:'1.5s', dur:'3s',   size:'28px' },
              { em:'🐡', left:'55%', top:'35%', delay:'0.8s', dur:'4.5s', size:'26px' },
              { em:'🦑', left:'88%', top:'30%', delay:'2s',   dur:'4s',   size:'24px' },
              { em:'🐠', left:'42%', top:'20%', delay:'1.2s', dur:'3.8s', size:'24px' },
              { em:'🦞', left:'10%', top:'55%', delay:'0.3s', dur:'4.2s', size:'22px' },
            ].map((f,i) => (
              <div key={i} style={{
                position:'absolute', left:f.left, top:f.top,
                fontSize:f.size,
                animation:`floatFish ${f.dur} ease-in-out infinite`,
                animationDelay:f.delay,
                filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.15))'
              }}>{f.em}</div>
            ))}

            {/* 말풍선들 */}
            <div style={{
              position:'absolute', bottom:'56%', left:'16%',
              background:'white', borderRadius:'12px 12px 12px 2px',
              padding:'5px 10px', fontSize:'9px', fontWeight:800, color:'#0f766e',
              boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
              animation:'bounce 2.2s ease-in-out infinite', animationDelay:'0.4s',
              whiteSpace:'nowrap'
            }}>오늘 굴비 신선해요! 🐟</div>

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
                  transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: active ? `0 10px 28px ${color.shadow}` : '0 2px 8px rgba(0,0,0,0.06)',
                  transform: active ? 'translateY(-4px) scale(1.05)' : 'translateY(0) scale(1)',
                }}>
                  <span style={{ fontSize: '20px' }}>{CAT_ICONS[cat] || '🐟'}</span>
                  <span>{cat}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 상품 수 & 필터 ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <p style={{ fontSize: '15px', color: sub, fontWeight: 600 }}>
            총 <strong style={{ color: text, fontSize: '18px' }}>{filtered.length}</strong>개 상품
          </p>
          {getPriceLabel() && (
            <span style={{
              fontSize: '12px', fontWeight: 800, padding: '6px 14px',
              borderRadius: '100px',
              background: 'linear-gradient(135deg,#0f766e,#0891b2)',
              color: 'white'
            }}>{getPriceLabel()} 기준 💰</span>
          )}
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
            <div style={{ fontSize: '72px', marginBottom: '20px', animation: 'floatFish 3s ease-in-out infinite' }}>🐟</div>
            <p style={{ fontSize: '20px', fontWeight: 800, color: text, marginBottom: '8px' }}>아직 상품이 없어요</p>
            <p style={{ color: sub, fontSize: '14px' }}>곧 신선한 수산물이 올라올 예정이에요!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '20px' }}>
            {filtered.map((p, i) => (
              <Link key={p.id} href={`/shop/product/${p.id}`} style={{ textDecoration: 'none' }}>
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
                    background: dark ? '#1a2235' : 'linear-gradient(135deg,#e8f8f5,#dff4f8)'
                  }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        className="product-img" />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '72px', animation: 'floatFish 3s ease-in-out infinite',
                        animationDelay: `${i * 0.3}s`
                      }}>
                        {CAT_ICONS[categories.find(c => c.id === p.category_id)?.name || ''] || '🐟'}
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
                          background: 'linear-gradient(135deg,#0f766e,#0891b2)',
                          color: 'white', fontSize: '10px', fontWeight: 800,
                          padding: '4px 10px', borderRadius: '100px',
                          boxShadow: '0 4px 12px rgba(15,118,110,0.4)'
                        }}>✨ NEW</span>
                      )}
                    </div>
                  </div>

                  {/* 정보 */}
                  <div style={{ padding: '18px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: text, marginBottom: '4px', lineHeight: 1.3 }}>{p.name}</p>
                    <p style={{ fontSize: '12px', color: sub, marginBottom: '14px', fontWeight: 500 }}>{p.unit} 단위</p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{
                          fontSize: '22px', fontWeight: 900, color: '#0f766e',
                          letterSpacing: '-1px', margin: 0
                        }}>{getPrice(p).toLocaleString()}원</p>
                        {memberType === '도매업' && (
                          <p style={{ fontSize: '11px', color: sub, margin: '2px 0 0', textDecoration: 'line-through' }}>
                            소매 {p.retail_price.toLocaleString()}원
                          </p>
                        )}
                      </div>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '14px',
                        background: 'linear-gradient(135deg,#0f766e,#0891b2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', boxShadow: '0 6px 16px rgba(15,118,110,0.35)',
                        transition: 'all 0.2s'
                      }}>→</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── 모바일 하단 네비 ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: headerBg, backdropFilter: 'blur(24px)',
        borderTop: `1px solid ${border}`,
        padding: '10px 16px 24px',
        display: 'flex', justifyContent: 'space-around',
        zIndex: 40, boxShadow: '0 -8px 32px rgba(0,0,0,0.08)'
      }} className="mobile-nav">

        {/* 홈 */}
        <Link href="/shop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: '#0f766e' }}>
          <span style={{ fontSize: '22px' }}>🏠</span>
          <span style={{ fontSize: '10px', fontWeight: 800 }}>홈</span>
        </Link>

        {/* 회원등급 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <div style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
            background: memberType === '도매업'
              ? 'linear-gradient(135deg,#7c3aed,#6366f1)'
              : memberType === '소매업'
              ? 'linear-gradient(135deg,#0f766e,#0891b2)'
              : 'rgba(0,0,0,0.08)',
            color: memberType !== '일반' ? 'white' : sub,
            boxShadow: memberType !== '일반' ? '0 3px 10px rgba(0,0,0,0.2)' : 'none'
          }}>
            {memberType === '도매업' ? '🏭' : memberType === '소매업' ? '🏪' : '👤'} {memberType}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, color: sub }}>등급</span>
        </div>

        {/* 테마 */}
        <button onClick={() => setDark(!dark)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: sub }}>
          <span style={{ fontSize: '22px' }}>{dark ? '🌙' : '☀️'}</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>테마</span>
        </button>

        {/* 내정보/로그인 */}
        {user ? (
          <Link href="/shop/mypage" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: '#0f766e', flex: 1 }}>
            <span style={{ fontSize: '22px' }}>👤</span>
            <span style={{ fontSize: '9px', fontWeight: 800 }}>마이</span>
          </Link>
        ) : (
          <Link href="/shop/login" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: sub, flex: 1 }}>
            <span style={{ fontSize: '22px' }}>👤</span>
            <span style={{ fontSize: '9px', fontWeight: 700 }}>로그인</span>
          </Link>
        )}
        {user && (
          <button onClick={handleLogout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: sub, flex: 1 }}>
            <span style={{ fontSize: '22px' }}>🚪</span>
            <span style={{ fontSize: '9px', fontWeight: 700 }}>로그아웃</span>
          </button>
        )}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .mobile-nav { display: none !important; }
          .header-user-btns { display: flex !important; align-items: center !important; gap: 8px !important; }
          .mobile-animals { display: none !important; }
        }
        @media (max-width: 639px) {
          .hero-scene { display: none !important; }
          .mobile-animals { display: flex !important; }
          .header-user-btns { display: none !important; }
        }
        .product-card:hover {
          transform: translateY(-10px) scale(1.02) !important;
          box-shadow: 0 30px 60px rgba(0,0,0,0.15) !important;
          border-color: rgba(15,118,110,0.3) !important;
        }
        .product-card:hover .product-img { transform: scale(1.08); }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatFish {
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
      `}</style>
    </div>
  )
}
