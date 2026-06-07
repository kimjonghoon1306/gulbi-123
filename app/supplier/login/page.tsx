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

  const MsgBox = ({ msg }: { msg: string }) => !msg ? null : (
    <div className={`msg-box ${msg.startsWith('✅') ? 'msg-ok' : 'msg-err'}`}>
      <p>{msg}</p>
    </div>
  )

  return (
    <div className={`root ${dark ? 'dark' : 'light'}`}>

      {/* SVG 배경 */}
      <svg className="bg-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="lg1" cx="70%" cy="20%" r="55%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="lg2" cx="20%" cy="80%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="lg3" cx="90%" cy="90%" r="40%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08"/>
            <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
          </radialGradient>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.15"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lg1)"/>
        <rect width="100%" height="100%" fill="url(#lg2)"/>
        <rect width="100%" height="100%" fill="url(#lg3)"/>
        <rect width="100%" height="100%" fill="url(#dots)" className="dot-pattern"/>
        {/* 큰 글로우 오브 */}
        <ellipse cx="75%" cy="15%" rx="300" ry="200" fill="#7c3aed" opacity="0.04" className="orb1"/>
        <ellipse cx="15%" cy="85%" rx="250" ry="180" fill="#f59e0b" opacity="0.05" className="orb2"/>
        <ellipse cx="85%" cy="75%" rx="180" ry="150" fill="#06b6d4" opacity="0.04" className="orb3"/>
        {/* 빛나는 파티클 */}
        {[
          [8,12],[25,35],[18,68],[42,22],[55,78],[72,18],[88,45],[65,88],[35,92],[80,62]
        ].map(([x,y],i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r={i%2===0?'2.5':'1.5'}
            fill={i%3===0?'#a78bfa':i%3===1?'#fbbf24':'#67e8f9'}
            opacity="0.6" className={`star star-${i%4}`}/>
        ))}
      </svg>

      {/* 상단 네비 */}
      <nav className="top-nav">
        <Link href="/landing" className="back-home">
          <span className="back-icon">←</span>
          <span>대문으로</span>
        </Link>
        <div className="nav-right">
          <button onClick={() => setDark(v => !v)} className="icon-btn theme-btn">
            {dark ? '🌙' : '☀️'}
          </button>
          <a href="/admin/dashboard" className="icon-btn gear-btn">⚙️</a>
        </div>
      </nav>

      {/* 메인 레이아웃 */}
      <div className="main-layout">

        {/* 왼쪽 브랜드 패널 */}
        <div className="brand-panel">
          <div className="brand-logo">🏭</div>
          <h1 className="brand-title">온종일팜<br/><span>공급업체 포털</span></h1>
          <p className="brand-desc">신뢰할 수 있는 농축수산물 공급망<br/>파트너와 함께 성장하세요</p>
          <div className="brand-features">
            {[
              { icon: '📦', text: '상품 등록 · 관리' },
              { icon: '💰', text: '가격 제안 · 확정' },
              { icon: '📊', text: '판매 현황 모니터링' },
              { icon: '🚚', text: '주문 · 배송 추적' },
            ].map((f, i) => (
              <div key={i} className="feature-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽 카드 */}
        <div className="card-wrap">
          <div className="card">
            <div className="card-glow-line"/>

            {/* 모드 탭 */}
            <div className="mode-tabs">
              {[
                { k: 'login', label: '로그인' },
                { k: 'findEmail', label: '이메일 찾기' },
                { k: 'findPw', label: '비밀번호 찾기' },
              ].map(t => (
                <button key={t.k} onClick={() => { setMode(t.k as Mode); setError(''); setFindEmailResult(''); setFindEmailMsg(''); setFindPwMsg('') }}
                  className={`tab-btn ${mode === t.k ? 'tab-active' : ''}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* 로그인 */}
            {mode === 'login' && (
              <div className="form-body">
                <div className="field">
                  <label>이메일</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="example@company.com" className="inp"/>
                </div>
                <div className="field">
                  <label>비밀번호</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="비밀번호" className="inp" style={{ paddingRight: '48px' }}/>
                    <button onClick={() => setShowPw(v => !v)} className="pw-eye">
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <MsgBox msg={error}/>
                <button onClick={handleLogin} disabled={loading} className="submit-btn">
                  <span className="btn-shine"/>
                  {loading ? '로그인 중...' : '로그인 →'}
                </button>
                <p className="form-footer">
                  처음이신가요?{' '}
                  <Link href="/supplier/register" className="link-gold">가입 신청</Link>
                </p>
                <div className="notice-box">
                  <p className="notice-title">⚠️ 이메일 계정 분리 안내</p>
                  <p className="notice-body">쇼핑몰 회원과 공급업체 파트너는 <strong>서로 다른 이메일 주소</strong>로 가입하셔야 합니다. 두 서비스는 독립된 회원 시스템으로 운영되어 각 계정의 권한과 정보를 안전하게 분리 관리하고 있습니다. 불편을 드려 죄송하며, 양해 부탁드립니다. 🙏</p>
                </div>
              </div>
            )}

            {/* 이메일 찾기 */}
            {mode === 'findEmail' && (
              <div className="form-body">
                <p className="form-hint">가입 시 입력한 <strong>업체명</strong>과 <strong>연락처</strong>로 이메일을 찾을 수 있습니다.</p>
                {[
                  { label: '업체명', val: findCompany, set: setFindCompany, ph: '가입 시 입력한 업체명' },
                  { label: '연락처', val: findContact, set: setFindContact, ph: '가입 시 입력한 연락처' },
                ].map(f => (
                  <div key={f.label} className="field">
                    <label>{f.label}</label>
                    <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="inp"/>
                  </div>
                ))}
                {findEmailResult && (
                  <div className="result-box">
                    <p className="result-label">찾은 이메일</p>
                    <p className="result-value">{findEmailResult}</p>
                  </div>
                )}
                <MsgBox msg={findEmailMsg}/>
                <button onClick={handleFindEmail} disabled={findEmailLoading} className="submit-btn">
                  <span className="btn-shine"/>
                  {findEmailLoading ? '조회 중...' : '이메일 찾기 →'}
                </button>
              </div>
            )}

            {/* 비밀번호 찾기 */}
            {mode === 'findPw' && (
              <div className="form-body">
                <p className="form-hint">가입한 이메일로 <strong>비밀번호 재설정 링크</strong>를 보내드립니다.</p>
                <div className="field">
                  <label>이메일</label>
                  <input type="email" value={findPwEmail} onChange={e => setFindPwEmail(e.target.value)}
                    placeholder="가입한 이메일 주소" className="inp"/>
                </div>
                <MsgBox msg={findPwMsg}/>
                <button onClick={handleFindPw} disabled={findPwLoading} className="submit-btn">
                  <span className="btn-shine"/>
                  {findPwLoading ? '전송 중...' : '재설정 링크 전송 →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .root {
          min-height: 100vh;
          font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
          position: relative; overflow: hidden;
          transition: background 0.4s;
        }
        .root.dark { background: #060810; color: #f0eeff; }
        .root.light { background: #f0f2fc; color: #1a1030; }

        .bg-svg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          pointer-events: none;
        }
        .dot-pattern { color: #7c3aed; }
        .root.light .dot-pattern { color: #6d28d9; }

        @keyframes orbFloat { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,20px) scale(1.1)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(25px,-20px)} }
        @keyframes starTwinkle { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.4)} }

        .orb1 { animation: orbFloat 12s ease-in-out infinite; }
        .orb2 { animation: orbFloat2 15s ease-in-out infinite; }
        .orb3 { animation: orbFloat 10s ease-in-out infinite 3s; }
        .star { animation: starTwinkle 3s ease-in-out infinite; }
        .star-0 { animation-delay: 0s; }
        .star-1 { animation-delay: 0.8s; }
        .star-2 { animation-delay: 1.6s; }
        .star-3 { animation-delay: 2.4s; }

        /* 상단 네비 */
        .top-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px;
          background: transparent;
        }
        .back-home {
          display: flex; align-items: center; gap: 8px;
          color: rgba(167,139,250,0.8); text-decoration: none;
          font-size: 13px; font-weight: 600;
          padding: 8px 16px; border-radius: 100px;
          background: rgba(124,58,237,0.12);
          border: 1px solid rgba(124,58,237,0.25);
          transition: all 0.2s;
          backdrop-filter: blur(8px);
        }
        .back-home:hover {
          background: rgba(124,58,237,0.25);
          color: #c4b5fd;
          transform: translateX(-3px);
        }
        .back-icon { font-size: 16px; }
        .nav-right { display: flex; gap: 8px; }
        .icon-btn {
          width: 40px; height: 40px; border-radius: 12px;
          border: 1px solid rgba(124,58,237,0.2);
          background: rgba(15,18,28,0.6);
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; cursor: pointer; text-decoration: none;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .icon-btn:hover { transform: scale(1.15); border-color: rgba(245,158,11,0.5); }
        .gear-btn:hover { transform: rotate(30deg) scale(1.15) !important; }

        /* 메인 레이아웃 */
        .main-layout {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          gap: 64px; padding: 100px 40px 40px;
          position: relative; z-index: 1;
        }

        /* 브랜드 패널 */
        .brand-panel {
          flex: 1; max-width: 380px;
          animation: fadeInLeft 0.7s ease both;
        }
        @keyframes fadeInLeft { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }

        .brand-logo {
          width: 80px; height: 80px; border-radius: 24px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          display: flex; align-items: center; justify-content: center;
          font-size: 40px; margin-bottom: 28px;
          box-shadow: 0 12px 40px rgba(22,163,74,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
          animation: logoPulse 3s ease-in-out infinite;
        }
        @keyframes logoPulse {
          0%,100%{box-shadow:0 12px 40px rgba(22,163,74,0.4)}
          50%{box-shadow:0 12px 60px rgba(22,163,74,0.7), 0 0 0 12px rgba(22,163,74,0.06)}
        }

        .brand-title {
          font-size: 42px; font-weight: 900; line-height: 1.15;
          letter-spacing: -1.5px; margin-bottom: 16px;
        }
        .root.dark .brand-title { color: white; }
        .root.light .brand-title { color: #1a1030; }
        .brand-title span {
          background: linear-gradient(135deg, #16a34a, #4ade80);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .brand-desc {
          font-size: 15px; line-height: 1.8; margin-bottom: 36px;
          opacity: 0.55;
        }

        .brand-features { display: flex; flex-direction: column; gap: 12px; }
        .feature-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 14px;
          background: rgba(22,163,74,0.08);
          border: 1px solid rgba(22,163,74,0.12);
          font-size: 14px; font-weight: 500;
          animation: fadeInLeft 0.6s ease both;
          transition: all 0.2s;
        }
        .root.light .feature-item { background: rgba(22,163,74,0.06); }
        .feature-item:hover { background: rgba(22,163,74,0.14); transform: translateX(4px); }
        .feature-item span:first-child { font-size: 20px; }

        /* 카드 */
        .card-wrap { flex: 0 0 420px; animation: fadeInRight 0.7s ease both; }
        @keyframes fadeInRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }

        .card {
          background: rgba(12,15,25,0.75);
          backdrop-filter: blur(32px);
          border-radius: 28px;
          border: 1px solid rgba(139,92,246,0.2);
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
          overflow: hidden; position: relative;
        }
        .root.light .card {
          background: rgba(255,255,255,0.85);
          box-shadow: 0 40px 100px rgba(0,0,0,0.12);
          border-color: rgba(139,92,246,0.15);
        }

        .card-glow-line {
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #7c3aed 30%, #f59e0b 60%, #06b6d4 80%, transparent 100%);
        }

        /* 탭 */
        .mode-tabs {
          display: flex; gap: 0;
          border-bottom: 1px solid rgba(139,92,246,0.12);
          padding: 0 24px;
        }
        .tab-btn {
          flex: 1; padding: 16px 8px;
          background: none; border: none; border-bottom: 2px solid transparent;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; color: rgba(167,139,250,0.4);
          margin-bottom: -1px;
        }
        .tab-btn:hover { color: rgba(167,139,250,0.7); }
        .tab-active {
          color: #a78bfa !important;
          border-bottom-color: #a78bfa !important;
        }
        .root.light .tab-btn { color: rgba(109,40,217,0.4); }
        .root.light .tab-active { color: #7c3aed !important; border-bottom-color: #7c3aed !important; }

        /* 폼 */
        .form-body { padding: 28px 32px 36px; display: flex; flex-direction: column; gap: 16px; }

        .field { display: flex; flex-direction: column; gap: 8px; }
        .field label {
          font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          color: rgba(167,139,250,0.6);
        }
        .root.light .field label { color: rgba(109,40,217,0.6); }

        .inp {
          width: 100%; padding: 14px 18px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(139,92,246,0.18);
          border-radius: 14px; color: inherit;
          font-size: 14px; outline: none;
          transition: all 0.2s;
        }
        .root.light .inp { background: rgba(0,0,0,0.04); }
        .inp:focus {
          border-color: #a78bfa;
          box-shadow: 0 0 0 4px rgba(124,58,237,0.12);
          background: rgba(124,58,237,0.06);
        }
        .inp::placeholder { color: rgba(167,139,250,0.3); }
        .root.light .inp::placeholder { color: rgba(109,40,217,0.3); }

        .pw-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; font-size: 16px;
          opacity: 0.6; transition: opacity 0.2s;
        }
        .pw-eye:hover { opacity: 1; }

        .form-hint {
          font-size: 13px; line-height: 1.7; opacity: 0.55;
        }
        .form-hint strong { opacity: 1; color: #c4b5fd; }
        .root.light .form-hint strong { color: #7c3aed; }

        /* 버튼 */
        .submit-btn {
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
          color: #111; font-size: 15px; font-weight: 800;
          border: none; border-radius: 16px; cursor: pointer;
          position: relative; overflow: hidden;
          box-shadow: 0 8px 32px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          letter-spacing: -0.3px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 50px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(1px) scale(0.98); }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-shine {
          position: absolute; top: 0; left: -80%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-15deg);
          transition: left 0.5s;
        }
        .submit-btn:hover .btn-shine { left: 150%; }

        .form-footer { text-align: center; font-size: 13px; opacity: 0.5; }
        .link-gold { color: #f59e0b; font-weight: 700; text-decoration: none; }
        .link-gold:hover { text-decoration: underline; }

        /* 결과 박스 */
        .result-box {
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 14px; padding: 18px; text-align: center;
        }
        .result-label { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.5; margin-bottom: 6px; }
        .result-value { font-size: 20px; font-weight: 800; color: #34d399; }

        /* 메시지 */
        .msg-box { border-radius: 12px; padding: 12px 16px; }
        .msg-box p { font-size: 13px; margin: 0; line-height: 1.6; }
        .msg-ok { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); }
        .msg-ok p { color: #34d399; }
        .msg-err { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); }
        .msg-err p { color: #f87171; }

        /* 안내 박스 */
        .notice-box {
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.25);
          border-radius: 12px; padding: 14px 16px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .notice-title { font-size: 12px; font-weight: 800; color: #fbbf24; margin: 0; letter-spacing: 0.3px; }
        .notice-body { font-size: 12px; line-height: 1.75; color: rgba(251,191,36,0.75); margin: 0; }
        .notice-body strong { color: #fbbf24; font-weight: 700; }
        .root.light .notice-box { background: rgba(245,158,11,0.06); }
        .root.light .notice-body { color: rgba(180,110,0,0.8); }
        .root.light .notice-title { color: #b45309; }
        .root.light .notice-body strong { color: #b45309; }

        /* 모바일 */
        @media (max-width: 900px) {
          .brand-panel { display: none; }
          .main-layout { padding: 80px 20px 40px; }
          .card-wrap { flex: 0 0 100%; max-width: 440px; }
        }
        @media (max-width: 480px) {
          .form-body { padding: 24px 20px 28px; }
          .mode-tabs { padding: 0 16px; }
          .tab-btn { font-size: 12px; padding: 14px 4px; }
        }
      `}</style>
    </div>
  )
}
