'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    { icon: '📋', title: '도매·소매 주문관리', desc: '거래처별 도매주문과 개인 소매주문을 한 곳에서 관리. 주문 상태를 실시간으로 추적하세요.', gradient: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/20' },
    { icon: '🐟', title: '수산물 특화 상품관리', desc: 'kg, 박스, 마리 등 수산물 특성에 맞는 단위 관리. 도매가·소매가 분리 설정 가능.', gradient: 'from-cyan-500 to-teal-600', shadow: 'shadow-cyan-500/20' },
    { icon: '📦', title: '재고관리·부족 알림', desc: '입출고 이력 자동 기록. 최소 재고 설정 시 부족 알림으로 재고 부족 사태 예방.', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
    { icon: '👥', title: '거래처·회원 관리', desc: '도매 거래처와 소매 고객을 분리 관리. 사업자번호, 담당자, 거래이력 한눈에 확인.', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
    { icon: '🧾', title: '세금계산서·현금영수증', desc: '발행 내역 등록 및 미발행 알림. 부가세 자동 계산으로 세무처리 편리하게.', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20' },
    { icon: '🌙', title: '다크모드·반응형', desc: '눈이 편한 다크모드 지원. PC, 태블릿 어디서든 편하게 사용 가능.', gradient: 'from-slate-500 to-gray-600', shadow: 'shadow-slate-500/20' },
  ]

  const cases = [
    { name: '영광 굴비가게', location: '전남 영광', desc: '굴비 도매 거래처 20곳 관리. 월 주문 300건 처리 중.', emoji: '🐟', color: 'from-sky-500/20 to-blue-600/20', border: 'border-sky-500/30' },
    { name: '목포 수산마트', location: '전남 목포', desc: '냉동·냉장·생물 재고 통합 관리. 세금계산서 발행 자동화.', emoji: '🦀', color: 'from-red-500/20 to-orange-600/20', border: 'border-red-500/30' },
    { name: '여수 해산물', location: '전남 여수', desc: '전복·굴·홍합 소매 온라인 주문 관리. 배송지 자동 저장.', emoji: '🦪', color: 'from-emerald-500/20 to-teal-600/20', border: 'border-emerald-500/30' },
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
            <span className="text-xl sm:text-2xl">🐟</span>
            <span className="font-bold text-base sm:text-lg tracking-tight">굴비가게</span>
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
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-sky-500/30">
              ⚙️ <span className="hidden sm:inline">관리자</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-sky-950/40 via-transparent to-transparent" />
          <div className="absolute top-1/3 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-sky-600/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-blue-700/15 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1.5s'}} />
          <div className="absolute top-1/2 right-1/3 w-48 sm:w-64 h-48 sm:h-64 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay:'3s'}} />
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" className="w-full" fill="none">
            <path d="M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,100 L0,100 Z" fill="#111827" opacity="0.8"/>
            <path d="M0,70 C300,30 600,90 900,50 C1100,25 1300,70 1440,60 L1440,100 L0,100 Z" fill="#0a0f1e" opacity="0.6"/>
          </svg>
        </div>

        <div className={`relative z-10 text-center max-w-4xl mx-auto w-full transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full mb-6 sm:mb-8 backdrop-blur">
            🐟 수산물 도매업체를 위한 전문 관리 솔루션
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 leading-[1.1] tracking-tight">
            수산물 도매
            <span className="block bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
              이제 쉽게
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto">
            주문부터 재고, 세금계산서까지<br className="hidden sm:block" />
            수산물 도매에 필요한 모든 것을 한 곳에서
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/shop"
              className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-sky-500/40 active:scale-95 text-sm sm:text-base">
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
                <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">{s.num}</p>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {[
          { e: '🐟', x: 8, y: 20, s: 4 },
          { e: '🦀', x: 85, y: 30, s: 5 },
          { e: '🦪', x: 15, y: 65, s: 6 },
          { e: '🐙', x: 90, y: 65, s: 4.5 },
          { e: '🦐', x: 50, y: 15, s: 5.5 },
          { e: '🐡', x: 70, y: 75, s: 4 },
        ].map((item, i) => (
          <div key={i} className="absolute text-4xl opacity-25 select-none pointer-events-none hidden sm:block"
            style={{ left: `${item.x}%`, top: `${item.y}%`, animation: `float ${item.s}s ease-in-out infinite`, animationDelay: `${i * 0.7}s` }}>
            {item.e}
          </div>
        ))}
      </section>

      {/* 기능 소개 */}
      <section id="features" className="py-16 sm:py-28 px-4 sm:px-6 bg-[#111827]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-sky-400 text-sm font-bold mb-3 tracking-widest uppercase">✨ 핵심 기능</p>
            <h2 className="text-3xl md:text-5xl font-black mb-4">필요한 건 다 있어요</h2>
            <p className="text-slate-400 text-base sm:text-lg">수산물 도매업에 최적화된 6가지 핵심 기능</p>
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
            <p className="text-slate-400 text-base sm:text-lg">전남 지역 수산물 업체들이 먼저 경험했습니다</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
            {cases.map((c, i) => (
              <div key={c.name}
                className={`relative bg-gradient-to-br ${c.color} border ${c.border} rounded-2xl p-6 sm:p-7 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 overflow-hidden backdrop-blur`}>
                <div className="absolute top-0 right-0 text-7xl sm:text-8xl opacity-10 leading-none pt-4 pr-4">{c.emoji}</div>
                <div className="relative z-10">
                  <span className="text-4xl sm:text-5xl mb-4 sm:mb-5 block">{c.emoji}</span>
                  <h3 className="font-bold text-lg sm:text-xl text-white mb-1">{c.name}</h3>
                  <p className="text-sky-400 text-xs font-semibold mb-3 sm:mb-4">📍 {c.location}</p>
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
              { label: '업체명', placeholder: '예) 영광 굴비가게' },
              { label: '연락처', placeholder: '010-0000-0000' },
              { label: '지역', placeholder: '예) 전남 영광' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 tracking-wide uppercase">{f.label}</label>
                <input type="text" placeholder={f.placeholder}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 sm:py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 tracking-wide uppercase">문의 내용</label>
              <textarea rows={4} placeholder="궁금한 점이나 요청사항을 입력해주세요"
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 sm:py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none" />
            </div>
            <button className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 text-sm sm:text-base">
              상담 신청하기 🐟
            </button>
            <p className="text-center text-slate-500 text-xs">빠른 시일 내에 연락드릴게요</p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-slate-800 bg-[#0a0f1e]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐟</span>
            <span className="font-bold text-slate-400 text-sm sm:text-base">굴비가게 도매 관리 시스템</span>
          </div>
          <a href="https://yuanfnb.com" target="_blank" rel="noopener noreferrer"
            className="text-pink-400 hover:text-pink-300 text-sm font-semibold transition-colors">
            유안 F&B →
          </a>
          <p className="text-slate-600 text-xs sm:text-sm">© 2026 All rights reserved</p>
        </div>
      </footer>

      <style jsx>{`
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
