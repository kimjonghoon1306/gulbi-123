'use client'

import React from 'react'

// 마이페이지 등급/혜택 탭 — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  D: any
  tc: any
  accent: string
  member: any
  orders: any[]
  curGrade: any
  nextGrade: any
  gradeProgress: number
  totalAmount: number
}

export function BenefitsTab({ D, tc, accent, member, orders, curGrade, nextGrade, gradeProgress, totalAmount }: Props) {
  return (
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
                        {nextGrade.name}까지 <strong style={{ color:accent }}>{(nextGrade.min - totalAmount).toLocaleString()}원</strong> 남았어요
                      </p>
                    </div>
                  )}
                  {!nextGrade && <p style={{ textAlign:'center', fontSize:'13px', color:'#ec4899', fontWeight:700, margin:0 }}>🎉 최고 등급 달성!</p>}
                </div>

                {/* 등급별 혜택 표 */}
                <div style={{ background:D.card, borderRadius:'20px', padding:'20px', border:`1px solid ${D.border}` }}>
                  <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 14px' }}>🎁 등급별 혜택</p>
                  {[
                    { grade:'🛒 일반', benefit:'기본 일반 구매가',         range:'0원~',     active: curGrade.name==='일반' },
                    { grade:'🥈 실버', benefit:'일반 구매가 3% 할인 쿠폰',      range:'50만원~',  active: curGrade.name==='실버' },
                    { grade:'🥇 골드', benefit:'일반 구매가 5% 할인 + 우선 배송', range:'200만원~', active: curGrade.name==='골드' },
                    { grade:'💎 VIP',  benefit:'일반 구매가 10% 할인 + 전담 CS', range:'500만원~', active: curGrade.name==='VIP' },
                  ].map((g, i, arr) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom: i < arr.length-1 ? `1px solid ${D.border}` : 'none', opacity: g.active ? 1 : 0.45 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        {g.active && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:tc.color, flexShrink:0 }} />}
                        <div>
                          <p style={{ fontSize:'13px', fontWeight: g.active ? 800 : 600, color:D.text, margin:'0 0 2px' }}>{g.grade}</p>
                          <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>{g.benefit}</p>
                        </div>
                      </div>
                      <p style={{ fontSize:'11px', color: g.active ? accent : D.sub, fontWeight: g.active ? 700 : 400, margin:0, flexShrink:0 }}>{g.range}</p>
                    </div>
                  ))}
                </div>

                {/* 포인트 */}
                <div style={{ background:D.card, borderRadius:'20px', padding:'20px', border:`1px solid ${D.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                    <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:0 }}>💰 쇼핑 포인트</p>
                    <span style={{ fontSize:'10px', color:'#f59e0b', fontWeight:700, background:'rgba(245,158,11,0.12)', padding:'3px 8px', borderRadius:'20px' }}>준비 중</span>
                  </div>
                  <p style={{ fontSize:'36px', fontWeight:900, color:accent, margin:'0 0 4px', letterSpacing:'-1px' }}>0<span style={{ fontSize:'16px', fontWeight:600, color:D.sub, marginLeft:'4px' }}>P</span></p>
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
                      ? `${member.member_type} 공급가 혜택을 정상적으로 이용하실 수 있습니다.`
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
                    { icon:'💰', title:'소매 공급가 적용',   desc:'일반 구매가보다 저렴한 전용 공급가로 구매하실 수 있어요.' },
                    { icon:'🚚', title:'대량 주문 우선 처리', desc:'대량 발주 시 우선 처리 및 빠른 배송을 지원합니다.' },
                    { icon:'📋', title:'세금계산서 발행',     desc:'사업자 세금계산서 발행이 가능합니다.' },
                    { icon:'📞', title:'전담 상담 배정',      desc:'소매 유통 전담 상담원이 배정되어 빠른 응대가 가능합니다.' },
                  ] : [
                    { icon:'💰', title:'도매 공급가 적용',    desc:'최저가 도매 공급가로 대량 구매하실 수 있어요.' },
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
                          <p style={{ fontSize:'16px', fontWeight:900, color:accent, margin:0 }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
  )
}
