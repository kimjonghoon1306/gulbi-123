'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { renderLanding, type PresetKey, type TemplateKey, type LandingData, TEMPLATES } from '@/lib/landing-templates'
import FloatingToolbar from './FloatingToolbar'

type Product = {
  id: string; name: string; description: string
  origin?: string | null
  category_id: string; wholesale_price: number; member_price: number; retail_price: number
  stock: number; unit: string; image_url: string; is_active: boolean
}

type Props = {
  show: boolean
  onClose: () => void
  products: Product[]
  onDone: () => void
  initialProduct?: Product | null
}

const BG_PRESETS = {
  dark:  { label: '블랙',  bg: '#0d0d0d' },
  warm:  { label: '골드',  bg: 'linear-gradient(160deg,#1a0e08,#3d2010)' },
  white: { label: '화이트', bg: '#f5f5f5' },
}

export default function AiLandingEditor({ show, onClose, products, onDone, initialProduct }: Props) {
  const supabase = createClient()

  const [aiTab, setAiTab] = useState<'ai' | 'manual' | 'html'>('ai')
  const [aiStep, setAiStep] = useState<1 | 2 | 3>(1)
  const [aiChoice, setAiChoice] = useState(false) // 상품 지정 진입 시 수정/새로만들기 선택창
  const [aiDark, setAiDark] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [aiImage, setAiImage] = useState<File | null>(null)
  const [aiImagePreview, setAiImagePreview] = useState('')
  // AI 생성용 추가 사진 (대표 외 여러 장 → 원산지·스토리·레시피·보관 섹션 자동 배치)
  const [aiExtraImages, setAiExtraImages] = useState<{ id: number; file: File; preview: string }[]>([])
  const [aiBgRemovedPreview, setAiBgRemovedPreview] = useState('')
  const [aiBgRemovedBase64, setAiBgRemovedBase64] = useState('')
  const [aiSelectedBg, setAiSelectedBg] = useState('dark')
  const [aiBgLoading, setAiBgLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)   // 생성/재생성 로딩
  const [aiSaving, setAiSaving] = useState(false)     // 등록(저장) 로딩 — 재생성과 분리
  const [aiLoadingMsg, setAiLoadingMsg] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiPersona, setAiPersona] = useState('shohost')
  const [aiMeta, setAiMeta] = useState({ name: '', origin: '', category_id: '', unit: 'kg', wholesale_price: '', member_price: '', retail_price: '', stock: '' })
  const [aiLandingHtml, setAiLandingHtml] = useState('')
  const [aiLandingData, setAiLandingData] = useState<LandingData | null>(null)
  const [aiPresetKey, setAiPresetKey] = useState<PresetKey>('gold' as PresetKey)
  const [aiTemplateKey, setAiTemplateKey] = useState<TemplateKey>('premium')
  const [showBuyerPreview, setShowBuyerPreview] = useState<'mobile' | 'desktop' | false>(false)
  const [manualBlocks, setManualBlocks] = useState<{ id: number; type: 'image' | 'video' | 'text'; content: string; file: File | null }[]>([])
  // HTML 붙여넣기 탭
  const [htmlCode, setHtmlCode] = useState('')
  const [htmlProduct, setHtmlProduct] = useState<Product | null>(null)
  const aiLoadingTimer = useRef<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 상품관리에서 '상세' 버튼으로 특정 상품을 지정해 열 때: 상품 재선택 없이 바로 선택창
  useEffect(() => {
    if (show && initialProduct) {
      selectProductForAI(initialProduct)
      const hasDetail = !!(initialProduct.description && initialProduct.description.trim())
      setAiChoice(hasDetail)
      if (!hasDetail) setAiStep(1)
    } else if (!show) {
      setAiChoice(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, initialProduct])

  const startEditExisting = () => {
    if (!initialProduct?.description) return
    setAiLandingData(null)
    setAiLandingHtml(initialProduct.description)
    setAiChoice(false)
    setAiStep(3)
  }
  const startMakeNew = () => { setAiChoice(false); setAiStep(1) }

  if (!show) return null

  // ── helpers ──────────────────────────────────────────────
  const resizeImg = (file: File): Promise<{ base64: string; mimeType: string }> =>
    new Promise(resolve => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1024; let { width: w, height: h } = img
        if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h * MAX / w); w = MAX } else { w = Math.round(w * MAX / h); h = MAX } }
        const c = document.createElement('canvas'); c.width = w; c.height = h
        c.getContext('2d')!.drawImage(img, 0, 0, w, h)
        const d = c.toDataURL('image/jpeg', 0.85)
        resolve({ base64: d.split(',')[1], mimeType: 'image/jpeg' })
      }
      img.src = url
    })

  const getYoutubeEmbedUrl = (url: string): string => {
    const regexes = [/youtube\.com\/watch\?v=([^&]+)/, /youtu\.be\/([^?]+)/, /youtube\.com\/embed\/([^?]+)/]
    for (const regex of regexes) { const m = url.match(regex); if (m) return 'https://www.youtube.com/embed/' + m[1] }
    return url
  }

  // ── image upload + bg removal ────────────────────────────
  const handleImageUpload = async (file: File) => {
    setAiImage(file); setAiBgLoading(true); setAiError('')
    try {
      const { base64, mimeType } = await resizeImg(file)
      const originalUrl = 'data:' + mimeType + ';base64,' + base64
      setAiImagePreview(originalUrl)
      const res = await fetch('/api/remove-bg', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64, mimeType }) })
      const data = await res.json()
      if (data.error) {
        setAiError('배경제거 실패 — 원본으로 진행해요')
        setAiBgRemovedPreview(originalUrl); setAiBgRemovedBase64(base64)
      } else {
        setAiBgRemovedPreview('data:image/png;base64,' + data.base64); setAiBgRemovedBase64(data.base64)
      }
    } catch { setAiError('배경제거 실패 — 원본으로 진행해요') }
    finally { setAiBgLoading(false) }
  }

  const addExtraImages = async (files: FileList) => {
    for (const f of Array.from(files)) {
      try {
        const { base64, mimeType } = await resizeImg(f)
        setAiExtraImages(prev => [...prev, { id: Date.now() + Math.random(), file: f, preview: 'data:' + mimeType + ';base64,' + base64 }])
      } catch { /* 개별 실패는 건너뜀 */ }
    }
  }
  const removeExtraImage = (id: number) => setAiExtraImages(prev => prev.filter(x => x.id !== id))

  const selectProductForAI = (p: Product) => {
    setSelectedProduct(p)
    setAiMeta({ name: p.name, origin: p.origin || '', category_id: p.category_id || '', unit: p.unit || 'kg', wholesale_price: String(p.wholesale_price || ''), member_price: String(p.member_price || ''), retail_price: String(p.retail_price || ''), stock: String(p.stock || '') })
    if (p.image_url) { setAiImagePreview(p.image_url); setAiBgRemovedPreview(p.image_url) }
    setAiExtraImages([])
  }

  // ── AI generation ────────────────────────────────────────
  const handleGenerateLanding = async () => {
    if (!aiImage && !selectedProduct?.image_url) return setAiError('이미지를 먼저 올려주세요.')
    setAiLoading(true); setAiError('')
    const steps = ['🔍 이미지 분석 중...', '✍️ 상품 스토리 작성 중...', '📋 특징 · 비교표 정리 중...', '⭐ 후기 · FAQ 작성 중...', '🎨 상세페이지 완성 중...']
    let idx = 0; setAiLoadingMsg(steps[0])
    aiLoadingTimer.current = setInterval(() => { idx = Math.min(idx + 1, steps.length - 1); setAiLoadingMsg(steps[idx]) }, 5000)
    try {
      // 대표 이미지(배경제거본 우선) + 추가 사진 전부 수집 → API가 섹션별 자동 배치
      const images: { base64: string; mimeType: string }[] = []
      if (aiBgRemovedBase64) { images.push({ base64: aiBgRemovedBase64, mimeType: 'image/png' }) }
      else if (aiImage) { images.push(await resizeImg(aiImage)) }
      else if (selectedProduct?.image_url) {
        const imgRes = await fetch(selectedProduct.image_url)
        if (!imgRes.ok) { setAiLoading(false); return setAiError('상품 이미지를 불러올 수 없어요. 이미지를 새로 업로드해주세요.') }
        const blob = await imgRes.blob()
        const mt = blob.type || 'image/jpeg'
        images.push(await resizeImg(new File([blob], 'product.jpg', { type: mt })))
      }
      for (const ex of aiExtraImages) {
        try { images.push(await resizeImg(ex.file)) } catch { /* 개별 실패 건너뜀 */ }
      }
      if (images.length === 0) { setAiLoading(false); return setAiError('이미지가 준비되지 않았어요.') }

      const res = await fetch('/api/generate-landing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, persona: aiPersona, theme: 'premium', productName: aiMeta.name, retailPrice: aiMeta.retail_price, wholesalePrice: aiMeta.wholesale_price, unit: aiMeta.unit })
      })
      const data = await res.json()
      if (data.error) {
        console.error('[admin landing generate] failed', data)
        return setAiError('상세페이지 생성에 실패했습니다. 서버 로그를 확인해 주세요.')
      }
      setAiLandingData(data.data || null)
      setAiLandingHtml(data.html)
      setAiPresetKey('gold' as PresetKey); setAiTemplateKey('premium')
      setAiStep(3)
    } catch (e: any) {
      console.error('[admin landing generate] unexpected error', e)
      setAiError('상세페이지 생성 중 오류가 발생했습니다. 서버 로그를 확인해 주세요.')
    }
    finally { setAiLoading(false); clearInterval(aiLoadingTimer.current); setAiLoadingMsg('') }
  }

  const handleChangePreset = (key: PresetKey) => {
    if (!aiLandingData) return
    const html = renderLanding(aiLandingData, key, aiTemplateKey)
    setAiLandingHtml(html); setAiPresetKey(key)
    const el = document.getElementById('landing-preview'); if (el) el.innerHTML = html
  }

  const handleChangeTemplate = (key: TemplateKey) => {
    if (!aiLandingData) return
    const html = renderLanding(aiLandingData, aiPresetKey, key)
    setAiLandingHtml(html); setAiTemplateKey(key)
    const el = document.getElementById('landing-preview'); if (el) el.innerHTML = html
  }

  // ── save / register ──────────────────────────────────────
  const handleAiRegister = async () => {
    setAiSaving(true); setAiError('')
    try {
      let mainImgUrl = ''
      if (aiImage) {
        const ext = aiBgRemovedBase64 ? 'png' : (aiImage.name.split('.').pop() || 'jpg')
        const fn = Date.now() + '.' + ext
        let blob: Blob = aiImage
        if (aiBgRemovedBase64) { const b = atob(aiBgRemovedBase64); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); blob = new Blob([a], { type: 'image/png' }) }
        const { error: upErr } = await supabase.storage.from('products').upload(fn, blob, { upsert: true })
        if (!upErr) mainImgUrl = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
      }
      const finalHtml = document.getElementById('landing-preview')?.innerHTML || aiLandingHtml
      if (selectedProduct) {
        const updateData: any = { name: aiMeta.name || selectedProduct.name, origin: aiMeta.origin.trim() || null, description: finalHtml, category_id: aiMeta.category_id || null, wholesale_price: Number(aiMeta.wholesale_price) || 0, retail_price: Number(aiMeta.retail_price) || 0, stock: Number(aiMeta.stock) || 0, unit: aiMeta.unit || '개', member_price: Number(aiMeta.member_price) || 0 }
        if (mainImgUrl) updateData.image_url = mainImgUrl
        await supabase.from('products').update(updateData).eq('id', selectedProduct.id)
      } else {
        await supabase.from('products').insert({ name: aiMeta.name || '상품', origin: aiMeta.origin.trim() || null, description: finalHtml, category_id: aiMeta.category_id || null, wholesale_price: Number(aiMeta.wholesale_price) || 0, retail_price: Number(aiMeta.retail_price) || 0, stock: Number(aiMeta.stock) || 0, unit: aiMeta.unit || '개', member_price: Number(aiMeta.member_price) || 0, image_url: mainImgUrl, is_active: true })
      }
      reset(); onDone()
    } catch (e: any) {
      console.error('[admin landing save] failed', e)
      setAiError('상세페이지 저장에 실패했습니다. 서버 로그를 확인해 주세요.')
    }
    finally { setAiSaving(false) }
  }

  // 직접 만들기 블록 → HTML (저장/미리보기 공용)
  const buildManualHtml = () => manualBlocks.map((b, idx) => {
    if (!b.content) return ''
    if (b.type === 'image') return `<div style="width:100%;overflow:hidden;"><img src="${b.content}" style="width:100%;display:block;object-fit:cover;" /></div>`
    if (b.type === 'video') {
      const isYT = b.content.includes('youtube') || b.content.includes('youtu.be')
      if (isYT) { const eu = getYoutubeEmbedUrl(b.content); return `<div style="width:100%;position:relative;padding-bottom:56.25%;background:#000;"><iframe src="${eu}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe></div>` }
      return `<div style="width:100%;background:#000;"><video controls style="width:100%;display:block;"><source src="${b.content}" /></video></div>`
    }
    if (b.type === 'text') {
      const bg = idx === 0 ? 'background:linear-gradient(135deg,#1a1a1a,#2d2d2d);color:white;' : 'background:#fff;border-bottom:8px solid #f5f5f5;'
      return `<div style="padding:28px 24px;font-size:15px;line-height:2;${bg}">${b.content.split('\n').join('<br/>')}</div>`
    }
    return ''
  }).filter(Boolean).join('')

  const handleManualRegister = async () => {
    if (!selectedProduct) return setAiError('상품을 먼저 선택해주세요.')
    setAiLoading(true); setAiError('')
    try {
      const html = buildManualHtml()
      await supabase.from('products').update({ description: html }).eq('id', selectedProduct.id)
      reset(); onDone()
    } catch (e: any) {
      console.error('[admin manual landing save] failed', e)
      setAiError('상세페이지 저장에 실패했습니다. 서버 로그를 확인해 주세요.')
    }
    finally { setAiLoading(false) }
  }

  const reset = () => {
    clearInterval(aiLoadingTimer.current)
    setAiLoading(false); setAiLoadingMsg(''); setAiStep(1); setAiTab('ai'); setAiChoice(false)
    setAiImage(null); setAiImagePreview(''); setAiBgRemovedPreview(''); setAiBgRemovedBase64(''); setAiExtraImages([])
    setAiLandingHtml(''); setAiError(''); setAiSelectedBg('dark'); setShowBuyerPreview(false)
    setSelectedProduct(null); setManualBlocks([])
    setHtmlCode(''); setHtmlProduct(null)
  }

  const handleClose = () => { reset(); onClose() }

  // ── manual block helpers ─────────────────────────────────
  const addBlock = (type: 'image' | 'video' | 'text') => setManualBlocks(p => [...p, { id: Date.now(), type, content: '', file: null }])
  const updateBlock = (id: number, content: string) => setManualBlocks(p => p.map(b => b.id === id ? { ...b, content } : b))
  const removeBlock = (id: number) => setManualBlocks(p => p.filter(b => b.id !== id))
  const uploadManualImage = (id: number, file: File) => {
    const reader = new FileReader()
    reader.onload = () => setManualBlocks(p => p.map(b => b.id === id ? { ...b, content: reader.result as string, file } : b))
    reader.readAsDataURL(file)
  }

  // ── shared header ────────────────────────────────────────
  const Header = () => (
    <div style={{ height: '52px', background: aiDark ? 'linear-gradient(135deg,#1a1a1a,#2d2d2d)' : 'linear-gradient(135deg,#f5f5f5,#e8e8e8)', borderBottom: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', flexShrink: 0 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <p style={{ color: '#22c55e', fontWeight: 900, fontSize: '14px', margin: 0, flexShrink: 0 }}>✨ 상세페이지 제작</p>
        <div style={{ display: 'flex', gap: '4px', background: aiDark ? 'rgba(255,255,255,0.06)' : '#fafafa', borderRadius: '8px', padding: '3px' }}>
          {[{ k: 'ai', label: '✨ AI 생성' }, { k: 'manual', label: '✏️ 직접 만들기' }, { k: 'html', label: '</> HTML 붙여넣기' }].map(t => (
            <button key={t.k} onClick={() => setAiTab(t.k as any)}
              style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', background: aiTab === t.k ? '#22c55e' : 'transparent', color: aiTab === t.k ? '#111' : aiDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {aiTab === 'ai' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {([1, 2, 3] as const).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, background: aiStep >= s ? '#22c55e' : aiDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: aiStep >= s ? '#111' : aiDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                {aiStep > s ? '✓' : s}
              </div>
              {i < 2 && <div style={{ width: '16px', height: '1px', background: aiStep > s ? '#22c55e' : aiDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />}
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setAiDark(v => !v)} style={{ background: aiDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', border: 'none', borderRadius: '8px', width: '34px', height: '34px', fontSize: '18px', cursor: 'pointer' }}>
        {aiDark ? '🌙' : '☀️'}
      </button>
      <button onClick={handleClose} style={{ background: aiDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', border: 'none', borderRadius: '8px', width: '34px', height: '34px', color: aiDark ? 'rgba(255,255,255,0.6)' : '#444', fontSize: '18px', cursor: 'pointer' }}>✕</button>
    </div>
  )

  return (
    <>
      {/* ── AI STEP 1-3 ── */}
      {aiTab === 'ai' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: aiDark ? 'rgba(0,0,0,0.95)' : 'rgba(240,240,240,0.97)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
          <Header />

          {/* 선택창: 상품관리에서 '상세' 눌러 진입 시 (상품 재선택 없음) */}
          {aiChoice && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
              <div style={{ width: '100%', maxWidth: '620px', textAlign: 'center' }}>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#666', fontSize: '13px', margin: '0 0 6px' }}>선택한 상품</p>
                <h2 style={{ color: aiDark ? 'white' : '#111', fontSize: '22px', fontWeight: 900, margin: '0 0 28px' }}>📦 {initialProduct?.name}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  <button onClick={startEditExisting}
                    style={{ padding: '28px 22px', borderRadius: '18px', border: '2px solid ' + (aiDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'), background: aiDark ? 'rgba(255,255,255,0.04)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e' }} onMouseLeave={e => { e.currentTarget.style.borderColor = aiDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}>
                    <div style={{ fontSize: '30px', marginBottom: '10px' }}>✏️</div>
                    <p style={{ color: aiDark ? 'white' : '#111', fontSize: '17px', fontWeight: 800, margin: '0 0 6px' }}>기존 상세페이지 수정</p>
                    <p style={{ color: aiDark ? 'rgba(255,255,255,0.45)' : '#888', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>지금 저장된 상세페이지를 그대로 불러와<br />글자·문구를 직접 고쳐요.</p>
                  </button>
                  <button onClick={startMakeNew}
                    style={{ padding: '28px 22px', borderRadius: '18px', border: '2px solid transparent', background: 'linear-gradient(135deg,#ec4899,#f43f5e)', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: '30px', marginBottom: '10px' }}>✨</div>
                    <p style={{ color: '#fff', fontSize: '17px', fontWeight: 900, margin: '0 0 6px' }}>AI로 새로 만들기</p>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>사진과 말투를 골라<br />상세페이지를 처음부터 새로 생성해요.</p>
                  </button>
                </div>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.3)' : '#999', fontSize: '12px', margin: '20px 0 0' }}>※ 새로 만들면 지금 상세페이지는 저장 전까지 바뀌지 않아요.</p>
              </div>
            </div>
          )}

          {/* STEP 1: 상품 선택 + 이미지 */}
          {!aiChoice && aiStep === 1 && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', gap: '20px', minHeight: 0 }}>
              {/* 상품 리스트 */}
              <div style={{ width: isMobile ? '100%' : '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '1px' }}>📦 상품 선택</p>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {products.filter(p => p.is_active).map(p => (
                    <button key={p.id} onClick={() => selectProductForAI(p)}
                      style={{ padding: '10px 12px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', border: '2px solid ' + (selectedProduct?.id === p.id ? '#22c55e' : 'rgba(255,255,255,0.08)'), background: selectedProduct?.id === p.id ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.image_url ? <img src={p.image_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🧺</div>}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ color: aiDark ? 'white' : '#111', fontSize: '12px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                          <p style={{ color: aiDark ? 'rgba(255,255,255,0.4)' : '#666', fontSize: '10px', margin: '2px 0 0' }}>{p.retail_price?.toLocaleString()}원</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {products.length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: aiDark ? 'rgba(255,255,255,0.3)' : '#888', fontSize: '12px' }}><p>등록된 상품이 없어요</p></div>}
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '1px' }}>📸 {selectedProduct ? '대표 이미지 (교체 또는 그대로 사용)' : '대표 이미지'}</p>
                <input id="ai-img-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                {!aiImagePreview ? (
                  <div onClick={() => document.getElementById('ai-img-input')?.click()}
                    style={{ flex: 1, border: '2px dashed rgba(34,197,94,0.4)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(34,197,94,0.03)', minHeight: '200px' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📸</div>
                    <p style={{ color: '#22c55e', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>클릭해서 이미지 올리기</p>
                    <p style={{ color: aiDark ? 'rgba(255,255,255,0.3)' : '#888', fontSize: '12px' }}>JPG · PNG · WEBP</p>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {Object.entries(BG_PRESETS).map(([key, bg]) => (
                        <button key={key} onClick={() => setAiSelectedBg(key)}
                          style={{ borderRadius: '10px', overflow: 'hidden', border: '3px solid ' + (aiSelectedBg === key ? '#22c55e' : 'transparent'), cursor: 'pointer', background: 'none', padding: 0 }}>
                          <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg.bg }}>
                            {(aiBgRemovedPreview || aiImagePreview) && <img src={aiBgRemovedPreview || aiImagePreview} alt="" style={{ height: '60px', objectFit: 'contain' }} />}
                          </div>
                          <div style={{ background: aiSelectedBg === key ? '#22c55e' : 'rgba(255,255,255,0.08)', padding: '4px', textAlign: 'center' }}>
                            <p style={{ color: aiSelectedBg === key ? '#111' : 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 700, margin: 0 }}>{bg.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(34,197,94,0.2)', minHeight: isMobile ? '240px' : '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: aiSelectedBg === 'warm' ? 'linear-gradient(160deg,#1a0e08,#3d2010)' : aiSelectedBg === 'white' ? '#f5f5f5' : '#0d0d0d' }}>
                      {aiBgLoading ? <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>⏳ 배경 제거 중...</p> : <img src={aiBgRemovedPreview || aiImagePreview} alt="" style={{ maxHeight: isMobile ? '220px' : '400px', maxWidth: '100%', objectFit: 'contain' }} />}
                    </div>
                    <button onClick={() => { setAiImagePreview(''); setAiBgRemovedPreview(''); setAiBgRemovedBase64(''); setAiError('') }}
                      style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer' }}>
                      🔄 이미지 다시 올리기
                    </button>
                  </div>
                )}

                {/* 추가 사진 (여러 장 → 원산지·스토리·레시피·보관 섹션 자동 배치) */}
                <div>
                  <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '1px' }}>
                    🖼 추가 사진 <span style={{ fontWeight: 400, letterSpacing: 0, color: aiDark ? 'rgba(255,255,255,0.35)' : '#777' }}>(선택 · 여러 장 올리면 상세페이지가 더 풍성해져요)</span>
                  </p>
                  <input id="admin-ai-extra" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) addExtraImages(e.target.files); e.target.value = '' }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {aiExtraImages.map(ex => (
                      <div key={ex.id} style={{ position: 'relative', width: '64px', height: '64px' }}>
                        <img src={ex.preview} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', background: '#111' }} />
                        <button onClick={() => removeExtraImage(ex.id)} title="삭제"
                          style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '12px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    ))}
                    <button onClick={() => document.getElementById('admin-ai-extra')?.click()} title="사진 추가"
                      style={{ width: '64px', height: '64px', borderRadius: '8px', border: '2px dashed rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.03)', color: '#22c55e', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>＋</button>
                  </div>
                </div>

                {aiError && <p style={{ color: '#fbbf24', fontSize: '12px' }}>{aiError}</p>}
                <button onClick={() => setAiStep(2)} disabled={!selectedProduct}
                  style={{ padding: '14px', borderRadius: '12px', background: !selectedProduct ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg,#ec4899,#f43f5e)', color: !selectedProduct ? 'rgba(255,255,255,0.3)' : '#111', fontSize: '14px', fontWeight: 900, border: 'none', cursor: !selectedProduct ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                  {!selectedProduct ? '상품을 먼저 선택해주세요' : `"${selectedProduct.name}" 으로 다음 단계 →`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 상품 정보 + 말투 */}
          {!aiChoice && aiStep === 2 && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: aiDark ? 'transparent' : '#f8f8f8', position: 'relative' }}>
              {aiLoading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: aiDark ? 'rgba(0,0,0,0.85)' : 'rgba(240,240,240,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid rgba(34,197,94,0.2)', borderTop: '3px solid #22c55e', animation: 'spin 0.9s linear infinite' }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#22c55e', fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>{aiLoadingMsg || '준비 중...'}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>이미지 분석 → 카피 작성 → 레이아웃 구성</p>
                  </div>
                </div>
              )}
              <div style={{ width: '100%', maxWidth: isMobile ? '540px' : '960px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '20px' : '28px', alignItems: 'start' }}>
                <div>
                  <h3 style={{ color: aiDark ? 'white' : '#111', fontSize: '18px', fontWeight: 900, margin: '0 0 12px' }}>📋 상품 정보</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input value={aiMeta.name} onChange={e => setAiMeta(p => ({ ...p, name: e.target.value }))} placeholder="상품명 (예: 산지직송 보리굴비)"
                      style={{ padding: '15px 16px', borderRadius: '12px', border: '2px solid ' + (aiDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'), background: aiDark ? 'rgba(255,255,255,0.07)' : 'white', color: aiDark ? 'white' : '#111', fontSize: '15px', fontWeight: 600, outline: 'none' }}
                      onFocus={e => { e.target.style.borderColor = '#22c55e' }} onBlur={e => { e.target.style.borderColor = aiDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)' }} />
                    <input value={aiMeta.origin} onChange={e => setAiMeta(p => ({ ...p, origin: e.target.value }))} placeholder="원산지 (예: 국내산 · 전남 영광)"
                      maxLength={100}
                      style={{ padding: '15px 16px', borderRadius: '12px', border: '2px solid ' + (aiDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'), background: aiDark ? 'rgba(255,255,255,0.07)' : 'white', color: aiDark ? 'white' : '#111', fontSize: '14px', outline: 'none' }}
                      onFocus={e => { e.target.style.borderColor = '#22c55e' }} onBlur={e => { e.target.style.borderColor = aiDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      {[
                        { label: '🛒 일반 구매가', key: 'retail_price', color: '99,102,241' },
                        { label: '🏪 소매 공급가', key: 'member_price', color: '15,118,110' },
                        { label: '🏭 도매 공급가', key: 'wholesale_price', color: '236,72,153' },
                      ].map(f => (
                        <div key={f.key}>
                          <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#666', fontSize: '10px', fontWeight: 700, margin: '0 0 5px' }}>{f.label}</p>
                          <input type="number" value={(aiMeta as any)[f.key]} onChange={e => setAiMeta(p => ({ ...p, [f.key]: e.target.value }))} placeholder="원"
                            style={{ width: '100%', padding: '12px 10px', borderRadius: '10px', border: `2px solid rgba(${f.color},0.3)`, background: aiDark ? `rgba(${f.color},0.06)` : 'white', color: aiDark ? 'white' : '#111', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = `rgb(${f.color})` }} onBlur={e => { e.target.style.borderColor = `rgba(${f.color},0.3)` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 style={{ color: aiDark ? 'white' : '#111', fontSize: '18px', fontWeight: 900, margin: '0 0 12px' }}>🎭 어떤 말투로 쓸까요?</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {([
                      { key: 'shohost', emoji: '🎤', title: '쇼호스트', desc: '지금 바로! 놀라운 퀄리티!', color: '#f97316' },
                      { key: 'grandma', emoji: '👵', title: '할머니', desc: '정겹고 따뜻한 말투', color: '#ec4899' },
                      { key: 'expert',  emoji: '👨‍⚕️', title: '전문가', desc: '신뢰감 있는 전문 설명', color: '#3b82f6' },
                      { key: 'parent',  emoji: '👨‍👩‍👧', title: '엄마아빠', desc: '온가족 건강을 생각해요', color: '#22c55e' },
                    ] as const).map(p => (
                      <button key={p.key} onClick={() => setAiPersona(p.key)}
                        style={{ padding: '16px 12px', borderRadius: '14px', textAlign: 'left', cursor: 'pointer', border: '2px solid ' + (aiPersona === p.key ? p.color : aiDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), background: aiPersona === p.key ? p.color + '18' : aiDark ? 'rgba(255,255,255,0.03)' : 'white', boxShadow: aiPersona === p.key ? '0 0 20px ' + p.color + '33' : 'none', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '28px', marginBottom: '6px' }}>{p.emoji}</div>
                        <p style={{ color: aiDark ? 'white' : '#111', fontSize: '14px', fontWeight: 800, margin: '0 0 3px' }}>{p.title}</p>
                        <p style={{ color: aiDark ? 'rgba(255,255,255,0.4)' : '#888', fontSize: '11px', margin: 0 }}>{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {aiError && <div style={{ gridColumn: '1 / -1', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px' }}><p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{aiError}</p></div>}
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
                  <button onClick={() => setAiStep(1)} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: '1.5px solid ' + (aiDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'), background: 'transparent', color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← 이전</button>
                  <button onClick={handleGenerateLanding} disabled={aiLoading || !aiMeta.name.trim()}
                    style={{ flex: 3, padding: '15px', borderRadius: '12px', background: aiLoading || !aiMeta.name.trim() ? 'rgba(34,197,94,0.25)' : 'linear-gradient(135deg,#ec4899,#f43f5e)', color: aiLoading || !aiMeta.name.trim() ? 'rgba(255,255,255,0.3)' : '#111', fontSize: '15px', fontWeight: 900, border: 'none', cursor: aiLoading || !aiMeta.name.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                    {aiLoading ? (aiLoadingMsg || '⏳ 준비 중...') : '✨ 상세페이지 자동 생성'}
                  </button>
                </div>
                {!aiMeta.name.trim() && <p style={{ gridColumn: '1 / -1', color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', margin: '-10px 0 0' }}>상품명을 입력해야 생성할 수 있어요</p>}
              </div>
            </div>
          )}

          {/* STEP 3: 미리보기 + 편집 */}
          {!aiChoice && aiStep === 3 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 700, flexShrink: 0, letterSpacing: '0.05em' }}>디자인</span>
                {TEMPLATES.map(t => (
                  <button key={t.key} onClick={() => handleChangeTemplate(t.key as TemplateKey)} title={t.desc}
                    style={{ padding: '6px 11px', borderRadius: '8px', border: '1.5px solid', borderColor: aiTemplateKey === t.key ? '#22c55e' : 'rgba(255,255,255,0.15)', background: aiTemplateKey === t.key ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.04)', color: aiTemplateKey === t.key ? '#4ade80' : 'rgba(255,255,255,0.6)', fontSize: '11.5px', fontWeight: aiTemplateKey === t.key ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {t.emoji} {t.name}
                  </button>
                ))}
                <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', flexShrink: 0 }}>🎨</span>
                {([
                  { k: 'gold' as PresetKey,  label: '골드', bg: '#C8842D', border: '#E8B87A' },
                  { k: 'dark' as PresetKey,  label: '검정', bg: '#0D0D0D', border: '#555' },
                  { k: 'blue' as PresetKey,  label: '파랑', bg: '#1D4ED8', border: '#60A5FA' },
                  { k: 'red'  as PresetKey,  label: '빨강', bg: '#DC2626', border: '#F87171' },
                  { k: 'pink' as PresetKey,  label: '핑크', bg: '#DB2777', border: '#F9A8D4' },
                  { k: 'white' as PresetKey, label: '하양', bg: '#F5F5F5', border: '#374151' },
                ]).map(t => (
                  <button key={t.k} onClick={() => handleChangePreset(t.k)} title={t.label}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', flexShrink: 0, border: '2px solid ' + (aiPresetKey === t.k ? t.border : 'transparent'), background: t.bg, boxShadow: aiPresetKey === t.k ? `0 0 8px ${t.bg}99` : 'none', transform: aiPresetKey === t.k ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s' }} />
                ))}
                <div style={{ flex: 1 }} />
                <button onClick={() => setAiStep(2)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>← 설정</button>
                <button onClick={handleGenerateLanding} disabled={aiLoading || aiSaving} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.5)', background: 'transparent', color: '#22c55e', fontSize: '10px', fontWeight: 700, cursor: (aiLoading||aiSaving) ? 'not-allowed' : 'pointer', opacity: (aiLoading||aiSaving) ? 0.6 : 1, whiteSpace: 'nowrap' }}>{aiLoading ? '⏳ 생성 중…' : '🔄 재생성'}</button>
                <button onClick={() => setShowBuyerPreview('mobile')} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(100,200,100,0.4)', background: 'rgba(100,200,100,0.07)', color: '#6ee7b7', fontSize: '10px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>📱 모바일</button>
                <button onClick={() => setShowBuyerPreview('desktop')} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(147,197,253,0.4)', background: 'rgba(147,197,253,0.07)', color: '#93c5fd', fontSize: '10px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🖥️ PC</button>
                <button onClick={handleAiRegister} disabled={aiLoading || aiSaving} style={{ padding: '5px 14px', borderRadius: '6px', background: 'linear-gradient(135deg,#ec4899,#f43f5e)', color: '#111', fontSize: '11px', fontWeight: 900, border: 'none', cursor: (aiLoading||aiSaving) ? 'not-allowed' : 'pointer', opacity: (aiLoading||aiSaving) ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  {aiSaving ? '⏳ 등록 중...' : '🛍️ 등록'}
                </button>
              </div>
              {aiError && <p style={{ color: '#f87171', fontSize: '12px', padding: '6px 12px', background: 'rgba(239,68,68,0.1)', margin: 0, flexShrink: 0 }}>{aiError}</p>}
              <div style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', background: '#d0d0d0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '16px' }}>
                <div style={{ width: '100%', maxWidth: '390px', background: 'white', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px' }}>
                  {!aiLandingData && (
                    <div style={{ background: '#ecfdf5', color: '#047857', fontSize: '12px', fontWeight: 700, padding: '10px 14px', textAlign: 'center' }}>✏️ 기존 상세페이지 수정 중 — 글자를 눌러 바로 고치고 저장하세요</div>
                  )}
                  {aiBgRemovedPreview && aiLandingData && (
                    <div style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: aiSelectedBg === 'warm' ? 'linear-gradient(160deg,#1a0e08,#3d2010)' : aiSelectedBg === 'white' ? '#f5f5f5' : '#0d0d0d' }}>
                      <img src={aiBgRemovedPreview} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div id="landing-preview" contentEditable={!aiLandingData} suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: aiLandingHtml }} />
                </div>
              </div>
              <FloatingToolbar previewId="landing-preview" />
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL ── */}
      {aiTab === 'manual' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: aiDark ? 'rgba(0,0,0,0.95)' : 'rgba(240,240,240,0.97)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: isMobile ? 'auto' : 'hidden', minHeight: 0 }}>
            {/* 왼쪽 패널 */}
            <div style={{ width: isMobile ? '100%' : '360px', flexShrink: 0, background: aiDark ? '#111' : '#f8f8f8', borderRight: '1px solid rgba(34,197,94,0.15)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '20px', gap: '14px' }}>
              <div>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '1px' }}>📦 상품 선택</p>
                <select onChange={e => { const p = products.find(p => p.id === e.target.value); if (p) setSelectedProduct(p) }} value={selectedProduct?.id || ''}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid rgba(34,197,94,0.3)', background: aiDark ? 'rgba(255,255,255,0.07)' : 'white', color: aiDark ? 'white' : '#111', fontSize: '13px', outline: 'none' }}>
                  <option value="">-- 상품 선택 --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '1px' }}>➕ 섹션 추가</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {[{ type: 'image' as const, label: '🖼️ 이미지' }, { type: 'video' as const, label: '🎬 영상' }, { type: 'text' as const, label: '✏️ 텍스트' }].map(b => (
                    <button key={b.type} onClick={() => addBlock(b.type)}
                      style={{ padding: '8px 4px', borderRadius: '8px', border: '1.5px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)', color: '#22c55e', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {manualBlocks.map((block, idx) => (
                  <div key={block.id} style={{ background: aiDark ? 'rgba(255,255,255,0.05)' : '#fafafa', borderRadius: '10px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <p style={{ color: '#22c55e', fontSize: '11px', fontWeight: 700, margin: 0 }}>{block.type === 'image' ? '🖼️ 이미지' : block.type === 'video' ? '🎬 영상' : '✏️ 텍스트'} #{idx + 1}</p>
                      <button onClick={() => removeBlock(block.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '5px', color: '#f87171', fontSize: '11px', cursor: 'pointer', padding: '2px 7px' }}>삭제</button>
                    </div>
                    {block.type === 'image' && (
                      <label style={{ cursor: 'pointer', display: 'block' }}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadManualImage(block.id, f) }} />
                        {block.content ? <img src={block.content} alt="" style={{ width: '100%', borderRadius: '6px', maxHeight: '100px', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '50px', borderRadius: '6px', border: '2px dashed rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(34,197,94,0.6)', fontSize: '12px' }}>클릭해서 이미지 선택</div>}
                      </label>
                    )}
                    {block.type === 'video' && (
                      <div>
                        <label style={{ cursor: 'pointer', display: 'block' }}>
                          <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadManualImage(block.id, f) }} />
                          <div style={{ width: '100%', height: '40px', borderRadius: '6px', border: '2px dashed rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(34,197,94,0.6)', fontSize: '12px' }}>{block.content ? '✅ 영상 선택됨' : '클릭해서 영상 선택'}</div>
                        </label>
                        <input value={block.content.startsWith('http') ? block.content : ''} onChange={e => updateBlock(block.id, e.target.value)} placeholder="또는 URL 직접 입력"
                          style={{ width: '100%', marginTop: '4px', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: aiDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: aiDark ? 'white' : '#111', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    )}
                    {block.type === 'text' && (
                      <div>
                        <textarea value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="내용을 입력하세요... (줄바꿈 가능)" rows={4}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: aiDark ? 'rgba(255,255,255,0.07)' : 'white', color: aiDark ? 'white' : '#111', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          {['굵게', '제목', '소제목'].map((s, i) => (
                            <button key={s} onClick={() => {
                              const tags = ['<strong>내용</strong>', '<h2 style="font-size:20px;font-weight:900;margin:16px 0 8px;">제목</h2>', '<h3 style="font-size:16px;font-weight:700;margin:12px 0 6px;color:#22c55e;">소제목</h3>']
                              updateBlock(block.id, (block.content || '') + '\n' + tags[i])
                            }} style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(34,197,94,0.3)', background: 'transparent', color: 'rgba(34,197,94,0.8)', fontSize: '10px', cursor: 'pointer' }}>{s}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {aiError && <p style={{ color: '#f87171', fontSize: '12px' }}>{aiError}</p>}
              <button onClick={() => { if (!selectedProduct) return setAiError('상품을 먼저 선택해주세요.'); setAiError(''); setShowBuyerPreview('mobile') }}
                disabled={!selectedProduct}
                style={{ padding: '14px', borderRadius: '12px', background: !selectedProduct ? 'rgba(255,255,255,0.08)' : 'rgba(34,197,94,0.15)', color: !selectedProduct ? 'rgba(255,255,255,0.3)' : '#22c55e', fontSize: '14px', fontWeight: 800, border: '1.5px solid ' + (!selectedProduct ? 'transparent' : 'rgba(34,197,94,0.4)'), cursor: !selectedProduct ? 'not-allowed' : 'pointer' }}>
                👁️ 올리기 전 미리보기
              </button>
              <button onClick={handleManualRegister} disabled={aiLoading || !selectedProduct}
                style={{ padding: '14px', borderRadius: '12px', background: aiLoading || !selectedProduct ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg,#ec4899,#f43f5e)', color: aiLoading || !selectedProduct ? 'rgba(255,255,255,0.3)' : '#111', fontSize: '14px', fontWeight: 900, border: 'none', cursor: aiLoading || !selectedProduct ? 'not-allowed' : 'pointer' }}>
                {aiLoading ? '저장 중...' : '💾 상세페이지 저장'}
              </button>
            </div>

            {/* 오른쪽 미리보기 */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#d0d0d0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '16px' }}>
              <div style={{ width: '100%', maxWidth: '390px', background: 'white', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px' }}>
                {selectedProduct?.image_url && (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
                  </div>
                )}
                {manualBlocks.map(block => (
                  <div key={block.id}>
                    {block.type === 'image' && block.content && <img src={block.content} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />}
                    {block.type === 'video' && block.content && (
                      block.content.includes('youtube') || block.content.includes('youtu.be')
                        ? <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', background: '#000' }}><iframe src={getYoutubeEmbedUrl(block.content)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen /></div>
                        : <video controls style={{ width: '100%', display: 'block' }}><source src={block.content} /></video>
                    )}
                    {block.type === 'text' && block.content && (
                      <div style={{ padding: '28px 24px', fontSize: '15px', lineHeight: 2, background: '#fff', borderBottom: '8px solid #f5f5f5' }} dangerouslySetInnerHTML={{ __html: block.content.split('\n').join('<br/>') }} />
                    )}
                  </div>
                ))}
                {manualBlocks.length === 0 && <div style={{ padding: '40px 24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>왼쪽에서 섹션을 추가하면 여기서 미리볼 수 있어요</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 구매자 미리보기 ── */}
      {showBuyerPreview && (() => {
        const isManual = aiTab === 'manual'
        const previewHtml = isManual ? buildManualHtml() : aiLandingHtml
        const topImg = isManual ? (selectedProduct?.image_url || '') : aiBgRemovedPreview
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#111', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['#ff5f57', '#ffbd2e', '#28c840'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: '6px', padding: '4px 12px', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>{showBuyerPreview === 'mobile' ? '📱 모바일 미리보기 (390px)' : '🖥️ PC 미리보기 (1200px)'}</p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setShowBuyerPreview('mobile')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: showBuyerPreview === 'mobile' ? '#6ee7b7' : 'rgba(255,255,255,0.1)', color: showBuyerPreview === 'mobile' ? '#111' : 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>📱</button>
              <button onClick={() => setShowBuyerPreview('desktop')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: showBuyerPreview === 'desktop' ? '#93c5fd' : 'rgba(255,255,255,0.1)', color: showBuyerPreview === 'desktop' ? '#111' : 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>🖥️</button>
            </div>
            <button onClick={() => setShowBuyerPreview(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '7px 14px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>← 수정으로 돌아가기</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', background: '#1a1a1a' }}>
            {showBuyerPreview === 'mobile' ? (
              <div style={{ width: '100%', maxWidth: '390px', minHeight: '844px', background: 'white', borderRadius: '36px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.8)', border: '8px solid #333', flexShrink: 0 }}>
                {topImg && <div style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: aiSelectedBg === 'warm' ? 'linear-gradient(160deg,#1a0e08,#3d2010)' : aiSelectedBg === 'white' ? '#f5f5f5' : '#0d0d0d' }}><img src={topImg} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} /></div>}
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            ) : (
              <div style={{ width: '100%', maxWidth: '1200px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div style={{ background: '#f0f0f0', padding: '10px 16px', display: 'flex', gap: '6px', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
                  {['#ff5f57', '#ffbd2e', '#28c840'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
                  <div style={{ flex: 1, background: 'white', borderRadius: '6px', padding: '3px 12px', marginLeft: '8px' }}><p style={{ fontSize: '11px', color: '#999', margin: 0 }}>gulbi-store.vercel.app/shop/product/...</p></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '600px' }}>
                  {topImg && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: aiSelectedBg === 'warm' ? 'linear-gradient(160deg,#1a0e08,#3d2010)' : aiSelectedBg === 'white' ? '#f5f5f5' : '#0d0d0d' }}><img src={topImg} alt="" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} /></div>}
                  <div style={{ overflowY: 'auto', maxHeight: '700px' }}><div dangerouslySetInnerHTML={{ __html: previewHtml }} /></div>
                </div>
              </div>
            )}
          </div>
        </div>
        ) })()}

      {/* ── HTML 붙여넣기 탭 ── */}
      {aiTab === 'html' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: aiDark ? 'rgba(0,0,0,0.95)' : 'rgba(240,240,240,0.97)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 0, minHeight: 0, overflow: isMobile ? 'auto' : 'hidden' }}>
            {/* 왼쪽 편집 */}
            <div style={{ width: isMobile ? '100%' : '420px', flexShrink: 0, background: aiDark ? '#111' : '#fafafa', borderRight: '1px solid rgba(34,197,94,0.15)', display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflowY: 'auto' }}>
              <div>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '1px' }}>📦 상품 선택</p>
                <select value={htmlProduct?.id || ''} onChange={e => { const p = products.find(p => p.id === e.target.value); setHtmlProduct(p || null) }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: aiDark ? '#1a1a1a' : 'white', color: aiDark ? 'white' : '#111', fontSize: '13px', outline: 'none' }}>
                  <option value="">상품 선택...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: 0, letterSpacing: '1px' }}>{'</>'} HTML 코드 붙여넣기</p>
                  <button onClick={() => { const el = document.getElementById('admin-html-preview'); if (el) el.innerHTML = htmlCode }} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(34,197,94,0.2)', border: 'none', color: '#22c55e', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>미리보기 갱신</button>
                </div>
                <textarea
                  value={htmlCode}
                  onChange={e => setHtmlCode(e.target.value)}
                  placeholder={'기존 상세페이지 HTML 코드를 붙여넣으세요\n\n예시:\n<div style="...">\n  <img src="..." />\n  <p>상품 설명</p>\n</div>'}
                  style={{ flex: 1, minHeight: '320px', padding: '12px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)', background: aiDark ? '#0a0a0a' : 'white', color: aiDark ? '#22c55e' : '#111', fontSize: '12px', fontFamily: "'Courier New', monospace", outline: 'none', resize: 'none', lineHeight: 1.6 }}
                />
              </div>

              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px', padding: '10px 12px', fontSize: '11px', color: aiDark ? 'rgba(255,255,255,0.4)' : '#666', lineHeight: 1.6 }}>
                💡 스마트스토어, 쿠팡, 자사몰 등 기존 상세페이지의 HTML 소스를 복사해서 붙여넣으면 됩니다
              </div>

              {aiError && <p style={{ color: '#f87171', fontSize: '12px', margin: 0 }}>{aiError}</p>}

              <button
                onClick={async () => {
                  if (!htmlProduct) return setAiError('상품을 먼저 선택해주세요.')
                  if (!htmlCode.trim()) return setAiError('HTML 코드를 입력해주세요.')
                  setAiLoading(true); setAiError('')
                  try {
                    await supabase.from('products').update({ description: htmlCode }).eq('id', htmlProduct.id)
                    reset(); onDone()
                  } catch (e: any) {
                    console.error('[admin html save] failed', e)
                    setAiError('상세페이지 저장에 실패했습니다. 서버 로그를 확인해 주세요.')
                  }
                  finally { setAiLoading(false) }
                }}
                disabled={aiLoading || !htmlProduct || !htmlCode.trim()}
                style={{ padding: '14px', borderRadius: '12px', background: aiLoading || !htmlProduct || !htmlCode.trim() ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg,#ec4899,#f43f5e)', color: aiLoading || !htmlProduct || !htmlCode.trim() ? 'rgba(255,255,255,0.3)' : '#111', fontSize: '14px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>
                {aiLoading ? '저장 중...' : '💾 상세페이지 저장'}
              </button>
            </div>

            {/* 오른쪽 미리보기 */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#d0d0d0', display: 'flex', justifyContent: 'center', padding: '16px' }}>
              <div style={{ width: '100%', maxWidth: '390px', background: 'white', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px' }}>
                {htmlProduct?.image_url && (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={htmlProduct.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div id="admin-html-preview" dangerouslySetInnerHTML={{ __html: htmlCode }} style={{ fontSize: '13px' }} />
                {!htmlCode && <div style={{ padding: '40px 24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>HTML 코드를 붙여넣고 "미리보기 갱신"을 눌러보세요</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } [contenteditable]:focus { outline: 2px solid #22c55e !important; border-radius: 2px; }`}</style>
    </>
  )
}
