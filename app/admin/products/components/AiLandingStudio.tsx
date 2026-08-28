'use client'

// ─────────────────────────────────────────────────────────────
// AiLandingStudio — 새 모던 상세페이지 에디터 (온종일팜 STUDIO)
//
// ★ 옛 AiLandingEditor.tsx 는 그대로 백업으로 남겨둠. 이 컴포넌트는
//   공용 훅 useLandingEditor 로 "생성·저장·연결"을 100% 동일하게 재사용한다.
//   → 앞뒤 프로세스(상품→생성→미리보기→저장→상품 반영)가 안 끊긴다.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react'
import { renderLanding, type PresetKey, type TemplateKey } from '@/lib/landing-templates'
import { SHOWCASE_STYLES, renderShowcase, inferCategory, type ShowcaseStyle, type ShowcaseCategory, type ShowcaseLayout } from '@/lib/showcase-templates'
import LandingBasicInfoFields from '@/app/components/LandingBasicInfoFields'
import LandingFactFields from '@/app/components/LandingFactFields'
import { useLandingEditor, type Product } from './useLandingEditor'
import { useStudioImageTools } from './useStudioImageTools'

type Props = {
  show: boolean
  onClose: () => void
  products: Product[]
  onDone: () => void
  initialProduct?: Product | null
}

// 옛 landing-templates 중 쇼케이스와 겹치지 않는 것만(팝·클린·매거진·럭셔리·비즈니스·감성).
// premium/modern/traditional은 쇼케이스 무드와 중복이라 제외.
const LEGACY_STYLES: { tpl: TemplateKey; name: string; paper: string; ink: string; accent: string }[] = [
  { tpl: 'pop', name: '팝 · 컬러풀', paper: '#fff5fa', ink: '#2a1a24', accent: '#ff5fa2' },
  { tpl: 'clean', name: '클린 · 화이트', paper: '#fafafa', ink: '#1a1a1a', accent: '#22c55e' },
  { tpl: 'magazine', name: '매거진', paper: '#111111', ink: '#f0f0f0', accent: '#e8e8e8' },
  { tpl: 'luxury', name: '럭셔리 골드', paper: '#0a0a0a', ink: '#eadfc8', accent: '#c8a45c' },
  { tpl: 'business', name: '비즈니스', paper: '#f4f7fb', ink: '#16233a', accent: '#1a6fff' },
  { tpl: 'emotional', name: '감성 · 스토리', paper: '#f2ede4', ink: '#2a2018', accent: '#2c4842' },
]
// 카테고리 → 옛 템플릿용 배색(preset) 매핑
const CAT_PRESET: Record<ShowcaseCategory, PresetKey> = {
  seafood: 'blue', health: 'gold', produce: 'white', meat: 'red', processed: 'dark',
}
// 옛 템플릿 → 가장 가까운 쇼케이스 무드. 이미지 집중형일 때 이 무드로 renderShowcase(visual).
// (옛 템플릿은 구조상 글-이미지 반복이라 이미지 집중형이 안 됨 → 무드만 살려 쇼케이스로 렌더)
const LEGACY_TO_MOOD: Record<string, string> = {
  pop: 'market', clean: 'clean', magazine: 'modern', luxury: 'modern', business: 'clean', emotional: 'story',
}

// 폰트 목록 (한글/영문). 값은 실제 font-family, 라벨은 표시용.
const FONTS = [
  { css: `'Pretendard',sans-serif`, label: 'Pretendard', kind: 'ko' },
  { css: `'Nanum Myeongjo',serif`, label: '나눔명조', kind: 'ko' },
  { css: `'Gowun Batang',serif`, label: '고운바탕', kind: 'ko' },
  { css: `'Black Han Sans',sans-serif`, label: '블랙한산스', kind: 'ko' },
  { css: `'Jua',sans-serif`, label: '주아', kind: 'ko' },
  { css: `'Playfair Display',serif`, label: 'Playfair', kind: 'en' },
  { css: `'Montserrat',sans-serif`, label: 'Montserrat', kind: 'en' },
]

type StockImg = { url: string; thumb: string; source: string }

export default function AiLandingStudio({ show, onClose, products, onDone, initialProduct }: Props) {
  const s = useLandingEditor({ show, products, onDone, initialProduct })

  // 로컬 UI 상태 (에디터 셸 전용 — 저장 로직과 무관)
  const [panelTab, setPanelTab] = useState<'concept' | 'text' | 'bg'>('concept')
  const [previewMode, setPreviewMode] = useState<'mobile' | 'pc'>('mobile')
  const [autoBgLoading, setAutoBgLoading] = useState(false)
  const [styleId, setStyleId] = useState<string>('')   // 선택된 쇼케이스 스타일
  const [dragOver, setDragOver] = useState(false)      // 사진 드래그앤드롭 하이라이트
  const [layoutMode, setLayoutMode] = useState<ShowcaseLayout>('balanced') // 혼합형/이미지집중형
  const [fontCss, setFontCss] = useState('')
  const [headingWeight, setHeadingWeight] = useState(800)
  const [stockQuery, setStockQuery] = useState('')
  const [stockSource, setStockSource] = useState<'' | 'pexels' | 'pixabay'>('')
  const [stockResults, setStockResults] = useState<StockImg[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  const [enhanceLoading, setEnhanceLoading] = useState(false)
  const [enhancedUrl, setEnhancedUrl] = useState('')
  const [toolMsg, setToolMsg] = useState('')

  // 생성 완료 시 카테고리 추론 → 그 카테고리 기본 스타일 자동 선택(한 번만)
  useEffect(() => {
    if (s.aiStep === 3 && s.aiLandingData && !styleId) {
      const cat = inferCategory({ productGroup: s.productGroup, freshType: s.freshType, productName: s.aiMeta.name || s.selectedProduct?.name })
      setStyleId(`${cat}.premium`)
    }
    if (s.aiStep !== 3 && styleId) setStyleId('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.aiStep, s.aiLandingData])

  // 미리보기 렌더: 스타일 선택에 따라. styleId나 생성데이터 바뀌면 재렌더.
  // legacy.* = 옛 landing-templates(팝 등), 그 외 = 쇼케이스. 없으면 원본 HTML.
  useEffect(() => {
    const el = document.getElementById('landing-preview'); if (!el) return
    if (s.aiLandingData && styleId) {
      if (styleId.startsWith('legacy.')) {
        const tpl = styleId.slice(7) as TemplateKey
        const cat = inferCategory({ productGroup: s.productGroup, freshType: s.freshType, productName: s.aiMeta.name || s.selectedProduct?.name })
        // 이미지 집중형: 옛 템플릿은 글-이미지 반복 구조라 진짜 이미지집중이 안 됨.
        // → 옛 템플릿 무드를 쇼케이스로 매핑해 renderShowcase(visual)로 렌더(진짜 이미지 위주).
        if (layoutMode === 'visual') {
          const mood = LEGACY_TO_MOOD[tpl] || 'premium'
          el.innerHTML = renderShowcase(s.aiLandingData, `${cat}.${mood}`, 'visual')
        } else {
          el.innerHTML = renderLanding(s.aiLandingData, CAT_PRESET[cat] || 'gold', tpl, 'balanced')
        }
      } else {
        el.innerHTML = renderShowcase(s.aiLandingData, styleId, layoutMode)
      }
    } else if (s.aiLandingHtml) {
      el.innerHTML = s.aiLandingHtml
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.aiLandingData, styleId, s.aiLandingHtml, s.aiStep, s.aiTab, layoutMode])

  // 미리보기 이미지에 호버/탭 → 🔄교체 / ✨AI채우기 / ✕삭제 툴바 부착.
  useStudioImageTools('landing-preview', s.aiStep === 3 || !!s.aiLandingHtml,
    `${styleId}|${layoutMode}|${s.aiLandingHtml.slice(0, 30)}`, (img) => { void aiFillImage(img) })

  // 폰트 오버라이드를 미리보기 안에 <style>로 주입(저장 HTML에 함께 남아 상품페이지에도 적용)
  const applyFontOverride = (css: string, weight: number) => {
    const el = document.getElementById('landing-preview'); if (!el) return
    let st = el.querySelector('#st-font-ov') as HTMLStyleElement | null
    if (!st) { st = document.createElement('style'); st.id = 'st-font-ov'; el.appendChild(st) }
    const fam = css ? `#landing-preview,#landing-preview *{font-family:${css} !important}` : ''
    st.textContent = `${fam}\n#landing-preview h1,#landing-preview h2,#landing-preview h3{font-weight:${weight} !important;word-break:keep-all}`
  }

  // 상품 특정 영문 힌트(고정 카테고리 대신 실제 상품을 반영)
  const productHint = () => {
    const nm = (s.aiMeta.name || s.selectedProduct?.name || '').toLowerCase()
    const map: [RegExp, string][] = [
      [/박대/, 'Korean half-dried bakdae flatfish (tonguefish) fillet'],
      [/굴비|조기/, 'Korean dried yellow croaker (gulbi)'],
      [/고등어/, 'Korean mackerel fillet'], [/갈치/, 'Korean cutlassfish'],
      [/새우/, 'fresh shrimp'], [/전복/, 'fresh abalone'], [/게|대게|꽃게/, 'fresh crab'],
      [/오징어|낙지/, 'fresh squid'], [/굴/, 'fresh oysters'], [/멸치/, 'dried anchovies'],
      [/한우|소고기/, 'premium Korean hanwoo beef'], [/삼겹|돼지/, 'Korean pork belly'],
      [/닭|계육/, 'Korean chicken'], [/사과/, 'fresh apples'], [/배/, 'fresh Korean pears'],
      [/참외/, 'Korean chamoe melon'], [/딸기/, 'fresh strawberries'], [/감귤|귤/, 'Korean tangerines'],
      [/쌀/, 'Korean rice'], [/홍삼|인삼/, 'Korean red ginseng'], [/젓갈/, 'Korean salted seafood jeotgal'],
      [/김치/, 'Korean kimchi'], [/장아찌|절임/, 'Korean pickled side dish'],
    ]
    for (const [re, en] of map) if (re.test(nm)) return en
    return s.aiMeta.name || s.selectedProduct?.name || 'Korean food'
  }
  // 상품·주제를 반영한 시네마틱 프롬프트 자동 생성
  const aiArtPrompt = () => {
    const cat = inferCategory({ productGroup: s.productGroup, freshType: s.freshType, productName: s.aiMeta.name || s.selectedProduct?.name })
    const subject = productHint()
    const scene = ({
      seafood: 'on rustic wet dark stone with soft steam, moody deep shadows, dramatic side light',
      health: 'on dark wood with dried herbs, warm golden light, elegant premium mood',
      produce: 'on natural wooden table with morning light, fresh and bright, natural styling',
      meat: 'on dark slate with glowing embers, rich red warm tones, dramatic',
      processed: 'in ceramic bowls on dark table, warm moody light, traditional Korean',
    } as const)[cat]
    return `cinematic professional food photograph of ${subject}, ${scene}, high detail, appetizing, no text, no letters, no watermark`
  }
  const fetchAiImage = async (): Promise<string | null> => {
    const r = await fetch('/api/landing-images', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'background', prompt: aiArtPrompt(), aspectRatio: '3:4' }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || !d.url) { setToolMsg(d.error || 'AI 이미지 생성에 실패했어요. (Replicate 토큰 확인)'); return null }
    return d.url
  }

  // ✨ 미리보기 개별 이미지의 "AI 채우기" — 그 이미지를 AI 생성 컷으로 교체. 토큰 없으면 안내만.
  const aiFillImage = async (img: HTMLImageElement) => {
    img.style.opacity = '0.35'; setToolMsg('✨ AI가 이미지를 만드는 중… (약 5초)')
    const url = await fetchAiImage()
    if (url) { img.src = url; img.removeAttribute('srcset'); setToolMsg('✨ AI 이미지로 교체했어요.') }
    img.style.opacity = ''
  }

  // ✨ AI 화보 만들기(배경 탭 버튼) — 미리보기에 새 컷 추가.
  const [artLoading, setArtLoading] = useState(false)
  const makeAiArt = async () => {
    setArtLoading(true); setToolMsg('AI가 화보 배경을 만드는 중… (약 5초)')
    try {
      const url = await fetchAiImage()
      if (url) { insertImageToPreview(url); setToolMsg('✨ AI 화보를 미리보기에 추가했어요.') }
    } catch { setToolMsg('AI 화보 생성 중 오류가 발생했어요.') }
    finally { setArtLoading(false) }
  }

  const searchStock = async () => {
    if (!stockQuery.trim()) return
    setStockLoading(true); setToolMsg('')
    try {
      const r = await fetch('/api/landing-images', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: stockQuery.trim(), source: stockSource || undefined, orientation: 'portrait', perPage: 12 }),
      })
      const d = await r.json()
      if (!r.ok) { setToolMsg(d.error || '검색 실패'); setStockResults([]) }
      else setStockResults((d.images || []).map((x: any) => ({ url: x.url, thumb: x.thumb, source: x.source })))
    } catch { setToolMsg('검색 중 오류가 발생했어요.') }
    finally { setStockLoading(false) }
  }

  const insertImageToPreview = (url: string) => {
    const el = document.getElementById('landing-preview'); if (!el) return
    el.insertAdjacentHTML('beforeend', `<div style="width:100%;overflow:hidden"><img src="${url}" style="width:100%;display:block"/></div>`)
    setToolMsg('✅ 미리보기 맨 아래에 추가했어요.')
  }

  // 로컬 파일을 미리보기에 삽입(중간 이미지 추가). 여러 장을 순서대로. 저장 시 innerHTML로 함께 저장.
  const insertUploadedImages = (files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imgs.length === 0) return
    // 순서 보장: 하나씩 순차로 읽어 추가
    let i = 0
    const next = () => {
      if (i >= imgs.length) { setToolMsg(`✅ 사진 ${imgs.length}장을 추가했어요.`); return }
      const reader = new FileReader()
      reader.onload = () => { insertImageToPreview(reader.result as string); i++; next() }
      reader.readAsDataURL(imgs[i])
    }
    next()
  }

  // ★ 배경 자동 채우기: 생성 직후 Gemini 카피 기반으로 히어로/주요 섹션 배경을
  //   Pexels/Pixabay/Flux에서 자동 조달해 미리보기에 깔아준다(사용자가 검색 안 해도 이쁘게).
  const autoFillBackground = async () => {
    const el = document.getElementById('landing-preview'); if (!el) return
    setAutoBgLoading(true)
    try {
      // 상품명·카테고리 기반 검색어(한글→영문 힌트). Gemini 자동선택 대신 간단·안전한 규칙.
      const name = (s.aiMeta.name || s.selectedProduct?.name || '').toLowerCase()
      const q = /굴비|박대|고등어|생선|도미|조기/.test(name) ? 'korean grilled fish rustic dark'
        : /게장|게|새우|전복|조개|해산물|수산/.test(name) ? 'fresh seafood dark moody'
        : /채소|과일|농산|쌀/.test(name) ? 'fresh farm vegetables wooden'
        : 'korean food premium dark background'
      const r = await fetch('/api/landing-images', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: q, orientation: 'portrait', perPage: 6 }),
      })
      const d = await r.json()
      const imgs: { url: string }[] = d.images || []
      if (imgs.length === 0) { setToolMsg('배경을 찾지 못했어요. 배경 탭에서 직접 검색해보세요.'); return }
      // 히어로(첫 섹션)에 배경 이미지가 없으면 은은하게 깔아준다
      const firstSection = el.querySelector('section, div[data-landing] > *') as HTMLElement | null
      const bg = imgs[0].url
      if (firstSection) {
        firstSection.style.backgroundImage = `linear-gradient(rgba(20,16,12,.55),rgba(20,16,12,.75)), url('${bg}')`
        firstSection.style.backgroundSize = 'cover'
        firstSection.style.backgroundPosition = 'center'
        firstSection.style.color = '#fff'
      }
      setToolMsg('✨ AI가 어울리는 배경을 자동으로 깔았어요.')
    } catch { setToolMsg('배경 자동 채우기에 실패했어요.') }
    finally { setAutoBgLoading(false) }
  }

  const enhancePhoto = async () => {
    const url = s.selectedProduct?.image_url
    if (!url) { setToolMsg('공개 URL이 있는 상품 이미지에만 보정할 수 있어요.'); return }
    setEnhanceLoading(true); setToolMsg('')
    try {
      const r = await fetch('/api/landing-images', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enhance', imageUrl: url, upscale: true, removeBg: false }),
      })
      const d = await r.json()
      if (!r.ok) setToolMsg(d.error || '보정 실패')
      else { setEnhancedUrl(d.url); setToolMsg(d.steps?.includes('upscale') ? '✅ 고화질로 보정했어요.' : '이미 충분히 고화질이라 그대로 사용해요.') }
    } catch { setToolMsg('보정 중 오류가 발생했어요.') }
    finally { setEnhanceLoading(false) }
  }

  if (!show) return null
  const theme = s.aiDark ? 'dark' : 'light'

  return (
    <div className="st-root" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* 상단바 */}
      <div className="st-top">
        <div className="st-brand"><span className="st-logo">🌿</span><div>온종일팜<small>STUDIO</small></div></div>
        <div className="st-crumb"><span className="st-dot" />{s.selectedProduct?.name || s.htmlProduct?.name || s.aiMeta.name || '새 상세페이지'}</div>
        <div className="st-modeseg">
          {([['ai', '✨ AI 만들기'], ['manual', '✏️ 직접'], ['html', '</> 코드']] as const).map(([k, label]) => (
            <button key={k} className={s.aiTab === k ? 'on' : ''} onClick={() => s.setAiTab(k)}>{label}</button>
          ))}
        </div>
        <div className="st-right">
          <button className="st-theme" onClick={() => s.setAiDark(v => !v)} title="다크/라이트">{s.aiDark ? '☀️' : '🌙'}</button>
          <button className="st-btn ghost" onClick={onClose}>닫기</button>
          {s.aiTab === 'ai' && s.aiStep === 3 && (
            <button className="st-btn primary" onClick={s.handleAiRegister} disabled={s.aiSaving}>{s.aiSaving ? '저장 중…' : '💾 저장하기'}</button>
          )}
          {s.aiTab === 'manual' && (
            <button className="st-btn primary" onClick={s.handleManualRegister} disabled={s.aiLoading}>{s.aiLoading ? '저장 중…' : '💾 저장하기'}</button>
          )}
          {s.aiTab === 'html' && (
            <button className="st-btn primary" onClick={s.handleHtmlRegister} disabled={s.aiLoading}>{s.aiLoading ? '저장 중…' : '💾 저장하기'}</button>
          )}
        </div>
      </div>

      {/* 상품 지정 진입: 수정 / 새로 만들기 선택 */}
      {s.aiChoice ? (
        <div className="st-choice">
          <h2>📦 {initialProduct?.name}</h2>
          <p>이 상품의 상세페이지를 어떻게 할까요?</p>
          <div className="st-choice-cards">
            <button onClick={s.startEditExisting}><b>기존 수정</b><span>지금 상세페이지를 불러와 글자만 고쳐요</span></button>
            <button onClick={s.startMakeNew}><b>새로 만들기</b><span>사진으로 처음부터 새로 제작해요</span></button>
          </div>
        </div>
      ) : s.aiTab === 'ai' ? (
        <div className="st-body">
          {/* 좌측 스텝 */}
          <nav className="st-rail">
            {[[1, '상품·사진'], [2, '정보'], [3, '컨셉·완성']].map(([n, lb]) => (
              <div key={n as number} className={'st-step' + (s.aiStep === n ? ' on' : s.aiStep > (n as number) ? ' done' : '')} onClick={() => (n as number) < s.aiStep && s.setAiStep(n as 1 | 2 | 3)}>
                <span className="st-stepnum">{s.aiStep > (n as number) ? '✓' : (n as number)}</span>
                <span className="st-steplb">{lb}</span>
              </div>
            ))}
          </nav>

          {/* 중앙 캔버스 */}
          <div className="st-canvas">
            {s.aiStep < 3 ? (
              <div className="st-hint">
                <div className="st-hint-ic">🖼️</div>
                <p>{s.aiStep === 1 ? '상품과 사진을 준비하면' : '정보를 입력하면'}<br/>여기 실시간 미리보기가 나타나요</p>
              </div>
            ) : (
              <>
                {/* 상단 미리보기 툴바: PC/모바일 토글 + 안내 */}
                <div className="st-preview-bar">
                  <div className="st-canvas-tag"><span className="st-live" />글자를 눌러 바로 수정 · 사진을 눌러 교체</div>
                  <div className="st-viewseg">
                    <button className={previewMode === 'mobile' ? 'on' : ''} onClick={() => setPreviewMode('mobile')}>📱 모바일</button>
                    <button className={previewMode === 'pc' ? 'on' : ''} onClick={() => setPreviewMode('pc')}>🖥️ PC</button>
                  </div>
                </div>
                {/* 미리보기 전체가 드롭존 — 사진을 끌어다 놓으면 여러 장 한 번에 추가 */}
                <div className={'st-stage ' + previewMode + (dragOver ? ' dragover' : '')}
                  onDragOver={e => { e.preventDefault(); if (!dragOver) setDragOver(true) }}
                  onDragLeave={e => { if (e.currentTarget === e.target) setDragOver(false) }}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) insertUploadedImages(e.dataTransfer.files) }}>
                  <div className={'st-device ' + previewMode}>
                    {previewMode === 'mobile' && <div className="st-notch" />}
                    <div className="st-screen">
                      <div id="landing-preview" contentEditable suppressContentEditableWarning
                        style={{ minHeight: '100%', outline: 'none' }} />
                    </div>
                  </div>
                  {dragOver && <div className="st-dropmsg">📥 여기에 놓으면 사진이 추가돼요</div>}
                </div>
                {/* 중간 이미지 추가 바 — 여러 장 선택 + 드래그 안내 */}
                <div className="st-addimg-bar">
                  <label className="st-addimg-btn">
                    <input type="file" accept="image/*" multiple hidden onChange={e => e.target.files && insertUploadedImages(e.target.files)} />
                    <span className="st-plus">＋</span> 사진 추가 <span className="st-addimg-hint">(여러 장 선택 · 끌어다 놓기 가능)</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* 우측 패널 */}
          <aside className="st-panel">
            {s.aiStep === 1 && (
              <>
                <div className="st-phead"><h3>📦 상품 · 사진</h3><p>상품을 고르고 대표 사진을 올려요.</p></div>
                <div className="st-pbody">
                  <div className="st-lab">상품 선택</div>
                  <select className="st-select" value={s.selectedProduct?.id || ''} onChange={e => { const p = products.find(x => x.id === e.target.value); if (p) s.selectProductForAI(p) }}>
                    <option value="">-- 상품 선택 --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>

                  <div className="st-lab" style={{ marginTop: 18 }}>대표 이미지</div>
                  <label className="st-drop"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) s.handleImageUpload(f) }}>
                    <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && s.handleImageUpload(e.target.files[0])} />
                    {enhancedUrl || s.aiBgRemovedPreview || s.aiImagePreview
                      ? <img src={enhancedUrl || s.aiBgRemovedPreview || s.aiImagePreview} alt="" />
                      : <span>{s.aiBgLoading ? '배경 처리 중…' : '＋ 클릭 또는 사진을 끌어다 놓기'}</span>}
                  </label>
                  {s.selectedProduct?.image_url && (
                    <button className="st-add" style={{ marginTop: 8 }} disabled={enhanceLoading} onClick={enhancePhoto}>
                      {enhanceLoading ? '보정 중…' : '✨ 사진 고화질 보정'}
                    </button>
                  )}
                  {toolMsg && <div className="st-toolmsg">{toolMsg}</div>}

                  <div className="st-lab" style={{ marginTop: 18 }}>추가 사진 <span style={{ color: 'var(--muted2)', fontWeight: 700 }}>· 여러 장 한 번에</span></div>
                  <label className="st-add"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.length) s.addExtraImages(e.dataTransfer.files) }}>
                    <input type="file" accept="image/*" multiple hidden onChange={e => e.target.files && s.addExtraImages(e.target.files)} />
                    ＋ 여러 장 선택 · 끌어다 놓기
                  </label>
                  <div className="st-thumbs">
                    {s.aiExtraImages.map(x => (
                      <div key={x.id} className="st-thumb"><img src={x.preview} alt="" /><button onClick={() => s.removeExtraImage(x.id)}>×</button></div>
                    ))}
                  </div>

                  {s.aiError && <div className="st-err">{s.aiError}</div>}
                  <button className="st-next" disabled={!s.selectedProduct && !s.aiImage} onClick={() => s.setAiStep(2)}>다음 · 정보 입력 →</button>
                </div>
              </>
            )}

            {s.aiStep === 2 && (
              <>
                <div className="st-phead"><h3>📝 상품 정보</h3><p>AI가 이 정보로 문구를 씁니다. 정확할수록 좋아요.</p></div>
                <div className="st-pbody">
                  <LandingFactFields dark={s.aiDark} shipCutoff={s.shipCutoff} setShipCutoff={s.setShipCutoff} hasHaccp={s.hasHaccp} setHasHaccp={s.setHasHaccp} haccpNo={s.haccpNo} setHaccpNo={s.setHaccpNo} />
                  <div style={{ height: 14 }} />
                  <LandingBasicInfoFields group={s.productGroup} setGroup={s.setProductGroup} freshType={s.freshType} setFreshType={s.setFreshType} value={s.basicInfo} onChange={s.setBasicInfo} dark={s.aiDark} isAutoFilling={s.basicInfoLoading} onAutoFill={s.autoFillBasicInfo} />

                  {/* 레이아웃 방향 선택 (생성 전) */}
                  <div className="st-lab" style={{ marginTop: 22 }}>상세페이지 방향</div>
                  <div className="st-layoutsel">
                    <button className={'st-layoutcard' + (layoutMode === 'balanced' ? ' on' : '')} onClick={() => setLayoutMode('balanced')}>
                      <span className="st-layicon">📝🖼️</span>
                      <span className="st-laynm">이미지 + 글 혼합형</span>
                      <span className="st-laydesc">설명과 사진 균형. 정보가 중요한 상품에.</span>
                    </button>
                    <button className={'st-layoutcard' + (layoutMode === 'visual' ? ' on' : '')} onClick={() => setLayoutMode('visual')}>
                      <span className="st-layicon">🖼️✨</span>
                      <span className="st-laynm">이미지 집중형</span>
                      <span className="st-laydesc">큰 사진 위주. 비주얼로 파는 상품에.</span>
                    </button>
                  </div>

                  {s.aiError && <div className="st-err">{s.aiError}</div>}
                  <div className="st-row2">
                    <button className="st-ghost" onClick={() => s.setAiStep(1)}>← 이전</button>
                    <button className="st-next" disabled={s.aiLoading} onClick={s.handleGenerateLanding}>{s.aiLoading ? (s.aiLoadingMsg || '생성 중…') : '✨ AI 상세페이지 생성'}</button>
                  </div>
                </div>
              </>
            )}

            {s.aiStep === 3 && (
              <>
                <div className="st-phead">
                  <div className="st-ptabs">
                    {([['concept', '🎨 컨셉'], ['text', '✏️ 텍스트'], ['bg', '🖼️ 배경']] as const).map(([k, lb]) => (
                      <button key={k} className={panelTab === k ? 'on' : ''} onClick={() => setPanelTab(k)}>{lb}</button>
                    ))}
                  </div>
                </div>
                <div className="st-pbody">
                  {/* 컨셉 탭 — 통합 목록(쇼케이스 6 + 옛 템플릿 6). 상품 카테고리 색 자동. */}
                  {panelTab === 'concept' && (() => {
                    const cat = inferCategory({ productGroup: s.productGroup, freshType: s.freshType, productName: s.aiMeta.name || s.selectedProduct?.name })
                    const showcaseList = SHOWCASE_STYLES.filter(x => x.category === cat)
                    const cards = [
                      ...showcaseList.map(st => ({ id: st.id, name: st.name, paper: st.paper, ink: st.ink, accent: st.accent })),
                      ...LEGACY_STYLES.map(l => ({ id: 'legacy.' + l.tpl, name: l.name, paper: l.paper, ink: l.ink, accent: l.accent })),
                    ]
                    return (
                      <>
                        <div className="st-lab">✨ 컨셉 선택 <span style={{ color: 'var(--muted2)', fontWeight: 700 }}>· {cards.length}가지</span></div>
                        <p className="st-tiny" style={{ marginTop: 0, marginBottom: 14 }}>클릭하면 미리보기가 바로 바뀌어요. 같은 상품도 완전 다른 느낌으로.</p>
                        <div className="st-stylegrid">
                          {cards.map(st => (
                            <button key={st.id} className={'st-stylecard' + (styleId === st.id ? ' on' : '')} onClick={() => setStyleId(st.id)}
                              style={{ background: st.paper }}>
                              <span className="st-styleswatch" style={{ background: st.accent }} />
                              <span className="st-stylenm" style={{ color: st.ink }}>{st.name}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )
                  })()}

                  {/* 텍스트/폰트 탭 */}
                  {panelTab === 'text' && (
                    <>
                      <div className="st-lab">폰트 <span style={{ color: 'var(--muted2)', fontWeight: 700 }}>· 미리보기 전체 적용</span></div>
                      <div className="st-fonts">
                        <button className={'st-fontitem' + (fontCss === '' ? ' on' : '')} onClick={() => { setFontCss(''); applyFontOverride('', headingWeight) }}>
                          <span>기본(컨셉 폰트)</span>
                        </button>
                        {FONTS.map(f => (
                          <button key={f.label} className={'st-fontitem' + (fontCss === f.css ? ' on' : '')} style={{ fontFamily: f.css }} onClick={() => { setFontCss(f.css); applyFontOverride(f.css, headingWeight) }}>
                            <span>{f.label}</span><b>{f.kind === 'ko' ? '가나다 Ag' : 'Abg 123'}</b>
                          </button>
                        ))}
                      </div>
                      <div className="st-lab" style={{ marginTop: 18 }}>제목 굵기 <span style={{ color: 'var(--muted2)', fontWeight: 700 }}>· {headingWeight}</span></div>
                      <input type="range" min={300} max={900} step={100} value={headingWeight} className="st-slider"
                        onChange={e => { const w = Number(e.target.value); setHeadingWeight(w); applyFontOverride(fontCss, w) }} />
                      <div className="st-weightchips">
                        {[300, 400, 600, 800, 900].map(w => (
                          <button key={w} className={'st-wchip' + (headingWeight === w ? ' on' : '')} onClick={() => { setHeadingWeight(w); applyFontOverride(fontCss, w) }}>{w}</button>
                        ))}
                      </div>
                      <p className="st-tiny">※ 글자 내용은 미리보기에서 직접 눌러 수정해요. 한글·영문 모두 가능.</p>
                    </>
                  )}

                  {/* 배경 탭 */}
                  {panelTab === 'bg' && (
                    <>
                      {/* ✨ AI 화보 만들기 (반자동, Flux) */}
                      <div className="st-artbox">
                        <div className="st-artnm">✨ AI 화보 만들기</div>
                        <div className="st-artdesc">상품에 어울리는 시네마틱 배경컷을 AI가 만들어 추가해요. (이미지 1장당 소량 과금)</div>
                        <button className="st-artbtn" disabled={artLoading} onClick={makeAiArt}>
                          {artLoading ? '만드는 중…' : '✨ 화보 배경 생성'}
                        </button>
                      </div>
                      <div className="st-lab" style={{ marginTop: 20 }}>무료 배경 검색</div>
                      <div className="st-srcseg">
                        {([['', '전체'], ['pexels', 'Pexels'], ['pixabay', 'Pixabay']] as const).map(([k, lb]) => (
                          <button key={k} className={stockSource === k ? 'on' : ''} onClick={() => setStockSource(k)}>{lb}</button>
                        ))}
                      </div>
                      <div className="st-searchrow">
                        <input value={stockQuery} onChange={e => setStockQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchStock()} placeholder="예: 바다 노을, 나무 도마" />
                        <button onClick={searchStock} disabled={stockLoading}>{stockLoading ? '…' : '검색'}</button>
                      </div>
                      <div className="st-stockgrid">
                        {stockResults.map((im, i) => (
                          <button key={i} className="st-stock" onClick={() => insertImageToPreview(im.url)} title={`${im.source} · 클릭해서 추가`}>
                            <img src={im.thumb} alt="" />
                          </button>
                        ))}
                      </div>
                      {stockResults.length === 0 && !stockLoading && <p className="st-tiny">검색어를 넣고 Enter. 클릭하면 미리보기에 추가돼요.</p>}
                    </>
                  )}

                  {toolMsg && <div className="st-toolmsg">{toolMsg}</div>}
                  {s.aiError && <div className="st-err">{s.aiError}</div>}
                  <div className="st-row2" style={{ marginTop: 20 }}>
                    <button className="st-ghost" onClick={() => s.setAiStep(2)}>← 다시 생성</button>
                    <button className="st-next" onClick={s.handleAiRegister} disabled={s.aiSaving}>{s.aiSaving ? '저장 중…' : '💾 저장'}</button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : s.aiTab === 'manual' ? (
        /* 직접 만들기 */
        <div className="st-simple">
          <div className="st-simple-inner">
            <div className="st-lab">상품 선택</div>
            <select className="st-select" value={s.selectedProduct?.id || ''} onChange={e => { const p = products.find(x => x.id === e.target.value); s.setSelectedProduct(p || null) }}>
              <option value="">-- 상품 선택 --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="st-blockbtns">
              <button onClick={() => s.addBlock('text')}>＋ 텍스트</button>
              <button onClick={() => s.addBlock('image')}>＋ 이미지</button>
              <button onClick={() => s.addBlock('video')}>＋ 영상</button>
            </div>
            {s.manualBlocks.map(b => (
              <div key={b.id} className="st-block">
                <div className="st-block-h"><span>{b.type === 'text' ? '✏️ 텍스트' : b.type === 'image' ? '🖼️ 이미지' : '🎬 영상'}</span><button onClick={() => s.removeBlock(b.id)}>삭제</button></div>
                {b.type === 'text' && <textarea className="st-ta" value={b.content} onChange={e => s.updateBlock(b.id, e.target.value)} placeholder="내용을 입력하세요" />}
                {b.type === 'image' && (
                  <label className="st-drop sm">
                    <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && s.uploadManualImage(b.id, e.target.files[0])} />
                    {b.content ? <img src={b.content} alt="" /> : <span>＋ 이미지 선택</span>}
                  </label>
                )}
                {b.type === 'video' && <input className="st-select" value={b.content} onChange={e => s.updateBlock(b.id, e.target.value)} placeholder="유튜브 링크 또는 영상 URL" />}
              </div>
            ))}
            {s.aiError && <div className="st-err">{s.aiError}</div>}
          </div>
        </div>
      ) : (
        /* 코드로 만들기 */
        <div className="st-simple">
          <div className="st-simple-inner wide">
            <div className="st-lab">상품 선택</div>
            <select className="st-select" value={s.htmlProduct?.id || ''} onChange={e => { const p = products.find(x => x.id === e.target.value); s.setHtmlProduct(p || null) }}>
              <option value="">-- 상품 선택 --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="st-lab" style={{ marginTop: 16 }}>HTML 코드</div>
            <textarea className="st-code" value={s.htmlCode} onChange={e => s.setHtmlCode(e.target.value)} placeholder="<div>상세페이지 HTML을 붙여넣으세요</div>" spellCheck={false} />
            <div className="st-lab" style={{ marginTop: 16 }}>미리보기</div>
            <div className="st-codeprev" dangerouslySetInnerHTML={{ __html: s.htmlCode }} />
            {s.aiError && <div className="st-err">{s.aiError}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gowun+Batang:wght@400;700&family=Nanum+Myeongjo:wght@400;700;800&family=Jua&family=Playfair+Display:wght@700&family=Montserrat:wght@700;800&display=swap');
.st-root{position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;
  --bg:#eef0f3;--panel:#fff;--ink:#141719;--muted:#8b9199;--muted2:#b7bcc3;--line:#e7eaee;--line2:#eff1f4;
  --accent:#12b76a;--accent-d:#0e9457;--accent-soft:#e7f8f0;--shadow:0 8px 24px rgba(16,24,40,.08);
  background:var(--bg);color:var(--ink);font-family:'Pretendard',sans-serif}
.st-root[data-theme="dark"]{--bg:#1c2025;--panel:#24292f;--ink:#e8ebee;--muted:#8b939c;--muted2:#5f6870;--line:#31373e;--line2:#2b3138;--accent:#2dd48a;--accent-d:#25b877;--accent-soft:#1e3a30;--shadow:0 8px 24px rgba(0,0,0,.3)}
.st-root *{box-sizing:border-box}
.st-root button{cursor:pointer;border:none;background:none;font:inherit;color:inherit}
.st-top{height:58px;flex:none;display:flex;align-items:center;gap:14px;padding:0 16px;background:var(--panel);border-bottom:1px solid var(--line)}
.st-brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:14px}
.st-logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#34d888);display:flex;align-items:center;justify-content:center;font-size:15px}
.st-brand small{display:block;font-size:9px;color:var(--muted);letter-spacing:.1em}
.st-crumb{display:flex;align-items:center;gap:7px;padding:6px 12px;border-radius:9px;background:var(--bg);font-size:12.5px;font-weight:600;max-width:190px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.st-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);flex:none}
.st-modeseg{display:flex;gap:3px;background:var(--bg);padding:4px;border-radius:10px}
.st-modeseg button{padding:7px 12px;border-radius:7px;font-size:12px;font-weight:700;color:var(--muted)}
.st-modeseg button.on{background:var(--panel);color:var(--accent-d);box-shadow:var(--shadow)}
.st-right{margin-left:auto;display:flex;align-items:center;gap:8px}
.st-theme{width:36px;height:36px;border-radius:9px;font-size:16px}
.st-theme:hover{background:var(--bg)}
.st-btn{padding:9px 15px;border-radius:9px;font-size:13px;font-weight:700}
.st-btn.ghost{border:1px solid var(--line);color:var(--ink)}
.st-btn.ghost:hover{background:var(--bg)}
.st-btn.primary{background:var(--accent);color:#fff;box-shadow:0 6px 16px rgba(18,183,106,.32)}
.st-btn.primary:hover{background:var(--accent-d)}
.st-btn.primary:disabled{opacity:.5}
.st-body{flex:1;display:grid;grid-template-columns:104px 1fr 460px;overflow:hidden}
.st-rail{background:var(--panel);border-right:1px solid var(--line);padding:16px 9px;display:flex;flex-direction:column;gap:8px}
.st-step{display:flex;flex-direction:column;align-items:center;gap:7px;padding:15px 4px;border-radius:14px;color:var(--muted);cursor:default}
.st-step.on{background:var(--accent-soft);color:var(--accent-d)}
.st-step.done{color:var(--accent);cursor:pointer}
.st-stepnum{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;background:var(--bg)}
.st-step.on .st-stepnum{background:var(--accent);color:#fff}
.st-steplb{font-size:12px;font-weight:700}
.st-canvas{position:relative;display:flex;flex-direction:column;overflow:hidden;background:radial-gradient(circle at 50% 0%,rgba(0,0,0,.02),var(--bg) 70%)}
.st-hint{margin:auto;text-align:center;color:var(--muted)}
.st-hint-ic{font-size:44px;margin-bottom:14px;opacity:.5}
.st-hint p{font-size:13px;line-height:1.7}
/* 상단 미리보기 바 */
.st-preview-bar{flex:none;display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--line);background:var(--panel)}
.st-canvas-tag{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:600;color:var(--muted)}
.st-live{width:7px;height:7px;border-radius:50%;background:var(--accent)}
.st-viewseg{display:flex;gap:3px;background:var(--bg);padding:4px;border-radius:9px}
.st-viewseg button{padding:6px 13px;border-radius:7px;font-size:12px;font-weight:700;color:var(--muted)}
.st-viewseg button.on{background:var(--panel);color:var(--accent-d);box-shadow:var(--shadow)}
/* 스테이지(미리보기 영역) — 크게 */
.st-stage{position:relative;flex:1;overflow-y:auto;display:flex;justify-content:center;padding:16px 14px}
.st-device{background:#111;box-shadow:0 20px 50px -12px rgba(0,0,0,.4);position:relative;align-self:flex-start}
.st-device.mobile{width:min(400px,96%);border-radius:36px;padding:10px}
.st-device.pc{width:100%;max-width:680px;border-radius:14px;padding:0;background:#fff;border:1px solid var(--line)}
/* PC 모드: 상세페이지를 넓게(모바일과 확실히 다르게) */
.st-device.pc #landing-preview [data-showcase]{max-width:100% !important}
.st-notch{position:absolute;top:17px;left:50%;transform:translateX(-50%);width:90px;height:21px;background:#111;border-radius:13px;z-index:5}
.st-device.mobile .st-screen{border-radius:28px}
.st-screen{width:100%;overflow:hidden;background:#fff}
.st-screen #landing-preview{min-height:400px}
/* 하단 사진 추가 바 — 크고 잘 보이게 */
.st-addimg-bar{flex:none;padding:12px 18px;border-top:1px solid var(--line);background:var(--panel);display:flex;justify-content:center}
.st-addimg-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 24px;border-radius:11px;border:2px dashed var(--accent);color:var(--accent-d);font-size:14.5px;font-weight:800;cursor:pointer;background:var(--accent-soft);transition:.15s}
.st-addimg-btn:hover{background:var(--accent);color:#fff;border-style:solid}
.st-addimg-btn:hover .st-addimg-hint{color:rgba(255,255,255,.85)}
.st-addimg-btn .st-plus{font-size:18px;line-height:1}
.st-addimg-hint{font-size:12px;font-weight:600;color:var(--muted)}
/* 레이아웃 방향 선택 카드 */
.st-layoutsel{display:flex;flex-direction:column;gap:10px}
.st-layoutcard{display:flex;flex-direction:column;gap:4px;text-align:left;padding:16px 18px;border:2px solid var(--line);border-radius:13px;background:var(--panel);transition:.15s;cursor:pointer}
.st-layoutcard:hover{border-color:var(--muted2)}
.st-layoutcard.on{border-color:var(--accent);background:var(--accent-soft)}
.st-layicon{font-size:22px}
.st-laynm{font-size:16px;font-weight:800;color:var(--ink)}
.st-laydesc{font-size:12.5px;color:var(--muted);line-height:1.5}
/* 드래그앤드롭 하이라이트 */
.st-stage.dragover{outline:3px dashed var(--accent);outline-offset:-8px;background:var(--accent-soft)}
.st-dropmsg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;background:var(--accent);color:#fff;padding:14px 24px;border-radius:12px;font-size:15px;font-weight:800;box-shadow:0 10px 30px rgba(18,183,106,.4);pointer-events:none}
.st-panel{background:var(--panel);border-left:1px solid var(--line);overflow-y:auto;display:flex;flex-direction:column}
.st-phead{padding:22px 22px 16px;border-bottom:1px solid var(--line2)}
.st-phead h3{font-size:19px;font-weight:800}
.st-phead p{font-size:13.5px;color:var(--muted);margin-top:6px;line-height:1.55}
.st-pbody{padding:22px 22px 48px}
.st-lab{font-size:13px;font-weight:800;color:var(--muted);letter-spacing:.02em;margin-bottom:11px}
.st-select{width:100%;border:1.5px solid var(--line);border-radius:11px;padding:14px 15px;font-size:15px;font-weight:600;background:var(--panel);color:var(--ink);outline:none}
.st-select:focus{border-color:var(--accent)}
.st-drop{display:flex;align-items:center;justify-content:center;min-height:150px;border:2px dashed var(--line);border-radius:12px;cursor:pointer;overflow:hidden;color:var(--muted);font-size:13px;font-weight:600;background:var(--bg)}
.st-drop.sm{min-height:80px}
.st-drop:hover{border-color:var(--accent)}
.st-drop img{width:100%;height:100%;object-fit:contain;max-height:220px}
.st-add{display:block;text-align:center;padding:10px;border:1px solid var(--line);border-radius:10px;font-size:12.5px;font-weight:700;color:var(--accent-d);cursor:pointer}
.st-thumbs{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.st-thumb{position:relative;width:56px;height:56px;border-radius:8px;overflow:hidden}
.st-thumb img{width:100%;height:100%;object-fit:cover}
.st-thumb button{position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;font-size:12px;line-height:1}
.st-err{background:#fdecea;color:#c0392b;border:1px solid #f5c6c0;border-radius:10px;padding:10px 12px;font-size:12.5px;font-weight:600;margin-top:14px}
.st-root[data-theme="dark"] .st-err{background:#3a1f1c;color:#ff9b8f;border-color:#5a2f2a}
.st-next{width:100%;margin-top:20px;padding:16px;border-radius:12px;background:var(--accent);color:#fff;font-size:16px;font-weight:800;box-shadow:0 6px 16px rgba(18,183,106,.3)}
.st-next:hover{background:var(--accent-d)}
.st-next:disabled{opacity:.45;box-shadow:none}
.st-ghost{padding:16px 18px;border-radius:12px;border:1.5px solid var(--line);font-size:15px;font-weight:700;color:var(--ink);flex:none}
.st-row2{display:flex;gap:10px;align-items:center;margin-top:18px}
.st-row2 .st-next{margin-top:0;flex:1}
.st-concepts{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.st-concept{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px;border:1.5px solid var(--line);border-radius:11px;text-align:left;transition:.15s}
.st-concept:hover{border-color:var(--muted2)}
.st-concept.on{border-color:var(--accent);background:var(--accent-soft)}
.st-cemoji{font-size:20px}
.st-cnm{font-size:13px;font-weight:800;margin-top:4px}
.st-cds{font-size:10.5px;color:var(--muted)}
.st-palette{display:flex;gap:9px;flex-wrap:wrap}
.st-sw{width:34px;height:34px;border-radius:9px;box-shadow:0 0 0 1px var(--line)}
.st-sw.on{box-shadow:0 0 0 2px var(--accent)}
.st-choice{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px}
.st-choice h2{font-size:24px;font-weight:800}
.st-choice p{color:var(--muted);margin:10px 0 28px}
.st-choice-cards{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}
.st-choice-cards button{width:230px;padding:26px;border-radius:16px;border:1.5px solid var(--line);background:var(--panel);text-align:left;transition:.15s}
.st-choice-cards button:hover{border-color:var(--accent);box-shadow:var(--shadow)}
.st-choice-cards b{display:block;font-size:17px;font-weight:800;margin-bottom:8px}
.st-choice-cards span{font-size:12.5px;color:var(--muted);line-height:1.6}
.st-simple{flex:1;overflow-y:auto;padding:28px}
.st-simple-inner{max-width:520px;margin:0 auto}
.st-simple-inner.wide{max-width:820px}
.st-blockbtns{display:flex;gap:8px;margin:18px 0}
.st-blockbtns button{flex:1;padding:11px;border-radius:10px;border:1px dashed var(--line);font-size:12.5px;font-weight:700;color:var(--accent-d)}
.st-blockbtns button:hover{background:var(--accent-soft)}
.st-block{border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:12px;background:var(--panel)}
.st-block-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12px;font-weight:700}
.st-block-h button{color:#c0392b;font-size:12px}
.st-ta{width:100%;min-height:90px;border:1px solid var(--line);border-radius:10px;padding:11px;font-size:13px;background:var(--bg);color:var(--ink);resize:vertical;outline:none}
.st-code{width:100%;min-height:280px;border:1px solid var(--line);border-radius:12px;padding:14px;font-family:'SF Mono',Menlo,monospace;font-size:12.5px;line-height:1.6;background:var(--bg);color:var(--ink);resize:vertical;outline:none}
.st-codeprev{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff;min-height:120px}
.st-ptabs{display:flex;gap:4px;background:var(--bg);padding:4px;border-radius:10px}
.st-ptabs button{flex:1;padding:11px;border-radius:8px;font-size:14px;font-weight:700;color:var(--muted)}
.st-ptabs button.on{background:var(--panel);color:var(--accent-d);box-shadow:var(--shadow)}
.st-toolmsg{background:var(--accent-soft);color:var(--accent-d);border-radius:9px;padding:9px 11px;font-size:12px;font-weight:600;margin-top:12px}
.st-tiny{font-size:11px;color:var(--muted);margin-top:12px;line-height:1.6}
.st-fonts{display:flex;flex-direction:column;gap:6px}
.st-fontitem{display:flex;align-items:center;justify-content:space-between;padding:11px 13px;border:1.5px solid var(--line);border-radius:10px;font-size:13px;color:var(--ink)}
.st-fontitem b{font-size:15px;color:var(--muted)}
.st-fontitem.on{border-color:var(--accent);background:var(--accent-soft)}
.st-slider{width:100%;-webkit-appearance:none;height:6px;border-radius:4px;background:linear-gradient(90deg,var(--muted2),var(--accent));outline:none}
.st-slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid var(--accent);cursor:pointer}
.st-weightchips{display:flex;gap:6px;margin-top:10px}
.st-wchip{flex:1;padding:7px 0;border-radius:8px;font-size:11.5px;font-weight:700;background:var(--bg);color:var(--muted)}
.st-wchip.on{background:var(--ink);color:#fff}
.st-srcseg{display:flex;gap:4px;background:var(--bg);padding:4px;border-radius:9px;margin-bottom:10px}
.st-srcseg button{flex:1;padding:7px;border-radius:7px;font-size:11.5px;font-weight:700;color:var(--muted)}
.st-srcseg button.on{background:var(--panel);color:var(--accent-d);box-shadow:var(--shadow)}
.st-searchrow{display:flex;gap:8px}
.st-searchrow input{flex:1;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:13px;background:var(--panel);color:var(--ink);outline:none}
.st-searchrow input:focus{border-color:var(--accent)}
.st-searchrow button{padding:0 16px;border-radius:10px;background:var(--accent);color:#fff;font-size:13px;font-weight:700}
.st-artbox{background:linear-gradient(135deg,var(--accent-soft),rgba(59,160,255,.1));border:1.5px solid var(--accent);border-radius:13px;padding:16px}
.st-artnm{font-size:15px;font-weight:800;color:var(--accent-d)}
.st-artdesc{font-size:12.5px;color:var(--muted);line-height:1.55;margin:6px 0 12px}
.st-artbtn{width:100%;padding:13px;border-radius:11px;background:var(--accent);color:#fff;font-size:14.5px;font-weight:800;box-shadow:0 6px 16px rgba(18,183,106,.3)}
.st-artbtn:hover{background:var(--accent-d)}
.st-artbtn:disabled{opacity:.55}
.st-stockgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.st-stock{border-radius:9px;overflow:hidden;aspect-ratio:3/4;border:1px solid var(--line)}
.st-stock img{width:100%;height:100%;object-fit:cover}
.st-stock:hover{outline:2px solid var(--accent)}
.st-stylegrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.st-stylecard{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:20px 16px;border-radius:13px;border:2px solid var(--line);text-align:left;min-height:88px;transition:.15s;overflow:hidden}
.st-stylecard:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
.st-stylecard.on{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.st-styleswatch{position:absolute;top:11px;right:11px;width:16px;height:16px;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.3)}
.st-stylenm{font-size:15px;font-weight:800;letter-spacing:-.01em}
.st-stylecat{font-size:12px;font-weight:600;opacity:.8}
`
