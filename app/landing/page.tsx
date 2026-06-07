'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [promoStep, setPromoStep] = useState(0)
  const [promoKey, setPromoKey] = useState(0) // 스텝 바뀔 때 애니메이션 리트리거
  const [orderIdx, setOrderIdx] = useState(-1) // 주문 아이템 순차 등장
  const [barWidths, setBarWidths] = useState([0, 0, 0, 0]) // 재고 바 너비
  const [countVal, setCountVal] = useState(0) // 정산 카운트업
  const [rankIdx, setRankIdx] = useState(-1) // 베스트 순차 등장
  const promoTimer = useRef<any>(null)
  const animTimer = useRef<any>(null)

  const goStep = (i: number) => {
    setPromoStep(i)
    setPromoKey(k => k + 1)
    clearInterval(promoTimer.current)
    promoTimer.current = setInterval(() => goStep((i + 1) % 4), 4000)
  }

  useEffect(() => {
    setVisible(true)
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    promoTimer.current = setInterval(() => setPromoStep(p => { const next = (p + 1) % 4; setPromoKey(k => k + 1); return next }), 4000)
    return () => clearInterval(promoTimer.current)
  }, [])

  // 스텝별 애니메이션
  useEffect(() => {
    clearInterval(animTimer.current)
    setOrderIdx(-1); setBarWidths([0,0,0,0]); setCountVal(0); setRankIdx(-1)

    if (promoStep === 0) {
      // 주문 아이템 순차 등장
      let i = 0
      animTimer.current = setInterval(() => {
        setOrderIdx(i); i++
        if (i >= 3) clearInterval(animTimer.current)
      }, 350)
    }
    if (promoStep === 1) {
      // 재고 바 순차 채우기
      setTimeout(() => setBarWidths([85, 0, 0, 0]), 100)
      setTimeout(() => setBarWidths([85, 23, 0, 0]), 300)
      setTimeout(() => setBarWidths([85, 23, 67, 0]), 500)
      setTimeout(() => setBarWidths([85, 23, 67, 12]), 700)
    }
    if (promoStep === 2) {
      // 금액 카운트업
      let v = 0; const target = 48200000
      animTimer.current = setInterval(() => {
        v = Math.min(v + 1600000, target)
        setCountVal(v)
        if (v >= target) clearInterval(animTimer.current)
      }, 40)
    }
    if (promoStep === 3) {
      // 베스트 순차 등장
      let i = 0
      animTimer.current = setInterval(() => {
        setRankIdx(i); i++
        if (i >= 4) clearInterval(animTimer.current)
      }, 250)
    }
    return () => clearInterval(animTimer.current)
  }, [promoStep, promoKey])

  const features = [
    { icon: '📋', title: '도매·소매 주문관리', desc: '거래처별 도매주문과 개인 소매주문을 한 곳에서 관리. 주문 상태를 실시간으로 추적하세요.', gradient: 'from-green-600 to-blue-600', shadow: 'shadow-green-600/20' },
    { icon: '🧺', title: '농축수산물 전문 상품관리', desc: 'kg, 박스, 마리 등 농축수산물 특성에 맞는 단위 관리. 도매가·소매가 분리 설정 가능.', gradient: 'from-green-500 to-teal-600', shadow: 'shadow-green-500/20' },
    { icon: '📦', title: '재고관리·부족 알림', desc: '입출고 이력 자동 기록. 최소 재고 설정 시 부족 알림으로 재고 부족 사태 예방.', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
    { icon: '👥', title: '거래처·회원 관리', desc: '도매 거래처와 소매 고객을 분리 관리. 사업자번호, 담당자, 거래이력 한눈에 확인.', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
    { icon: '🧾', title: '세금계산서·현금영수증', desc: '발행 내역 등록 및 미발행 알림. 부가세 자동 계산으로 세무처리 편리하게.', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20' },
    { icon: '🌙', title: '다크모드·반응형', desc: '눈이 편한 다크모드 지원. PC, 태블릿 어디서든 편하게 사용 가능.', gradient: 'from-slate-500 to-gray-600', shadow: 'shadow-slate-500/20' },
  ]

  const cases = [
    { name: '온종일팜 거래처', location: '산지직송', desc: '농축수산물 도매 거래처 20곳 관리. 월 주문 300건 처리 중.', emoji: '🌾', color: 'from-green-600/20 to-blue-600/20', border: 'border-green-600/30' },
    { name: '온종일팜 거래처', location: '경기 이천', desc: '냉동·냉장·생물 재고 통합 관리. 세금계산서 발행 자동화.', emoji: '🥩', color: 'from-red-500/20 to-orange-600/20', border: 'border-red-500/30' },
    { name: '온종일팜 거래처', location: '충남 당진', desc: '한우·돼지고기·채소 소매 온라인 주문 관리. 배송지 자동 저장.', emoji: '🥬', color: 'from-emerald-500/20 to-teal-600/20', border: 'border-emerald-500/30' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">

      {/* ── 공급업체 플로팅 버튼 ── */}
      <a
        href="/supplier/login"
        className="fixed bottom-5 left-4 sm:bottom-8 sm:left-8 z-50 flex items-center gap-1.5 sm:gap-2 text-slate-900 text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-full select-none"
        style={{
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
          boxShadow: '0 8px 30px rgba(251,191,36,0.5)',
          animation: 'floatBtn 3s ease-in-out infinite',
          animationDelay: '1.5s',
        }}
      >
        <span style={{ animation: 'spinIcon 4s linear infinite', display: 'inline-block' }}>🏭</span>
        <span className="hidden sm:inline">공급업체 포털</span>
        <span className="sm:hidden">공급업체</span>
        <span>→</span>
      </a>

      {/* ── 유안 F&B 플로팅 버튼 ── */}
      <a
        href="https://yuanfnb.com"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center gap-1.5 sm:gap-2 text-white text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-full select-none"
        style={{
          background: 'linear-gradient(135deg, #f472b6, #ec4899, #db2777)',
          boxShadow: '0 8px 30px rgba(236,72,153,0.5)',
          animation: 'floatBtn 3s ease-in-out infinite',
        }}
      >
        <span style={{ animation: 'spinIcon 4s linear infinite', display: 'inline-block' }}>✨</span>
        <span className="hidden sm:inline">유안 F&B 홈페이지</span>
        <span className="sm:hidden">유안 F&B</span>
        <span>→</span>
      </a>

      {/* 네비게이션 */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0f1e]/95 backdrop-blur-xl shadow-xl shadow-black/30 border-b border-white/5' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🧺</span>
            <span className="font-bold text-base sm:text-lg tracking-tight">온종일팜</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-6">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">기능소개</a>
            <a href="#cases" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">도입사례</a>
            <a href="#contact" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">문의</a>
            <Link href="/shop"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all duration-200 hover:scale-105">
              🛒 <span className="hidden sm:inline">쇼핑몰</span>
            </Link>
            <Link href="/admin/dashboard"
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-600/30">
              ⚙️ <span className="hidden sm:inline">관리자</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-green-950/40 via-transparent to-transparent" />
          <div className="absolute top-1/3 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-green-700/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-blue-700/15 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1.5s'}} />
          <div className="absolute top-1/2 right-1/3 w-48 sm:w-64 h-48 sm:h-64 bg-green-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay:'3s'}} />
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" className="w-full" fill="none">
            <path d="M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,100 L0,100 Z" fill="#111827" opacity="0.8"/>
            <path d="M0,70 C300,30 600,90 900,50 C1100,25 1300,70 1440,60 L1440,100 L0,100 Z" fill="#0a0f1e" opacity="0.6"/>
          </svg>
        </div>

        <div className={`relative z-10 text-center max-w-4xl mx-auto w-full transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-green-600/10 border border-green-600/20 text-green-500 text-xs font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full mb-6 sm:mb-8 backdrop-blur">
            🧺 농축수산물 도매업체를 위한 전문 관리 솔루션
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 leading-[1.1] tracking-tight">
            농축수산물 도매
            <span className="block bg-gradient-to-r from-green-500 via-green-300 to-green-500 bg-clip-text text-transparent">
              이제 쉽게
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto">
            주문부터 재고, 세금계산서까지<br className="hidden sm:block" />
            농축수산물 도매에 필요한 모든 것을 한 곳에서
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/shop"
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-green-600/40 active:scale-95 text-sm sm:text-base">
              🛒 쇼핑몰 바로가기
            </Link>
            <a href="#contact"
              className="bg-white/5 hover:bg-white/10 backdrop-blur border border-white/10 hover:border-white/20 text-white font-semibold px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl transition-all duration-200 hover:scale-105 text-sm sm:text-base">
              무료 상담 신청
            </a>
          </div>

          <div className="flex justify-center gap-6 sm:gap-12 mt-10 sm:mt-20 flex-wrap">
            {[
              { num: '100%', label: '국내 서버' },
              { num: '6가지', label: '핵심 기능' },
              { num: '24/7', label: '언제든 접속' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">{s.num}</p>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {[
          { e: '🌾', x: 8, y: 20, s: 4 },
          { e: '🥩', x: 85, y: 30, s: 5 },
          { e: '🧺', x: 15, y: 65, s: 6 },
          { e: '🥬', x: 90, y: 65, s: 4.5 },
          { e: '🍎', x: 50, y: 15, s: 5.5 },
          { e: '🌽', x: 70, y: 75, s: 4 },
        ].map((item, i) => (
          <div key={i} className="absolute text-4xl opacity-25 select-none pointer-events-none hidden sm:block"
            style={{ left: `${item.x}%`, top: `${item.y}%`, animation: `float ${item.s}s ease-in-out infinite`, animationDelay: `${i * 0.7}s` }}>
            {item.e}
          </div>
        ))}
      </section>

      {/* ── 프로모션 애니메이션 ── */}
      <section className="py-20 px-4 sm:px-6 bg-[#0a0f1e]">
        <div className="max-w-5xl mx-auto text-center">

          <p className="text-green-400 text-xs font-bold mb-4 tracking-widest uppercase">✦ 이렇게 작동해요</p>
          <h2 className="text-3xl md:text-5xl font-black mb-12 leading-tight">
            농축수산물 도매를<br />
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">이제 스마트하게</span>
          </h2>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">

            {/* 탭 */}
            <div className="flex border-b border-slate-700/50 bg-slate-900/60">
              {['주문 접수','재고 관리','정산 처리','분석 리포트'].map((label, i) => (
                <button key={i}
                  onClick={() => goStep(i)}
                  className="flex-1 py-3.5 text-xs sm:text-sm font-semibold transition-all duration-200"
                  style={{
                    color: promoStep === i ? '#22c55e' : 'rgba(255,255,255,0.35)',
                    fontWeight: promoStep === i ? 700 : 500,
                    background: 'transparent', border: 'none',
                    borderBottom: `2px solid ${promoStep === i ? '#22c55e' : 'transparent'}`,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>{label}</button>
              ))}
            </div>

            {/* 진행 바 */}
            <div className="h-0.5 bg-slate-700/40">
              <div style={{ width: `${(promoStep + 1) * 25}%`, transition: 'width 0.4s ease', height: '100%', background: 'linear-gradient(90deg,#22c55e,#4ade80)', borderRadius: '0 2px 2px 0' }} />
            </div>

            <div className="p-6 sm:p-10">

              {/* STEP 0: 주문 접수 */}
              {promoStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center text-left" style={{ animation: 'promoIn 0.4s ease' }}>
                  <div>
                    <div className="text-7xl font-black text-green-400/10 leading-none mb-3 tracking-tighter">01</div>
                    <h3 className="text-xl sm:text-2xl font-black mb-3 text-white">모바일로 간편 주문 접수</h3>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">도매업체 고객이 앱이나 웹에서 직접 주문합니다. 전화 없이도 24시간 주문 접수.</p>
                    <div className="flex gap-2 mt-5 flex-wrap">
                      {['📱 모바일 주문','💬 카카오 연동','📧 이메일 알림'].map((t,i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    {[
                      { buyer: '㈜온종일유통', product: '한우 갈비 5kg × 4박스', status: '접수완료', time: '방금 전', dot: '#22c55e' },
                      { buyer: '해진식품', product: '한우 갈비 5kg × 10박스', status: '처리중', time: '2분 전', dot: '#4ade80' },
                      { buyer: '온종일유통㈜', product: '유기농 채소 3kg × 20박스', status: '출고완료', time: '15분 전', dot: '#34d399' },
                    ].map((o, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{
                        background: 'rgba(255,255,255,0.04)',
                        opacity: orderIdx >= i ? 1 : 0,
                        transform: orderIdx >= i ? 'translateX(0)' : 'translateX(-16px)',
                        transition: 'all 0.4s ease',
                      }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: o.dot }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white">{o.buyer}</div>
                          <div className="text-xs text-slate-400 truncate">{o.product}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-bold" style={{ color: o.dot }}>{o.status}</div>
                          <div className="text-xs text-slate-500">{o.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 1: 재고 관리 */}
              {promoStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center text-left" style={{ animation: 'promoIn 0.4s ease' }}>
                  <div>
                    <div className="text-7xl font-black text-green-400/10 leading-none mb-3 tracking-tighter">02</div>
                    <h3 className="text-xl sm:text-2xl font-black mb-3 text-white">실시간 재고 자동 관리</h3>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">주문이 들어오면 재고가 자동으로 차감됩니다. 부족 시 즉시 알림.</p>
                    <div className="flex gap-2 mt-5 flex-wrap">
                      {['📦 자동 차감','⚠️ 부족 알림','📊 입출고 기록'].map((t,i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: '한우 갈비', warn: false, emoji: '🥩' },
                      { name: '돼지 삼겹살', warn: true,  emoji: '🥓' },
                      { name: '유기농 채소', warn: false, emoji: '🥬' },
                      { name: '제주 감귤', warn: true,  emoji: '🍎' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${item.warn ? 'rgba(251,146,60,0.25)' : 'rgba(255,255,255,0.06)'}`,
                        opacity: barWidths[i] > 0 ? 1 : 0,
                        transform: barWidths[i] > 0 ? 'translateX(0)' : 'translateX(16px)',
                        transition: 'opacity 0.4s ease, transform 0.4s ease',
                      }}>
                        <span className="text-xl flex-shrink-0">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold text-white">{item.name}</span>
                            <span className="text-xs font-bold" style={{ color: item.warn ? '#fb923c' : '#22c55e' }}>
                              {barWidths[i]}%{item.warn ? ' ⚠️' : ''}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div style={{
                              width: `${barWidths[i]}%`, height: '100%', borderRadius: '9999px',
                              background: item.warn ? 'linear-gradient(90deg,#fb923c,#ef4444)' : 'linear-gradient(90deg,#22c55e,#4ade80)',
                              transition: 'width 0.8s cubic-bezier(0.34,1.2,0.64,1)',
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: 정산 처리 */}
              {promoStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center text-left" style={{ animation: 'promoIn 0.4s ease' }}>
                  <div>
                    <div className="text-7xl font-black text-green-400/10 leading-none mb-3 tracking-tighter">03</div>
                    <h3 className="text-xl sm:text-2xl font-black mb-3 text-white">세금계산서 자동 발행</h3>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">주문 완료 시 세금계산서가 자동 발행됩니다. 정산이 이렇게 쉬워집니다.</p>
                    <div className="flex gap-2 mt-5 flex-wrap">
                      {['🧾 자동 발행','💳 카드·계좌','📑 정산 리포트'].map((t,i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <div className="text-xs font-bold text-slate-400 mb-3">📊 이번 달 정산 현황</div>
                    {/* 카운트업 금액 */}
                    <div className="text-3xl font-black text-white mb-1">
                      ₩{countVal.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-400 font-bold mb-4">▲ 전월 대비 +23%</div>
                    {/* 정산 진행 바 */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400">수금 진행률</span>
                        <span className="text-green-400 font-bold">{Math.round((countVal / 48200000) * 83)}%</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ width: `${Math.round((countVal / 48200000) * 83)}%`, height: '100%', borderRadius: '9999px', background: 'linear-gradient(90deg,#22c55e,#34d399)', transition: 'width 0.1s linear' }} />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: '미수금', value: '₩8,400,000', color: '#fb923c' },
                        { label: '수금완료', value: '₩39,800,000', color: '#34d399' },
                        { label: '세금계산서 발행', value: '142건', color: '#22c55e' },
                      ].map((r, i) => (
                        <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <span className="text-xs text-slate-400">{r.label}</span>
                          <span className="text-sm font-black" style={{ color: r.color }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: 분석 리포트 */}
              {promoStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center text-left" style={{ animation: 'promoIn 0.4s ease' }}>
                  <div>
                    <div className="text-7xl font-black text-green-400/10 leading-none mb-3 tracking-tighter">04</div>
                    <h3 className="text-xl sm:text-2xl font-black mb-3 text-white">데이터 기반 의사결정</h3>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">매출·재고·고객 데이터를 한눈에. 어떤 상품이 잘 팔리는지 바로 확인.</p>
                    <div className="flex gap-2 mt-5 flex-wrap">
                      {['📈 매출 분석','👥 고객 통계','🏆 베스트 상품'].map((t,i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <div className="text-xs font-bold text-slate-400 mb-3">🏆 이번 달 베스트 상품</div>
                    <div className="space-y-2.5">
                      {[
                        { rank: '1', name: '온종일팜 신선상품', sales: '₩19,500,000', change: '+32%', emoji: '🌾' },
                        { rank: '2', name: '한우 갈비 특대', sales: '₩8,400,000', change: '+18%', emoji: '🥩' },
                        { rank: '3', name: '유기농 채소 세트', sales: '₩6,200,000', change: '+41%', emoji: '🥬' },
                        { rank: '4', name: '제주 감귤 1kg', sales: '₩4,800,000', change: '-5%', emoji: '🍎' },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center gap-3 py-2" style={{
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          opacity: rankIdx >= i ? 1 : 0,
                          transform: rankIdx >= i ? 'translateX(0)' : 'translateX(20px)',
                          transition: 'all 0.35s ease',
                        }}>
                          <span className="text-xs font-black w-4 text-slate-500">{p.rank}</span>
                          <span className="text-base">{p.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{p.name}</div>
                            <div className="text-xs text-green-400 font-bold">{p.sales}</div>
                          </div>
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: p.change.startsWith('+') ? '#34d399' : '#f87171' }}>{p.change}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 점 네비 */}
            <div className="flex justify-center gap-2 py-5 border-t border-slate-700/40">
              {[0,1,2,3].map(i => (
                <div key={i} onClick={() => goStep(i)}
                  style={{ width: promoStep === i ? '22px' : '7px', height: '7px', borderRadius: '4px', cursor: 'pointer', background: promoStep === i ? '#22c55e' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section id="features" className="py-16 sm:py-28 px-4 sm:px-6 bg-[#111827]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-green-500 text-sm font-bold mb-3 tracking-widest uppercase">✨ 핵심 기능</p>
            <h2 className="text-3xl md:text-5xl font-black mb-4">필요한 건 다 있어요</h2>
            <p className="text-slate-400 text-base sm:text-lg">농축수산물 도매업에 최적화된 6가지 핵심 기능</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <div key={f.title}
                className={`group relative bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 sm:p-7 hover:border-transparent hover:-translate-y-2 hover:shadow-2xl ${f.shadow} transition-all duration-300 overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-5 shadow-lg ${f.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-2.5 text-white">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* 도입 사례 */}
      <section id="cases" className="py-16 sm:py-28 px-4 sm:px-6 bg-[#0a0f1e]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-amber-400 text-sm font-bold mb-3 tracking-widest uppercase">🏆 도입 사례</p>
            <h2 className="text-3xl md:text-5xl font-black mb-4">이미 쓰고 있어요</h2>
            <p className="text-slate-400 text-base sm:text-lg">전국 농축수산물 업체들이 먼저 경험했습니다</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
            {cases.map((c, i) => (
              <div key={c.name}
                className={`relative bg-gradient-to-br ${c.color} border ${c.border} rounded-2xl p-6 sm:p-7 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 overflow-hidden backdrop-blur`}>
                <div className="absolute top-0 right-0 text-7xl sm:text-8xl opacity-10 leading-none pt-4 pr-4">{c.emoji}</div>
                <div className="relative z-10">
                  <span className="text-4xl sm:text-5xl mb-4 sm:mb-5 block">{c.emoji}</span>
                  <h3 className="font-bold text-lg sm:text-xl text-white mb-1">{c.name}</h3>
                  <p className="text-green-500 text-xs font-semibold mb-3 sm:mb-4">📍 {c.location}</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* 문의 섹션 */}
      <section id="contact" className="py-16 sm:py-28 px-4 sm:px-6 bg-[#111827]">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-emerald-400 text-sm font-bold mb-3 tracking-widest uppercase">📞 무료 상담</p>
            <h2 className="text-3xl md:text-5xl font-black mb-4">지금 바로 시작하세요</h2>
            <p className="text-slate-400 text-base sm:text-lg">도입 문의 및 데모 신청을 받고 있어요</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur">
            {[
              { label: '업체명', placeholder: '예) 온종일팜 거래처' },
              { label: '연락처', placeholder: '010-0000-0000' },
              { label: '지역', placeholder: '예) 산지직송' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 tracking-wide uppercase">{f.label}</label>
                <input type="text" placeholder={f.placeholder}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 sm:py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 tracking-wide uppercase">문의 내용</label>
              <textarea rows={4} placeholder="궁금한 점이나 요청사항을 입력해주세요"
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 sm:py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all resize-none" />
            </div>
            <button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-600/20 hover:shadow-green-600/40 text-sm sm:text-base">
              상담 신청하기 🧺
            </button>
            <p className="text-center text-slate-500 text-xs">빠른 시일 내에 연락드릴게요</p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-slate-800 bg-[#0a0f1e]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧺</span>
            <span className="font-bold text-slate-400 text-sm sm:text-base">온종일팜 도매 관리 시스템</span>
          </div>
          <a href="https://yuanfnb.com" target="_blank" rel="noopener noreferrer"
            className="text-pink-400 hover:text-pink-300 text-sm font-semibold transition-colors">
            유안 F&B →
          </a>
          <p className="text-slate-600 text-xs sm:text-sm">© 2026 All rights reserved</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes promoIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-18px) rotate(5deg); }
        }
        @keyframes floatBtn {
          0%, 100% { transform: translateY(0px) scale(1); box-shadow: 0 8px 30px rgba(236,72,153,0.5); }
          50% { transform: translateY(-10px) scale(1.03); box-shadow: 0 20px 40px rgba(236,72,153,0.6); }
        }
        @keyframes spinIcon {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
