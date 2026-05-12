'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import SupplierLayout from '../_layout/layout'
import { useSupplierTheme } from '../_layout/theme-context'

type KeyInfo = { hasKey: boolean; keyHint: string | null; isValid: boolean; updatedAt: string | null }

function SettingsContent() {
  const t = useSupplierTheme()
  const supabase = createClient()
  const router = useRouter()

  const [keyInfo, setKeyInfo]       = useState<KeyInfo | null>(null)
  const [keyInput, setKeyInput]     = useState('')
  const [showKey, setShowKey]       = useState(false)
  const [keyLoading, setKeyLoading] = useState(false)
  const [keyMsg, setKeyMsg]         = useState<{type:'success'|'error';text:string}|null>(null)

  const [curPw, setCurPw]         = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCur, setShowCur]     = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const [showCfm, setShowCfm]     = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg]         = useState<{type:'success'|'error';text:string}|null>(null)

  useEffect(() => { fetchKeyInfo() }, [])

  const fetchKeyInfo = async () => {
    try {
      const res = await fetch('/api/user-key')
      if (res.ok) setKeyInfo(await res.json())
    } catch {}
  }

  const saveKey = async () => {
    if (!keyInput.trim()) return setKeyMsg({ type: 'error', text: 'API 키를 입력해주세요.' })
    setKeyLoading(true); setKeyMsg(null)
    try {
      const res = await fetch('/api/user-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiKey: keyInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setKeyMsg({ type: 'error', text: data.error || '저장 실패' })
      } else {
        setKeyMsg({ type: 'success', text: '✅ API 키가 저장됐어요!' })
        setKeyInput('')
        fetchKeyInfo()
        setTimeout(() => setKeyMsg(null), 3000)
      }
    } catch (e: any) {
      setKeyMsg({ type: 'error', text: e.message })
    }
    setKeyLoading(false)
  }

  const deleteKey = async () => {
    if (!confirm('API 키를 삭제하시겠습니까?')) return
    await fetch('/api/user-key', { method: 'DELETE' })
    setKeyInfo(null)
    setKeyMsg({ type: 'success', text: '키가 삭제됐어요.' })
    setTimeout(() => setKeyMsg(null), 2000)
  }

  const changePw = async () => {
    if (!curPw || !newPw || !confirmPw)
      return setPwMsg({ type: 'error', text: '모든 항목을 입력해주세요.' })
    if (newPw !== confirmPw)
      return setPwMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' })
    if (newPw.length < 6)
      return setPwMsg({ type: 'error', text: '비밀번호는 6자 이상이어야 합니다.' })
    setPwLoading(true); setPwMsg(null)
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || '',
      password: curPw,
    })
    if (signInErr) {
      setPwLoading(false)
      return setPwMsg({ type: 'error', text: '현재 비밀번호가 올바르지 않습니다.' })
    }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      setPwMsg({ type: 'error', text: `오류: ${error.message}` })
    } else {
      setPwMsg({ type: 'success', text: '✅ 비밀번호가 변경됐어요!' })
      setCurPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setPwMsg(null), 3000)
    }
    setPwLoading(false)
  }

  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 8 ? 2 : newPw.length < 12 ? 3 : 4
  const pwStrengthColor = ['', '#f87171', '#fbbf24', '#fbbf24', '#34d399'][pwStrength]
  const pwStrengthLabel = ['', '너무 짧아요', '보통', '좋아요', '매우 강함'][pwStrength]

  const inputBase: React.CSSProperties = {
    width: '100%', background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: '14px', padding: '15px 18px', fontSize: '15px',
    color: t.text, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }
  const labelBase: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: t.textMuted, marginBottom: '10px', letterSpacing: '0.8px', textTransform: 'uppercase',
  }
  const sectionTitle: React.CSSProperties = {
    fontSize: '18px', fontWeight: 800, color: t.text, margin: '0 0 6px',
  }
  const sectionSub: React.CSSProperties = {
    fontSize: '13px', color: t.textMuted, margin: '0 0 28px',
  }
  const divider: React.CSSProperties = {
    height: '1px', background: t.border, margin: '24px 0',
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', flexDirection: 'column' }}>

      {/* 상단 헤더 */}
      <div style={{
        background: t.isDark
          ? 'linear-gradient(135deg, #1c2333 0%, #161b22 100%)'
          : 'linear-gradient(135deg, #fffbf5 0%, #fef3e2 100%)',
        borderBottom: `1px solid ${t.border}`,
        padding: '28px 40px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
          }}>⚙️</div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: t.text, margin: 0 }}>설정</h1>
            <p style={{ fontSize: '13px', color: t.textMuted, margin: '4px 0 0' }}>API 키 관리 및 계정 보안 설정</p>
          </div>
        </div>
      </div>

      {/* 본문 — 2컬럼 풀스크린 */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0',
      }} className="settings-body">

        {/* ─────────────── 왼쪽: AI 키 관리 ─────────────── */}
        <div style={{
          borderRight: `1px solid ${t.border}`,
          padding: '40px 48px',
          display: 'flex', flexDirection: 'column',
          minHeight: 'calc(100vh - 104px)',
        }} className="settings-col">
          <p style={sectionTitle}>🤖 AI 키 관리</p>
          <p style={sectionSub}>OpenAI API 키를 등록해야 AI 상세페이지를 만들 수 있어요</p>

          {/* 현재 등록 키 상태 */}
          <div style={{
            background: keyInfo?.hasKey
              ? (t.isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.07)')
              : t.input,
            border: `1px solid ${keyInfo?.hasKey ? 'rgba(245,158,11,0.25)' : t.border}`,
            borderRadius: '18px', padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: '16px',
            marginBottom: '28px',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: keyInfo?.hasKey ? 'rgba(245,158,11,0.15)' : t.input,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            }}>
              {keyInfo?.hasKey ? '🔑' : '🔓'}
            </div>
            <div style={{ flex: 1 }}>
              {keyInfo?.hasKey ? (
                <>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>
                    {keyInfo.keyHint || 'sk-...등록됨'}
                  </p>
                  <p style={{ fontSize: '12px', color: t.textMuted, margin: 0 }}>
                    {keyInfo.isValid ? '✅ 검증 완료' : '⚠️ 미검증'}
                    {keyInfo.updatedAt && ` · ${new Date(keyInfo.updatedAt).toLocaleDateString('ko-KR')} 등록`}
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: t.textMuted, margin: '0 0 4px' }}>등록된 키 없음</p>
                  <p style={{ fontSize: '12px', color: t.textFaint, margin: 0 }}>아래에서 키를 등록해주세요</p>
                </>
              )}
            </div>
            {keyInfo?.hasKey && (
              <button onClick={deleteKey} style={{
                padding: '8px 14px', borderRadius: '10px', flexShrink: 0,
                border: '1px solid rgba(239,68,68,0.25)',
                background: 'rgba(239,68,68,0.07)', color: '#f87171',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              }}>삭제</button>
            )}
          </div>

          {/* 키 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelBase}>OpenAI API 키</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveKey()}
                placeholder="sk-proj-..."
                style={{ ...inputBase, paddingRight: '52px' }}
              />
              <button onClick={() => setShowKey(v => !v)} style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
                color: t.textMuted, padding: '4px',
              }}>{showKey ? '🙈' : '👁'}</button>
            </div>
          </div>

          {/* 안내박스 */}
          <div style={{
            background: t.isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.05)',
            border: `1px solid rgba(99,102,241,0.2)`,
            borderRadius: '14px', padding: '16px 20px', marginBottom: '20px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', margin: '0 0 8px' }}>💡 발급 방법</p>
            <p style={{ fontSize: '12px', color: t.textMuted, margin: 0, lineHeight: 1.7 }}>
              1. platform.openai.com 접속<br />
              2. API Keys → Create new secret key<br />
              3. 생성된 키(sk-proj-...)를 위 입력란에 붙여넣기
            </p>
          </div>

          {keyMsg && (
            <div style={{
              padding: '14px 18px', borderRadius: '14px', marginBottom: '16px',
              background: keyMsg.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${keyMsg.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: keyMsg.type === 'success' ? '#34d399' : '#f87171',
              fontSize: '13px', fontWeight: 600,
            }}>{keyMsg.text}</div>
          )}

          <button onClick={saveKey} disabled={keyLoading || !keyInput.trim()} style={{
            padding: '16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white', fontSize: '15px', fontWeight: 800,
            boxShadow: '0 6px 20px rgba(245,158,11,0.35)',
            opacity: keyLoading || !keyInput.trim() ? 0.5 : 1,
            transition: 'all 0.2s', marginTop: 'auto',
          }}>
            {keyLoading ? '⏳ 검증 중...' : keyInfo?.hasKey ? '🔄 키 변경하기' : '✅ 키 등록하기'}
          </button>
        </div>

        {/* ─────────────── 오른쪽: 비밀번호 변경 ─────────────── */}
        <div style={{
          padding: '40px 48px',
          display: 'flex', flexDirection: 'column',
          minHeight: 'calc(100vh - 104px)',
        }} className="settings-col">
          <p style={sectionTitle}>🔒 비밀번호 변경</p>
          <p style={sectionSub}>보안을 위해 주기적으로 변경해주세요</p>

          {/* 현재 비번 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelBase}>현재 비밀번호</label>
            <div style={{ position: 'relative' }}>
              <input type={showCur ? 'text' : 'password'} value={curPw}
                onChange={e => setCurPw(e.target.value)}
                placeholder="현재 비밀번호 입력"
                style={{ ...inputBase, paddingRight: '52px' }} />
              <button onClick={() => setShowCur(v => !v)} style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: t.textMuted,
              }}>{showCur ? '🙈' : '👁'}</button>
            </div>
          </div>

          <div style={divider} />

          {/* 새 비번 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelBase}>새 비밀번호</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="6자 이상 입력"
                style={{ ...inputBase, paddingRight: '52px' }} />
              <button onClick={() => setShowNew(v => !v)} style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: t.textMuted,
              }}>{showNew ? '🙈' : '👁'}</button>
            </div>
            {/* 비번 강도 바 */}
            {newPw && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '6px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '5px', borderRadius: '3px',
                      background: pwStrength >= i ? pwStrengthColor : t.input,
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: pwStrengthColor, margin: 0, fontWeight: 600 }}>
                  {pwStrengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* 새 비번 확인 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelBase}>새 비밀번호 확인</label>
            <div style={{ position: 'relative' }}>
              <input type={showCfm ? 'text' : 'password'} value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="비밀번호 재입력"
                style={{
                  ...inputBase, paddingRight: '52px',
                  borderColor: confirmPw && newPw !== confirmPw ? 'rgba(239,68,68,0.5)' : t.inputBorder,
                }} />
              <button onClick={() => setShowCfm(v => !v)} style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: t.textMuted,
              }}>{showCfm ? '🙈' : '👁'}</button>
            </div>
            {confirmPw && newPw !== confirmPw && (
              <p style={{ fontSize: '12px', color: '#f87171', margin: '8px 0 0', fontWeight: 600 }}>
                ⚠️ 비밀번호가 일치하지 않습니다
              </p>
            )}
            {confirmPw && newPw === confirmPw && newPw.length >= 6 && (
              <p style={{ fontSize: '12px', color: '#34d399', margin: '8px 0 0', fontWeight: 600 }}>
                ✅ 비밀번호가 일치합니다
              </p>
            )}
          </div>

          {/* 보안 안내 */}
          <div style={{
            background: t.isDark ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.05)',
            border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: '14px', padding: '16px 20px', marginBottom: '20px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', margin: '0 0 8px' }}>🛡 보안 권장 사항</p>
            <p style={{ fontSize: '12px', color: t.textMuted, margin: 0, lineHeight: 1.7 }}>
              영문 대/소문자 + 숫자 + 특수문자 조합<br />
              8자 이상 사용 권장 · 타 사이트와 다른 비밀번호 사용
            </p>
          </div>

          {pwMsg && (
            <div style={{
              padding: '14px 18px', borderRadius: '14px', marginBottom: '16px',
              background: pwMsg.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${pwMsg.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: pwMsg.type === 'success' ? '#34d399' : '#f87171',
              fontSize: '13px', fontWeight: 600,
            }}>{pwMsg.text}</div>
          )}

          <button onClick={changePw} disabled={pwLoading} style={{
            padding: '16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: 'white', fontSize: '15px', fontWeight: 800,
            boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
            opacity: pwLoading ? 0.6 : 1, transition: 'all 0.2s',
            marginTop: 'auto',
          }}>
            {pwLoading ? '⏳ 변경 중...' : '🔒 비밀번호 변경하기'}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .settings-body { grid-template-columns: 1fr !important; }
          .settings-col  { border-right: none !important; border-bottom: 1px solid ${t.border}; padding: 28px 20px !important; min-height: auto !important; }
        }
      `}</style>
    </div>
  )
}

export default function SupplierSettingsPage() {
  return (
    <SupplierLayout>
      <SettingsContent />
    </SupplierLayout>
  )
}
