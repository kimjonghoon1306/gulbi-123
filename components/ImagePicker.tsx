'use client'

// 이미지 삽입 UI — 3가지 모드 통합
// 1. 🌿 씬 (큐레이션된 9개 카테고리 - 기본)
// 2. 🔍 검색 (자유 검색 — 보조)
// 3. ✨ AI 생성 (DALL-E로 만들기)
//
// 삽입 시 자동으로 테마 보정이 적용됨 (ImagePicker는 URL만 넘기고,
// 실제 보정된 HTML은 부모 컴포넌트의 insertUnsplashImage에서 처리)

import { useState } from 'react'
import { SCENES, pickSceneQuery, type SceneKey } from '@/lib/image-scenes'
import type { ThemeKey } from '@/lib/image-processing'

type Tab = 'scene' | 'search' | 'ai'

type Props = {
  theme: ThemeKey                        // 현재 페이지 테마
  activeSectionIdx: number | null        // AI 탭에서 선택된 섹션 인덱스 (null이면 맨 끝)
  insertMode: 'before' | 'after' | 'end'
  onInsertModeChange: (m: 'before' | 'after' | 'end') => void
  onClearActiveSection: () => void
  onClose: () => void
  // 이미지 URL을 받아 삽입 (부모가 테마 보정 후 실제 DOM/블록에 삽입)
  onInsert: (imgUrl: string) => void
  // 사용 맥락: 'preview' = AI 상세페이지 미리보기, 'block' = 수동 블록 채우기
  mode: 'preview' | 'block'
}

export default function ImagePicker({
  theme, activeSectionIdx, insertMode, onInsertModeChange,
  onClearActiveSection, onClose, onInsert, mode,
}: Props) {
  const [tab, setTab] = useState<Tab>('scene')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedScene, setSelectedScene] = useState<SceneKey | null>(null)
  const [error, setError] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResult, setAiResult] = useState('')  // base64 or URL

  // Unsplash 검색 실행
  const runSearch = async (q: string) => {
    if (!q.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/unsplash-search?q=' + encodeURIComponent(q))
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setResults([])
      } else {
        setResults(data.results || [])
      }
    } catch (e: any) {
      setError('검색 오류: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // 씬 클릭 → 해당 씬의 쿼리로 검색
  const handleSceneClick = (sceneKey: SceneKey) => {
    setSelectedScene(sceneKey)
    const scene = SCENES.find(s => s.key === sceneKey)
    if (scene) runSearch(pickSceneQuery(scene))
  }

  // AI 이미지 생성
  const generateAi = async () => {
    if (!aiPrompt.trim()) return
    setLoading(true); setError(''); setAiResult('')
    try {
      const res = await fetch('/api/ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else if (data.b64) setAiResult('data:image/png;base64,' + data.b64)
    } catch (e: any) {
      setError('생성 오류: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImageClick = (url: string) => {
    onInsert(url)
  }

  return (
    <div
      onClick={mode === 'block' ? onClose : undefined}
      style={{
        ...(mode === 'block'
          ? { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }
          : { background: '#1a1a2e', borderBottom: '2px solid rgba(147,197,253,0.3)', padding: '14px', flexShrink: 0, maxHeight: '50%', overflowY: 'auto' }),
      }}>
      <div
        onClick={e => mode === 'block' && e.stopPropagation()}
        style={mode === 'block'
          ? { background: '#1a1a2e', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '85vh', overflow: 'auto', padding: '20px', border: '1px solid rgba(147,197,253,0.3)' }
          : {}
        }>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <p style={{ color: '#93c5fd', fontSize: mode === 'block' ? '15px' : '13px', fontWeight: 800, margin: 0, flex: 1 }}>
            🖼️ 이미지 넣기 · <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '11px' }}>
              {theme === 'gold' && '골드 톤'}
              {theme === 'dark' && '다크 톤'}
              {theme === 'white' && '화이트 톤'}
              {theme === 'natural' && '내추럴'}
              에 자동 보정됩니다
            </span>
          </p>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '16px', cursor: 'pointer', width: '30px', height: '30px' }}>
            ✕
          </button>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
          {([
            { k: 'scene' as Tab, label: '🌿 씬 선택', desc: '추천' },
            { k: 'search' as Tab, label: '🔍 직접 검색', desc: '' },
            { k: 'ai' as Tab, label: '✨ AI로 만들기', desc: '' },
          ]).map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); setResults([]); setError('') }}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: tab === t.k ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: tab === t.k ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              }}>
              {t.label}
              {t.desc && <span style={{ fontSize: '9px', marginLeft: '4px', color: '#6ee7b7' }}>{t.desc}</span>}
            </button>
          ))}
        </div>

        {/* AI 미리보기 모드에서만: 삽입 위치 토글 */}
        {mode === 'preview' && (
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <p style={{ color: '#93c5fd', fontSize: '11px', fontWeight: 700, margin: 0 }}>📍 삽입 위치:</p>
              {activeSectionIdx !== null ? (
                <span style={{ fontSize: '11px', color: '#6ee7b7', background: 'rgba(110,231,183,0.12)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                  섹션 {activeSectionIdx + 1} 선택됨
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>미리보기에서 섹션을 클릭하세요</span>
              )}
              {activeSectionIdx !== null && (
                <button onClick={onClearActiveSection}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '5px', color: 'rgba(255,255,255,0.6)', fontSize: '10px', padding: '2px 8px', cursor: 'pointer' }}>
                  해제
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {([
                { k: 'before' as const, label: '↑ 선택한 섹션 위' },
                { k: 'after' as const, label: '↓ 선택한 섹션 아래' },
                { k: 'end' as const, label: '⬇ 맨 끝' },
              ]).map(m => (
                <button key={m.k} onClick={() => onInsertModeChange(m.k)}
                  disabled={m.k !== 'end' && activeSectionIdx === null}
                  style={{
                    flex: 1, padding: '6px 8px', borderRadius: '6px',
                    border: '1px solid ' + (insertMode === m.k ? '#3b82f6' : 'rgba(255,255,255,0.1)'),
                    background: insertMode === m.k ? 'rgba(59,130,246,0.25)' : 'transparent',
                    color: insertMode === m.k ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                    fontSize: '11px', fontWeight: 700,
                    cursor: (m.k !== 'end' && activeSectionIdx === null) ? 'not-allowed' : 'pointer',
                    opacity: (m.k !== 'end' && activeSectionIdx === null) ? 0.4 : 1,
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 탭 내용: 씬 */}
        {tab === 'scene' && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: '0 0 8px' }}>
              💡 상세페이지에 자주 쓰이는 분위기만 골라뒀어요. 원하는 씬을 누르면 바로 추천 이미지가 뜹니다.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px', marginBottom: '12px' }}>
              {SCENES.map(s => (
                <button key={s.key} onClick={() => handleSceneClick(s.key)}
                  style={{
                    padding: '10px 6px', borderRadius: '10px',
                    border: '1.5px solid ' + (selectedScene === s.key ? '#c8a96e' : 'rgba(255,255,255,0.08)'),
                    background: selectedScene === s.key ? 'rgba(200,169,110,0.12)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{s.emoji}</div>
                  <p style={{ color: selectedScene === s.key ? '#c8a96e' : 'white', fontSize: '11px', fontWeight: 700, margin: 0 }}>{s.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', margin: '2px 0 0' }}>{s.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 탭 내용: 검색 */}
        {tab === 'search' && (
          <>
            <div style={{ background: 'rgba(239,158,11,0.08)', border: '1px solid rgba(239,158,11,0.25)', borderRadius: '8px', padding: '6px 10px', marginBottom: '10px' }}>
              <p style={{ color: '#fbbf24', fontSize: '11px', margin: 0 }}>
                ⚠️ "굴비", "보리굴비" 등 한국 특산물은 결과가 없을 수 있어요. 그럴 땐 <strong>AI로 만들기</strong> 탭을 써보세요.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runSearch(query) }}
                placeholder="예: seafood, korean food, gift, cooking..."
                style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1.5px solid rgba(147,197,253,0.3)', background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: '13px', outline: 'none' }} />
              <button onClick={() => runSearch(query)}
                style={{ padding: '9px 14px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                {loading ? '⏳' : '검색'}
              </button>
            </div>
          </>
        )}

        {/* 탭 내용: AI 생성 */}
        {tab === 'ai' && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: '0 0 8px' }}>
              💡 원하는 분위기를 한글로 묘사하세요. 상품 본체보다는 <strong>분위기·씬</strong>에 좋아요.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') generateAi() }}
                placeholder="예: 한국 전통 상차림, 따뜻한 조명, 프리미엄"
                style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1.5px solid rgba(200,169,110,0.3)', background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: '13px', outline: 'none' }} />
              <button onClick={generateAi} disabled={loading || !aiPrompt.trim()}
                style={{
                  padding: '9px 14px', borderRadius: '8px',
                  background: loading ? 'rgba(200,169,110,0.2)' : 'linear-gradient(135deg,#c8a96e,#e8c878)',
                  color: loading ? 'rgba(255,255,255,0.3)' : '#111',
                  border: 'none', fontSize: '13px', fontWeight: 800,
                  cursor: loading || !aiPrompt.trim() ? 'not-allowed' : 'pointer', flexShrink: 0,
                }}>
                {loading ? '⏳ 생성 중' : '✨ 생성'}
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '0 0 10px' }}>
              * OpenAI 설정에 API 키가 등록되어 있어야 합니다 (설정 페이지).
            </p>

            {/* AI 결과 표시 */}
            {aiResult && (
              <div onClick={() => handleImageClick(aiResult)}
                style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '2px solid #c8a96e', marginBottom: '8px' }}>
                <img src={aiResult} alt="AI 생성" style={{ width: '100%', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)' }}>
                  <span style={{ color: 'white', background: '#c8a96e', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, opacity: 0.9 }}>
                    클릭해서 삽입
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <p style={{ color: '#f87171', fontSize: '12px', margin: '8px 0', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
            {error}
          </p>
        )}

        {/* 검색/씬 결과 그리드 (AI 탭은 자체 결과 표시) */}
        {tab !== 'ai' && results.length > 0 && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: '8px 0' }}>
              💡 이미지를 클릭하면 {mode === 'preview' ? '선택한 위치에' : '이 블록에'} 자동 보정되어 삽입됩니다
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
              {results.map((img: any) => (
                <div key={img.id} onClick={() => handleImageClick(img.urls.regular)}
                  style={{ borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', aspectRatio: '1', border: '2px solid transparent', transition: 'border 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}>
                  <img src={img.urls.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </>
        )}

        {tab !== 'ai' && results.length === 0 && !loading && tab === 'search' && (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
            검색어를 입력하고 엔터를 누르세요
          </div>
        )}
      </div>
    </div>
  )
}
