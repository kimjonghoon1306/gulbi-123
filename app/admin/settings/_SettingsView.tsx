'use client'

import type { Dispatch, SetStateAction } from 'react'

type Message = { type: 'success' | 'error'; text: string }
type Bubble = { id: number; x: number; size: number; delay: number }
type Section = { key: string; icon: string; label: string }

type SettingsViewProps = {
  currentPw: string
  setCurrentPw: Dispatch<SetStateAction<string>>
  newPw: string
  setNewPw: Dispatch<SetStateAction<string>>
  confirmPw: string
  setConfirmPw: Dispatch<SetStateAction<string>>
  showCurrent: boolean
  setShowCurrent: Dispatch<SetStateAction<boolean>>
  showNew: boolean
  setShowNew: Dispatch<SetStateAction<boolean>>
  showConfirm: boolean
  setShowConfirm: Dispatch<SetStateAction<boolean>>
  pwLoading: boolean
  pwMsg: Message | null
  activeSection: string
  setActiveSection: Dispatch<SetStateAction<string>>
  fishMood: string
  setFishMood: Dispatch<SetStateAction<string>>
  bubbles: Bubble[]
  openaiKey: string
  setOpenaiKey: Dispatch<SetStateAction<string>>
  openaiKeyMsg: Message | null
  openaiKeyLoading: boolean
  showOpenaiKey: boolean
  setShowOpenaiKey: Dispatch<SetStateAction<boolean>>
  geminiKey: string
  setGeminiKey: Dispatch<SetStateAction<string>>
  geminiKeyMsg: Message | null
  geminiKeyLoading: boolean
  showGeminiKey: boolean
  setShowGeminiKey: Dispatch<SetStateAction<boolean>>
  openaiSaved: string | null
  geminiSaved: string | null
  handleChangePw: () => Promise<void>
  saveOpenaiKey: () => Promise<void>
  saveGeminiKey: () => Promise<void>
  sections: Section[]
}

export default function SettingsView({
  currentPw, setCurrentPw, newPw, setNewPw, confirmPw, setConfirmPw,
  showCurrent, setShowCurrent, showNew, setShowNew, showConfirm, setShowConfirm,
  pwLoading, pwMsg, activeSection, setActiveSection, fishMood, setFishMood, bubbles,
  openaiKey, setOpenaiKey, openaiKeyMsg, openaiKeyLoading, showOpenaiKey, setShowOpenaiKey,
  geminiKey, setGeminiKey, geminiKeyMsg, geminiKeyLoading, showGeminiKey, setShowGeminiKey,
  openaiSaved, geminiSaved, handleChangePw, saveOpenaiKey, saveGeminiKey, sections,
}: SettingsViewProps) {
  return (
    <div className="animate-fadeIn min-h-full">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">설정</h1>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">계정 및 시스템 설정</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* 왼쪽 캐릭터 + 메뉴 */}
        <div className="lg:col-span-1 lg:row-start-1 space-y-4 order-1 lg:order-none">
          {/* 팜이 캐릭터 */}
          <div className="relative bg-gradient-to-br from-green-500 via-green-600 to-blue-600 rounded-3xl p-6 overflow-hidden shadow-xl shadow-green-600/30">
            {/* 물방울 애니메이션 */}
            {bubbles.map(b => (
              <div key={b.id} className="absolute rounded-full bg-white/10"
                style={{
                  width: b.size, height: b.size,
                  left: `${b.x}%`, bottom: '-20px',
                  animation: `floatUp ${3 + b.delay}s ease-in-out infinite`,
                  animationDelay: `${b.delay}s`
                }} />
            ))}
            <div className="relative z-10 text-center">
              <div className="text-7xl mb-3 farm-bounce inline-block">{fishMood}</div>
              <p className="text-white font-bold text-lg">팜이</p>
              <p className="text-green-100 text-xs mt-1">시스템 마스코트</p>
              <div className="mt-4 bg-white/20 rounded-2xl px-4 py-2">
                <p className="text-white text-xs font-medium">
                  {fishMood === '😄' && '오늘도 화이팅! 🌾'}
                  {fishMood === '😤' && '다 입력해주세요!'}
                  {fishMood === '😵' && '비번이 달라요!'}
                  {fishMood === '😬' && '6자 이상 써주세요!'}
                  {fishMood === '🤔' && '확인 중이에요...'}
                  {fishMood === '😱' && '비번이 틀렸어요!'}
                  {fishMood === '😢' && '오류가 났어요...'}
                  {fishMood === '🥳' && '변경 완료!!! 🎉'}
                </p>
              </div>
            </div>
          </div>

          {/* 메뉴 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-2 shadow-sm">
            {sections.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1
                  ${activeSection === s.key
                    ? 'bg-green-600 text-white shadow-md scale-[1.02]'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-700'}`}>
                <span className="text-lg">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

        </div>

        {/* 오른쪽 콘텐츠 */}
        <div className="lg:col-span-3 lg:row-start-1 lg:row-span-2 space-y-4 order-2 lg:order-none">

          {/* 계정 관리 */}
          {activeSection === 'account' && (
            <div className="animate-fadeIn space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-700">
                  <h2 className="font-bold text-slate-800 dark:text-white">👤 관리자 정보</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-gray-700/50 rounded-2xl mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-3xl shadow-lg">
                      🧺
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-lg">관리자</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500">온종일팜 도매 관리 시스템</p>
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500 px-2.5 py-1 rounded-full font-medium mt-1 inline-block">ADMIN</span>
                    </div>
                  </div>

                  {/* 통계 */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '관리 기간', value: '진행중', icon: '📅' },
                      { label: '권한', value: '최고관리자', icon: '👑' },
                      { label: '서버', value: 'Seoul', icon: '🇰🇷' },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 text-center hover:shadow-md transition-shadow duration-200">
                        <p className="text-2xl mb-1">{item.icon}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{item.label}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 보안 설정 */}
          {activeSection === 'security' && (
            <div className="animate-fadeIn">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-700 flex items-center gap-3">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <h2 className="font-bold text-slate-800 dark:text-white">비밀번호 변경</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">보안을 위해 정기적으로 변경해 주세요</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: '현재 비밀번호', value: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                    { label: '새 비밀번호', value: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(!showNew) },
                    { label: '새 비밀번호 확인', value: confirmPw, set: setConfirmPw, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                      <div className="relative">
                        <input type={f.show ? 'text' : 'password'} value={f.value}
                          onChange={e => { f.set(e.target.value); setFishMood('😄') }}
                          placeholder="••••••••"
                          className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 pr-12 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600 transition-all" />
                        <button type="button" onClick={f.toggle}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg hover:scale-110 transition-transform">
                          {f.show ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 비번 강도 표시 */}
                  {newPw && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400 dark:text-slate-500">비밀번호 강도</p>
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            newPw.length >= i * 3
                              ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-green-500' : 'bg-emerald-400'
                              : 'bg-slate-200 dark:bg-gray-700'
                          }`} />
                        ))}
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {newPw.length < 4 ? '😬 너무 짧아요' : newPw.length < 7 ? '😐 보통이에요' : newPw.length < 10 ? '🙂 좋아요' : '💪 완벽해요!'}
                      </p>
                    </div>
                  )}

                  {pwMsg && (
                    <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2
                      ${pwMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800'}`}>
                      {pwMsg.type === 'success' ? '✅' : '❌'} {pwMsg.text}
                    </div>
                  )}

                  <button onClick={handleChangePw} disabled={pwLoading}
                    className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-green-600/20 hover:shadow-green-600/40">
                    {pwLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        변경 중...
                      </span>
                    ) : '🔐 비밀번호 변경'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'apikey' && (
            <div className="animate-fadeIn">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-700 flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h2 className="font-bold text-slate-800 dark:text-white">AI API 키 관리</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">상품 자동생성에 사용할 API 키를 입력하세요</p>
                  </div>
                </div>
                <div className="p-6 space-y-6">

                  {/* OpenAI 키 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">OpenAI API 키</span>
                      <span className="text-xs bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full">선택</span>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">💡 OpenAI 키 발급</p>
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"
                        className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.15))', border: '1px solid rgba(245,158,11,0.3)', color: '#d97706', textDecoration: 'none' }}>
                        🔑 OpenAI API 키 발급받기 →
                      </a>
                    </div>
                    {openaiSaved
                      ? <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                          <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">✅ 키 등록됨</span>
                          <span className="text-emerald-700 dark:text-emerald-400 text-xs font-mono">{openaiSaved}</span>
                        </div>
                      : <div className="rounded-xl px-3 py-2 bg-slate-50 dark:bg-gray-700/40 border border-slate-200 dark:border-gray-600 text-slate-400 text-xs font-medium">아직 등록된 키가 없어요</div>
                    }
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{openaiSaved ? '키 변경 (새 키 입력)' : 'OpenAI API 키'}</label>
                      <div className="relative">
                        <input
                          type={showOpenaiKey ? 'text' : 'password'}
                          value={openaiKey}
                          onChange={e => setOpenaiKey(e.target.value)}
                          placeholder={openaiSaved ? '바꿀 때만 새 키 붙여넣기 (그대로 두면 유지)' : 'sk-...'}
                          className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 pr-12 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                        />
                        <button type="button" onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform">
                          {showOpenaiKey ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    {openaiKeyMsg && (
                      <div className={`rounded-xl px-4 py-3 text-sm font-medium ${openaiKeyMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800'}`}>
                        {openaiKeyMsg.text}
                      </div>
                    )}
                    <button onClick={saveOpenaiKey} disabled={openaiKeyLoading}
                      className="w-full py-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-sm font-bold transition-colors active:scale-95 disabled:opacity-50">
                      {openaiKeyLoading ? '저장 중...' : '💾 OpenAI 키 저장'}
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-gray-700" />

                  {/* Gemini 키 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Gemini API 키</span>
                      <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">AI 상세페이지 생성에 사용</span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">💡 Google AI Studio에서 무료 발급</p>
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                        className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))', border: '1px solid rgba(16,185,129,0.3)', color: '#059669', textDecoration: 'none' }}>
                        🔑 Gemini API 키 발급받기 (무료) →
                      </a>
                    </div>
                    {geminiSaved
                      ? <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                          <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">✅ 키 등록됨</span>
                          <span className="text-emerald-700 dark:text-emerald-400 text-xs font-mono">{geminiSaved}</span>
                        </div>
                      : <div className="rounded-xl px-3 py-2 bg-slate-50 dark:bg-gray-700/40 border border-slate-200 dark:border-gray-600 text-slate-400 text-xs font-medium">아직 등록된 키가 없어요</div>
                    }
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{geminiSaved ? '키 변경 (새 키 입력)' : 'Gemini API 키'}</label>
                      <div className="relative">
                        <input
                          type={showGeminiKey ? 'text' : 'password'}
                          value={geminiKey}
                          onChange={e => setGeminiKey(e.target.value)}
                          placeholder={geminiSaved ? '바꿀 때만 새 키 붙여넣기 (그대로 두면 유지)' : 'AIza...'}
                          className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 pr-12 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button type="button" onClick={() => setShowGeminiKey(!showGeminiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform">
                          {showGeminiKey ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    {geminiKeyMsg && (
                      <div className={`rounded-xl px-4 py-3 text-sm font-medium ${geminiKeyMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800'}`}>
                        {geminiKeyMsg.text}
                      </div>
                    )}
                    <button onClick={saveGeminiKey} disabled={geminiKeyLoading}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-500/20">
                      {geminiKeyLoading ? '저장 중...' : '🤖 Gemini 키 저장'}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* 시스템 정보 */}
          {activeSection === 'info' && (
            <div className="animate-fadeIn space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-700">
                  <h2 className="font-bold text-slate-800 dark:text-white">ℹ️ 시스템 정보</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: '시스템', value: '온종일팜 관리 시스템', icon: '🧺' },
                      { label: '버전', value: 'v1.0.0', icon: '🚀' },
                      { label: '프레임워크', value: 'Next.js 14', icon: '⚡' },
                      { label: '데이터베이스', value: 'Supabase', icon: '🗄️' },
                      { label: '배포', value: 'Vercel', icon: '▲' },
                      { label: '서버', value: 'Seoul 🇰🇷', icon: '📡' },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                        <p className="text-xl mb-2">{item.icon}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{item.label}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 하단 브랜드 카드 */}
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 dark:from-gray-900 dark:to-gray-950 rounded-2xl p-6 overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 text-[120px] opacity-10 leading-none">🧺</div>
                <div className="relative z-10">
                  <p className="text-4xl mb-3">🧺</p>
                  <p className="text-white font-bold text-xl">온종일팜</p>
                  <p className="text-slate-400 text-sm mt-1">농축수산물 도매 관리 플랫폼</p>
                  <div className="flex gap-2 mt-4">
                    <span className="text-xs bg-green-600/20 text-green-500 px-3 py-1.5 rounded-full border border-green-600/20">Next.js</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">Supabase</span>
                    <span className="text-xs bg-slate-500/20 text-slate-400 px-3 py-1.5 rounded-full border border-slate-500/20">Vercel</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-4">© 2026 All rights reserved</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 시스템 상태 - 모바일에서 맨 아래 */}
        <div className="lg:col-span-1 lg:row-start-2 lg:col-start-1 space-y-4 order-3 lg:order-none">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3">시스템 상태</p>
            {[
              { label: 'Supabase', status: '정상', color: 'bg-emerald-500' },
              { label: 'Vercel', status: '정상', color: 'bg-emerald-500' },
              { label: '서울 서버', status: '정상', color: 'bg-emerald-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`} />
                  <span className="text-xs text-emerald-500 font-medium">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-60px) scale(1.1); opacity: 0.08; }
          100% { transform: translateY(-120px) scale(0.8); opacity: 0; }
        }
        .farm-bounce {
          animation: fishBounce 2s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes fishBounce {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}
