'use client'

import React from 'react'

// 쇼핑몰 메인 히어로(바다마을) 섹션 — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  bg: string
  border: string
  dark: boolean
  text: string
  sub: string
  gtext: string
  heroVisible: boolean
  visitorCount: number
  productCount: number
}

export function HeroSection({ bg, border, dark, text, sub, gtext, heroVisible, visitorCount, productCount }: Props) {
  return (
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
                { num: productCount + '+', label: '등록 상품', icon: '📦' },
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
  )
}
