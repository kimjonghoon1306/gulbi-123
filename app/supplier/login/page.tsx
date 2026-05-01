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

  // 이메일 찾기
  const [findCompany, setFindCompany] = useState('')
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
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr || !data.user) {
      setLoading(false)
      return setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
    const { data: supplier } = await supabase.from('suppliers').select('status').eq('id', data.user.id).single()
    if (supplier?.status === '대기중') {
      await supabase.auth.signOut(); setLoading(false)
      return setError('아직 승인 대기 중입니다.')
    }
    if (supplier?.status === '거절') {
      await supabase.auth.signOut(); setLoading(false)
      return setError('가입이 거절되었습니다. 관리자에게 문의해주세요.')
    }
    router.push('/supplier/dashboard')
  }

  // 이메일 찾기: 업체명 + 연락처로 suppliers 테이블 조회
  const handleFindEmail = async () => {
    if (!findCompany || !findContact) return setFindEmailMsg('업체명과 연락처를 모두 입력해주세요.')
    setFindEmailLoading(true); setFindEmailMsg(''); setFindEmailResult('')
    const supabase = createClient()
    const { data } = await supabase
      .from('suppliers')
      .select('email')
      .eq('company_name', findCompany)
      .eq('contact', findContact)
      .single()
    setFindEmailLoading(false)
    if (!data?.email) {
      setFindEmailMsg('입력하신 정보와 일치하는 계정을 찾을 수 없습니다.')
    } else {
      // 이메일 일부 마스킹: abc***@company.com
      const [id, domain] = data.email.split('@')
      const masked = id.slice(0, 3) + '***@' + domain
      setFindEmailResult(masked)
      setFindEmailMsg('')
    }
  }

  // 비밀번호 찾기: 이메일로 재설정 링크 발송
  const handleFindPw = async () => {
    if (!findPwEmail) return setFindPwMsg('이메일을 입력해주세요.')
    setFindPwLoading(true); setFindPwMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(findPwEmail, {
      redirectTo: `${window.location.origin}/supplier/login`,
    })
    setFindPwLoading(false)
    setFindPwMsg(error
      ? '오류가 발생했습니다. 이메일을 확인해주세요.'
      : '✅ 비밀번호 재설정 링크를 이메일로 보냈습니다. 링크를 클릭해 새 비밀번호를 설정하세요.'
    )
  }

  const bg = dark ? '#0d1117' : '#f1f5f9'
  const cardBg = dark ? '#161b22' : '#ffffff'
  const border = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const text = dark ? 'white' : '#1e293b'
  const subText = dark ? 'rgba(255,255,255,0.4)' : '#94a3b8'
  const inputBg = dark ? 'rgba(255,255,255,0.05)' : '#f8fafc'
  const inputBorder = dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'

  const inputStyle = (focused = false): React.CSSProperties => ({
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    border: `1px solid ${focused ? '#f59e0b' : inputBorder}`,
    background: inputBg, color: text, fontSize: '14px',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  })

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label style={{ fontSize: '12px', fontWeight: 600, color: subText, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
      {children}
    </label>
  )

  const MsgBox = ({ msg }: { msg: string }) => !msg ? null : (
    <div style={{
      background: msg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${msg.startsWith('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: '10px', padding: '12px 16px',
    }}>
      <p style={{ color: msg.startsWith('✅') ? '#34d399' : '#f87171', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>{msg}</p>
    </div>
  )

  const PrimaryBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
      background: disabled ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: '#111', fontSize: '15px', fontWeight: 800,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 8px 24px rgba(245,158,11,0.35)',
    }}>{children}</button>
  )

  const BackBtn = () => (
    <button onClick={() => { setMode('login'); setFindEmailResult(''); setFindEmailMsg(''); setFindPwMsg('') }}
      style={{ background: 'none', border: 'none', color: subText, fontSize: '13px', cursor: 'pointer', padding: 0 }}>
      ← 로그인으로 돌아가기
    </button>
  )

  const titles: Record<Mode, string> = {
    login: '공급업체 포털',
    findEmail: '이메일 찾기',
    findPw: '비밀번호 찾기',
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', transition: 'background 0.3s', position: 'relative' }}>

      {/* 배경 장식 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: dark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.06)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: dark ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.06)', filter: 'blur(80px)' }} />
      </div>

      {/* 다크모드 토글 */}
      <button onClick={() => setDark(v => !v)} style={{
        position: 'fixed', top: '20px', right: '20px',
        width: '44px', height: '44px', borderRadius: '12px',
        border: `1px solid ${border}`, background: cardBg,
        fontSize: '18px', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10,
      }}>{dark ? '🌙' : '☀️'}</button>

      {/* 관리자 페이지 버튼 */}
      <a href="/admin/dashboard" title="관리자 페이지" style={{
        position: 'fixed', bottom: '24px', right: '24px',
        width: '52px', height: '52px', borderRadius: '16px',
        border: `1px solid ${border}`, background: cardBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', textDecoration: 'none', zIndex: 10,
        boxShadow: dark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)',
      }}>⚙️</a>

      {/* 카드 */}
      <div style={{
        width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1,
        background: cardBg, borderRadius: '24px',
        border: `1px solid ${border}`,
        boxShadow: dark ? '0 32px 64px rgba(0,0,0,0.4)' : '0 32px 64px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>

        {/* 헤더 */}
        <div style={{
          padding: '40px 40px 32px', textAlign: 'center',
          background: dark ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.02))' : 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(217,119,6,0.01))',
          borderBottom: `1px solid ${border}`,
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
          }}>🏭</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: text, margin: '0 0 6px' }}>{titles[mode]}</h1>
          <p style={{ fontSize: '13px', color: subText, margin: 0 }}>굴비가게 공급업체 전용</p>
        </div>

        {/* 본문 */}
        <div style={{ padding: '32px 40px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── 로그인 ── */}
          {mode === 'login' && (<>
            <div>
              <Label>이메일</Label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="example@company.com" style={inputStyle()}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = inputBorder} />
            </div>
            <div>
              <Label>비밀번호</Label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="비밀번호"
                  style={{ ...inputStyle(), paddingRight: '48px' }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = inputBorder} />
                <button onClick={() => setShowPw(v => !v)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: subText, fontSize: '16px',
                }}>{showPw ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '-4px' }}>
              <button onClick={() => { setMode('findEmail'); setFindEmailResult(''); setFindEmailMsg('') }}
                style={{ background: 'none', border: 'none', color: subText, fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                이메일 찾기
              </button>
              <button onClick={() => { setMode('findPw'); setFindPwMsg('') }}
                style={{ background: 'none', border: 'none', color: subText, fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                비밀번호 찾기
              </button>
            </div>
            <MsgBox msg={error} />
            <PrimaryBtn onClick={handleLogin} disabled={loading}>{loading ? '로그인 중...' : '로그인'}</PrimaryBtn>
            <p style={{ textAlign: 'center', fontSize: '13px', color: subText, margin: 0 }}>
              처음이신가요? <Link href="/supplier/register" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'none' }}>가입 신청</Link>
            </p>
          </>)}

          {/* ── 이메일 찾기 ── */}
          {mode === 'findEmail' && (<>
            <p style={{ fontSize: '13px', color: subText, margin: 0, lineHeight: 1.7 }}>
              가입 시 입력한 <strong style={{ color: text }}>업체명</strong>과 <strong style={{ color: text }}>연락처</strong>로 이메일을 찾을 수 있습니다.
            </p>
            <div>
              <Label>업체명</Label>
              <input type="text" value={findCompany} onChange={e => setFindCompany(e.target.value)}
                placeholder="가입 시 입력한 업체명" style={inputStyle()}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = inputBorder} />
            </div>
            <div>
              <Label>연락처</Label>
              <input type="text" value={findContact} onChange={e => setFindContact(e.target.value)}
                placeholder="가입 시 입력한 연락처" style={inputStyle()}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = inputBorder} />
            </div>
            {findEmailResult && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <p style={{ color: subText, fontSize: '12px', margin: '0 0 6px' }}>찾은 이메일</p>
                <p style={{ color: '#34d399', fontSize: '18px', fontWeight: 800, margin: 0 }}>{findEmailResult}</p>
              </div>
            )}
            <MsgBox msg={findEmailMsg} />
            <PrimaryBtn onClick={handleFindEmail} disabled={findEmailLoading}>
              {findEmailLoading ? '조회 중...' : '이메일 찾기'}
            </PrimaryBtn>
            <BackBtn />
          </>)}

          {/* ── 비밀번호 찾기 ── */}
          {mode === 'findPw' && (<>
            <p style={{ fontSize: '13px', color: subText, margin: 0, lineHeight: 1.7 }}>
              가입한 이메일을 입력하시면 <strong style={{ color: text }}>비밀번호 재설정 링크</strong>를 보내드립니다. 링크를 클릭해 새 비밀번호를 설정하세요.
            </p>
            <div>
              <Label>이메일</Label>
              <input type="email" value={findPwEmail} onChange={e => setFindPwEmail(e.target.value)}
                placeholder="가입한 이메일 주소" style={inputStyle()}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = inputBorder} />
            </div>
            <MsgBox msg={findPwMsg} />
            <PrimaryBtn onClick={handleFindPw} disabled={findPwLoading}>
              {findPwLoading ? '전송 중...' : '재설정 링크 전송'}
            </PrimaryBtn>
            <BackBtn />
          </>)}
        </div>
      </div>
      <style>{`* { box-sizing: border-box; }`}</style>
    </div>
  )
}
