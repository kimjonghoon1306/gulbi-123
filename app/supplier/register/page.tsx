'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SupplierRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '', password: '', company_name: '', representative: '',
    business_number: '', contact: '', address: '', category: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.company_name) {
      return setError('이메일, 비밀번호, 업체명은 필수입니다.')
    }
    setLoading(true); setError('')

    const supabase = createClient()

    // 1. Supabase Auth 회원가입
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authErr || !authData.user) {
      setLoading(false)
      return setError(authErr?.message || '회원가입 실패')
    }

    // 2. suppliers 테이블에 업체 정보 저장
    const { error: dbErr } = await supabase.from('suppliers').insert({
      id: authData.user.id,
      email: form.email,
      company_name: form.company_name,
      representative: form.representative,
      business_number: form.business_number,
      contact: form.contact,
      address: form.address,
      category: form.category,
      status: '대기중',
    })

    setLoading(false)
    if (dbErr) return setError('정보 저장 실패: ' + dbErr.message)
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">신청 완료</h2>
          <p className="text-slate-500 text-sm mb-6">
            관리자 승인 후 로그인하실 수 있습니다.<br />
            승인까지 영업일 기준 1~2일 소요됩니다.
          </p>
          <Link href="/supplier/login"
            className="block w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold transition-colors">
            로그인 페이지로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏭</span>
            <div>
              <h1 className="text-xl font-bold text-slate-800">공급업체 가입 신청</h1>
              <p className="text-slate-400 text-sm">관리자 승인 후 서비스 이용 가능합니다</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-4">
          {/* 계정 정보 */}
          <div>
            <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-3">계정 정보</p>
            <div className="space-y-3">
              <input type="email" placeholder="이메일 *" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <input type="password" placeholder="비밀번호 * (8자 이상)" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          {/* 업체 정보 */}
          <div>
            <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-3">업체 정보</p>
            <div className="space-y-3">
              <input type="text" placeholder="업체명 *" value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="대표자명" value={form.representative}
                  onChange={e => setForm({ ...form, representative: e.target.value })}
                  className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                <input type="text" placeholder="사업자등록번호" value={form.business_number}
                  onChange={e => setForm({ ...form, business_number: e.target.value })}
                  className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <input type="text" placeholder="연락처" value={form.contact}
                onChange={e => setForm({ ...form, contact: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <input type="text" placeholder="주소" value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-500">
                <option value="">취급 품목 선택</option>
                {['어류', '갑각류', '패류', '해조류', '건어물', '기타'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50">
            {loading ? '처리 중...' : '가입 신청하기'}
          </button>

          <p className="text-center text-sm text-slate-400">
            이미 계정이 있으신가요?{' '}
            <Link href="/supplier/login" className="text-violet-500 font-semibold hover:underline">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

