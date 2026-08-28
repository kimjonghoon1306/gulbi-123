'use client'

import { useState, useEffect } from 'react'

// AI 상세페이지 "이미지 소스" 키 3종 관리 카드.
// Gemini(두뇌)와 별개로, 배경·사진 보정에 쓰는 키들. 4개 전부 항상 ON(토글 없음).
// 관리자가 안 넣어도 서버 기본값으로 동작 → 상태에 "기본 키 사용 중" 표시.

type Src = {
  id: 'pexels' | 'pixabay' | 'replicate'
  emoji: string
  name: string
  badge: string
  badgeColor: string
  desc: string
  placeholder: string
  issueUrl: string
  issueLabel: string
  bodyKey: 'pexelsKey' | 'pixabayKey' | 'replicateKey'
  hintKey: 'pexelsKeyHint' | 'pixabayKeyHint' | 'replicateKeyHint'
}

const SOURCES: Src[] = [
  {
    id: 'pexels', emoji: '📷', name: 'Pexels 키', badge: '고급 실사 사진', badgeColor: 'sky',
    desc: '시네마틱하고 분위기 있는 배경 사진을 무료로 가져옵니다. 프리미엄·고급 느낌 컨셉에 어울립니다.',
    placeholder: 'Pexels API 키 붙여넣기', issueUrl: 'https://www.pexels.com/api/new/', issueLabel: '🔑 Pexels 키 발급받기 (무료) →',
    bodyKey: 'pexelsKey', hintKey: 'pexelsKeyHint',
  },
  {
    id: 'pixabay', emoji: '🎨', name: 'Pixabay 키', badge: '다양한 무료 이미지', badgeColor: 'violet',
    desc: '밝고 다양한 스타일의 사진·일러스트·패턴을 무료로 가져옵니다. 활기차고 실용적인 컨셉에 어울립니다.',
    placeholder: 'Pixabay API 키 붙여넣기', issueUrl: 'https://pixabay.com/api/docs/', issueLabel: '🔑 Pixabay 키 발급받기 (무료) →',
    bodyKey: 'pixabayKey', hintKey: 'pixabayKeyHint',
  },
  {
    id: 'replicate', emoji: '✨', name: 'Replicate 키 (Flux)', badge: 'AI 이미지·사진 보정', badgeColor: 'rose',
    desc: '사진을 선명하게 업스케일하고, 배경을 정리하며, 딱 맞는 배경이 없을 때 새로 만들어냅니다. (이미지 처리당 소량 과금)',
    placeholder: 'Replicate API 토큰 붙여넣기 (r8_...)', issueUrl: 'https://replicate.com/account/api-tokens', issueLabel: '🔑 Replicate 토큰 발급받기 →',
    bodyKey: 'replicateKey', hintKey: 'replicateKeyHint',
  },
]

const badgeCls: Record<string, string> = {
  sky: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
}

export default function ImageSourceKeysCard() {
  const [hints, setHints] = useState<Record<string, string | null>>({})
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [msg, setMsg] = useState<Record<string, { type: 'success' | 'error'; text: string } | null>>({})

  useEffect(() => { void fetchHints() }, [])

  async function fetchHints() {
    try {
      const res = await fetch('/api/user-key')
      if (res.ok) {
        const d = await res.json()
        setHints({ pexels: d.pexelsKeyHint || null, pixabay: d.pixabayKeyHint || null, replicate: d.replicateKeyHint || null })
      }
    } catch {}
  }

  async function save(src: Src) {
    const val = (inputs[src.id] || '').trim()
    if (!val) { setMsg(m => ({ ...m, [src.id]: { type: 'error', text: 'API 키를 입력해주세요.' } })); return }
    setLoading(l => ({ ...l, [src.id]: true }))
    setMsg(m => ({ ...m, [src.id]: null }))
    try {
      const res = await fetch('/api/user-key', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [src.bodyKey]: val }),
      })
      const d = await res.json()
      if (!res.ok) {
        setMsg(m => ({ ...m, [src.id]: { type: 'error', text: d.error || '저장에 실패했습니다.' } }))
      } else {
        setMsg(m => ({ ...m, [src.id]: { type: 'success', text: '✅ 키가 저장됐어요!' } }))
        setHints(h => ({ ...h, [src.id]: d.hint || '등록됨' }))
        setInputs(i => ({ ...i, [src.id]: '' }))
        setTimeout(() => setMsg(m => ({ ...m, [src.id]: null })), 3000)
      }
    } catch {
      setMsg(m => ({ ...m, [src.id]: { type: 'error', text: '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' } }))
    }
    setLoading(l => ({ ...l, [src.id]: false }))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-700 flex items-center gap-3">
        <span className="text-2xl">🖼️</span>
        <div>
          <h2 className="font-bold text-slate-800 dark:text-white">이미지 소스 키 <span className="text-xs font-medium text-emerald-500">· 항상 켜짐</span></h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">상세페이지 배경과 사진 보정에 사용해요. Gemini가 상황에 맞게 자동으로 골라 씁니다.</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {SOURCES.map((src, idx) => {
          const saved = hints[src.id]
          const isDefault = saved === '기본 키 사용 중'
          return (
            <div key={src.id}>
              {idx > 0 && <div className="border-t border-slate-100 dark:border-gray-700 mb-6" />}
              <div className="space-y-3">
                {/* 제목 + 뱃지 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">{src.emoji}</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">{src.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeCls[src.badgeColor]}`}>{src.badge}</span>
                </div>
                {/* 기능 설명 */}
                <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{src.desc}</p>
                {/* 발급 링크 */}
                <a href={src.issueUrl} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                  style={{ textDecoration: 'none' }}>
                  {src.issueLabel}
                </a>
                {/* 등록 상태 */}
                {saved
                  ? <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${isDefault ? 'bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'}`}>
                      <span className={`text-sm font-bold ${isDefault ? 'text-sky-600 dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{isDefault ? '🔵 기본 키 사용 중' : '✅ 키 등록됨'}</span>
                      {!isDefault && <span className="text-emerald-700 dark:text-emerald-400 text-xs font-mono">{saved}</span>}
                    </div>
                  : <div className="rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-gray-700/40 border border-slate-200 dark:border-gray-600 text-slate-400 text-xs font-medium">아직 등록된 키가 없어요</div>
                }
                {/* 입력칸 (크게) */}
                <div className="relative">
                  <input
                    type={show[src.id] ? 'text' : 'password'}
                    value={inputs[src.id] || ''}
                    onChange={e => setInputs(i => ({ ...i, [src.id]: e.target.value }))}
                    placeholder={saved && !isDefault ? '바꿀 때만 새 키 붙여넣기' : src.placeholder}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3.5 pr-12 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button type="button" onClick={() => setShow(s => ({ ...s, [src.id]: !s[src.id] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform">
                    {show[src.id] ? '🙈' : '👁️'}
                  </button>
                </div>
                {/* 메시지 */}
                {msg[src.id] && (
                  <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg[src.id]!.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800'}`}>
                    {msg[src.id]!.text}
                  </div>
                )}
                {/* 저장 버튼 (크게) */}
                <button onClick={() => save(src)} disabled={loading[src.id]}
                  className="w-full py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-sm font-bold transition-colors active:scale-95 disabled:opacity-50">
                  {loading[src.id] ? '저장 중...' : `${src.emoji} ${src.name} 저장`}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
