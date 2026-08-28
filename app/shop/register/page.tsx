'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logClientError } from '@/lib/log-error'

type MemberType = '일반' | '소매업' | '도매업'

export default function ShopRegisterPage() {
  const [step, setStep] = useState(1)
  const [memberType, setMemberType] = useState<MemberType>('일반')
  const [form, setForm] = useState({
    email: '', password: '', confirmPw: '', name: '', contact: '',
    businessName: '', businessNumber: '', businessCeo: '', businessAddress: ''
  })
  const [showPw, setShowPw] = useState(false)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dark, setDark] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)
  }, [])

  const typeInfo = {
    '일반': { icon: '🛒', title: '일반 구매자', desc: '수산물을 직접 구매하고 싶어요', color: 'from-green-600 to-blue-600', border: 'border-green-600', bg: 'bg-green-600/10' },
    '소매업': { icon: '🏪', title: '소매업 창업', desc: '온종일팜 제품을 소매로 판매하고 싶어요', color: 'from-emerald-500 to-teal-600', border: 'border-emerald-500', bg: 'bg-emerald-500/10' },
    '도매업': { icon: '🏭', title: '도매업 거래', desc: '대량 구매 및 도매 거래를 원해요', color: 'from-violet-500 to-purple-600', border: 'border-violet-500', bg: 'bg-violet-500/10' },
  }

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.name || !form.contact) {
      return setError('필수 항목을 모두 입력해주세요.')
    }
    if (form.password !== form.confirmPw) {
      return setError('비밀번호가 일치하지 않습니다.')
    }
    if (form.password.length < 6) {
      return setError('비밀번호는 6자 이상이어야 합니다.')
    }
    if ((memberType === '소매업' || memberType === '도매업') && (!form.businessName || !form.businessNumber || !form.businessCeo || !form.businessAddress)) {
      return setError('업체명·사업자번호·대표자명·사업장 주소를 모두 입력해주세요. (세금계산서 발행에 필요)')
    }
    if (!agree) {
      return setError('이용약관·개인정보 수집·이용에 동의해주세요.')
    }
    setLoading(true)
    setError('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          // DB 트리거가 shop_members 자동 생성 시 사용할 메타데이터
          data: {
            name: form.name,
            contact: form.contact,
            member_type: memberType,
            business_name: form.businessName || null,
            business_number: form.businessNumber || null,
            business_ceo: form.businessCeo || null,
            business_address: form.businessAddress || null,
          }
        }
      })
      if (signUpError) {
        const msg = signUpError.message
        if (msg.includes('already registered') || msg.includes('already been registered'))
          return setError('이미 가입된 이메일이에요. 로그인 페이지에서 로그인해주세요.')
        if (msg.includes('invalid email') || msg.includes('Invalid email'))
          return setError('이메일 형식이 올바르지 않아요.')
        if (msg.includes('password') && msg.includes('short'))
          return setError('비밀번호는 6자 이상이어야 해요.')
        console.error('[shop register] sign up failed', signUpError)
        logClientError({ area: 'auth', message: '쇼핑몰 회원가입 실패', detail: `${msg} (email=${form.email})` })
        return setError('가입 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      }
      if (data.user) {
        // signUp 직후 세션이 없는 경우(이메일 인증 설정 등) → 즉시 로그인으로 세션 확보
        // 세션 없으면 RLS 정책에 의해 shop_members INSERT가 차단됨
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          })
          if (signInError) {
            // 로그인 실패 시 서비스 역할 키가 없으면 insert 불가 → 안내 메시지
            return setError('계정 생성 후 로그인에 실패했어요. 이메일 인증을 완료한 후 다시 로그인해주세요.')
          }
        }
        const status = memberType === '일반' ? '승인' : '대기중'
        const { error: insertError } = await supabase.from('shop_members').upsert({
          id: data.user.id,
          email: form.email,
          name: form.name,
          contact: form.contact,
          member_type: memberType,
          business_name: form.businessName || null,
          business_number: form.businessNumber || null,
          business_ceo: form.businessCeo || null,
          business_address: form.businessAddress || null,
          status,
        }, { onConflict: 'id' })
        if (insertError) {
          console.error('[shop register] member upsert failed', insertError)
          logClientError({ area: 'auth', message: '쇼핑몰 회원정보 저장 실패', detail: `${insertError.message} (email=${form.email})` })
          return setError('회원 정보 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        }
        setStep(3)
      }
    } catch (e: any) {
      console.error('[shop register] unexpected error', e)
      setError('가입 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  const D = {
    bg: dark ? '#0a0f1e' : '#f0fdf4',
    text: dark ? '#ffffff' : '#111827',
    sub: dark ? '#94a3b8' : '#4b5563',
    border: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
    card: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
    inputBg: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    inputBorder: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: D.bg, color: D.text }}>
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${D.border}` }}>
        <Link href="/landing" className="flex items-center gap-2" style={{ textDecoration: 'none', color: D.text }}>
          <span className="text-2xl">🧺</span>
          <span className="font-bold text-lg">온종일팜</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => { const n = !dark; setDark(n); localStorage.setItem('shop-theme', n ? 'dark' : 'light'); window.dispatchEvent(new Event('shop-theme-change')) }}
            style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
              fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0 }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <Link href="/shop/login" className="text-sm transition-colors" style={{ color: D.sub, textDecoration: 'none' }}>
            이미 계정이 있어요 →
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* 완료 화면 */}
          {step === 3 && (
            <div className="text-center animate-fadeIn">
              <div className="text-7xl mb-6 inline-block" style={{animation:'bounce 1s ease infinite'}}>
                {memberType === '일반' ? '🎉' : '⏳'}
              </div>
              <h2 className="text-3xl font-black mb-4" style={{ color: D.text }}>
                {memberType === '일반' ? '가입 완료!' : '신청 완료!'}
              </h2>
              <p className="mb-2" style={{ color: D.sub }}>
                {memberType === '일반'
                  ? '온종일팜 회원이 되신 걸 환영해요!'
                  : `${memberType} 신청이 접수됐어요.\n관리자 승인 후 이용 가능합니다.`}
              </p>
              {memberType !== '일반' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 mt-4">
                  <p className="text-amber-400 text-sm">⏳ 보통 1~2 영업일 내에 승인 연락을 드려요</p>
                </div>
              )}
              <Link href="/shop"
                className="inline-block bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-200 hover:scale-105 mt-4">
                쇼핑몰 바로가기 →
              </Link>
            </div>
          )}

          {/* 1단계: 회원 유형 선택 */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black mb-2" style={{ color: D.text }}>회원가입</h1>
                <p style={{ color: D.sub }}>어떤 목적으로 이용하실 건가요?</p>
              </div>

              <div className="space-y-3 mb-8">
                {(Object.keys(typeInfo) as MemberType[]).map(type => (
                  <button key={type} onClick={() => setMemberType(type)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.01] text-left
                      ${memberType === type
                        ? `${typeInfo[type].border} ${typeInfo[type].bg}`
                        : ''}`}
                    style={memberType !== type ? { border: `2px solid ${D.border}`, background: D.card } : {}}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${typeInfo[type].color} flex items-center justify-center text-2xl flex-shrink-0 shadow-lg`}>
                      {typeInfo[type].icon}
                    </div>
                    <div>
                      <p className="font-bold text-lg" style={{ color: D.text }}>{typeInfo[type].title}</p>
                      <p className="text-sm mt-0.5" style={{ color: D.sub }}>{typeInfo[type].desc}</p>
                    </div>
                    {memberType === type && <span className="ml-auto text-xl">✅</span>}
                  </button>
                ))}
              </div>

              {(memberType === '소매업' || memberType === '도매업') && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
                  <p className="text-amber-400 text-sm">⚠️ {memberType} 신청은 관리자 승인 후 이용 가능합니다</p>
                </div>
              )}

              <button onClick={() => setStep(2)}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-600/20">
                다음 단계 →
              </button>
            </div>
          )}

          {/* 2단계: 정보 입력 */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => setStep(1)} className="transition-colors" style={{ color: D.sub, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← 뒤로</button>
                <div>
                  <h1 className="text-2xl font-black" style={{ color: D.text }}>정보 입력</h1>
                  <p className="text-sm" style={{ color: D.sub }}>{typeInfo[memberType].icon} {typeInfo[memberType].title}로 가입</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: '이메일 *', key: 'email', type: 'email', placeholder: 'example@email.com' },
                  { label: '비밀번호 * (6자 이상)', key: 'password', type: showPw ? 'text' : 'password', placeholder: '••••••••' },
                  { label: '비밀번호 확인 *', key: 'confirmPw', type: showPw ? 'text' : 'password', placeholder: '••••••••' },
                  { label: '이름 *', key: 'name', type: 'text', placeholder: '홍길동' },
                  { label: '연락처 *', key: 'contact', type: 'text', placeholder: '010-0000-0000' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold mb-1.5 tracking-wide" style={{ color: D.sub }}>{f.label}</label>
                    <div className="relative">
                      <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                        style={{ background: D.inputBg, border: `1px solid ${D.inputBorder}`, color: D.text }} />
                      {(f.key === 'password') && (
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                          {showPw ? '🙈' : '👁️'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {(memberType === '소매업' || memberType === '도매업') && (
                  <>
                    <div className="h-px my-2" style={{ background: D.border }} />
                    <p className="text-xs font-bold tracking-wide" style={{ color: D.sub }}>사업자 정보</p>
                    {[
                      { label: '업체명 *', key: 'businessName', placeholder: '예) 온종일팜 거래처' },
                      { label: '사업자번호 *', key: 'businessNumber', placeholder: '000-00-00000' },
                      { label: '대표자명 *', key: 'businessCeo', placeholder: '대표자 성함' },
                      { label: '사업장 주소 *', key: 'businessAddress', placeholder: '세금계산서에 표기될 주소' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-bold mb-1.5 tracking-wide" style={{ color: D.sub }}>{f.label}</label>
                        <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]}
                          onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                          className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                          style={{ background: D.inputBg, border: `1px solid ${D.inputBorder}`, color: D.text }} />
                      </div>
                    ))}
                  </>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <label className="flex items-start gap-2.5 mt-1 cursor-pointer" style={{ fontSize: '13px', lineHeight: 1.5, color: D.sub }}>
                  <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                    style={{ marginTop: '2px', flexShrink: 0, width: '17px', height: '17px', accentColor: '#16a34a', cursor: 'pointer' }} />
                  <span>
                    <Link href="/shop/terms" target="_blank" style={{ color: '#16a34a', fontWeight: 700 }}>이용약관</Link> 및{' '}
                    <Link href="/shop/privacy" target="_blank" style={{ color: '#16a34a', fontWeight: 700 }}>개인정보 수집·이용</Link>에 동의합니다. (필수)
                  </span>
                </label>

                <button onClick={handleRegister} disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg shadow-green-600/20 mt-2">
                  {loading ? '처리 중...' : '가입 완료'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        button, a, input, select { -webkit-tap-highlight-color: transparent; }
        button { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s, box-shadow 0.2s; }
        button:not(:disabled):hover { transform: translateY(-2px); filter: brightness(1.05); }
        button:not(:disabled):active { transform: scale(0.97); }
        input, select, textarea { transition: border-color 0.2s, box-shadow 0.2s; }
      `}</style>
    </div>
  )
}
