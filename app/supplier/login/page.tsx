'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SupplierLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [dark, setDark] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'findEmail' | 'findPw'>('login')
  const [findInput, setFindInput] = useState('')
  const [findMsg, setFindMsg] = useState('')
  const [findLoading, setFindLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return setError('이메일과 비밀번호를 입력해주세요.')
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr || !data.user) {
      setLoading(false)
      return setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
    const { data: supplier } = await supabase.from('suppliers').select('status').eq('id', data.user.id).single()
    if (supplier) {
      if (supplier.status === '대기중') {
        await supabase.auth.signOut(); setLoading(false)
        return setError('아직 승인 대기 중입니다.')
      }
      if (supplier.status === '거절') {
        await supabase.auth.signOut(); setLoading(false)
        return setError('가입이 거절되었습니다. 관리자에게 문의해주세요.')
      }
    }
    router.push('/supplier/dashboard')
  }

  const handleFindPw = async () => {
    if (!findInput) return setFindMsg('이메일을 입력해주세요.')
    setFindLoading(true); setFindMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(findInput, {
      redirectTo: `${window.location.origin}/supplier/login`,
    })
    setFindLoading(false)
    setFindMsg(error ? '오류가 발생했습니다. 이메일을 확인해주세요.' : '비밀번호 재설정 링크를 이메일로 보냈습니다.')
  }

  const bg = dark ? '#0d1117' : '#f1f5f9'
  const cardBg = dark ? '#161b22' : '#ffffff'
  const border = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const text = dark ? 'white' : '#1e293b'
  const subText = dark ? 'rgba(255,255,255,0.4)' : '#94a3b8'
  const inputBg = dark ? 'rgba(255,255,255,0.05)' : '#f8fafc'
  const inputBorder = dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', transition: 'background 0.3s', position: 'relative' }}>

      {/* 배경 장식 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: dark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.06)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: dark ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.06)', filter: 'blur(80px)' }} />
      </div>

      {/* 다크모드 토글 */}
      <button onClick={() => setDark(v => !v)} style={{
        position: 'absolute', top: '24px', right: '24px',
        width: '44px', height: '44px', borderRadius: '12px', border: `1px solid ${border}`,
        background: cardBg, color: text, fontSize: '18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}>{dark ? '🌙' : '☀️'}</button>

      {/* 카드 */}
      <div style={{
        width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1,
        background: cardBg, borderRadius: '24px',
        border: `1px solid ${border}`,
        boxShadow: dark ? '0 32px 64px rgba(0,0,0,0.4)' : '0 32px 64px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>

        {/* 상단 헤더 */}
        <div style={{
          padding: '40px 40px 32px',
          background: dark ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))' : 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(217,119,6,0.02))',
          borderBottom: `1px solid ${border}`,
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
          }}>🏭</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: text, margin: '0 0 6px' }}>
            {mode === 'login' ? '공급업체 포털' : mode === 'findEmail' ? '이메일 찾기' : '비밀번호 재설정'}
          </h1>
          <p style={{ fontSize: '13px', color: subText, margin: 0 }}>
            {mode === 'login' ? '굴비가게 공급업체 전용 로그인' : '가입 시 입력한 정보를 확인해주세요'}
          </p>
        </div>

        {/* 본문 */}
        <div style={{ padding: '32px 40px 40px' }}>

          {/* 로그인 폼 */}
          {mode === 'login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: subText, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>이메일</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="example@company.com"
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: '12px',
                    border: `1px solid ${inputBorder}`, background: inputBg,
                    color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#f59e0b' }}
                  onBlur={e => { e.target.style.borderColor = inputBorder }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: subText, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>비밀번호</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="비밀번호를 입력하세요"
                    style={{
                      width: '100%', padding: '13px 48px 13px 16px', borderRadius: '12px',
                      border: `1px solid ${inputBorder}`, background: inputBg,
                      color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#f59e0b' }}
                    onBlur={e => { e.target.style.borderColor = inputBorder }} />
                  <button onClick={() => setShowPw(v => !v)} style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: subText, fontSize: '16px', padding: '4px',
                  }}>{showPw ? '🙈' : '👁️'}</button>
                </div>
              </div>

              {/* 이메일/비번 찾기 링크 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '-4px' }}>
                <button onClick={() => { setMode('findPw'); setFindInput(''); setFindMsg('') }}
                  style={{ background: 'none', border: 'none', color: subText, fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                  비밀번호 찾기
                </button>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                  <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>⚠️ {error}</p>
                </div>
              )}

              <button onClick={handleLogin} disabled={loading} style={{
                width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#111', fontSize: '15px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(245,158,11,0.35)',
                transition: 'all 0.2s', marginTop: '4px',
              }}>
                {loading ? '로그인 중...' : '로그인'}
              </button>

              <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                <p style={{ fontSize: '13px', color: subText, margin: 0 }}>
                  처음이신가요?{' '}
                  <Link href="/supplier/register" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'none' }}>가입 신청</Link>
                </p>
              </div>
            </div>
          )}

          {/* 비밀번호 찾기 */}
          {mode === 'findPw' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: subText, margin: 0, lineHeight: 1.6 }}>
                가입 시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
              </p>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: subText, display: 'block', marginBottom: '8px' }}>이메일</label>
                <input type="email" value={findInput} onChange={e => setFindInput(e.target.value)}
                  placeholder="가입한 이메일 주소"
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: '12px',
                    border: `1px solid ${inputBorder}`, background: inputBg,
                    color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#f59e0b' }}
                  onBlur={e => { e.target.style.borderColor = inputBorder }} />
              </div>
              {findMsg && (
                <div style={{ background: findMsg.includes('보냈') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${findMsg.includes('보냈') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '10px', padding: '12px 16px' }}>
                  <p style={{ color: findMsg.includes('보냈') ? '#34d399' : '#f87171', fontSize: '13px', margin: 0 }}>{findMsg}</p>
                </div>
              )}
              <button onClick={handleFindPw} disabled={findLoading} style={{
                width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#111', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
              }}>
                {findLoading ? '전송 중...' : '재설정 링크 전송'}
              </button>
              <button onClick={() => setMode('login')} style={{
                background: 'none', border: 'none', color: subText, fontSize: '13px', cursor: 'pointer',
              }}>← 로그인으로 돌아가기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
