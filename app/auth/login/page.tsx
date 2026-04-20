'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(`오류: ${error.message}`)
      } else if (data.session) {
        router.push('/admin/dashboard')
        router.refresh()
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (e: any) {
      setError(`연결 오류: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">

      {/* 배경 애니메이션 원들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bubble bubble-1" />
        <div className="bubble bubble-2" />
        <div className="bubble bubble-3" />
        <div className="bubble bubble-4" />
      </div>

      {/* 로그인 카드 */}
      <div className="relative z-10 w-full max-w-md mx-4 login-card">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10">

          {/* 로고 */}
          <div className="text-center mb-10">
            <div className="fish-icon text-6xl mb-4 inline-block">🐟</div>
            <h1 className="text-3xl font-bold text-white tracking-tight">굴비가게</h1>
            <p className="text-sky-300 mt-2 text-sm font-medium">영광 수산물 도매 관리 시스템</p>
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-40" />
          </div>

          {/* 입력폼 */}
          <div className="space-y-5">
            <div className="input-group">
              <label className="block text-sky-200 text-xs font-semibold mb-2 tracking-wide uppercase">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-sky-400 focus:bg-white/15 transition-all duration-200"
              />
            </div>

            <div className="input-group">
              <label className="block text-sky-200 text-xs font-semibold mb-2 tracking-wide uppercase">비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-white/30 text-sm focus:outline-none focus:border-sky-400 focus:bg-white/15 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform duration-150"
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-bold py-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/30 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading-dot">●</span>
                  <span className="loading-dot delay-200">●</span>
                  <span className="loading-dot delay-400">●</span>
                </span>
              ) : '로그인'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <a href="/landing" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all duration-200 border border-white/20">
              🏠 대문으로 돌아가기
            </a>
          </div>
          <p className="text-center text-white/20 text-xs mt-4">© 2026 굴비가게 · 영광 수산물</p>
        </div>
      </div>

      <style jsx>{`
        .login-card { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .fish-icon { animation: float 3s ease-in-out infinite; display: inline-block; }
        .input-group { animation: slideUp 0.5s ease both; }
        .input-group:nth-child(2) { animation-delay: 0.1s; }
        .bubble { position: absolute; border-radius: 50%; opacity: 0.12; animation: pulse ease-in-out infinite; }
        .bubble-1 { width: 400px; height: 400px; background: radial-gradient(circle, #38bdf8, #0ea5e9); left: -150px; top: -150px; animation-duration: 8s; }
        .bubble-2 { width: 250px; height: 250px; background: radial-gradient(circle, #0284c7, #0369a1); right: -80px; bottom: 50px; animation-duration: 10s; animation-delay: -3s; }
        .bubble-3 { width: 180px; height: 180px; background: radial-gradient(circle, #7dd3fc, #38bdf8); left: 30%; bottom: -80px; animation-duration: 9s; animation-delay: -5s; }
        .bubble-4 { width: 120px; height: 120px; background: radial-gradient(circle, #0ea5e9, #0284c7); right: 25%; top: 30px; animation-duration: 7s; animation-delay: -2s; }
        @keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
        @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.08); } }
        @keyframes blink { 0%,80%,100% { opacity:0.2; } 40% { opacity:1; } }
        .loading-dot { font-size:8px; animation: blink 1.2s ease-in-out infinite; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  )
}
