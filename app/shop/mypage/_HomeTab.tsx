'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { OrderBadge } from '../_OrderBadge'

type MyPageTab = 'home' | 'orders' | 'coupons' | 'benefits' | 'wishlist' | 'settings' | 'points'

type Props = {
  D: any
  accent: string
  member: any
  orders: any[]
  pointBalance: number
  totalAmount: number
  curGrade: any
  dark: boolean
  setTab: Dispatch<SetStateAction<MyPageTab>>
  onShopClick: () => void
  handleLogout: () => void
}

const PROGRAMS = {
  partner: {
    eyebrow: '온종일팜 공식 제휴 프로그램',
    icon: '🔗',
    title: '온파트너 알아보기',
    hook: '내가 소개한 상품이 팔릴 때마다, 링크가 수익이 됩니다.',
    summary: '온종일팜 상품의 나만의 추천 링크를 만들어 블로그·인스타·카톡에 공유하는 제휴 프로그램이에요.',
    benefits: [
      ['링크 하나로 시작', '마음에 드는 온종일팜 상품을 골라 내 추천 링크를 바로 만들어요.'],
      ['구매가 수익으로', '누군가 내 링크를 통해 구매하면 상품별 수수료가 적립돼요.'],
      ['성과를 한눈에', '클릭·구매·예상 수익을 대시보드에서 확인할 수 있어요.'],
      ['현금 또는 쇼핑 혜택', '쌓인 캐시는 출금하거나 온종일팜 쇼핑포인트로 전환할 수 있어요.'],
    ],
    accent: '#84cc16',
    accent2: '#16a34a',
    glow: 'rgba(132,204,22,.20)',
    signup: 'https://partner.yuanfnb.com/pages/signup.html',
    cta: '온파트너 무료 신청하기',
    note: '가입은 무료이며 실제 수수료율은 상품과 캠페인에 따라 달라질 수 있어요.',
  },
  experience: {
    eyebrow: '곧 선보입니다 · 체험하고 콘텐츠로 성장하는 방법',
    icon: '🎁',
    title: '온종일 체험단 알아보기',
    hook: '좋아하는 상품과 매장을 직접 체험하고, 내 콘텐츠의 가치도 키워보세요.',
    summary: '맛집·카페·뷰티·숙소·배송형 상품 캠페인에 신청하고, 선정되면 체험 후 솔직한 리뷰를 만드는 리뷰어 프로그램이에요.',
    benefits: [
      ['원하는 캠페인 선택', '지역과 관심 카테고리에 맞는 체험을 직접 골라 신청해요.'],
      ['체험 혜택 제공', '선정되면 캠페인 안내에 따라 상품이나 서비스를 체험할 수 있어요.'],
      ['리워드 적립', '리뷰 제출과 캠페인 활동으로 포인트 혜택을 받을 수 있어요.'],
      ['채널 성장 기회', '꾸준한 리뷰 경험을 쌓으며 블로그·SNS 콘텐츠를 풍성하게 만들어요.'],
    ],
    accent: '#ec4899',
    accent2: '#f97316',
    glow: 'rgba(236,72,153,.18)',
    signup: null,
    cta: '체험단 리뷰어로 신청하기',
    note: '캠페인별 선정 조건과 제공 혜택은 다르며, 리뷰어 가입 후 원하는 캠페인에 신청할 수 있어요.',
  },
} as const

type ProgramKey = keyof typeof PROGRAMS

export function HomeTab({ D, accent, member, orders, pointBalance, totalAmount, curGrade, dark, setTab, onShopClick, handleLogout }: Props) {
  const [openProgram, setOpenProgram] = useState<ProgramKey | null>(null)
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenProgram(null) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])
  const selectedProgram = openProgram ? PROGRAMS[openProgram] : null

  return (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

            {/* 모든 회원에게 항상 노출되는 온종일 서비스 안내 */}
            <section aria-label="온종일 서비스 알아보기">
              <div style={{ marginBottom:'10px' }}>
                <p style={{ fontSize:'12px', fontWeight:900, color:accent, margin:'0 0 3px', letterSpacing:'0.08em' }}>MORE WITH ONJONGIL</p>
                <p style={{ fontSize:'18px', fontWeight:900, color:D.text, margin:0, letterSpacing:'-0.5px' }}>쇼핑만 하기엔 아까운 온종일의 두 가지 기회</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:'10px' }}>
                {(Object.entries(PROGRAMS) as [ProgramKey, typeof PROGRAMS[ProgramKey]][]).map(([key, program]) => (
                  <button key={key} type="button" onClick={() => setOpenProgram(key)} className="onj-program-card"
                    style={{ position:'relative', overflow:'hidden', width:'100%', minHeight:'176px', padding:'20px', textAlign:'left', cursor:'pointer', borderRadius:'22px', border:`2px solid ${program.accent}`, background:`linear-gradient(145deg,${program.glow},${D.card} 62%)`, boxShadow:`0 12px 30px ${program.glow}, inset 0 0 0 1px ${program.accent}22`, color:D.text }}>
                    <span aria-hidden="true" style={{ position:'absolute', right:'-18px', top:'-24px', width:'105px', height:'105px', borderRadius:'50%', background:program.glow, filter:'blur(2px)' }} />
                    <div style={{ position:'relative', zIndex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'14px' }}>
                        <span style={{ width:'46px', height:'46px', borderRadius:'15px', display:'grid', placeItems:'center', fontSize:'24px', background:`linear-gradient(135deg,${program.accent},${program.accent2})`, boxShadow:`0 8px 18px ${program.glow}` }}>{program.icon}</span>
                        <span style={{ fontSize:'11px', fontWeight:900, color:program.accent, border:`1px solid ${program.accent}66`, background:program.glow, borderRadius:'999px', padding:'6px 10px' }}>{program.signup ? '누구나 무료로 알아보기' : '곧 선보입니다'}</span>
                      </div>
                      <p style={{ fontSize:'17px', fontWeight:900, margin:'0 0 7px', color:D.text }}>{program.title}</p>
                      <p style={{ fontSize:'12px', fontWeight:650, lineHeight:1.65, margin:'0 0 12px', color:D.sub }}>{program.hook}</p>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', color:program.accent, fontSize:'12px', fontWeight:900 }}>혜택 자세히 보기 <span aria-hidden="true">→</span></span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 내 정기배송 — 크게 노출. 지금은 준비중 */}
            <div style={{ background:D.card, borderRadius:'20px', border:`1px solid ${D.border}`, borderLeft:`3px solid ${accent}`, padding:'20px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                <p style={{ fontSize:'15px', fontWeight:800, color:D.text, margin:0, letterSpacing:'-0.3px' }}>내 정기배송</p>
                <span style={{ fontSize:'12px', fontWeight:600, color:D.sub }}>준비 중</span>
              </div>
              <p style={{ fontSize:'13px', color:D.sub, margin:0, lineHeight:1.6 }}>
                아직 이용 중인 정기배송이 없어요.<br/>
                매주·격주·매달 주기로 자동 배송받는 정기배송 서비스를 곧 열 예정입니다.
              </p>
            </div>

            {/* 승인 대기 배너 */}
            {member.member_type !== '일반' && member.status === '대기중' && (
              <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'16px', padding:'16px' }}>
                <p style={{ color:'#f59e0b', fontWeight:700, fontSize:'13px', margin:'0 0 4px' }}>⏳ 승인 대기 중</p>
                <p style={{ color:dark?'rgba(255,200,0,0.6)':'#92400e', fontSize:'12px', margin:0, lineHeight:1.7 }}>
                  관리자 확인 후 1~2 영업일 내에 승인 연락을 드려요. 승인 후 공급가 혜택을 이용하실 수 있습니다.
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
                { icon:'💰', label:'쇼핑 포인트',     sub:`${pointBalance.toLocaleString()} P`,          onClick: () => setTab('points') },
                { icon: member.member_type==='일반' ? '⭐' : '💼',
                  label: member.member_type==='일반' ? '회원 등급' : '유통 혜택',
                  sub:   member.member_type==='일반' ? `${curGrade.icon} ${curGrade.name}` : (member.status==='승인'?'이용 가능':'승인 후 이용'),
                  onClick: () => setTab('benefits') },
                { icon:'🛒', label:'쇼핑 계속하기',   sub:'신선한 상품 보러 가기',                      onClick: onShopClick },
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
                  <button onClick={() => setTab('orders')} style={{ fontSize:'11px', color:accent, fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>전체 보기 →</button>
                </div>
                {orders.slice(0, 2).map(order => (
                  <div key={order.id} style={{ background:D.input, borderRadius:'14px', padding:'14px', marginBottom:'8px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                      <p style={{ fontSize:'12px', fontWeight:700, color:D.text, margin:0 }}>{order.order_number || `#${order.id.slice(0,8).toUpperCase()}`}</p>
                      <OrderBadge status={order.status} />
                    </div>
                    <p style={{ fontSize:'15px', fontWeight:900, color:accent, margin:'0 0 2px' }}>{order.total_amount.toLocaleString()}원</p>
                    <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>{new Date(order.created_at).toLocaleString('ko-KR', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 로그아웃 */}
            <button onClick={handleLogout}
              style={{ width:'100%', padding:'14px', borderRadius:'14px', border:`1.5px solid ${D.border}`, background:'transparent', color:D.sub, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
              로그아웃
            </button>

            {selectedProgram && (
              <div role="dialog" aria-modal="true" aria-labelledby="program-modal-title" onClick={() => setOpenProgram(null)}
                style={{ position:'fixed', inset:0, zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'18px', background:'rgba(3,12,8,.72)', backdropFilter:'blur(10px)' }}>
                <div onClick={event => event.stopPropagation()}
                  style={{ width:'100%', maxWidth:'560px', maxHeight:'90vh', overflowY:'auto', borderRadius:'28px', background:D.card, border:`2px solid ${selectedProgram.accent}`, boxShadow:`0 28px 80px rgba(0,0,0,.38), 0 0 42px ${selectedProgram.glow}` }}>
                  <div style={{ position:'relative', overflow:'hidden', padding:'28px 26px 24px', background:`linear-gradient(135deg,${selectedProgram.glow},transparent 70%)`, borderBottom:`1px solid ${D.border}` }}>
                    <button type="button" aria-label="팝업 닫기" onClick={() => setOpenProgram(null)}
                      style={{ position:'absolute', top:'16px', right:'16px', width:'40px', height:'40px', borderRadius:'13px', border:`1px solid ${D.border}`, background:D.card, color:D.text, fontSize:'18px', cursor:'pointer' }}>✕</button>
                    <span style={{ display:'inline-flex', fontSize:'11px', fontWeight:900, color:selectedProgram.accent, border:`1px solid ${selectedProgram.accent}66`, borderRadius:'999px', padding:'6px 10px', marginBottom:'14px' }}>{selectedProgram.eyebrow}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:'13px', paddingRight:'38px' }}>
                      <span style={{ width:'58px', height:'58px', flexShrink:0, borderRadius:'18px', display:'grid', placeItems:'center', fontSize:'30px', background:`linear-gradient(135deg,${selectedProgram.accent},${selectedProgram.accent2})`, boxShadow:`0 10px 24px ${selectedProgram.glow}` }}>{selectedProgram.icon}</span>
                      <div>
                        <h2 id="program-modal-title" style={{ fontSize:'24px', fontWeight:950, letterSpacing:'-0.8px', color:D.text, margin:'0 0 5px' }}>{selectedProgram.title}</h2>
                        <p style={{ fontSize:'13px', lineHeight:1.65, fontWeight:750, color:selectedProgram.accent, margin:0 }}>{selectedProgram.hook}</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:'24px 26px 28px' }}>
                    <p style={{ fontSize:'14px', color:D.sub, fontWeight:650, lineHeight:1.8, margin:'0 0 18px' }}>{selectedProgram.summary}</p>
                    <div style={{ display:'grid', gap:'9px', marginBottom:'20px' }}>
                      {selectedProgram.benefits.map(([title, description], index) => (
                        <div key={title} style={{ display:'grid', gridTemplateColumns:'34px 1fr', gap:'11px', alignItems:'start', padding:'13px', borderRadius:'16px', border:`1px solid ${selectedProgram.accent}38`, background:selectedProgram.glow }}>
                          <span style={{ width:'34px', height:'34px', borderRadius:'11px', display:'grid', placeItems:'center', fontSize:'13px', fontWeight:950, color:'#fff', background:`linear-gradient(135deg,${selectedProgram.accent},${selectedProgram.accent2})` }}>{index + 1}</span>
                          <div><p style={{ fontSize:'13px', fontWeight:900, color:D.text, margin:'0 0 3px' }}>{title}</p><p style={{ fontSize:'12px', color:D.sub, lineHeight:1.6, margin:0 }}>{description}</p></div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize:'11px', lineHeight:1.65, color:D.sub, margin:'0 0 14px' }}>※ {selectedProgram.note}</p>
                    {selectedProgram.signup ? (
                      <a href={selectedProgram.signup} target="_blank" rel="noopener noreferrer"
                        style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', minHeight:'52px', borderRadius:'16px', background:`linear-gradient(135deg,${selectedProgram.accent},${selectedProgram.accent2})`, color:'#fff', fontSize:'15px', fontWeight:950, textDecoration:'none', boxShadow:`0 12px 26px ${selectedProgram.glow}` }}>{selectedProgram.cta} →</a>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'9px', alignItems:'stretch' }}>
                        <button type="button" disabled aria-disabled="true"
                          style={{ minHeight:'52px', borderRadius:'16px', border:`1px solid ${selectedProgram.accent}55`, background:`linear-gradient(135deg,${selectedProgram.accent}88,${selectedProgram.accent2}88)`, color:'#fff', fontSize:'15px', fontWeight:950, cursor:'not-allowed', opacity:.78 }}>{selectedProgram.cta}</button>
                        <span style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'0 15px', borderRadius:'16px', border:`2px solid ${selectedProgram.accent}`, background:selectedProgram.glow, color:selectedProgram.accent, fontSize:'12px', fontWeight:950, whiteSpace:'nowrap' }}>곧 출시됩니다</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
  )
}
