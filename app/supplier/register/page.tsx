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
  const [dark, setDark] = useState(true)

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.company_name) {
      return setError('이메일, 비밀번호, 업체명은 필수입니다.')
    }
    if (form.password.length < 6) {
      return setError('비밀번호는 6자 이상이어야 합니다.')
    }
    setLoading(true); setError('')
    const supabase = createClient()

    let userId = ''

    // 1. signUp 시도 (Supabase는 기존 이메일도 에러 없이 반환 - identities로 구분)
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email, password: form.password,
    })

    if (authErr) {
      setLoading(false)
      const msg = authErr.message
      if (msg.includes('invalid email') || msg.includes('Invalid email'))
        return setError('이메일 형식이 올바르지 않습니다.')
      return setError('가입 오류: ' + msg)
    }

    if (!authData.user) {
      setLoading(false)
      return setError('가입에 실패했습니다. 다시 시도해주세요.')
    }

    const isExistingEmail = authData.user.identities && authData.user.identities.length === 0

    if (isExistingEmail) {
      // 기존 Auth 계정 → 로그인으로 실제 userId 획득
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: form.email, password: form.password,
      })
      if (signInErr || !signInData?.user) {
        setLoading(false)
        return setError('이미 가입된 이메일입니다. 비밀번호를 정확히 입력해주세요.')
      }
      userId = signInData.user.id
    } else {
      // 신규 계정 생성 성공
      userId = authData.user.id
    }

    // 2. 이미 공급업체로 가입된 경우 체크
    const { data: existing } = await supabase.from('suppliers').select('id').eq('id', userId).single()
    if (existing) {
      await supabase.auth.signOut()
      setLoading(false)
      return setError('이미 공급업체로 가입된 계정입니다. 로그인 페이지에서 로그인해주세요.')
    }

    // 3. suppliers 테이블에 insert
    const { error: dbErr } = await supabase.from('suppliers').insert({
      id: userId, email: form.email,
      company_name: form.company_name, representative: form.representative,
      business_number: form.business_number, contact: form.contact,
      address: form.address, category: form.category, status: '대기중',
    })
    await supabase.auth.signOut()
    setLoading(false)
    if (dbErr) return setError('정보 저장 실패: ' + dbErr.message)
    setDone(true)
  }

  const bg = dark ? '#0d1117' : '#f1f5f9'
  const cardBg = dark ? '#161b22' : '#ffffff'
  const border = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const text = dark ? 'white' : '#1e293b'
  const subText = dark ? 'rgba(255,255,255,0.4)' : '#94a3b8'
  const inputBg = dark ? 'rgba(255,255,255,0.05)' : '#f8fafc'
  const inputBorder = dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'
  const sectionLabel = dark ? '#a78bfa' : '#7c3aed'

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    border: `1px solid ${inputBorder}`, background: inputBg,
    color: text, fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#a78bfa'
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = inputBorder
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: cardBg, borderRadius: '24px', padding: '48px 40px', maxWidth: '420px', width: '100%', textAlign: 'center', border: `1px solid ${border}`, boxShadow: dark ? '0 32px 64px rgba(0,0,0,0.4)' : '0 32px 64px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: text, margin: '0 0 10px' }}>신청 완료</h2>
        <p style={{ fontSize: '14px', color: subText, margin: '0 0 32px', lineHeight: 1.7 }}>
          관리자 승인 후 로그인하실 수 있습니다.<br />승인까지 영업일 기준 1~2일 소요됩니다.
        </p>
        <Link href="/supplier/login" style={{
          display: 'block', width: '100%', padding: '15px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#111', fontWeight: 800, fontSize: '15px', textDecoration: 'none',
          textAlign: 'center', boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
        }}>로그인 페이지로 →</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', transition: 'background 0.3s' }}>

      {/* 배경 장식 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: dark ? 'rgba(167,139,250,0.04)' : 'rgba(167,139,250,0.06)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: dark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.06)', filter: 'blur(80px)' }} />
      </div>

      {/* 다크모드 토글 */}
      <button onClick={() => setDark(v => !v)} style={{
        position: 'fixed', top: '20px', right: '20px',
        width: '44px', height: '44px', borderRadius: '12px',
        border: `1px solid ${border}`, background: cardBg,
        fontSize: '18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10,
      }}>{dark ? '🌙' : '☀️'}</button>

      {/* 카드 */}
      <div style={{
        width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1,
        background: cardBg, borderRadius: '24px',
        border: `1px solid ${border}`,
        boxShadow: dark ? '0 32px 64px rgba(0,0,0,0.4)' : '0 32px 64px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>

        {/* 헤더 */}
        <div style={{
          padding: '36px 40px 28px', textAlign: 'center',
          background: dark ? 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(124,58,237,0.03))' : 'linear-gradient(135deg, rgba(167,139,250,0.06), rgba(124,58,237,0.02))',
          borderBottom: `1px solid ${border}`,
        }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '18px', margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', boxShadow: '0 8px 24px rgba(167,139,250,0.4)',
          }}>🏭</div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: text, margin: '0 0 6px' }}>공급업체 가입 신청</h1>
          <p style={{ fontSize: '13px', color: subText, margin: 0 }}>관리자 승인 후 서비스 이용 가능합니다</p>
        </div>

        {/* 폼 */}
        <div style={{ padding: '28px 40px 36px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 계정 정보 */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: sectionLabel, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>계정 정보</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="email" placeholder="이메일 *" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              <input type="password" placeholder="비밀번호 * (6자 이상)" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>

          {/* 업체 정보 */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: sectionLabel, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>업체 정보</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="업체명 *" value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', overflow: 'hidden' }} className="rep-grid">
                <input type="text" placeholder="대표자명" value={form.representative}
                  onChange={e => setForm({ ...form, representative: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }} onFocus={handleFocus} onBlur={handleBlur} />
                <input type="text" placeholder="사업자등록번호" value={form.business_number}
                  onChange={e => setForm({ ...form, business_number: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <input type="text" placeholder="연락처" value={form.contact}
                onChange={e => setForm({ ...form, contact: e.target.value })}
                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              <input type="text" placeholder="주소" value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ ...inputStyle, color: text }}
                onFocus={handleFocus} onBlur={handleBlur}>
                <option value="">취급 품목 선택</option>
                {['어류', '갑각류', '패류', '해조류', '건어물', '기타'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px 16px' }}>
              <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>⚠️ {error}</p>
            </div>
          )}

          {/* 이메일 중복 안내 */}
          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ color: '#a78bfa', fontSize: '12px', margin: 0, lineHeight: 1.7 }}>
              📌 쇼핑몰 회원과 공급업체 계정은 이메일을 각각 다르게 사용해주세요.<br />
              쇼핑몰에 이미 가입된 이메일로는 공급업체 가입이 불가합니다.
            </p>
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
            background: loading ? 'rgba(167,139,250,0.4)' : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            color: 'white', fontSize: '15px', fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 24px rgba(167,139,250,0.35)',
          }}>
            {loading ? '처리 중...' : '가입 신청하기'}
          </button>

          {/* 하단 링크 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/supplier/login" style={{ fontSize: '13px', color: subText, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ← 로그인으로 돌아가기
            </Link>
            <p style={{ fontSize: '13px', color: subText, margin: 0 }}>
              이미 계정이 있으신가요?{' '}
              <Link href="/supplier/login" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>로그인</Link>
            </p>
          </div>
        </div>
      </div>
      <style>{`* { box-sizing: border-box; } @media (max-width: 520px) { .rep-grid { grid-template-columns: 1fr !important; } } select option { background: #161b22; color: white; }`}</style>
    </div>
  )
}
