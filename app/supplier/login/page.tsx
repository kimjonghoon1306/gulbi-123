'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'findEmail' | 'findPw'

export default function SupplierLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('123456')
  const [showPw, setShowPw] = useState(false)
  const [dark, setDark] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [findCompany, setFindCompany] = useState('')
  const [findContact, setFindContact] = useState('')
  const [findEmailResult, setFindEmailResult] = useState('')
  const [findEmailMsg, setFindEmailMsg] = useState('')
  const [findEmailLoading, setFindEmailLoading] = useState(false)
  const [findPwEmail, setFindPwEmail] = useState('')
  const [findPwMsg, setFindPwMsg] = useState('')
  const [findPwLoading, setFindPwLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return setError('이메일과 비밀번호를 입력해주세요.')
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr || !data.user) { setLoading(false); return setError('이메일 또는 비밀번호가 올바르지 않습니다.') }
    const { data: supplier } = await supabase.from('suppliers').select('status').eq('id', data.user.id).single()
    if (supplier?.status === '대기중') { await supabase.auth.signOut(); setLoading(false); return setError('아직 승인 대기 중입니다.') }
    if (supplier?.status === '거절') { await supabase.auth.signOut(); setLoading(false); return setError('가입이 거절되었습니다.') }
    router.push('/supplier/dashboard')
  }

  const handleFindEmail = async () => {
    if (!findCompany || !findContact) return setFindEmailMsg('업체명과 연락처를 모두 입력해주세요.')
    setFindEmailLoading(true); setFindEmailMsg(''); setFindEmailResult('')
    const supabase = createClient()
    const { data } = await supabase.from('suppliers').select('email').eq('company_name', findCompany).eq('contact', findContact).single()
    setFindEmailLoading(false)
    if (!data?.email) { setFindEmailMsg('일치하는 계정을 찾을 수 없습니다.') }
    else { const [id, domain] = data.email.split('@'); setFindEmailResult(id.slice(0, 3) + '***@' + domain) }
  }

  const handleFindPw = async () => {
    if (!findPwEmail) return setFindPwMsg('이메일을 입력해주세요.')
    setFindPwLoading(true); setFindPwMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(findPwEmail, { redirectTo: `${window.location.origin}/supplier/login` })
    setFindPwLoading(false)
    setFindPwMsg(error ? '오류가 발생했습니다.' : '✅ 비밀번호 재설정 링크를 이메일로 보냈습니다.')
  }

  const c = {
    bg: dark ? '#07090f' : '#f0f2f8',
    card: dark ? 'rgba(15,18,28,0.85)' : 'rgba(255,255,255,0.9)',
    border: dark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)',
    text: dark ? '#f0eefc' : '#1a1030',
    sub: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)',
    inputBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBorder: dark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.25)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    border: `1.5px solid ${c.inputBorder}`, background: c.inputBg,
    color: c.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    transition: 'all 0.2s',
  }

  const MsgBox = ({ msg }: { msg: string }) => !msg ? null : (
    <div style={{ background: msg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.startsWith('✅') ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '10px', padding: '12px 16px' }}>
      <p style={{ color: msg.startsWith('✅') ? '#34d399' : '#f87171', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>{msg}</p>
    </div>
  )

  const titles: Record<Mode, string> = { login: '공급업체 포털', findEmail: '이메일 찾기', findPw: '비밀번호 찾기' }

  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'background 0.4s' }}>

      {/* SVG 배경 */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g1" cx="80%" cy="20%" r="50%">
            <stop offset="0%" stopColor={dark ? '#7c3aed' : '#a78bfa'} stopOpacity={dark ? '0.15' : '0.12'} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="g2" cx="20%" cy="80%" r="50%">
            <stop offset="0%" stopColor={dark ? '#f59e0b' : '#f59e0b'} stopOpacity={dark ? '0.1' : '0.08'} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="g3" cx="50%" cy="50%" r="40%">
            <stop offset="0%" stopColor={dark ? '#ec4899' : '#ec4899'} stopOpacity="0.04" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g1)" />
        <rect width="100%" height="100%" fill="url(#g2)" />
        <rect width="100%" height="100%" fill="url(#g3)" />
        {/* 육각형 그리드 패턴 */}
        <pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
          <polygon points="30,2 58,17 58,35 30,50 2,35 2,17" fill="none" stroke={dark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.08)'} strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#hex)" />
        {/* 떠다니는 원형 */}
        <circle cx="10%" cy="15%" r="80" fill={dark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.05)'} className="float1" />
        <circle cx="90%" cy="70%" r="120" fill={dark ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.04)'} className="float2" />
        <circle cx="50%" cy="90%" r="60" fill={dark ? 'rgba(236,72,153,0.05)' : 'rgba(236,72,153,0.04)'} className="float3" />
        {/* 반짝이는 점들 */}
        {[[15,25],[85,15],[70,60],[25,75],[60,35],[40,85]].map(([x,y], i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r="2" fill={dark ? 'rgba(167,139,250,0.4)' : 'rgba(124,58,237,0.3)'} className={`sparkle${i % 3}`} />
        ))}
      </svg>

      {/* 다크모드 토글 */}
      <button onClick={() => setDark(v => !v)} className="theme-btn" style={{
        position: 'fixed', top: '20px', right: '20px', width: '44px', height: '44px',
        borderRadius: '12px', border: `1px solid ${c.border}`, background: c.card,
        backdropFilter: 'blur(12px)', fontSize: '18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
        boxShadow: dark ? '0 4px 20px rgba(124,58,237,0.2)' : '0 4px 20px rgba(0,0,0,0.08)',
      }}>{dark ? '🌙' : '☀️'}</button>

      {/* 관리자 버튼 */}
      <a href="/admin/dashboard" className="admin-btn" style={{
        position: 'fixed', bottom: '24px', right: '24px', width: '52px', height: '52px',
        borderRadius: '16px', border: `1px solid ${c.border}`, background: c.card,
        backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', textDecoration: 'none', zIndex: 10,
        boxShadow: dark ? '0 8px 24px rgba(124,58,237,0.2)' : '0 8px 24px rgba(0,0,0,0.08)',
      }}>⚙️</a>

      {/* 카드 */}
      <div style={{
        width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1,
        background: c.card, backdropFilter: 'blur(24px)',
        borderRadius: '28px', border: `1px solid ${c.border}`,
        boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 32px 80px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        {/* 카드 상단 글로우 라인 */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #7c3aed, #f59e0b, transparent)' }} />

        {/* 헤더 */}
        <div style={{ padding: '36px 40px 28px', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '200px', height: '100px', background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div className="logo-icon" style={{
            width: '68px', height: '68px', borderRadius: '20px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', boxShadow: '0 8px 32px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
            position: 'relative', zIndex: 1,
          }}>🏭</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: c.text, margin: '0 0 6px', letterSpacing: '-0.5px' }}>{titles[mode]}</h1>
          <p style={{ fontSize: '13px', color: c.sub, margin: 0 }}>굴비가게 공급업체 전용</p>
        </div>

        {/* 본문 */}
        <div style={{ padding: '4px 40px 40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {mode === 'login' && (<>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: c.sub, display: 'block', marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="example@company.com" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
                onBlur={e => { e.target.style.borderColor = c.inputBorder; e.target.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: c.sub, display: 'block', marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>비밀번호</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="비밀번호" style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = c.inputBorder; e.target.style.boxShadow = 'none' }} />
                <button onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.sub, fontSize: '16px' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              {[{ label: '이메일 찾기', m: 'findEmail' }, { label: '비밀번호 찾기', m: 'findPw' }].map(({ label, m }) => (
                <button key={m} onClick={() => { setMode(m as Mode); setFindEmailResult(''); setFindEmailMsg(''); setFindPwMsg('') }}
                  style={{ background: 'none', border: 'none', color: c.sub, fontSize: '12px', cursor: 'pointer', padding: 0 }}>{label}</button>
              ))}
            </div>
            <MsgBox msg={error} />
            <button onClick={handleLogin} disabled={loading} className="primary-btn" style={{
              width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
              background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
              color: loading ? 'rgba(255,255,255,0.5)' : '#111',
              fontSize: '15px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              position: 'relative', overflow: 'hidden',
            }}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', color: c.sub, margin: 0 }}>
              처음이신가요?{' '}
              <Link href="/supplier/register" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'none' }}>가입 신청</Link>
            </p>
          </>)}

          {mode === 'findEmail' && (<>
            <p style={{ fontSize: '13px', color: c.sub, margin: 0, lineHeight: 1.7 }}>가입 시 입력한 <strong style={{ color: c.text }}>업체명</strong>과 <strong style={{ color: c.text }}>연락처</strong>로 이메일을 찾을 수 있습니다.</p>
            {[
              { label: '업체명', val: findCompany, set: setFindCompany, ph: '가입 시 입력한 업체명' },
              { label: '연락처', val: findContact, set: setFindContact, ph: '가입 시 입력한 연락처' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: c.sub, display: 'block', marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{f.label}</label>
                <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = c.inputBorder; e.target.style.boxShadow = 'none' }} />
              </div>
            ))}
            {findEmailResult && (
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <p style={{ color: c.sub, fontSize: '11px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>찾은 이메일</p>
                <p style={{ color: '#34d399', fontSize: '18px', fontWeight: 800, margin: 0 }}>{findEmailResult}</p>
              </div>
            )}
            <MsgBox msg={findEmailMsg} />
            <button onClick={handleFindEmail} disabled={findEmailLoading} className="primary-btn" style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#111', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(245,158,11,0.35)' }}>
              {findEmailLoading ? '조회 중...' : '이메일 찾기'}
            </button>
            <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: c.sub, fontSize: '13px', cursor: 'pointer', padding: 0 }}>← 로그인으로 돌아가기</button>
          </>)}

          {mode === 'findPw' && (<>
            <p style={{ fontSize: '13px', color: c.sub, margin: 0, lineHeight: 1.7 }}>가입한 이메일로 <strong style={{ color: c.text }}>비밀번호 재설정 링크</strong>를 보내드립니다.</p>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: c.sub, display: 'block', marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>이메일</label>
              <input type="email" value={findPwEmail} onChange={e => setFindPwEmail(e.target.value)} placeholder="가입한 이메일 주소" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
                onBlur={e => { e.target.style.borderColor = c.inputBorder; e.target.style.boxShadow = 'none' }} />
            </div>
            <MsgBox msg={findPwMsg} />
            <button onClick={handleFindPw} disabled={findPwLoading} className="primary-btn" style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#111', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(245,158,11,0.35)' }}>
              {findPwLoading ? '전송 중...' : '재설정 링크 전송'}
            </button>
            <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: c.sub, fontSize: '13px', cursor: 'pointer', padding: 0 }}>← 로그인으로 돌아가기</button>
          </>)}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }

        /* 떠다니는 배경 원 */
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-30px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-25px,20px)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,25px)} }
        .float1 { animation: float1 8s ease-in-out infinite; }
        .float2 { animation: float2 11s ease-in-out infinite; }
        .float3 { animation: float3 7s ease-in-out infinite; }

        /* 반짝이는 점 */
        @keyframes sparkle { 0%,100%{opacity:0.2;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
        .sparkle0 { animation: sparkle 3s ease-in-out infinite; }
        .sparkle1 { animation: sparkle 4.5s ease-in-out infinite 1s; }
        .sparkle2 { animation: sparkle 3.5s ease-in-out infinite 2s; }

        /* 로고 아이콘 pulse */
        @keyframes logoPulse { 0%,100%{box-shadow:0 8px 32px rgba(245,158,11,0.45)} 50%{box-shadow:0 8px 48px rgba(245,158,11,0.7), 0 0 0 8px rgba(245,158,11,0.08)} }
        .logo-icon { animation: logoPulse 3s ease-in-out infinite; }

        /* 버튼 hover/active */
        .primary-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .primary-btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.02) !important; box-shadow: 0 16px 40px rgba(245,158,11,0.5) !important; }
        .primary-btn:active:not(:disabled) { transform: translateY(1px) scale(0.98) !important; }

        /* 버튼 shine 효과 */
        .primary-btn::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent); transition: left 0.5s; }
        .primary-btn:hover::after { left:150%; }

        /* 테마 버튼 */
        .theme-btn { transition: all 0.2s !important; }
        .theme-btn:hover { transform: rotate(20deg) scale(1.1) !important; }

        /* 관리자 버튼 */
        .admin-btn { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .admin-btn:hover { transform: translateY(-4px) rotate(30deg) !important; box-shadow: 0 12px 30px rgba(124,58,237,0.3) !important; }
      `}</style>
    </div>
  )
}
