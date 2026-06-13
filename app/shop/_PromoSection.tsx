'use client'

import React from 'react'

// 쇼핑몰 메인 '이렇게 이용하세요' 시네마틱 섹션 — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  dark: boolean
  text: string
  sub: string
  gtext: string
  gulbiStep: number
  setGulbiStep: React.Dispatch<React.SetStateAction<number>>
  gulbiTimer: React.MutableRefObject<any>
}

export function PromoSection({ dark, text, sub, gtext, gulbiStep, setGulbiStep, gulbiTimer }: Props) {
  const goStep = (i: number) => {
    setGulbiStep(i)
    clearInterval(gulbiTimer.current)
    gulbiTimer.current = setInterval(() => setGulbiStep(p => (p + 1) % 4), 4000)
  }
  return (
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
              <button key={i} onClick={() => goStep(i)}
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
              <div key={i} onClick={() => goStep(i)}
                style={{ width: gulbiStep === i ? '22px' : '7px', height: '7px', borderRadius: '4px', cursor: 'pointer', background: gulbiStep === i ? '#14532d' : (dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'), transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
