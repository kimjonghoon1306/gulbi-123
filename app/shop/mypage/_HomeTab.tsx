'use client'

import type { Dispatch, SetStateAction } from 'react'
import { OrderBadge } from '../_OrderBadge'

type MyPageTab = 'home' | 'orders' | 'coupons' | 'benefits' | 'wishlist' | 'settings'

type Props = {
  D: any
  accent: string
  member: any
  orders: any[]
  totalAmount: number
  curGrade: any
  dark: boolean
  setTab: Dispatch<SetStateAction<MyPageTab>>
  onShopClick: () => void
  handleLogout: () => void
}

export function HomeTab({ D, accent, member, orders, totalAmount, curGrade, dark, setTab, onShopClick, handleLogout }: Props) {
  return (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

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
                { icon:'💰', label:'쇼핑 포인트',     sub:'0 P (준비 중)',                              onClick: () => {} },
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
          </div>
  )
}
