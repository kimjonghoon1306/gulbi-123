'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import SupplierLayout from '../_layout/layout'
import { useSupplierTheme } from '../_layout/theme-context'

type KeyInfo = { hasKey: boolean; keyHint: string | null; isValid: boolean; updatedAt: string | null }

function SettingsContent() {
  const t = useSupplierTheme()
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'key' | 'password'>('key')

  // AI 키
  const [keyInfo, setKeyInfo]       = useState<KeyInfo | null>(null)
  const [keyInput, setKeyInput]     = useState('')
  const [showKey, setShowKey]       = useState(false)
  const [keyLoading, setKeyLoading] = useState(false)
  const [keyMsg, setKeyMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 비밀번호
  const [curPw, setCurPw]           = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showCur, setShowCur]       = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [showCfm, setShowCfm]       = useState(false)
  const [pwLoading, setPwLoading]   = useState(false)
  const [pwMsg, setPwMsg]           = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  // 공통 스타일
  const card = {
    background: t.card, border: `1px solid ${t.border}`,
    borderRadius: '20px', overflow: 'hidden',
  }
  const inputStyle = {
    flex: 1, background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: '12px', padding: '13px 16px', fontSize: '14px',
    color: t.text, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 700,
    color: t.textMuted, marginBottom: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' as const,
  }
  const eyeBtn = {
    position: 'absolute' as const, right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: t.textMuted,
    padding: '4px',
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, padding: '0' }}>

      {/* 상단 헤더 배너 */}
      <div style={{
        background: t.isDark
          ? 'linear-gradient(135deg, #1a1f2e 0%, #161b22 100%)'
          : 'linear-gradient(135deg, #fff8f0 0%, #fef3e2 100%)',
        borderBottom: `1px solid ${t.border}`,
        padding: '32px 40px 28px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
            }}>⚙️</div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: t.text, margin: 0 }}>설정</h1>
              <p style={{ fontSize: '13px', color: t.textMuted, margin: '3px 0 0' }}>API 키 관리 및 계정 보안 설정</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* 탭 */}
        <div style={{
          display: 'flex', gap: '4px',
          background: t.input, borderRadius: '14px', padding: '4px',
          marginBottom: '28px', width: 'fit-content',
        }}>
          {([
            { key: 'key',      label: '🤖 AI 키 관리' },
            { key: 'password', label: '🔒 비밀번호 변경' },
          ] as const).map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700, transition: 'all 0.2s',
              background: tab === item.key
                ? (t.isDark ? 'rgba(245,158,11,0.2)' : '#fff')
                : 'transparent',
              color: tab === item.key ? '#f59e0b' : t.textMuted,
              boxShadow: tab === item.key && !t.isDark ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>{item.label}</button>
          ))}
        </div>

        {/* ── AI 키 탭 ── */}
        {tab === 'key' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="settings-grid">

            {/* 현재 등록된 키 */}
            <div style={card}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}` }}>
                <h2 style={{ fontSize: '15px', fontWeight: 800, color: t.text, margin: 0 }}>등록된 API 키</h2>
                <p style={{ fontSize: '12px', color: t.textMuted, margin: '4px 0 0' }}>현재 등록된 OpenAI API 키 상태</p>
              </div>
              <div style={{ padding: '24px' }}>
                {keyInfo?.hasKey ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 키 힌트 */}
                    <div style={{
                      background: t.isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: '14px', padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                    }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                        background: 'rgba(245,158,11,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                      }}>🔑</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>
                          {keyInfo.keyHint || 'sk-...등록됨'}
                        </p>
                        <p style={{ fontSize: '11px', color: t.textMuted, margin: 0 }}>
                          {keyInfo.isValid ? '✅ 검증 완료' : '⚠️ 미검증'}
                          {keyInfo.updatedAt && ` · ${new Date(keyInfo.updatedAt).toLocaleDateString('ko-KR')} 등록`}
                        </p>
                      </div>
                    </div>

                    {/* 삭제 버튼 */}
                    <button onClick={deleteKey} style={{
                      padding: '12px', borderRadius: '12px',
                      border: '1px solid rgba(239,68,68,0.25)',
                      background: 'rgba(239,68,68,0.06)',
                      color: '#f87171', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}>🗑 키 삭제</button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ fontSize: '36px', marginBottom: '10px' }}>🔑</p>
                    <p style={{ color: t.textMuted, fontSize: '13px', margin: '0 0 6px' }}>등록된 키가 없습니다</p>
                    <p style={{ color: t.textFaint, fontSize: '11px', margin: 0 }}>오른쪽에서 키를 등록해주세요</p>
                  </div>
                )}
              </div>
            </div>

            {/* 키 등록/변경 */}
            <div style={card}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}` }}>
                <h2 style={{ fontSize: '15px', fontWeight: 800, color: t.text, margin: 0 }}>
                  {keyInfo?.hasKey ? 'API 키 변경' : 'API 키 등록'}
                </h2>
                <p style={{ fontSize: '12px', color: t.textMuted, margin: '4px 0 0' }}>
                  OpenAI 플랫폼에서 발급받은 키를 입력하세요
                </p>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>OpenAI API 키</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={keyInput}
                      onChange={e => setKeyInput(e.target.value)}
                      placeholder="sk-proj-..."
                      style={{ ...inputStyle, paddingRight: '44px' }}
                    />
                    <button style={eyeBtn} onClick={() => setShowKey(v => !v)}>
                      {showKey ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* 안내 */}
                <div style={{
                  background: t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${t.border}`, borderRadius: '12px', padding: '14px 16px',
                }}>
                  <p style={{ fontSize: '12px', color: t.textMuted, margin: '0 0 6px', fontWeight: 700 }}>💡 발급 방법</p>
                  <p style={{ fontSize: '11px', color: t.textFaint, margin: 0, lineHeight: 1.6 }}>
                    platform.openai.com → API Keys → Create new secret key
                  </p>
                </div>

                {keyMsg && (
                  <div style={{
                    padding: '12px 16px', borderRadius: '12px',
                    background: keyMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${keyMsg.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    color: keyMsg.type === 'success' ? '#34d399' : '#f87171',
                    fontSize: '13px', fontWeight: 600,
                  }}>{keyMsg.text}</div>
                )}

                <button onClick={saveKey} disabled={keyLoading || !keyInput.trim()} style={{
                  padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white', fontSize: '14px', fontWeight: 800,
                  boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
                  opacity: keyLoading || !keyInput.trim() ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}>
                  {keyLoading ? '검증 중...' : keyInfo?.hasKey ? '키 변경하기' : '키 등록하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 비밀번호 탭 ── */}
        {tab === 'password' && (
          <div style={{ maxWidth: '480px' }}>
            <div style={card}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}` }}>
                <h2 style={{ fontSize: '15px', fontWeight: 800, color: t.text, margin: 0 }}>비밀번호 변경</h2>
                <p style={{ fontSize: '12px', color: t.textMuted, margin: '4px 0 0' }}>보안을 위해 주기적으로 변경해주세요</p>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* 현재 비번 */}
                <div>
                  <label style={labelStyle}>현재 비밀번호</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showCur ? 'text' : 'password'} value={curPw} onChange={e => setCurPw(e.target.value)}
                      placeholder="현재 비밀번호 입력" style={{ ...inputStyle, paddingRight: '44px' }} />
                    <button style={eyeBtn} onClick={() => setShowCur(v => !v)}>{showCur ? '🙈' : '👁'}</button>
                  </div>
                </div>

                <div style={{ height: '1px', background: t.border }} />

                {/* 새 비번 */}
                <div>
                  <label style={labelStyle}>새 비밀번호</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                      placeholder="6자 이상 입력" style={{ ...inputStyle, paddingRight: '44px' }} />
                    <button style={eyeBtn} onClick={() => setShowNew(v => !v)}>{showNew ? '🙈' : '👁'}</button>
                  </div>
                </div>

                {/* 새 비번 확인 */}
                <div>
                  <label style={labelStyle}>새 비밀번호 확인</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showCfm ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      placeholder="비밀번호 재입력" style={{ ...inputStyle, paddingRight: '44px' }} />
                    <button style={eyeBtn} onClick={() => setShowCfm(v => !v)}>{showCfm ? '🙈' : '👁'}</button>
                  </div>
                </div>

                {/* 비번 강도 표시 */}
                {newPw && (
                  <div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '4px', borderRadius: '2px',
                          background: newPw.length >= i * 3
                            ? (newPw.length >= 12 ? '#34d399' : newPw.length >= 8 ? '#fbbf24' : '#f87171')
                            : t.input,
                          transition: 'background 0.3s',
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: t.textMuted, margin: 0 }}>
                      {newPw.length < 6 ? '⚠️ 너무 짧아요' : newPw.length < 8 ? '😐 보통' : newPw.length < 12 ? '😊 좋아요' : '💪 매우 강함'}
                    </p>
                  </div>
                )}

                {pwMsg && (
                  <div style={{
                    padding: '12px 16px', borderRadius: '12px',
                    background: pwMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${pwMsg.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    color: pwMsg.type === 'success' ? '#34d399' : '#f87171',
                    fontSize: '13px', fontWeight: 600,
                  }}>{pwMsg.text}</div>
                )}

                <button onClick={changePw} disabled={pwLoading} style={{
                  padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: 'white', fontSize: '14px', fontWeight: 800,
                  boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                  opacity: pwLoading ? 0.6 : 1, transition: 'opacity 0.2s',
                }}>
                  {pwLoading ? '변경 중...' : '비밀번호 변경하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .settings-grid { grid-template-columns: 1fr !important; }
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

