'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SupplierLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) return setError('이메일과 비밀번호를 입력해주세요.')
    setLoading(true); setError('')

    const supabase = createClient()

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr || !data.user) {
      setLoading(false)
      return setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }

    // suppliers 테이블에서 승인 상태 확인
    const { data: supplier, error: supErr } = await supabase
      .from('suppliers')
      .select('status, company_name')
      .eq('id', data.user.id)
      .single()

    if (supErr || !supplier) {
      await supabase.auth.signOut()
      setLoading(false)
      return setError('공급업체 계정이 아닙니다.')
    }

    if (supplier.status === '대기중') {
      await supabase.auth.signOut()
      setLoading(false)
      return setError('아직 승인 대기 중입니다. 관리자 승인 후 로그인 가능합니다.')
    }

    if (supplier.status === '거절') {
      await supabase.auth.signOut()
      setLoading(false)
      return setError('가입이 거절되었습니다. 관리자에게 문의해주세요.')
    }

    router.push('/supplier/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-8 border-b border-slate-100 text-center">
          <span className="text-4xl">🏭</span>
          <h1 className="text-xl font-bold text-slate-800 mt-3">공급업체 로그인</h1>
          <p className="text-slate-400 text-sm mt-1">굴비가게 공급업체 전용 포털</p>
        </div>

        <div className="p-8 space-y-4">
          <input type="email" placeholder="이메일" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="password" placeholder="비밀번호" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50">
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <p className="text-center text-sm text-slate-400">
            처음이신가요?{' '}
            <Link href="/supplier/register" className="text-violet-500 font-semibold hover:underline">가입 신청</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

