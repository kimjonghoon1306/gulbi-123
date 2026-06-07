'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Mode = 'login' | 'findEmail' | 'findPw'

export default function ShopLoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)
  }, [])

  const D = {
    bg: dark ? '#0a0e1a' : '#fafaf8',
    headerBg: dark ? 'rgba(10,14,26,0.97)' : 'rgba(250,250,248,0.97)',
    card: dark ? '#111827' : '#ffffff',
    text: dark ? '#f0f0ee' : '#1a1a18',
    sub: dark ? '#6b7280' : '#9ca3af',
    border: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    inputBg: dark ? '#1a2235' : '#f5f3ef',
  }

  // 이메일 찾기
  const [findName, setFindName] = useState('')
  const [findContact, setFindContact] = useState('')
  const [findEmailResult, setFindEmailResult] = useState('')
  const [findEmailMsg, setFindEmailMsg] = useState('')
  const [findEmailLoading, setFindEmailLoading] = useState(false)

  // 비밀번호 찾기
  const [findPwEmail, setFindPwEmail] = useState('')
  const [findPwMsg, setFindPwMsg] = useState('')
  const [findPwLoading, setFindPwLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return setError('이메일과 비밀번호를 입력해주세요.')
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError || !data.session) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false); return
    }
    const { data: member } = await supabase.from('shop_members').select('status').eq('id', data.user.id).single()
    if (member?.status === '대기중') { await supabase.auth.signOut(); setError('승인 대기 중입니다. 관리자 승인 후 이용 가능해요.'); setLoading(false); return }
    if (member?.status === '거절') { await supabase.auth.signOut(); setError('가입이 거절되었습니다. 관리자에게 문의해주세요.'); setLoading(false); return }
    router.push('/shop')
  }

  // 이메일 찾기: 이름 + 연락처로 shop_members 조회
  const handleFindEmail = async () => {
    if (!findName || !findContact) return setFindEmailMsg('이름과 연락처를 모두 입력해주세요.')
    setFindEmailLoading(true); setFindEmailMsg(''); setFindEmailResult('')
    const supabase = createClient()
    const { data } = await supabase.from('shop_members').select('email').eq('name', findName).eq('contact', findContact).single()
    setFindEmailLoading(false)
    if (!data?.email) { setFindEmailMsg('일치하는 계정을 찾을 수 없습니다.') }
    else { const [id, domain] = data.email.split('@'); setFindEmailResult(id.slice(0, 3) + '***@' + domain) }
  }

  // 비밀번호 찾기: 이메일로 재설정 링크
  const handleFindPw = async () => {
    if (!findPwEmail) return setFindPwMsg('이메일을 입력해주세요.')
    setFindPwLoading(true); setFindPwMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(findPwEmail, { redirectTo: `${window.location.origin}/shop/login` })
    setFindPwLoading(false)
    setFindPwMsg(error ? '오류가 발생했습니다.' : '✅ 비밀번호 재설정 링크를 이메일로 보냈습니다.')
  }

  const resetMode = (m: Mode) => { setMode(m); setError(''); setFindEmailResult(''); setFindEmailMsg(''); setFindPwMsg('') }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: D.inputBg, border: '1.5px solid transparent',
    borderRadius: '12px', padding: '12px 16px', fontSize: '14px',
    color: D.text, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s',
  }

  const titles: Record<Mode, string> = { login: '로그인', findEmail: '이메일 찾기', findPw: '비밀번호 찾기' }

  return (
    <div style={{ minHeight: '100vh', background: D.bg, color: D.text, fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* 헤더 */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '64px', borderBottom: `1px solid ${D.border}`, background: D.headerBg, backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span style={{ fontSize: '22px' }}>🧺</span>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 800, color: D.text, letterSpacing: '-0.5px', lineHeight: 1 }}>온종일팜</p>
            <p style={{ fontSize: '9px', color: D.sub, letterSpacing: '2px', textTransform: 'uppercase' }}>Fresh Seafood</p>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => { const n = !dark; setDark(n); localStorage.setItem('shop-theme', n ? 'dark' : 'light') }}
            style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
              fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0 }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <Link href="/shop/register" style={{ fontSize: '13px', fontWeight: 600, color: '#14532d', textDecoration: 'none', padding: '8px 16px', borderRadius: '10px', border: '1.5px solid rgba(22,163,74,0.2)', background: 'rgba(22,163,74,0.05)' }}>
            회원가입 →
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* 로고 */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '14px', lineHeight: 1 }}>🧺</div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: D.text, letterSpacing: '-1px', marginBottom: '6px' }}>{titles[mode]}</h1>
            <p style={{ fontSize: '13px', color: D.sub }}>온종일팜 쇼핑몰</p>
          </div>

          {/* 탭 */}
          <div style={{ display: 'flex', background: D.card, borderRadius: '16px', padding: '4px', marginBottom: '16px', border: `1px solid ${D.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {[
              { k: 'login', label: '로그인' },
              { k: 'findEmail', label: '이메일 찾기' },
              { k: 'findPw', label: '비밀번호 찾기' },
            ].map(t => (
              <button key={t.k} onClick={() => resetMode(t.k as Mode)}
                style={{ flex: 1, padding: '9px 4px', borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  background: mode === t.k ? 'linear-gradient(135deg,#14532d,#15803d)' : 'transparent',
                  color: mode === t.k ? 'white' : '#9ca3af',
                  boxShadow: mode === t.k ? '0 4px 12px rgba(22,163,74,0.25)' : 'none',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* 폼 카드 */}
          <div style={{ background: D.card, borderRadius: '24px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: `1px solid ${D.border}` }}>

            {/* 로그인 */}
            {mode === 'login' && (<>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: D.sub, marginBottom: '8px' }}>이메일</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#14532d'}
                  onBlur={e => e.target.style.borderColor = 'transparent'} />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: D.sub, marginBottom: '8px' }}>비밀번호</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    onFocus={e => e.target.style.borderColor = '#14532d'}
                    onBlur={e => e.target.style.borderColor = 'transparent'} />
                  <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}><p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p></div>}
              <button onClick={handleLogin} disabled={loading} className="login-btn">
                {loading ? '로그인 중...' : '로그인'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '18px' }}>
                <Link href="/shop/register" style={{ fontSize: '13px', color: D.sub, textDecoration: 'none' }}>
                  아직 계정이 없어요? <span style={{ color: '#14532d', fontWeight: 700 }}>회원가입</span>
                </Link>
              </div>
            </>)}

            {/* 이메일 찾기 */}
            {mode === 'findEmail' && (<>
              <p style={{ fontSize: '13px', color: D.sub, marginBottom: '18px', lineHeight: 1.7 }}>
                가입 시 입력한 <strong style={{ color: D.text }}>이름</strong>과 <strong style={{ color: D.text }}>연락처</strong>로 이메일을 찾을 수 있습니다.
              </p>
              {[
                { label: '이름', val: findName, set: setFindName, ph: '가입 시 입력한 이름' },
                { label: '연락처', val: findContact, set: setFindContact, ph: '가입 시 입력한 연락처' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: D.sub, marginBottom: '8px' }}>{f.label}</label>
                  <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#14532d'}
                    onBlur={e => e.target.style.borderColor = 'transparent'} />
                </div>
              ))}
              {findEmailResult && (
                <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '14px' }}>
                  <p style={{ fontSize: '11px', color: D.sub, marginBottom: '6px' }}>찾은 이메일</p>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', margin: 0 }}>{findEmailResult}</p>
                </div>
              )}
              {findEmailMsg && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}><p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{findEmailMsg}</p></div>}
              <button onClick={handleFindEmail} disabled={findEmailLoading} className="login-btn">
                {findEmailLoading ? '조회 중...' : '이메일 찾기'}
              </button>
            </>)}

            {/* 비밀번호 찾기 */}
            {mode === 'findPw' && (<>
              <p style={{ fontSize: '13px', color: D.sub, marginBottom: '18px', lineHeight: 1.7 }}>
                가입한 이메일로 <strong style={{ color: D.text }}>비밀번호 재설정 링크</strong>를 보내드립니다.
              </p>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: D.sub, marginBottom: '8px' }}>이메일</label>
                <input type="email" value={findPwEmail} onChange={e => setFindPwEmail(e.target.value)}
                  placeholder="가입한 이메일 주소" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#14532d'}
                  onBlur={e => e.target.style.borderColor = 'transparent'} />
              </div>
              {findPwMsg && (
                <div style={{ background: findPwMsg.startsWith('✅') ? 'rgba(22,163,74,0.06)' : '#fef2f2', border: `1px solid ${findPwMsg.startsWith('✅') ? 'rgba(22,163,74,0.2)' : '#fecaca'}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>
                  <p style={{ color: findPwMsg.startsWith('✅') ? '#14532d' : '#ef4444', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>{findPwMsg}</p>
                </div>
              )}
              <button onClick={handleFindPw} disabled={findPwLoading} className="login-btn">
                {findPwLoading ? '전송 중...' : '재설정 링크 전송'}
              </button>
            </>)}
          </div>
        </div>
      </div>

      <style>{`
        .login-btn {
          width: 100%; padding: 14px; border-radius: 14px;
          background: linear-gradient(135deg, #14532d, #15803d);
          color: white; font-size: 15px; font-weight: 700; border: none;
          cursor: pointer; box-shadow: 0 8px 24px rgba(22,163,74,0.3);
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .login-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(22,163,74,0.4); }
        .login-btn:active:not(:disabled) { transform: translateY(1px); }
        .login-btn:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }
      `}</style>
    </div>
  )
}
