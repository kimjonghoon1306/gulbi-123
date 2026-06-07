'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function FarmLogoSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="drop-shadow-xl">
      <defs>
        <linearGradient id="loginGrad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#15803d"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#loginGrad)"/>
      <path d="M20 44 Q32 20 44 44" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <circle cx="32" cy="26" r="7" fill="white" fillOpacity="0.95"/>
      <path d="M24 48 h16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="32" cy="26" r="3" fill="url(#loginGrad)"/>
    </svg>
  )
}

// SVG 배경 패턴
function BgPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,197,94,0.08)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      <circle cx="15%" cy="20%" r="120" fill="rgba(34,197,94,0.06)"/>
      <circle cx="85%" cy="75%" r="160" fill="rgba(21,128,61,0.05)"/>
      <circle cx="50%" cy="50%" r="200" fill="rgba(34,197,94,0.03)"/>
    </svg>
  )
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [dark, setDark] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('app-theme')
    if (saved === 'light') setDark(false)
    else setDark(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
    } else {
      window.location.href = '/admin/dashboard'
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: dark ? 'linear-gradient(135deg,#071a0e,#0a2a10,#0f172a)' : 'linear-gradient(135deg,#f0fdf4,#dcfce7,#f1f5f9)' }}>
      <BgPattern />

      {/* 좌상단: 대문 버튼 */}
      <Link href="/landing" style={{
        position: 'fixed', top: '16px', left: '16px', zIndex: 60,
        display: 'flex', alignItems: 'center', gap: '6px',
        background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
        border: 'none', borderRadius: '12px', padding: '10px 14px',
        fontSize: '13px', fontWeight: 700,
        color: dark ? 'rgba(255,255,255,0.85)' : '#1a1a18',
        textDecoration: 'none', cursor: 'pointer',
      }}>← 대문</Link>

      {/* 우상단: 토글 버튼 */}
      <button onClick={() => { const n = !dark; setDark(n); localStorage.setItem('app-theme', n ? 'dark' : 'light') }}
        style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 60,
          width: '44px', height: '44px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
          fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', flexShrink: 0,
        }}>
        {dark ? '☀️' : '🌙'}
      </button>

      {/* 플로팅 이모지 배경 */}
      {['🌾','🥩','🧺','🥬','🍎','🧺'].map((em, i) => (
        <div
          key={i}
          className="absolute text-2xl opacity-10 select-none pointer-events-none"
          style={{
            left: `${8 + i * 15}%`,
            top: `${15 + (i % 3) * 25}%`,
            animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        >
          {em}
        </div>
      ))}

      <div className="relative z-10 w-full max-w-sm mx-4 animate-fadeIn">
        {/* 카드 */}
        <div className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
          style={{ background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)', border: dark ? '1px solid rgba(255,255,255,0.20)' : '1px solid rgba(0,0,0,0.10)' }}>

          {/* 로고 영역 */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4" style={{ animation: 'float 3s ease-in-out infinite' }}>
              <FarmLogoSVG />
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: dark ? 'white' : '#111827' }}>온종일팜</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-xs font-medium text-green-300">🌾 농산</span>
              <span className="text-green-600">·</span>
              <span className="text-xs font-medium text-green-300">🥩 축산</span>
              <span className="text-green-600">·</span>
              <span className="text-xs font-medium text-green-300">🧺 농축수산물</span>
            </div>
            <p className="text-green-400/70 text-xs mt-2">관리자 로그인</p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: dark ? 'rgba(187,247,208,0.8)' : '#15803d' }}>이메일</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-400/60" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4l6 5 6-5M2 4h12v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all"
                  style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)', color: dark ? 'white' : '#111827' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: dark ? 'rgba(187,247,208,0.8)' : '#15803d' }}>비밀번호</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-400/60" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all"
                  style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)', color: dark ? 'white' : '#111827' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 animate-fadeIn">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.4"/><path d="M7 4v3M7 9.5v.5" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <p className="text-red-300 text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 relative overflow-hidden
                bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500
                text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50
                hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                    <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  로그인 중...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12h7M10 8l3 4-3 4M10 8H3a1 1 0 01-1-1V3a1 1 0 011-1h7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  관리자 로그인
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: dark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.25)' }}>© 2026 온종일팜 · 농축수산물 도매 플랫폼</p>
      </div>

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
