'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { openPostcode } from '@/lib/postcode'
import { courierName } from '@/lib/tracking'

type Member = {
  id: string; email: string; name: string; contact: string
  member_type: '일반' | '소매업' | '도매업'
  business_name: string; business_number: string
  status: string; created_at: string
  address?: string
}

type Order = {
  id: string; order_number: string; customer_name: string; contact: string
  address: string; note: string; payment_method: string; status: string
  total_amount: number; created_at: string
  courier_code?: string; tracking_number?: string
}

type OrderItem = {
  id: string; product_name: string; quantity: number; unit: string
  unit_price: number; total_price: number
}

const STATUS_STEP: Record<string, number> = { '접수': 0, '준비중': 1, '출고': 2, '완료': 3 }
const STATUS_LABEL = ['접수', '준비중', '출고', '완료']
const STATUS_ICON = ['📋', '📦', '🚚', '✅']

const TYPE_CONFIG = {
  '일반':  { color: '#15803d', gradient: 'linear-gradient(135deg,#16a34a,#15803d)', label: '일반 구매자', icon: '🛒', badge: '일반회원' },
  '소매업': { color: '#14532d', gradient: 'linear-gradient(135deg,#15803d,#14532d)', label: '소매 유통',   icon: '🏪', badge: '소매회원' },
  '도매업': { color: '#047857', gradient: 'linear-gradient(135deg,#059669,#047857)', label: '도매 유통',   icon: '🏭', badge: '도매회원' },
}

const GRADE_INFO = [
  { name: '일반', icon: '🛒', min: 0,       max: 500000,   color: '#6b7280' },
  { name: '실버', icon: '🥈', min: 500000,  max: 2000000,  color: '#94a3b8' },
  { name: '골드', icon: '🥇', min: 2000000, max: 5000000,  color: '#f59e0b' },
  { name: 'VIP',  icon: '💎', min: 5000000, max: Infinity, color: '#ec4899' },
]

export default function MyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:'44px', height:'44px', borderRadius:'50%', border:'3px solid #14532d', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
      <MyPageInner />
    </Suspense>
  )
}

function MyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [member, setMember]           = useState<Member | null>(null)
  const [orders, setOrders]           = useState<Order[]>([])
  const [orderItems, setOrderItems]   = useState<Record<string, OrderItem[]>>({})
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<'home' | 'orders' | 'benefits' | 'wishlist' | 'settings'>('home')
  const [wishlists, setWishlists]     = useState<any[]>([])
  const [dark, setDark]               = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [itemsLoading, setItemsLoading]   = useState<string | null>(null)

  // ── 설정(주소/비번) ──
  const [addrInput, setAddrInput]     = useState('')
  const [addrSaving, setAddrSaving]   = useState(false)
  const [addrMsg, setAddrMsg]         = useState('')
  const [pw1, setPw1]                 = useState('')
  const [pw2, setPw2]                 = useState('')
  const [pwSaving, setPwSaving]       = useState(false)
  const [pwMsg, setPwMsg]             = useState('')

  const saveAddress = async () => {
    if (!member) return
    setAddrSaving(true); setAddrMsg('')
    const { error } = await supabase.from('shop_members').update({ address: addrInput.trim() }).eq('id', member.id)
    if (error) { setAddrMsg('저장 실패: ' + error.message) }
    else {
      try { localStorage.setItem('onjongil_addr', addrInput.trim()) } catch {}  // 체크아웃 자동입력 동기화
      setMember({ ...member, address: addrInput.trim() })
      setAddrMsg('✅ 기본 배송지가 저장됐어요')
    }
    setAddrSaving(false)
  }

  // ── 배송 조회 ──
  const [trackModal, setTrackModal] = useState(false)
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackData, setTrackData] = useState<any>(null)

  const openTracking = async (order: Order) => {
    if (!order.courier_code || !order.tracking_number) return
    setTrackModal(true); setTrackLoading(true); setTrackData(null)
    try {
      const res = await fetch('/api/tracking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courier: order.courier_code, invoice: order.tracking_number }),
      })
      const data = await res.json()
      setTrackData(data)
    } catch {
      setTrackData({ ok: false, error: '배송조회 중 오류가 발생했어요.' })
    } finally { setTrackLoading(false) }
  }

  const changePassword = async () => {
    setPwMsg('')
    if (pw1.length < 6) { setPwMsg('비밀번호는 6자 이상이어야 해요.'); return }
    if (pw1 !== pw2) { setPwMsg('두 비밀번호가 일치하지 않아요.'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw1 })
    if (error) { setPwMsg('변경 실패: ' + error.message) }
    else { setPw1(''); setPw2(''); setPwMsg('✅ 비밀번호가 변경됐어요') }
    setPwSaving(false)
  }

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/shop/login'); return }
      const { data: m } = await supabase.from('shop_members').select('*').eq('id', user.id).single()
      if (!m) {
        // shop_members 레코드가 없는 경우 (회원가입 시 INSERT 실패 등)
        // → auth 유저 정보로 기본값 구성 + general_orders에서 주문 조회는 계속 진행
        const fallbackMember = {
          id: user.id,
          email: user.email || '',
          name: user.email?.split('@')[0] || '회원',
          contact: '',
          member_type: '일반' as const,
          business_name: '',
          business_number: '',
          status: '승인',
          created_at: new Date().toISOString()
        }
        setMember(fallbackMember)
        // ❌ 기존: setOrders([]) → return  (주문 조회 없이 종료 — 버그)
        // ✅ 수정: general_orders에서 user_id로 주문 조회
        const { data: o } = await supabase
          .from('general_orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        setOrders(o || [])
        setLoading(false)
        return
      }
      setMember(m)
      setAddrInput(m.address || (typeof window !== 'undefined' ? localStorage.getItem('onjongil_addr') || '' : ''))
      const table = m.member_type === '도매업' ? 'wholesale_orders' : m.member_type === '소매업' ? 'retail_orders' : 'general_orders'
      // user_id로 먼저 조회, 없으면 contact로 조회
      let { data: o } = await supabase.from(table).select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (!o || o.length === 0) {
        const { data: o2 } = await supabase.from(table).select('*').eq('contact', m.contact).order('created_at', { ascending: false })
        o = o2
      }
      setOrders(o || [])
      loadAllOrderItems(o || [], m.member_type)
      // 찜 목록 조회
      const { data: wishes } = await supabase
        .from('wishlists')
        .select('id, created_at, products(id, name, image_url, retail_price, wholesale_price, member_price, unit, stock)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setWishlists(wishes || [])
      setLoading(false)
    } catch (e) {
      console.error('fetchData error:', e)
      setLoading(false)
    }
  }

  // 찜 해제
  const removeWishlist = async (wishId: string) => {
    setWishlists(prev => prev.filter(w => w.id !== wishId))
    await supabase.from('wishlists').delete().eq('id', wishId)
  }

  useEffect(() => {
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)

    // 장바구니 결제 완료 후 ?tab=orders 로 진입 시 주문내역 탭 바로 열기
    const tabParam = searchParams.get('tab')
    if (tabParam === 'orders' || tabParam === 'benefits' || tabParam === 'wishlist') {
      setTab(tabParam)
    }

    fetchData()

    // 📦 주문 완료 후 마이페이지 이동 시 자동 갱신
    const refreshOrders = () => {
      if (document.visibilityState === 'visible') fetchData()
    }
    document.addEventListener('visibilitychange', refreshOrders)

    return () => {
      document.removeEventListener('visibilitychange', refreshOrders)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 모든 주문의 상품을 한 번에 로드 (상세보기 없이 항상 펼쳐 보여주기 위함)
  const loadAllOrderItems = async (orderList: Order[], memberType?: string) => {
    if (!orderList || orderList.length === 0) return
    const table = memberType === '도매업' ? 'wholesale_order_items' : memberType === '소매업' ? 'retail_order_items' : 'general_order_items'
    const ids = orderList.map(o => o.id)
    const { data } = await supabase.from(table).select('*').in('order_id', ids)
    const grouped: Record<string, OrderItem[]> = {}
    ;(data || []).forEach((it: any) => {
      if (!grouped[it.order_id]) grouped[it.order_id] = []
      grouped[it.order_id].push(it)
    })
    setOrderItems(grouped)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/shop')
  }

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('shop-theme', next ? 'dark' : 'light')
  }

  // Derived values
  const tc           = member ? TYPE_CONFIG[member.member_type] : TYPE_CONFIG['일반']
  const totalAmount  = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
  const curGrade     = [...GRADE_INFO].reverse().find(g => totalAmount >= g.min) || GRADE_INFO[0]
  const nextGrade    = GRADE_INFO[GRADE_INFO.indexOf(curGrade) + 1] || null
  const gradeProgress= nextGrade ? Math.min((totalAmount / nextGrade.min) * 100, 100) : 100

  // Design tokens
  const D = {
    bg:     dark ? '#0d1117' : '#f1f5f9',
    card:   dark ? '#161b22' : '#ffffff',
    card2:  dark ? '#1e2530' : '#f8fafc',
    text:   dark ? '#f0f0ee' : '#0f172a',
    sub:    dark ? '#6b7280' : '#64748b',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    input:  dark ? '#1e2530' : '#f1f5f9',
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:D.bg, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:'44px', height:'44px', borderRadius:'50%', border:`3px solid ${tc.color}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:D.sub, fontSize:'13px', margin:0 }}>불러오는 중...</p>
    </div>
  )

  if (!member) return null

  return (
    <div style={{ background:D.bg, color:D.text, minHeight:'100vh', fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif" }}>

      {/* ── 헤더 ── */}
      <header style={{ background:dark?'rgba(13,17,23,0.97)':'rgba(255,255,255,0.97)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${D.border}`, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 20px', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <Link href="/shop" style={{ width:'36px', height:'36px', borderRadius:'10px', background:D.input, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', textDecoration:'none', color:D.text, flexShrink:0 }}>←</Link>
            <p style={{ fontWeight:800, fontSize:'16px', margin:0 }}>마이페이지</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ background:tc.gradient, color:'white', fontSize:'10px', fontWeight:700, padding:'4px 10px', borderRadius:'20px' }}>{tc.badge}</div>
            <button onClick={toggleDark} style={{ width:'44px', height:'44px', borderRadius:'12px',
              background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
              border:'none', cursor:'pointer', fontSize:'22px', display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s', flexShrink:0 }}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:'1340px', margin:'0 auto', padding:'24px 24px 100px' }}>

        <div className="mp-layout">
        <div className="mp-side">

        {/* ── 프로필 히어로 ── */}
        <div className="hero-card" style={{ background:tc.gradient, borderRadius:'32px', padding:'40px 36px', marginBottom:'22px', position:'relative', overflow:'hidden', boxShadow:`0 24px 60px ${tc.color}40` }}>
          {/* 움직이는 빛 블롭 */}
          <div className="hero-blob" style={{ position:'absolute', top:'-60px', right:'-40px', width:'220px', height:'220px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', filter:'blur(8px)' }} />
          <div className="hero-blob2" style={{ position:'absolute', bottom:'-70px', left:'18%', width:'240px', height:'240px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', filter:'blur(6px)' }} />

          {/* SVG 물결 (하단) */}
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'60px', opacity:0.18 }}>
            <path className="hero-wave" d="M0,60 C240,110 480,10 720,60 C960,110 1200,10 1440,60 L1440,120 L0,120 Z" fill="white" />
          </svg>

          {/* 떠다니는 아이콘들 */}
          {['🛒','🧺','🐟','🌾','✨','📦'].map((em, i) => (
            <div key={i} className="hero-float" style={{
              position:'absolute', fontSize:`${20 + (i%3)*8}px`, opacity:0.22,
              left:`${10 + i*15}%`, top:`${12 + (i%3)*26}%`,
              animationDelay:`${i*0.5}s`, animationDuration:`${4 + i*0.4}s`, pointerEvents:'none', userSelect:'none',
            }}>{em}</div>
          ))}

          <div style={{ position:'relative', zIndex:2 }}>

            {/* 프로필 */}
            <div className="hero-profile" style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'28px' }}>
              <div className="hero-avatar" style={{ width:'84px', height:'84px', borderRadius:'50%', background:'rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', flexShrink:0, border:'3px solid rgba(255,255,255,0.45)', boxShadow:'0 8px 24px rgba(0,0,0,0.18)' }}>
                {tc.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ display:'inline-block', color:'white', fontSize:'11px', fontWeight:700, margin:'0 0 8px', letterSpacing:'0.08em', background:'rgba(255,255,255,0.2)', padding:'4px 12px', borderRadius:'100px', backdropFilter:'blur(8px)' }}>{tc.label}</span>
                <p style={{ color:'white', fontSize:'30px', fontWeight:900, margin:'0 0 4px', letterSpacing:'-1px' }}>{member.name}님</p>
                <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'13px', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member.email}</p>
              </div>
            </div>

            {/* 통계 3칸 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }} className="stat-grid">
              {[
                { label:'총 주문',   value: `${orders.length}건`, icon:'📦' },
                { label:'누적 금액', value: totalAmount > 0 ? `${Math.floor(totalAmount/10000)}만원` : '0원', icon:'💰' },
                { label: member.member_type === '일반' ? '등급' : '상태', icon: member.member_type === '일반' ? '🏆' : '✅',
                  value: member.member_type === '일반'
                    ? `${curGrade.icon} ${curGrade.name}`
                    : member.status === '승인' ? '✅ 승인' : member.status === '대기중' ? '⏳ 대기' : '❌ 거절' },
              ].map((s, i) => (
                <div key={i} className="stat-card" style={{ background:'rgba(255,255,255,0.16)', borderRadius:'18px', padding:'18px 10px', textAlign:'center', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.2)' }}>
                  <p style={{ fontSize:'20px', margin:'0 0 6px' }}>{s.icon}</p>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'11px', margin:'0 0 5px', letterSpacing:'0.04em' }}>{s.label}</p>
                  <p style={{ color:'white', fontSize:'17px', fontWeight:900, margin:0 }} className="stat-value">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 탭 네비게이션 ── */}
        <div className="mp-tabs" style={{ display:'flex', gap:'8px', marginBottom:'22px', background:D.card, borderRadius:'20px', padding:'8px', border:`1px solid ${D.border}`, boxShadow:'0 4px 20px rgba(0,0,0,0.04)' }}>
          {[
            { key:'home',     icon:'🏠', label:'홈' },
            { key:'orders',   icon:'📦', label:'주문/배송' },
            { key:'wishlist', icon:'❤️', label:'찜 목록' },
            { key:'benefits', icon: member.member_type === '일반' ? '⭐' : '💼', label: member.member_type === '일반' ? '등급/혜택' : '유통 혜택' },
            { key:'settings', icon:'⚙️', label:'설정' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} className="mp-tab"
              style={{ flex:1, padding:'12px 6px', borderRadius:'15px', border:'none', cursor:'pointer', fontWeight:800, transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:'5px',
                background: tab === t.key ? tc.gradient : 'transparent',
                color: tab === t.key ? 'white' : D.sub,
                boxShadow: tab === t.key ? `0 8px 20px ${tc.color}45` : 'none',
                transform: tab === t.key ? 'translateY(-1px)' : 'none' }}>
              <span style={{ fontSize:'22px', lineHeight:1 }}>{t.icon}</span>
              <span className="mp-tab-label" style={{ fontSize:'12px', whiteSpace:'nowrap' }}>{t.label}</span>
            </button>
          ))}
        </div>

        </div>{/* /mp-side */}
        <div className="mp-main">

        {/* ════════════════ TAB: HOME ════════════════ */}
        {tab === 'home' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

            {/* 승인 대기 배너 */}
            {member.member_type !== '일반' && member.status === '대기중' && (
              <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'16px', padding:'16px' }}>
                <p style={{ color:'#f59e0b', fontWeight:700, fontSize:'13px', margin:'0 0 4px' }}>⏳ 승인 대기 중</p>
                <p style={{ color:dark?'rgba(255,200,0,0.6)':'#92400e', fontSize:'12px', margin:0, lineHeight:1.7 }}>
                  관리자 확인 후 1~2 영업일 내에 승인 연락을 드려요. 승인 후 유통가 혜택을 이용하실 수 있습니다.
                </p>
              </div>
            )}

            {/* 회원 정보 카드 */}
            <div style={{ background:D.card, borderRadius:'20px', padding:'20px', border:`1px solid ${D.border}` }}>
              <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 14px' }}>👤 회원 정보</p>
              {[
                { label:'이름',   value: member.name },
                { label:'이메일', value: member.email },
                { label:'연락처', value: member.contact },
                { label:'가입일', value: new Date(member.created_at).toLocaleDateString('ko-KR') },
                ...(member.member_type !== '일반' ? [
                  { label:'업체명',     value: member.business_name  || '-' },
                  { label:'사업자번호', value: member.business_number || '-' },
                  { label:'승인 상태',  value: member.status },
                ] : []),
              ].map((row, i, arr) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < arr.length-1 ? `1px solid ${D.border}` : 'none' }}>
                  <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>{row.label}</p>
                  <p style={{ fontSize:'13px', fontWeight:600, color: row.label === '승인 상태' ? (row.value==='승인'?'#22c55e':row.value==='대기중'?'#f59e0b':'#ef4444') : D.text, margin:0 }}>{row.value}</p>
                </div>
              ))}
            </div>

            {/* 퀵 메뉴 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {[
                { icon:'📦', label:'주문 내역',       sub:`총 ${orders.length}건`,                     onClick: () => setTab('orders') },
                { icon:'💰', label:'쇼핑 포인트',     sub:'0 P (준비 중)',                              onClick: () => {} },
                { icon: member.member_type==='일반' ? '⭐' : '💼',
                  label: member.member_type==='일반' ? '회원 등급' : '유통 혜택',
                  sub:   member.member_type==='일반' ? `${curGrade.icon} ${curGrade.name}` : (member.status==='승인'?'이용 가능':'승인 후 이용'),
                  onClick: () => setTab('benefits') },
                { icon:'🛒', label:'쇼핑 계속하기',   sub:'신선한 상품 보러 가기',                      onClick: () => router.push('/shop') },
              ].map((item, i) => (
                <button key={i} onClick={item.onClick}
                  style={{ background:D.card, border:`1px solid ${D.border}`, borderRadius:'18px', padding:'18px 16px', textAlign:'left', cursor:'pointer', transition:'transform 0.15s', display:'block', width:'100%' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  <p style={{ fontSize:'26px', margin:'0 0 10px' }}>{item.icon}</p>
                  <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 2px' }}>{item.label}</p>
                  <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>{item.sub}</p>
                </button>
              ))}
            </div>

            {/* 최근 주문 미리보기 */}
            {orders.length > 0 && (
              <div style={{ background:D.card, borderRadius:'20px', padding:'20px', border:`1px solid ${D.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                  <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:0 }}>📦 최근 주문</p>
                  <button onClick={() => setTab('orders')} style={{ fontSize:'11px', color:tc.color, fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>전체 보기 →</button>
                </div>
                {orders.slice(0, 2).map(order => (
                  <div key={order.id} style={{ background:D.input, borderRadius:'14px', padding:'14px', marginBottom:'8px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                      <p style={{ fontSize:'12px', fontWeight:700, color:D.text, margin:0 }}>{order.order_number || `#${order.id.slice(0,8).toUpperCase()}`}</p>
                      <OrderBadge status={order.status} />
                    </div>
                    <p style={{ fontSize:'15px', fontWeight:900, color:tc.color, margin:'0 0 2px' }}>{order.total_amount.toLocaleString()}원</p>
                    <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>{new Date(order.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 로그아웃 */}
            <button onClick={handleLogout}
              style={{ width:'100%', padding:'14px', borderRadius:'14px', border:`1.5px solid ${D.border}`, background:'transparent', color:D.sub, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
              로그아웃
            </button>
          </div>
        )}

        {/* ════════════════ TAB: ORDERS ════════════════ */}
        {tab === 'orders' && (
          <div className="my-orders" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {orders.length === 0 ? (
              <div style={{ gridColumn:'1 / -1', background:D.card, borderRadius:'24px', padding:'56px 20px', textAlign:'center', border:`1px solid ${D.border}` }}>
                <p style={{ fontSize:'52px', margin:'0 0 16px' }}>📭</p>
                <p style={{ fontWeight:800, fontSize:'16px', color:D.text, margin:'0 0 6px' }}>아직 주문 내역이 없어요</p>
                <p style={{ fontSize:'13px', color:D.sub, margin:'0 0 24px' }}>마음에 드는 상품을 찾아보세요</p>
                <button onClick={() => router.push('/shop')}
                  style={{ background:tc.gradient, color:'white', border:'none', borderRadius:'14px', padding:'13px 28px', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>
                  쇼핑하러 가기 →
                </button>
              </div>
            ) : orders.map(order => (
              <div key={order.id} style={{ background:D.card, borderRadius:'20px', border:`1px solid ${D.border}`, overflow:'hidden' }}>

                {/* 주문 헤더 */}
                <div style={{ padding:'18px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 3px' }}>{order.order_number || `#${order.id.slice(0,8).toUpperCase()}`}</p>
                      <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>{new Date(order.created_at).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })}</p>
                    </div>
                    <OrderBadge status={order.status} />
                  </div>

                  {/* 배송 진행 단계 */}
                  <div style={{ marginBottom:'14px' }}>
                    <div style={{ display:'flex', alignItems:'center', marginBottom:'8px' }}>
                      {STATUS_LABEL.map((s, i) => {
                        const done    = i <= (STATUS_STEP[order.status] || 0)
                        const current = i === (STATUS_STEP[order.status] || 0)
                        return (
                          <div key={i} style={{ display:'flex', alignItems:'center', flex: i < 3 ? 1 : 'none' }}>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                              <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0, transition:'all 0.3s',
                                background: done ? tc.gradient : D.input,
                                color: done ? 'white' : D.sub,
                                boxShadow: current ? `0 0 0 3px ${tc.color}33` : 'none' }}
                                className="status-circle">
                                {done ? (current ? STATUS_ICON[i] : '✓') : i+1}
                              </div>
                              <p style={{ fontSize:'9px', fontWeight: current ? 700 : 400, color: done ? tc.color : D.sub, margin:0, whiteSpace:'nowrap' }} className="status-label">{s}</p>
                            </div>
                            {i < 3 && (
                              <div style={{ flex:1, height:'2px', background: i < (STATUS_STEP[order.status]||0) ? tc.color : D.border, margin:'0 4px 16px', borderRadius:'2px', transition:'background 0.3s' }} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <p style={{ fontSize:'18px', fontWeight:900, color:tc.color, margin:0 }}>{order.total_amount.toLocaleString()}원</p>
                  </div>
                </div>

                {/* 주문 상세 (항상 표시) */}
                <div style={{ borderTop:`1px solid ${D.border}`, padding:'16px 20px', background:D.card2 }}>
                    <p style={{ fontSize:'11px', fontWeight:700, color:D.sub, margin:'0 0 10px', letterSpacing:'0.06em' }}>주문 상품</p>
                    {itemsLoading === order.id ? (
                      <div style={{ textAlign:'center', padding:'16px', color:D.sub, fontSize:'12px' }}>불러오는 중...</div>
                    ) : (orderItems[order.id] || []).length === 0 ? (
                      <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>상품 정보가 없어요</p>
                    ) : (orderItems[order.id] || []).map((item, i, arr) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < arr.length-1 ? `1px solid ${D.border}` : 'none' }}>
                        <div>
                          <p style={{ fontSize:'13px', fontWeight:600, color:D.text, margin:'0 0 2px' }}>{item.product_name}</p>
                          <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>{item.quantity}{item.unit} × {item.unit_price.toLocaleString()}원</p>
                        </div>
                        <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:0 }}>{item.total_price.toLocaleString()}원</p>
                      </div>
                    ))}
                    <div style={{ marginTop:'12px', display:'flex', flexDirection:'column', gap:'4px' }}>
                      {order.address      && <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>📍 {order.address}</p>}
                      {order.payment_method && <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>💳 {order.payment_method}</p>}
                      {order.note         && <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>📝 {order.note}</p>}
                      {order.tracking_number && <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>🚚 {courierName(order.courier_code || '')} {order.tracking_number}</p>}
                    </div>
                    {order.tracking_number && (
                      <button onClick={() => openTracking(order)} className="mp-track-btn"
                        style={{ marginTop:'14px', width:'100%', padding:'16px', borderRadius:'14px', border:'none', background:tc.gradient, color:'white', fontSize:'16px', fontWeight:800, cursor:'pointer', boxShadow:`0 8px 20px ${tc.color}40` }}>
                        🚚 실시간 배송조회
                      </button>
                    )}
                    {order.status === '접수' && (
                      <button
                        onClick={async () => {
                          if (!confirm('주문을 취소하시겠습니까?')) return
                          const table = member?.member_type === '도매업' ? 'wholesale_orders' : member?.member_type === '소매업' ? 'retail_orders' : 'general_orders'
                          await supabase.from(table).update({ status: '취소', updated_at: new Date().toISOString() }).eq('id', order.id)
                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: '취소' } : o))
                        }}
                        style={{ marginTop:'14px', width:'100%', padding:'12px', borderRadius:'12px', border:'1.5px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.06)', color:'#ef4444', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                        🚫 주문 취소
                      </button>
                    )}
                  </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════ TAB: WISHLIST ════════════════ */}
        {tab === 'wishlist' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
              <p style={{ fontSize:'15px', fontWeight:800, color:D.text, margin:0 }}>❤️ 찜한 상품 <span style={{ color:D.sub, fontSize:'13px', fontWeight:500 }}>{wishlists.length}개</span></p>
            </div>
            {wishlists.length === 0 ? (
              <div style={{ background:D.card, borderRadius:'20px', padding:'48px 20px', textAlign:'center', border:`1px solid ${D.border}` }}>
                <p style={{ fontSize:'40px', marginBottom:'12px' }}>🤍</p>
                <p style={{ fontSize:'14px', color:D.sub, margin:'0 0 16px' }}>찜한 상품이 없어요</p>
                <a href="/shop" style={{ display:'inline-block', padding:'10px 20px', borderRadius:'12px', background:tc.gradient, color:'white', fontSize:'13px', fontWeight:700, textDecoration:'none' }}>
                  쇼핑하러 가기
                </a>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'14px' }}>
                {wishlists.map((w: any) => {
                  const p = w.products
                  if (!p) return null
                  const wishPrice = member.member_type === '도매업' ? (p.wholesale_price||0)
                    : member.member_type === '소매업' ? (p.member_price||0)
                    : (p.retail_price||0)
                  return (
                    <a key={w.id} href={`/shop/product/${p.id}`} style={{ textDecoration:'none', display:'block', background:D.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${D.border}`, transition:'transform 0.15s' }}>
                      <div style={{ width:'100%', paddingTop:'100%', position:'relative', background:dark?'#1e2530':'#f8fafc' }}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                          : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px' }}>🧺</div>
                        }
                        {p.stock === 0 && (
                          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ background:'rgba(0,0,0,0.7)', color:'white', fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'20px' }}>품절</span>
                          </div>
                        )}
                        {/* 찜 해제 */}
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeWishlist(w.id) }} aria-label="찜 해제"
                          style={{ position:'absolute', top:'8px', right:'8px', width:'30px', height:'30px', borderRadius:'50%', border:'none', cursor:'pointer', background:'rgba(255,255,255,0.92)', fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', backdropFilter:'blur(4px)' }}>❤️</button>
                      </div>
                      <div style={{ padding:'10px 12px' }}>
                        <p style={{ fontSize:'13px', fontWeight:700, color:D.text, margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                        <p style={{ fontSize:'14px', fontWeight:900, color:tc.color, margin:0 }}>{wishPrice.toLocaleString()}원</p>
                        <p style={{ fontSize:'10px', color:D.sub, margin:'2px 0 0' }}>/{p.unit}</p>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════ TAB: BENEFITS ════════════════ */}
        {tab === 'benefits' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

            {/* ─── 일반 회원: 등급 + 포인트 ─── */}
            {member.member_type === '일반' && (
              <>
                {/* 등급 카드 */}
                <div style={{ background:D.card, borderRadius:'24px', padding:'24px', border:`1px solid ${D.border}` }}>
                  <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 20px' }}>⭐ 내 등급</p>
                  <div style={{ textAlign:'center', marginBottom:'24px' }}>
                    <div style={{ fontSize:'52px', marginBottom:'8px' }}>{curGrade.icon}</div>
                    <p style={{ fontSize:'26px', fontWeight:900, color:curGrade.color, margin:'0 0 4px' }}>{curGrade.name}</p>
                    <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>누적 {totalAmount.toLocaleString()}원 구매</p>
                  </div>
                  {nextGrade && (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                        <p style={{ fontSize:'11px', color:D.sub, margin:0, fontWeight:600 }}>{curGrade.name}</p>
                        <p style={{ fontSize:'11px', color:D.sub, margin:0, fontWeight:600 }}>다음: {nextGrade.name} ({nextGrade.min.toLocaleString()}원)</p>
                      </div>
                      <div style={{ height:'8px', background:D.input, borderRadius:'8px', overflow:'hidden' }}>
                        <div style={{ height:'100%', background:tc.gradient, borderRadius:'8px', width:`${gradeProgress}%`, transition:'width 1s ease' }} />
                      </div>
                      <p style={{ fontSize:'11px', color:D.sub, margin:'8px 0 0', textAlign:'center' }}>
                        {nextGrade.name}까지 <strong style={{ color:tc.color }}>{(nextGrade.min - totalAmount).toLocaleString()}원</strong> 남았어요
                      </p>
                    </div>
                  )}
                  {!nextGrade && <p style={{ textAlign:'center', fontSize:'13px', color:'#ec4899', fontWeight:700, margin:0 }}>🎉 최고 등급 달성!</p>}
                </div>

                {/* 등급별 혜택 표 */}
                <div style={{ background:D.card, borderRadius:'20px', padding:'20px', border:`1px solid ${D.border}` }}>
                  <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 14px' }}>🎁 등급별 혜택</p>
                  {[
                    { grade:'🛒 일반', benefit:'기본 소매가 구매',         range:'0원~',     active: curGrade.name==='일반' },
                    { grade:'🥈 실버', benefit:'소매가 3% 할인 쿠폰',      range:'50만원~',  active: curGrade.name==='실버' },
                    { grade:'🥇 골드', benefit:'소매가 5% 할인 + 우선 배송', range:'200만원~', active: curGrade.name==='골드' },
                    { grade:'💎 VIP',  benefit:'소매가 10% 할인 + 전담 CS', range:'500만원~', active: curGrade.name==='VIP' },
                  ].map((g, i, arr) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom: i < arr.length-1 ? `1px solid ${D.border}` : 'none', opacity: g.active ? 1 : 0.45 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        {g.active && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:tc.color, flexShrink:0 }} />}
                        <div>
                          <p style={{ fontSize:'13px', fontWeight: g.active ? 800 : 600, color:D.text, margin:'0 0 2px' }}>{g.grade}</p>
                          <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>{g.benefit}</p>
                        </div>
                      </div>
                      <p style={{ fontSize:'11px', color: g.active ? tc.color : D.sub, fontWeight: g.active ? 700 : 400, margin:0, flexShrink:0 }}>{g.range}</p>
                    </div>
                  ))}
                </div>

                {/* 포인트 */}
                <div style={{ background:D.card, borderRadius:'20px', padding:'20px', border:`1px solid ${D.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                    <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:0 }}>💰 쇼핑 포인트</p>
                    <span style={{ fontSize:'10px', color:'#f59e0b', fontWeight:700, background:'rgba(245,158,11,0.12)', padding:'3px 8px', borderRadius:'20px' }}>준비 중</span>
                  </div>
                  <p style={{ fontSize:'36px', fontWeight:900, color:tc.color, margin:'0 0 4px', letterSpacing:'-1px' }}>0<span style={{ fontSize:'16px', fontWeight:600, color:D.sub, marginLeft:'4px' }}>P</span></p>
                  <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>구매금액의 1% 포인트 적립 예정</p>
                </div>
              </>
            )}

            {/* ─── 소매업 / 도매업: 유통 혜택 ─── */}
            {(member.member_type === '소매업' || member.member_type === '도매업') && (
              <>
                {/* 승인 상태 */}
                <div style={{
                  background: member.status==='승인' ? 'rgba(34,197,94,0.08)' : member.status==='대기중' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${member.status==='승인' ? 'rgba(34,197,94,0.25)' : member.status==='대기중' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  borderRadius:'16px', padding:'18px'
                }}>
                  <p style={{ fontWeight:800, fontSize:'15px', margin:'0 0 5px',
                    color: member.status==='승인' ? '#22c55e' : member.status==='대기중' ? '#f59e0b' : '#ef4444' }}>
                    {member.status==='승인' ? '✅ 유통 회원 이용 가능' : member.status==='대기중' ? '⏳ 승인 대기 중' : '❌ 이용 거절됨'}
                  </p>
                  <p style={{ fontSize:'12px', color:D.sub, margin:0, lineHeight:1.7 }}>
                    {member.status==='승인'
                      ? `${member.member_type} 유통가 혜택을 정상적으로 이용하실 수 있습니다.`
                      : member.status==='대기중'
                      ? '관리자 확인 후 1~2 영업일 내 승인 연락을 드려요.'
                      : '이용이 거절되었습니다. 관리자에게 문의해 주세요.'}
                  </p>
                </div>

                {/* 혜택 목록 */}
                <div style={{ background:D.card, borderRadius:'20px', padding:'20px', border:`1px solid ${D.border}` }}>
                  <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 14px' }}>
                    {member.member_type==='소매업' ? '🏪 소매 유통 혜택' : '🏭 도매 유통 혜택'}
                  </p>
                  {(member.member_type === '소매업' ? [
                    { icon:'💰', title:'소매 유통가 적용',   desc:'일반 소매가보다 저렴한 전용 유통가로 구매하실 수 있어요.' },
                    { icon:'🚚', title:'대량 주문 우선 처리', desc:'대량 발주 시 우선 처리 및 빠른 배송을 지원합니다.' },
                    { icon:'📋', title:'세금계산서 발행',     desc:'사업자 세금계산서 발행이 가능합니다.' },
                    { icon:'📞', title:'전담 상담 배정',      desc:'소매 유통 전담 상담원이 배정되어 빠른 응대가 가능합니다.' },
                  ] : [
                    { icon:'💰', title:'도매 유통가 적용',    desc:'최저가 도매 유통가로 대량 구매하실 수 있어요.' },
                    { icon:'🏭', title:'전용 발주 라인',      desc:'도매 전용 주문 채널과 빠른 처리로 운영 효율을 높이세요.' },
                    { icon:'📋', title:'세금계산서 발행',      desc:'월별 합산 세금계산서 발행이 가능합니다.' },
                    { icon:'📊', title:'거래 명세서 제공',     desc:'월별 거래 내역 및 명세서를 발행해 드립니다.' },
                    { icon:'💳', title:'후불 결제 협의',      desc:'거래 실적에 따라 후불 결제 조건 협의가 가능합니다.' },
                  ]).map((b, i, arr) => (
                    <div key={i} style={{ display:'flex', gap:'14px', padding:'14px 0', borderBottom: i < arr.length-1 ? `1px solid ${D.border}` : 'none', alignItems:'flex-start' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:tc.gradient, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{b.icon}</div>
                      <div>
                        <p style={{ fontSize:'13px', fontWeight:700, color:D.text, margin:'0 0 3px' }}>{b.title}</p>
                        <p style={{ fontSize:'12px', color:D.sub, margin:0, lineHeight:1.65 }}>{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 사업자 정보 */}
                {(member.business_name || member.business_number) && (
                  <div style={{ background:D.card, borderRadius:'20px', padding:'20px', border:`1px solid ${D.border}` }}>
                    <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 14px' }}>🏢 사업자 정보</p>
                    {[
                      { label:'업체명',     value: member.business_name },
                      { label:'사업자번호', value: member.business_number },
                      { label:'연락처',     value: member.contact },
                    ].filter(r => r.value).map((row, i, arr) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < arr.length-1 ? `1px solid ${D.border}` : 'none' }}>
                        <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>{row.label}</p>
                        <p style={{ fontSize:'13px', fontWeight:600, color:D.text, margin:0 }}>{row.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 도매 전용: 월별 거래 요약 */}
                {member.member_type === '도매업' && orders.length > 0 && (
                  <div style={{ background:D.card, borderRadius:'20px', padding:'20px', border:`1px solid ${D.border}` }}>
                    <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 14px' }}>📊 거래 요약</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                      {[
                        { label:'총 주문 횟수', value:`${orders.length}건` },
                        { label:'누적 거래액',  value:`${(totalAmount/10000).toFixed(0)}만원` },
                        { label:'평균 주문액',  value:`${orders.length > 0 ? Math.floor(totalAmount/orders.length).toLocaleString() : 0}원` },
                        { label:'최근 주문',    value: orders[0] ? new Date(orders[0].created_at).toLocaleDateString('ko-KR', {month:'short',day:'numeric'}) : '-' },
                      ].map((s, i) => (
                        <div key={i} style={{ background:D.input, borderRadius:'14px', padding:'14px', textAlign:'center' }}>
                          <p style={{ fontSize:'10px', color:D.sub, margin:'0 0 5px' }}>{s.label}</p>
                          <p style={{ fontSize:'16px', fontWeight:900, color:tc.color, margin:0 }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ════════════════ TAB: SETTINGS ════════════════ */}
        {tab === 'settings' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

            {/* 기본 배송지 */}
            <div style={{ background:D.card, borderRadius:'20px', padding:'22px', border:`1px solid ${D.border}` }}>
              <p style={{ fontSize:'14px', fontWeight:800, color:D.text, margin:'0 0 4px' }}>📍 기본 배송지</p>
              <p style={{ fontSize:'12px', color:D.sub, margin:'0 0 14px' }}>주소 검색으로 도로명/지번을 찾고, 상세주소(동·호수)는 직접 적어주세요. 저장해두면 주문할 때 자동 입력돼요.</p>
              <button onClick={async () => { const r = await openPostcode(); if (r) { setAddrInput(r.address + ' '); setAddrMsg('') } }}
                style={{ width:'100%', marginBottom:'10px', padding:'12px', borderRadius:'12px', border:`2px dashed ${D.border}`, background:D.input, color:D.text, fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
                🔍 주소 검색
              </button>
              <textarea value={addrInput} onChange={e => { setAddrInput(e.target.value); setAddrMsg('') }}
                placeholder="주소 검색 후 상세주소(동·호수)를 입력해주세요"
                rows={2}
                style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', resize:'none', boxSizing:'border-box', lineHeight:1.6, fontFamily:'inherit' }} />
              {addrMsg && <p style={{ fontSize:'12px', fontWeight:700, color: addrMsg.startsWith('✅') ? '#16a34a' : '#ef4444', margin:'10px 0 0' }}>{addrMsg}</p>}
              <button onClick={saveAddress} disabled={addrSaving}
                style={{ width:'100%', marginTop:'12px', padding:'13px', borderRadius:'12px', border:'none', cursor: addrSaving ? 'not-allowed' : 'pointer', background: addrSaving ? D.input : tc.gradient, color: addrSaving ? D.sub : 'white', fontSize:'14px', fontWeight:800 }}>
                {addrSaving ? '저장 중...' : '배송지 저장'}
              </button>
            </div>

            {/* 비밀번호 변경 */}
            <div style={{ background:D.card, borderRadius:'20px', padding:'22px', border:`1px solid ${D.border}` }}>
              <p style={{ fontSize:'14px', fontWeight:800, color:D.text, margin:'0 0 4px' }}>🔑 비밀번호 변경</p>
              <p style={{ fontSize:'12px', color:D.sub, margin:'0 0 14px' }}>새 비밀번호를 두 번 입력하면 바로 변경돼요. (6자 이상)</p>
              <input type="password" value={pw1} onChange={e => { setPw1(e.target.value); setPwMsg('') }}
                placeholder="새 비밀번호"
                style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'10px' }} />
              <input type="password" value={pw2} onChange={e => { setPw2(e.target.value); setPwMsg('') }}
                placeholder="새 비밀번호 확인"
                style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
              {pwMsg && <p style={{ fontSize:'12px', fontWeight:700, color: pwMsg.startsWith('✅') ? '#16a34a' : '#ef4444', margin:'10px 0 0' }}>{pwMsg}</p>}
              <button onClick={changePassword} disabled={pwSaving}
                style={{ width:'100%', marginTop:'12px', padding:'13px', borderRadius:'12px', border:'none', cursor: pwSaving ? 'not-allowed' : 'pointer', background: pwSaving ? D.input : tc.gradient, color: pwSaving ? D.sub : 'white', fontSize:'14px', fontWeight:800 }}>
                {pwSaving ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ── 배송조회 모달 ── */}
      {trackModal && (
        <div onClick={() => setTrackModal(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:D.card, width:'100%', maxWidth:'560px', maxHeight:'88vh', overflowY:'auto', borderRadius:'28px', border:`1px solid ${D.border}` }}>
            <div style={{ position:'sticky', top:0, background:tc.gradient, padding:'24px 26px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <p style={{ fontSize:'22px', fontWeight:900, color:'white', margin:0 }}>🚚 배송 조회</p>
              <button onClick={() => setTrackModal(false)} style={{ width:'42px', height:'42px', borderRadius:'14px', background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', color:'white', fontSize:'20px' }}>✕</button>
            </div>
            <div style={{ padding:'26px' }}>
              {trackLoading ? (
                <div style={{ textAlign:'center', padding:'50px 0' }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'50%', border:'4px solid '+tc.color, borderTopColor:'transparent', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
                  <p style={{ fontSize:'17px', color:D.sub, margin:0, fontWeight:600 }}>배송 정보를 불러오는 중...</p>
                </div>
              ) : !trackData?.ok ? (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <p style={{ fontSize:'56px', margin:'0 0 14px' }}>📦</p>
                  <p style={{ fontSize:'17px', color:D.text, margin:0, lineHeight:1.7, fontWeight:700 }}>{trackData?.error || '배송 정보를 찾을 수 없어요.'}</p>
                </div>
              ) : (
                <>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', flexWrap:'wrap', gap:'8px' }}>
                    <p style={{ fontSize:'20px', fontWeight:900, color:D.text, margin:0 }}>{trackData.courierName}</p>
                    <span style={{ fontSize:'15px', fontWeight:800, padding:'6px 16px', borderRadius:'100px', background: trackData.completed ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)', color: trackData.completed ? '#16a34a' : '#d97706' }}>
                      {trackData.completed ? '✅ 배송완료' : '🚚 배송중'}
                    </span>
                  </div>
                  <p style={{ fontSize:'15px', color:D.sub, margin:'0 0 24px', fontWeight:600 }}>송장번호 {trackData.invoiceNo}</p>

                  {(!trackData.steps || trackData.steps.length === 0) ? (
                    <p style={{ fontSize:'16px', color:D.sub, textAlign:'center', padding:'28px 0', fontWeight:600 }}>아직 배송 이력이 없어요.<br/>집화 후 표시됩니다.</p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      {[...trackData.steps].reverse().map((s: any, i: number) => (
                        <div key={i} style={{ display:'flex', gap:'16px' }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <div style={{ width:'18px', height:'18px', borderRadius:'50%', background: i===0 ? tc.color : D.border, flexShrink:0, marginTop:'4px', boxShadow: i===0 ? `0 0 0 5px ${tc.color}25` : 'none' }} />
                            {i < trackData.steps.length - 1 && <div style={{ width:'3px', flex:1, background:D.border, minHeight:'30px' }} />}
                          </div>
                          <div style={{ paddingBottom:'22px' }}>
                            <p style={{ fontSize:'17px', fontWeight: i===0 ? 900 : 700, color: i===0 ? D.text : D.sub, margin:'0 0 4px' }}>{s.kind || '이동중'}</p>
                            <p style={{ fontSize:'15px', color:D.sub, margin:0, lineHeight:1.5 }}>{s.where} {s.time && `· ${s.time}`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

        </div>{/* /mp-main */}
        </div>{/* /mp-layout */}

      {/* ── 하단 고정 탭바 ── */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:dark?'rgba(13,17,23,0.97)':'rgba(255,255,255,0.97)', backdropFilter:'blur(20px)', borderTop:`1px solid ${D.border}`, padding:'10px 0 16px', display:'flex', justifyContent:'space-around', zIndex:50 }}>
        {[
          { icon:'🏠', label:'홈',  href:'/shop',        active:false },
          { icon:'🔍', label:'상품', href:'/shop',        active:false },
          { icon:'👤', label:'마이', href:'/shop/mypage', active:true  },
        ].map((item, i) => (
          <Link key={i} href={item.href}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', textDecoration:'none', opacity: item.active ? 1 : 0.9 }}>
            <span style={{ fontSize:'24px', filter: dark ? 'brightness(1.25) drop-shadow(0 1px 2px rgba(0,0,0,0.4))' : 'none' }}>{item.icon}</span>
            <span style={{ fontSize:'11px', fontWeight:700, color: item.active ? tc.color : (dark ? '#cbd5e1' : D.sub) }}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes mpFadeUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
        @keyframes mpFloat { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-14px) rotate(4deg); } }
        @keyframes mpBlob { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(14px,-10px) scale(1.12); } }
        @keyframes mpWave { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-40px); } }

        .hero-card { animation: mpFadeUp 0.6s ease both; }
        .hero-float { animation-name: mpFloat; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .hero-blob { animation: mpBlob 7s ease-in-out infinite; }
        .hero-blob2 { animation: mpBlob 9s ease-in-out infinite reverse; }
        .hero-wave { animation: mpWave 8s ease-in-out infinite; }
        .hero-avatar { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .hero-card:hover .hero-avatar { transform: scale(1.08) rotate(-6deg); }

        /* 통계칸 hover */
        .stat-card { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.25s; }
        .stat-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.26) !important; }

        /* 탭 hover */
        .mp-tab:hover { transform: translateY(-2px); filter: brightness(1.06); }
        .mp-tab:active { transform: scale(0.96); }

        /* 카드 등장 + hover 부양 */
        .my-orders > div { animation: mpFadeUp 0.5s ease both; transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s; }
        .my-orders > div:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(0,0,0,0.1); }

        /* 버튼/카드 hover 공통 */
        .mp-track-btn { transition: transform 0.2s, filter 0.2s; }
        .mp-track-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
        .mp-track-btn:active { transform: scale(0.97); }
        .quick-card { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s; }
        .quick-card:hover { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(0,0,0,0.1); }
        button, a { -webkit-tap-highlight-color: transparent; }

        /* PC: 좌우 2단 대시보드 (왼쪽 프로필+메뉴 고정 / 오른쪽 콘텐츠 꽉) */
        @media (min-width: 900px) {
          .mp-layout { display: grid; grid-template-columns: 340px 1fr; gap: 26px; align-items: start; }
          .mp-side { position: sticky; top: 84px; }
          .mp-tabs { flex-direction: column !important; }
          .mp-tab { flex-direction: row !important; justify-content: flex-start !important; gap: 12px !important; padding: 16px 18px !important; }
          .mp-tab-label { font-size: 16px !important; }
          .my-orders { display: grid !important; grid-template-columns: 1fr 1fr; gap: 18px !important; align-items: start; }
        }
        /* 모바일/태블릿: 위아래 스택 */
        @media (max-width: 899px) {
          .mp-layout { display: block; }
        }

        @media (max-width: 640px) {
          .hero-card { padding: 28px 22px !important; }
          .hero-avatar { width: 64px !important; height: 64px !important; font-size: 30px !important; }
          /* 주문 배송 단계 - 작은 화면에서 원 크기 축소 */
          .status-circle {
            width: 24px !important;
            height: 24px !important;
            font-size: 10px !important;
          }
          .status-label {
            font-size: 8px !important;
          }
          /* 3열 통계 - 아주 작은 화면 대응 */
          .stat-grid {
            gap: 6px !important;
          }
          .stat-card {
            padding: 10px 4px !important;
          }
          .stat-value {
            font-size: 12px !important;
          }
          /* 퀵메뉴 카드 패딩 축소 */
          .quick-card {
          /* 주문 배송 단계 - 작은 화면에서 원 크기 축소 */
          .status-circle {
            width: 24px !important;
            height: 24px !important;
            font-size: 10px !important;
          }
          .status-label {
            font-size: 8px !important;
          }
          /* 3열 통계 - 아주 작은 화면 대응 */
          .stat-grid {
            gap: 6px !important;
          }
          .stat-card {
            padding: 10px 4px !important;
          }
          .stat-value {
            font-size: 12px !important;
          }
          /* 퀵메뉴 카드 패딩 축소 */
          .quick-card {
            padding: 14px 12px !important;
          }
        }

        @media (max-width: 360px) {
          /* 아주 작은 기기 - 통계 2열로 변경 */
          .stat-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

// ── 배지 컴포넌트 ──
function OrderBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    '접수':  { bg:'rgba(59,130,246,0.12)',   color:'#3b82f6' },
    '준비중':{ bg:'rgba(245,158,11,0.12)',   color:'#f59e0b' },
    '출고':  { bg:'rgba(13,148,136,0.12)',  color:'#0d9488' },
    '완료':  { bg:'rgba(34,197,94,0.12)',   color:'#22c55e' },
    '취소':  { bg:'rgba(239,68,68,0.12)',   color:'#ef4444' },
  }
  const s = styles[status] || styles['접수']
  const step = STATUS_STEP[status] || 0
  return (
    <span style={{ fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'20px', background:s.bg, color:s.color, flexShrink:0 }}>
      {STATUS_ICON[step]} {status}
    </span>
  )
}

