'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'findPw' | 'changePw'

export default function SupplierLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('123456')
  const [showPw, setShowPw] = useState(false)
  const [dark, setDark] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('login')

  // 비번 찾기
  const [findEmail, setFindEmail] = useState('')
  const [findMsg, setFindMsg] = useState('')
  const [findLoading, setFindLoading] = useState(false)

  // 비번 변경
  const [newPw, setNewPw] = useState('')
  const [newPwConfirm, setNewPwConfirm] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [changePwMsg, setChangePwMsg] = useState('')
  const [changePwLoading, setChangePwLoading] = useState(false)

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

  const handleFindPw = async () => {
    if (!findEmail) return setFindMsg('이메일을 입력해주세요.')
    setFindLoading(true); setFindMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(findEmail, {
      redirectTo: `${window.location.origin}/supplier/login`,
    })
    setFindLoading(false)
    setFindMsg(error ? '오류가 발생했습니다.' : '✅ 비밀번호 재설정 링크를 이메일로 보냈습니다.')
  }

  const handleChangePw = async () => {
    if (!newPw || !newPwConfirm) return setChangePwMsg('새 비밀번호를 입력해주세요.')
    if (newPw !== newPwConfirm) return setChangePwMsg('비밀번호가 일치하지 않습니다.')
    if (newPw.length < 6) return setChangePwMsg('비밀번호는 6자 이상이어야 합니다.')
    setChangePwLoading(true); setChangePwMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setChangePwLoading(false)
    if (error) return setChangePwMsg('오류가 발생했습니다. 먼저 로그인해주세요.')
    setChangePwMsg('✅ 비밀번호가 변경되었습니다.')
    setNewPw(''); setNewPwConfirm('')
  }

  const bg = dark ? '#0d1117' : '#f1f5f9'
  const cardBg = dark ? '#161b22' : '#ffffff'
  const border = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const text = dark ? 'white' : '#1e293b'
  const subText = dark ? 'rgba(255,255,255,0.4)' : '#94a3b8'
  const inputBg = dark ? 'rgba(255,255,255,0.05)' : '#f8fafc'
  const inputBorder = dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'

  const Input = ({ type = 'text', value, onChange, placeholder, showToggle, onToggle, show }: any) => (
    <div style={{ position: 'relative' }}>
      <input
        type={showToggle ? (show ? 'text' : 'password') : type}
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()}
        style={{
          width: '100%', padding: showToggle ? '13px 48px 13px 16px' : '13px 16px',
          borderRadius: '12px', border: `1px solid ${inputBorder}`,
          background: inputBg, color: text, fontSize: '14px', outline: 'none',
          boxSizing: 'border-box', transition: 'border-color 0.2s',
        }}
        onFocus={e => { e.target.style.borderColor = '#f59e0b' }}
        onBlur={e => { e.target.style.borderColor = inputBorder }}
      />
      {showToggle && (
        <button onClick={onToggle} style={{
          position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: subText, fontSize: '16px', padding: '4px',
        }}>{show ? '🙈' : '👁️'}</button>
      )}
    </div>
  )

  const Label = ({ children }: any) => (
    <label style={{ fontSize: '12px', fontWeight: 600, color: subText, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>{children}</label>
  )

  const PrimaryBtn = ({ onClick, disabled, children }: any) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
      background: disabled ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: '#111', fontSize: '15px', fontWeight: 800,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 8px 24px rgba(245,158,11,0.35)',
    }}>{children}</button>
  )

  const BackBtn = ({ onClick }: any) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: subText, fontSize: '13px', cursor: 'pointer', padding: 0 }}>
      ← 로그인으로 돌아가기
    </button>
  )

  const MsgBox = ({ msg }: any) => msg ? (
    <div style={{
      background: msg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${msg.startsWith('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: '10px', padding: '12px 16px',
    }}>
      <p style={{ color: msg.startsWith('✅') ? '#34d399' : '#f87171', fontSize: '13px', margin: 0 }}>{msg}</p>
    </div>
  ) : null

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
        width: '44px', height: '44px', borderRadius: '12px', border: `1px solid ${border}`,
        background: cardBg, color: text, fontSize: '18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10,
      }}>{dark ? '🌙' : '☀️'}</button>

      {/* 관리자 페이지 이동 버튼 */}
      <a href="/admin/dashboard" style={{
        position: 'fixed', bottom: '24px', right: '24px',
        width: '52px', height: '52px', borderRadius: '16px',
        border: `1px solid ${border}`, background: cardBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', textDecoration: 'none', zIndex: 10,
        boxShadow: dark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
      }}
        title="관리자 페이지"
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#f59e0b' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = border }}>
        ⚙️
      </a>

      {/* 카드 */}
      <div style={{
        width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1,
        background: cardBg, borderRadius: '24px', border: `1px solid ${border}`,
        boxShadow: dark ? '0 32px 64px rgba(0,0,0,0.4)' : '0 32px 64px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>

        {/* 헤더 */}
        <div style={{
          padding: '40px 40px 32px',
          background: dark ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.02))' : 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(217,119,6,0.01))',
          borderBottom: `1px solid ${border}`, textAlign: 'center',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
          }}>🏭</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: text, margin: '0 0 6px' }}>
            {mode === 'login' ? '공급업체 포털' : mode === 'findPw' ? '비밀번호 찾기' : '비밀번호 변경'}
          </h1>
          <p style={{ fontSize: '13px', color: subText, margin: 0 }}>굴비가게 공급업체 전용</p>
        </div>

        {/* 본문 */}
        <div style={{ padding: '32px 40px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 로그인 */}
          {mode === 'login' && (<>
            <div><Label>이메일</Label><Input type="email" value={email} onChange={setEmail} placeholder="example@company.com" /></div>
            <div>
              <Label>비밀번호</Label>
              <Input value={password} onChange={setPassword} placeholder="비밀번호" showToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '-4px' }}>
              <button onClick={() => { setMode('findPw'); setFindEmail(''); setFindMsg('') }} style={{ background: 'none', border: 'none', color: subText, fontSize: '12px', cursor: 'pointer', padding: 0 }}>비밀번호 찾기</button>
              <button onClick={() => { setMode('changePw'); setChangePwMsg('') }} style={{ background: 'none', border: 'none', color: subText, fontSize: '12px', cursor: 'pointer', padding: 0 }}>비밀번호 변경</button>
            </div>
            <MsgBox msg={error} />
            <PrimaryBtn onClick={handleLogin} disabled={loading}>{loading ? '로그인 중...' : '로그인'}</PrimaryBtn>
            <p style={{ textAlign: 'center', fontSize: '13px', color: subText, margin: 0 }}>
              처음이신가요? <Link href="/supplier/register" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'none' }}>가입 신청</Link>
            </p>
          </>)}

          {/* 비밀번호 찾기 */}
          {mode === 'findPw' && (<>
            <p style={{ fontSize: '13px', color: subText, margin: 0, lineHeight: 1.7 }}>가입 시 사용한 이메일로 재설정 링크를 보내드립니다.</p>
            <div><Label>이메일</Label><Input type="email" value={findEmail} onChange={setFindEmail} placeholder="가입한 이메일 주소" /></div>
            <MsgBox msg={findMsg} />
            <PrimaryBtn onClick={handleFindPw} disabled={findLoading}>{findLoading ? '전송 중...' : '재설정 링크 전송'}</PrimaryBtn>
            <BackBtn onClick={() => setMode('login')} />
          </>)}

          {/* 비밀번호 변경 */}
          {mode === 'changePw' && (<>
            <p style={{ fontSize: '13px', color: subText, margin: 0, lineHeight: 1.7 }}>로그인된 상태에서 새 비밀번호로 변경합니다.</p>
            <div>
              <Label>새 비밀번호</Label>
              <Input value={newPw} onChange={setNewPw} placeholder="새 비밀번호 (6자 이상)" showToggle show={showNewPw} onToggle={() => setShowNewPw(v => !v)} />
            </div>
            <div>
              <Label>새 비밀번호 확인</Label>
              <Input value={newPwConfirm} onChange={setNewPwConfirm} placeholder="비밀번호 재입력" showToggle show={showNewPw} onToggle={() => setShowNewPw(v => !v)} />
            </div>
            <MsgBox msg={changePwMsg} />
            <PrimaryBtn onClick={handleChangePw} disabled={changePwLoading}>{changePwLoading ? '변경 중...' : '비밀번호 변경'}</PrimaryBtn>
            <BackBtn onClick={() => setMode('login')} />
          </>)}
        </div>
      </div>

      <style>{`* { box-sizing: border-box; }`}</style>
    </div>
  )
}
