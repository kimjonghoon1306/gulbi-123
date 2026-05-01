'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Member = {
  id: string; email: string; name: string; contact: string
  member_type: '일반' | '소매업' | '도매업'
  business_name: string; business_number: string
  status: string; created_at: string
}

type Order = {
  id: string; order_number: string; customer_name: string; contact: string
  address: string; note: string; payment_method: string; status: string
  total_amount: number; created_at: string
}

type OrderItem = {
  id: string; product_name: string; quantity: number; unit: string
  unit_price: number; total_price: number
}

const STATUS_STEP: Record<string, number> = { '접수': 0, '준비중': 1, '출고': 2, '완료': 3 }
const STATUS_LABEL = ['접수', '준비중', '출고', '완료']
const STATUS_ICON = ['📋', '📦', '🚚', '✅']

const TYPE_CONFIG = {
  '일반':  { color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', label: '일반 구매자', icon: '🛒', badge: '일반회원' },
  '소매업': { color: '#0f766e', gradient: 'linear-gradient(135deg,#0f766e,#0891b2)', label: '소매 유통',   icon: '🏪', badge: '소매회원' },
  '도매업': { color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed,#db2777)', label: '도매 유통',   icon: '🏭', badge: '도매회원' },
}

const GRADE_INFO = [
  { name: '일반', icon: '🛒', min: 0,       max: 500000,   color: '#6b7280' },
  { name: '실버', icon: '🥈', min: 500000,  max: 2000000,  color: '#94a3b8' },
  { name: '골드', icon: '🥇', min: 2000000, max: 5000000,  color: '#f59e0b' },
  { name: 'VIP',  icon: '💎', min: 5000000, max: Infinity, color: '#ec4899' },
]

export default function MyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [member, setMember]           = useState<Member | null>(null)
  const [orders, setOrders]           = useState<Order[]>([])
  const [orderItems, setOrderItems]   = useState<Record<string, OrderItem[]>>({})
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<'home' | 'orders' | 'benefits'>('home')
  const [dark, setDark]               = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [itemsLoading, setItemsLoading]   = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/shop/login'); return }
      const { data: m } = await supabase.from('shop_members').select('*').eq('id', user.id).single()
      if (!m) {
        // shop_members에 없으면 기본값으로 마이페이지 표시 (관리자 등)
        setMember({
          id: user.id,
          email: user.email || '',
          name: user.email?.split('@')[0] || '회원',
          contact: '',
          member_type: '일반',
          business_name: '',
          business_number: '',
          status: '승인',
          created_at: new Date().toISOString()
        })
        setOrders([])
        setLoading(false)
        return
      }
      setMember(m)
      const table = m.member_type === '도매업' ? 'wholesale_orders' : m.member_type === '소매업' ? 'retail_orders' : 'general_orders'
      // user_id로 먼저 조회, 없으면 contact로 조회
      let { data: o } = await supabase.from(table).select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (!o || o.length === 0) {
        const { data: o2 } = await supabase.from(table).select('*').eq('contact', m.contact).order('created_at', { ascending: false })
        o = o2
      }
      setOrders(o || [])
      setLoading(false)
    } catch (e) {
      console.error('fetchData error:', e)
      setLoading(false)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)
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

  const toggleOrder = async (orderId: string) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return }
    if (!orderItems[orderId]) {
      setItemsLoading(orderId)
      const table = member?.member_type === '도매업' ? 'wholesale_order_items' : member?.member_type === '소매업' ? 'retail_order_items' : 'general_order_items'
      const { data } = await supabase.from(table).select('*').eq('order_id', orderId)
      setOrderItems(prev => ({ ...prev, [orderId]: data || [] }))
      setItemsLoading(null)
    }
    setExpandedOrder(orderId)
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
        <div style={{ maxWidth:'680px', margin:'0 auto', padding:'0 20px', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <Link href="/shop" style={{ width:'36px', height:'36px', borderRadius:'10px', background:D.input, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', textDecoration:'none', color:D.text, flexShrink:0 }}>←</Link>
            <p style={{ fontWeight:800, fontSize:'16px', margin:0 }}>마이페이지</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ background:tc.gradient, color:'white', fontSize:'10px', fontWeight:700, padding:'4px 10px', borderRadius:'20px' }}>{tc.badge}</div>
            <button onClick={toggleDark} style={{ width:'36px', height:'36px', borderRadius:'10px', background:D.input, border:'none', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {dark ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'20px 20px 100px' }}>

        {/* ── 프로필 히어로 ── */}
        <div style={{ background:tc.gradient, borderRadius:'28px', padding:'28px 24px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
          {/* 배경 원형 장식 */}
          <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
          <div style={{ position:'absolute', bottom:'-40px', left:'30%', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
          <div style={{ position:'relative', zIndex:2 }}>

            {/* 프로필 */}
            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
              <div style={{ width:'68px', height:'68px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'30px', flexShrink:0, border:'2px solid rgba(255,255,255,0.35)' }}>
                {tc.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'11px', margin:'0 0 3px', letterSpacing:'0.08em' }}>{tc.label}</p>
                <p style={{ color:'white', fontSize:'22px', fontWeight:900, margin:'0 0 2px', letterSpacing:'-0.5px' }}>{member.name}님</p>
                <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'12px', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member.email}</p>
              </div>
            </div>

            {/* 통계 3칸 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }} className="stat-grid">
              {[
                { label:'총 주문',   value: `${orders.length}건` },
                { label:'누적 금액', value: totalAmount > 0 ? `${Math.floor(totalAmount/10000)}만원` : '0원' },
                { label: member.member_type === '일반' ? '등급' : '상태',
                  value: member.member_type === '일반'
                    ? `${curGrade.icon} ${curGrade.name}`
                    : member.status === '승인' ? '✅ 승인' : member.status === '대기중' ? '⏳ 대기' : '❌ 거절' },
              ].map((s, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.15)', borderRadius:'14px', padding:'12px 8px', textAlign:'center', backdropFilter:'blur(8px)' }} className="stat-card">
                  <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'10px', margin:'0 0 4px', letterSpacing:'0.04em' }}>{s.label}</p>
                  <p style={{ color:'white', fontSize:'14px', fontWeight:800, margin:0 }} className="stat-value">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 탭 네비게이션 ── */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'20px', background:D.card, borderRadius:'18px', padding:'5px', border:`1px solid ${D.border}` }}>
          {[
            { key:'home',     icon:'🏠', label:'홈' },
            { key:'orders',   icon:'📦', label:'주문/배송' },
            { key:'benefits', icon: member.member_type === '일반' ? '⭐' : '💼', label: member.member_type === '일반' ? '등급/혜택' : '유통 혜택' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{ flex:1, padding:'10px 6px', borderRadius:'14px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:700, transition:'all 0.2s',
                background: tab === t.key ? tc.gradient : 'transparent',
                color: tab === t.key ? 'white' : D.sub }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

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
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {orders.length === 0 ? (
              <div style={{ background:D.card, borderRadius:'24px', padding:'56px 20px', textAlign:'center', border:`1px solid ${D.border}` }}>
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

                {/* 주문 헤더 (클릭 토글) */}
                <div style={{ padding:'18px 20px', cursor:'pointer' }} onClick={() => toggleOrder(order.id)}>
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
                    <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>{expandedOrder === order.id ? '▲ 접기' : '▼ 상세 보기'}</p>
                  </div>
                </div>

                {/* 주문 상세 (펼침) */}
                {expandedOrder === order.id && (
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
                    </div>
                    {order.status === '접수' && (
                      <button
                        onClick={async () => {
                          if (!confirm('주문을 취소하시겠습니까?')) return
                          const table = member?.member_type === '도매업' ? 'wholesale_orders' : member?.member_type === '소매업' ? 'retail_orders' : 'general_orders'
                          await supabase.from(table).update({ status: '취소', updated_at: new Date().toISOString() }).eq('id', order.id)
                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: '취소' } : o))
                          setExpandedOrder(null)
                        }}
                        style={{ marginTop:'14px', width:'100%', padding:'12px', borderRadius:'12px', border:'1.5px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.06)', color:'#ef4444', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                        🚫 주문 취소
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
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

      </div>

      {/* ── 하단 고정 탭바 ── */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:dark?'rgba(13,17,23,0.97)':'rgba(255,255,255,0.97)', backdropFilter:'blur(20px)', borderTop:`1px solid ${D.border}`, padding:'10px 0 16px', display:'flex', justifyContent:'space-around', zIndex:50 }}>
        {[
          { icon:'🏠', label:'홈',  href:'/shop',        active:false },
          { icon:'🔍', label:'상품', href:'/shop',        active:false },
          { icon:'👤', label:'마이', href:'/shop/mypage', active:true  },
        ].map((item, i) => (
          <Link key={i} href={item.href}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', textDecoration:'none', opacity: item.active ? 1 : 0.45 }}>
            <span style={{ fontSize:'22px' }}>{item.icon}</span>
            <span style={{ fontSize:'10px', fontWeight:700, color: item.active ? tc.color : D.sub }}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
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
    '출고':  { bg:'rgba(139,92,246,0.12)',  color:'#8b5cf6' },
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

