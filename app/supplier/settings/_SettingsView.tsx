'use client'

import type { CSSProperties, Dispatch, SetStateAction } from 'react'

type KeyInfo = { hasKey: boolean; keyHint: string | null; geminiKeyHint?: string | null; isValid: boolean; updatedAt: string | null }
type Message = { type: 'success' | 'error'; text: string }

type SettingsViewProps = {
  t: any
  keyInfo: KeyInfo | null
  keyInput: string
  setKeyInput: Dispatch<SetStateAction<string>>
  showKey: boolean
  setShowKey: Dispatch<SetStateAction<boolean>>
  keyLoading: boolean
  keyMsg: Message | null
  geminiInput: string
  setGeminiInput: Dispatch<SetStateAction<string>>
  showGemini: boolean
  setShowGemini: Dispatch<SetStateAction<boolean>>
  geminiLoading: boolean
  geminiMsg: Message | null
  curPw: string
  setCurPw: Dispatch<SetStateAction<string>>
  newPw: string
  setNewPw: Dispatch<SetStateAction<string>>
  confirmPw: string
  setConfirmPw: Dispatch<SetStateAction<string>>
  showCur: boolean
  setShowCur: Dispatch<SetStateAction<boolean>>
  showNew: boolean
  setShowNew: Dispatch<SetStateAction<boolean>>
  showCfm: boolean
  setShowCfm: Dispatch<SetStateAction<boolean>>
  pwLoading: boolean
  pwMsg: Message | null
  saveKey: () => Promise<void>
  saveGeminiKey: () => Promise<void>
  deleteKey: () => Promise<void>
  changePw: () => Promise<void>
  pwStrength: number
  pwStrengthColor: string
  pwStrengthLabel: string
  inputBase: CSSProperties
  labelBase: CSSProperties
  sectionTitle: CSSProperties
  sectionSub: CSSProperties
  divider: CSSProperties
}

export default function SettingsView({
  t, keyInfo, keyInput, setKeyInput, showKey, setShowKey, keyLoading, keyMsg,
  geminiInput, setGeminiInput, showGemini, setShowGemini, geminiLoading, geminiMsg,
  curPw, setCurPw, newPw, setNewPw, confirmPw, setConfirmPw, showCur, setShowCur,
  showNew, setShowNew, showCfm, setShowCfm, pwLoading, pwMsg, saveKey, saveGeminiKey,
  deleteKey, changePw, pwStrength, pwStrengthColor, pwStrengthLabel, inputBase, labelBase,
  sectionTitle, sectionSub, divider,
}: SettingsViewProps) {
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
          <p style={sectionSub}>OpenAI 또는 Gemini 키 중 하나만 등록해도 AI 기능을 쓸 수 있어요</p>

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
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', margin: '0 0 10px' }}>💡 발급 방법</p>
            <p style={{ fontSize: '12px', color: t.textMuted, margin: '0 0 12px', lineHeight: 1.7 }}>
              1. 아래 버튼으로 OpenAI 사이트 접속<br />
              2. API Keys → Create new secret key<br />
              3. 생성된 키(sk-proj-...)를 위 입력란에 붙여넣기
            </p>
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '11px 16px', borderRadius: '12px', textDecoration: 'none',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.15))',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#818cf8', fontSize: '13px', fontWeight: 700,
              transition: 'all 0.2s',
            }}>
              🔑 OpenAI API 키 발급받기 →
            </a>
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
            transition: 'all 0.2s',
          }}>
            {keyLoading ? '⏳ 검증 중...' : keyInfo?.hasKey ? '🔄 키 변경하기' : '✅ 키 등록하기'}
          </button>

          {/* ─────────────── Gemini 키 ─────────────── */}
          <div style={{ borderTop: `1px solid ${t.border}`, margin: '32px 0 24px' }} />
          <p style={{ fontSize: '16px', fontWeight: 800, color: t.text, margin: '0 0 4px' }}>♊ Gemini API 키 (무료)</p>
          <p style={{ ...sectionSub, marginBottom: '20px' }}>구글 계정만 있으면 무료로 발급돼요. 사진 자동완성 등에 사용됩니다.</p>

          {/* Gemini 등록 상태 */}
          <div style={{
            background: keyInfo?.geminiKeyHint ? 'rgba(52,211,153,0.07)' : t.input,
            border: `1px solid ${keyInfo?.geminiKeyHint ? 'rgba(52,211,153,0.25)' : t.border}`,
            borderRadius: '18px', padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
              background: keyInfo?.geminiKeyHint ? 'rgba(52,211,153,0.15)' : t.input,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
            }}>{keyInfo?.geminiKeyHint ? '🔑' : '🔓'}</div>
            <div style={{ flex: 1 }}>
              {keyInfo?.geminiKeyHint ? (
                <>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>{keyInfo.geminiKeyHint}</p>
                  <p style={{ fontSize: '12px', color: '#34d399', margin: 0 }}>✅ 등록됨</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: t.textMuted, margin: '0 0 4px' }}>등록된 Gemini 키 없음</p>
                  <p style={{ fontSize: '12px', color: t.textFaint, margin: 0 }}>아래에서 키를 등록해주세요</p>
                </>
              )}
            </div>
          </div>

          {/* Gemini 키 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelBase}>Gemini API 키</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showGemini ? 'text' : 'password'}
                value={geminiInput}
                onChange={e => setGeminiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveGeminiKey()}
                placeholder="AIza..."
                style={{ ...inputBase, paddingRight: '52px' }}
              />
              <button onClick={() => setShowGemini(v => !v)} style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
                color: t.textMuted, padding: '4px',
              }}>{showGemini ? '🙈' : '👁'}</button>
            </div>
          </div>

          {/* Gemini 발급 안내 */}
          <div style={{
            background: 'rgba(52,211,153,0.05)',
            border: `1px solid rgba(52,211,153,0.2)`,
            borderRadius: '14px', padding: '16px 20px', marginBottom: '20px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', margin: '0 0 10px' }}>💡 발급 방법 (무료)</p>
            <p style={{ fontSize: '12px', color: t.textMuted, margin: '0 0 12px', lineHeight: 1.7 }}>
              1. 아래 버튼으로 Google AI Studio 접속 (구글 로그인)<br />
              2. "Create API key" → 키 생성<br />
              3. 생성된 키(AIza...)를 위 입력란에 붙여넣기
            </p>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '11px 16px', borderRadius: '12px', textDecoration: 'none',
              background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.15))',
              border: '1px solid rgba(52,211,153,0.3)',
              color: '#34d399', fontSize: '13px', fontWeight: 700,
            }}>
              🔑 Gemini API 키 발급받기 →
            </a>
          </div>

          {geminiMsg && (
            <div style={{
              padding: '14px 18px', borderRadius: '14px', marginBottom: '16px',
              background: geminiMsg.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${geminiMsg.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: geminiMsg.type === 'success' ? '#34d399' : '#f87171',
              fontSize: '13px', fontWeight: 600,
            }}>{geminiMsg.text}</div>
          )}

          <button onClick={saveGeminiKey} disabled={geminiLoading || !geminiInput.trim()} style={{
            padding: '16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white', fontSize: '15px', fontWeight: 800,
            boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
            opacity: geminiLoading || !geminiInput.trim() ? 0.5 : 1,
            transition: 'all 0.2s',
          }}>
            {geminiLoading ? '⏳ 검증 중...' : keyInfo?.geminiKeyHint ? '🔄 Gemini 키 변경하기' : '✅ Gemini 키 등록하기'}
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
