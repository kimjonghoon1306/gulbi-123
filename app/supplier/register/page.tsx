'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SupplierRegisterPage() {
  const router = useRouter()
  const [dark, setDark] = useState(true)
  const [form, setForm] = useState({
    email: '', password: '', company_name: '', representative: '',
    business_number: '', contact: '', address: '', category: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [agree, setAgree] = useState(false)

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.company_name) return setError('이메일, 비밀번호, 업체명은 필수입니다.')
    if (form.password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.')
    if (!agree) return setError('이용약관·개인정보 수집·이용에 동의해주세요.')
    setLoading(true); setError('')
    const supabase = createClient()

    const { data: authData, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (authErr) {
      setLoading(false)
      const msg = authErr.message
      if (msg.includes('invalid email') || msg.includes('Invalid email')) return setError('이메일 형식이 올바르지 않습니다.')
      return setError('가입 오류: ' + msg)
    }
    if (!authData.user) { setLoading(false); return setError('가입에 실패했습니다.') }

    let userId = ''
    const isExisting = authData.user.identities && authData.user.identities.length === 0
    if (isExisting) {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (signInErr || !signInData?.user) { setLoading(false); return setError('이미 가입된 이메일입니다. 비밀번호를 정확히 입력해주세요.') }
      userId = signInData.user.id
    } else {
      userId = authData.user.id
    }

    const { data: existing } = await supabase.from('suppliers').select('id').eq('id', userId).single()
    if (existing) { await supabase.auth.signOut(); setLoading(false); return setError('이미 공급업체로 가입된 계정입니다.') }

    const { error: dbErr } = await supabase.from('suppliers').insert({
      id: userId, email: form.email, company_name: form.company_name,
      representative: form.representative, business_number: form.business_number,
      contact: form.contact, address: form.address, category: form.category, status: '대기중',
    })
    await supabase.auth.signOut()
    setLoading(false)
    if (dbErr) return setError('정보 저장 실패: ' + dbErr.message)
    setDone(true)
  }

  if (done) return (
    <div className={`root ${dark ? 'dark' : 'light'}`}>
      <svg className="bg-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="dg1" cx="60%" cy="30%" r="50%"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
          <radialGradient id="dg2" cx="30%" cy="70%" r="50%"><stop offset="0%" stopColor="#10b981" stopOpacity="0.12"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#dg1)"/>
        <rect width="100%" height="100%" fill="url(#dg2)"/>
      </svg>
      <div style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div className="done-card">
          <div className="card-glow-line"/>
          <div style={{ padding:'48px 40px', textAlign:'center' }}>
            <div className="done-icon">✅</div>
            <h2 className="done-title">신청 완료</h2>
            <p className="done-desc">관리자 승인 후 로그인하실 수 있습니다.<br/>승인까지 영업일 기준 1~2일 소요됩니다.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <Link href="/supplier/login" className="submit-btn" style={{ display:'block', textDecoration:'none', textAlign:'center' }}>
                <span className="btn-shine"/>로그인 페이지로 →
              </Link>
              <Link href="/landing" className="back-link">← 대문으로 돌아가기</Link>
            </div>
          </div>
        </div>
      </div>
      <Styles dark={dark}/>
    </div>
  )

  return (
    <div className={`root ${dark ? 'dark' : 'light'}`}>
      <svg className="bg-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="rg1" cx="70%" cy="20%" r="55%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.16"/>
            <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="rg2" cx="20%" cy="80%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
          </radialGradient>
          <pattern id="hexP" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 58,17 58,35 30,50 2,35 2,17" fill="none" stroke="rgba(139,92,246,0.06)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#rg1)"/>
        <rect width="100%" height="100%" fill="url(#rg2)"/>
        <rect width="100%" height="100%" fill="url(#hexP)"/>
        {[
          [10,20],[30,50],[20,80],[60,15],[80,40],[70,75],[45,30],[55,65],[85,20],[15,60]
        ].map(([x,y],i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r={i%2===0?'2':'1.5'}
            fill={i%3===0?'#a78bfa':i%3===1?'#fbbf24':'#67e8f9'}
            opacity="0.5" className={`star star-${i%4}`}/>
        ))}
      </svg>

      {/* 상단 네비 */}
      <nav className="top-nav">
        <Link href="/landing" className="back-home">
          <span>←</span><span>대문으로</span>
        </Link>
        <button onClick={() => setDark(v => !v)} className="icon-btn">
          {dark ? '🌙' : '☀️'}
        </button>
      </nav>

      <div style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'100px 24px 48px' }}>
        <div style={{ width:'100%', maxWidth:'540px' }}>

          {/* 헤더 */}
          <div className="reg-header">
            <div className="brand-logo">🏭</div>
            <div>
              <h1 className="reg-title">공급업체 가입 신청</h1>
              <p className="reg-sub">관리자 승인 후 서비스 이용 가능합니다</p>
            </div>
          </div>

          {/* 카드 */}
          <div className="card">
            <div className="card-glow-line"/>
            <div style={{ padding:'32px' }}>

              {/* 계정 정보 */}
              <div className="section-label">계정 정보</div>
              <div className="fields-group">
                <div className="field">
                  <label>이메일 *</label>
                  <input type="email" placeholder="공급업체 전용 이메일" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})} className="inp"/>
                </div>
                <div className="field">
                  <label>비밀번호 * (6자 이상)</label>
                  <input type="password" placeholder="비밀번호" value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})} className="inp"/>
                </div>
              </div>

              {/* 업체 정보 */}
              <div className="section-label" style={{marginTop:'24px'}}>업체 정보</div>
              <div className="fields-group">
                <div className="field">
                  <label>업체명 *</label>
                  <input type="text" placeholder="업체명" value={form.company_name}
                    onChange={e => setForm({...form, company_name: e.target.value})} className="inp"/>
                </div>
                <div className="two-col">
                  <div className="field">
                    <label>대표자명</label>
                    <input type="text" placeholder="대표자명" value={form.representative}
                      onChange={e => setForm({...form, representative: e.target.value})} className="inp"/>
                  </div>
                  <div className="field">
                    <label>사업자등록번호</label>
                    <input type="text" placeholder="000-00-00000" value={form.business_number}
                      onChange={e => setForm({...form, business_number: e.target.value})} className="inp"/>
                  </div>
                </div>
                <div className="field">
                  <label>연락처</label>
                  <input type="text" placeholder="연락처" value={form.contact}
                    onChange={e => setForm({...form, contact: e.target.value})} className="inp"/>
                </div>
                <div className="field">
                  <label>주소</label>
                  <input type="text" placeholder="주소" value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})} className="inp"/>
                </div>
                <div className="field">
                  <label>취급 품목</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="inp">
                    <option value="">선택해주세요</option>
                    {['어류','갑각류','패류','해조류','건어물','기타'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* 안내문 */}
              <div className="notice-box">
                <span className="notice-icon">📌</span>
                <p>쇼핑몰 회원과 공급업체 계정은 이메일을 각각 다르게 사용해주세요. 각각의 회원을 분리하여 관리하기 위함이니 양해 바랍니다.</p>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginTop: '16px', fontSize: '13px', lineHeight: 1.5, opacity: 0.85, cursor: 'pointer' }}>
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                  style={{ marginTop: '2px', flexShrink: 0, width: '17px', height: '17px', cursor: 'pointer' }} />
                <span>
                  <Link href="/shop/terms" target="_blank" style={{ color: '#10b981', fontWeight: 700 }}>이용약관</Link> 및{' '}
                  <Link href="/shop/privacy" target="_blank" style={{ color: '#10b981', fontWeight: 700 }}>개인정보 수집·이용</Link>에 동의합니다. (필수)
                </span>
              </label>

              {error && (
                <div className="msg-box msg-err" style={{marginTop:'12px'}}>
                  <p>⚠️ {error}</p>
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading} className="submit-btn" style={{marginTop:'20px', width:'100%'}}>
                <span className="btn-shine"/>
                {loading ? '처리 중...' : '가입 신청하기 →'}
              </button>

              <div style={{display:'flex', justifyContent:'space-between', marginTop:'16px', alignItems:'center'}}>
                <Link href="/supplier/login" className="back-link">← 로그인으로 가기</Link>
                <p style={{fontSize:'13px', opacity:0.5}}>
                  이미 계정이 있으신가요?{' '}
                  <Link href="/supplier/login" className="link-gold">로그인</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Styles dark={dark}/>
    </div>
  )
}

function Styles({ dark }: { dark: boolean }) {
  return <style>{`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .root { min-height: 100vh; font-family: 'Apple SD Gothic Neo','Noto Sans KR',sans-serif; position: relative; overflow-x: hidden; transition: background 0.4s; }
    .root.dark { background: #060810; color: #f0eeff; }
    .root.light { background: #f0f2fc; color: #1a1030; }

    .bg-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

    @keyframes starTwinkle { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:0.8;transform:scale(1.4)} }
    .star-0{animation:starTwinkle 3s ease-in-out infinite}
    .star-1{animation:starTwinkle 4s ease-in-out infinite 1s}
    .star-2{animation:starTwinkle 3.5s ease-in-out infinite 2s}
    .star-3{animation:starTwinkle 5s ease-in-out infinite 0.5s}

    .top-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; }
    .back-home { display: flex; align-items: center; gap: 8px; color: rgba(167,139,250,0.8); text-decoration: none; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 100px; background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.25); transition: all 0.2s; backdrop-filter: blur(8px); }
    .back-home:hover { background: rgba(124,58,237,0.25); color: #c4b5fd; transform: translateX(-3px); }
    .icon-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(124,58,237,0.2); background: rgba(15,18,28,0.6); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; transition: all 0.2s; }
    .icon-btn:hover { transform: scale(1.15); }

    .reg-header { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
    .brand-logo { width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; box-shadow: 0 8px 32px rgba(245,158,11,0.4); animation: logoPulse 3s ease-in-out infinite; }
    @keyframes logoPulse { 0%,100%{box-shadow:0 8px 32px rgba(245,158,11,0.4)} 50%{box-shadow:0 8px 48px rgba(245,158,11,0.7),0 0 0 10px rgba(245,158,11,0.06)} }
    .reg-title { font-size: 26px; font-weight: 900; letter-spacing: -0.8px; }
    .root.dark .reg-title { color: white; }
    .reg-sub { font-size: 13px; opacity: 0.5; margin-top: 4px; }

    .card { background: rgba(12,15,25,0.8); backdrop-filter: blur(32px); border-radius: 28px; border: 1px solid rgba(139,92,246,0.2); box-shadow: 0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05); overflow: hidden; }
    .root.light .card { background: rgba(255,255,255,0.88); border-color: rgba(139,92,246,0.15); box-shadow: 0 40px 100px rgba(0,0,0,0.1); }
    .card-glow-line { height: 3px; background: linear-gradient(90deg,transparent,#7c3aed,#f59e0b,#06b6d4,transparent); }

    .section-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #a78bfa; margin-bottom: 14px; }
    .root.light .section-label { color: #7c3aed; }

    .fields-group { display: flex; flex-direction: column; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 7px; }
    .field label { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.55; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media(max-width:480px){.two-col{grid-template-columns:1fr;}}

    .inp { width: 100%; padding: 13px 16px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(139,92,246,0.18); border-radius: 12px; color: inherit; font-size: 14px; outline: none; transition: all 0.2s; }
    .root.light .inp { background: rgba(0,0,0,0.04); }
    .inp:focus { border-color: #a78bfa; box-shadow: 0 0 0 4px rgba(124,58,237,0.1); }
    .inp::placeholder { opacity: 0.35; }
    select.inp option { background: #161b22; color: white; }

    .notice-box { display: flex; gap: 10px; align-items: flex-start; background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.2); border-radius: 14px; padding: 14px 16px; margin-top: 20px; }
    .root.light .notice-box { background: rgba(124,58,237,0.06); border-color: rgba(124,58,237,0.15); }
    .notice-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
    .notice-box p { font-size: 12px; line-height: 1.7; opacity: 0.7; }

    .submit-btn { padding: 16px; background: linear-gradient(135deg,#f59e0b 0%,#d97706 50%,#b45309 100%); color: #111; font-size: 15px; font-weight: 800; border: none; border-radius: 16px; cursor: pointer; position: relative; overflow: hidden; box-shadow: 0 8px 32px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.2); transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); letter-spacing: -0.3px; display: block; text-align: center; }
    .submit-btn:hover:not(:disabled) { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 50px rgba(245,158,11,0.5); }
    .submit-btn:active:not(:disabled) { transform: translateY(1px) scale(0.98); }
    .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-shine { position: absolute; top: 0; left: -80%; width: 60%; height: 100%; background: linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); transform: skewX(-15deg); transition: left 0.5s; }
    .submit-btn:hover .btn-shine { left: 150%; }

    .back-link { font-size: 13px; color: rgba(167,139,250,0.7); text-decoration: none; }
    .root.light .back-link { color: rgba(109,40,217,0.6); }
    .back-link:hover { color: #a78bfa; }
    .link-gold { color: #f59e0b; font-weight: 700; text-decoration: none; }

    .msg-box { border-radius: 12px; padding: 12px 16px; }
    .msg-box p { font-size: 13px; margin: 0; }
    .msg-err { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); }
    .msg-err p { color: #f87171; }

    .done-card { max-width: 420px; width: 100%; background: rgba(12,15,25,0.8); backdrop-filter: blur(32px); border-radius: 28px; border: 1px solid rgba(139,92,246,0.2); box-shadow: 0 40px 100px rgba(0,0,0,0.5); overflow: hidden; }
    .root.light .done-card { background: rgba(255,255,255,0.88); }
    .done-icon { font-size: 60px; margin-bottom: 20px; }
    .done-title { font-size: 24px; font-weight: 900; margin-bottom: 12px; }
    .root.dark .done-title { color: white; }
    .done-desc { font-size: 14px; line-height: 1.8; opacity: 0.55; margin-bottom: 32px; }
  `}</style>
}
