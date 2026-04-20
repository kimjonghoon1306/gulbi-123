'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ShopLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(`로그인 실패: ${signInError.message}`)
      setLoading(false)
      return
    }

    if (!data.session) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    // 쇼핑몰 회원 상태 확인
    const { data: member } = await supabase
      .from('shop_members')
      .select('status, member_type')
      .eq('id', data.user.id)
      .single()

    if (member?.status === '대기중') {
      await supabase.auth.signOut()
      setError('승인 대기 중입니다. 관리자 승인 후 이용 가능해요.')
      setLoading(false)
      return
    }

    if (member?.status === '거절') {
      await supabase.auth.signOut()
      setError('가입이 거절되었습니다. 관리자에게 문의해주세요.')
      setLoading(false)
      return
    }

    router.push('/shop')
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#fafaf8',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      display: 'flex', flexDirection: 'column'
    }}>
      {/* 헤더 */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '64px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(250,250,248,0.97)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <Link href="/landing" style={{display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none'}}>
          <span style={{fontSize: '22px'}}>🐟</span>
          <div>
            <p style={{fontSize: '15px', fontWeight: 800, color: '#1a1a18', letterSpacing: '-0.5px', lineHeight: 1}}>굴비가게</p>
            <p style={{fontSize: '9px', color: '#9ca3af', letterSpacing: '2px', textTransform: 'uppercase'}}>Fresh Seafood</p>
          </div>
        </Link>
        <Link href="/shop/register" style={{
          fontSize: '13px', fontWeight: 600, color: '#0f766e', textDecoration: 'none',
          padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #0f766e20',
          background: '#0f766e08'
        }}>
          회원가입 →
        </Link>
      </header>

      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px'}}>
        <div style={{width: '100%', maxWidth: '400px'}}>

          {/* 로고 */}
          <div style={{textAlign: 'center', marginBottom: '40px'}}>
            <div style={{fontSize: '56px', marginBottom: '16px', lineHeight: 1}}>🐟</div>
            <h1 style={{fontSize: '28px', fontWeight: 900, color: '#1a1a18', letterSpacing: '-1px', marginBottom: '8px'}}>로그인</h1>
            <p style={{fontSize: '14px', color: '#9ca3af'}}>굴비가게 쇼핑몰에 오신 걸 환영해요</p>
          </div>

          {/* 폼 */}
          <div style={{
            background: 'white', borderRadius: '24px',
            padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', fontSize: '12px', fontWeight: 700, color: '#6b7280', marginBottom: '8px', letterSpacing: '0.5px'}}>이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                style={{
                  width: '100%', background: '#f5f3ef', border: '1.5px solid transparent',
                  borderRadius: '12px', padding: '12px 16px', fontSize: '14px',
                  color: '#1a1a18', outline: 'none', boxSizing: 'border-box',
                  transition: 'all 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#0f766e'}
                onBlur={e => e.target.style.borderColor = 'transparent'}
              />
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', fontSize: '12px', fontWeight: 700, color: '#6b7280', marginBottom: '8px', letterSpacing: '0.5px'}}>비밀번호</label>
              <div style={{position: 'relative'}}>
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  style={{
                    width: '100%', background: '#f5f3ef', border: '1.5px solid transparent',
                    borderRadius: '12px', padding: '12px 48px 12px 16px', fontSize: '14px',
                    color: '#1a1a18', outline: 'none', boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0f766e'}
                  onBlur={e => e.target.style.borderColor = 'transparent'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px'
                }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '12px', padding: '12px 16px', marginBottom: '16px'
              }}>
                <p style={{color: '#ef4444', fontSize: '13px', textAlign: 'center', fontWeight: 500}}>{error}</p>
              </div>
            )}

            <button onClick={handleLogin} disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '14px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #0f766e, #0891b2)',
              color: 'white', fontSize: '15px', fontWeight: 700, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(15,118,110,0.3)',
              transition: 'all 0.3s', transform: 'translateY(0)'
            }}
              onMouseEnter={e => { if (!loading) { (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.target as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(15,118,110,0.4)' } }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; (e.target as HTMLButtonElement).style.boxShadow = loading ? 'none' : '0 8px 24px rgba(15,118,110,0.3)' }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <div style={{textAlign: 'center', marginTop: '20px'}}>
              <Link href="/shop/register" style={{fontSize: '13px', color: '#9ca3af', textDecoration: 'none'}}>
                아직 계정이 없어요? <span style={{color: '#0f766e', fontWeight: 700}}>회원가입</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
