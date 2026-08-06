'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { renderLanding, type PresetKey, type TemplateKey, type LandingData, TEMPLATES } from '@/lib/landing-templates'

// ── 인라인 FloatingToolbar ──────────────────────────────────
function FloatingToolbar({ previewId }: { previewId: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const savedRange = useRef<Range | null>(null)

  useEffect(() => {
    const container = document.getElementById(previewId)
    if (!container) return
    const onSelect = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { setPos(null); return }
      const range = sel.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) { setPos(null); return }
      savedRange.current = range.cloneRange()
      const rect = range.getBoundingClientRect()
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 6 })
    }
    document.addEventListener('selectionchange', onSelect)
    return () => document.removeEventListener('selectionchange', onSelect)
  }, [previewId])

  const restore = () => {
    if (!savedRange.current) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges(); sel.addRange(savedRange.current)
  }
  const exec = (cmd: string, val?: string) => { restore(); document.execCommand(cmd, false, val) }

  if (!pos) return null
  return (
    <div onMouseDown={e => e.preventDefault()} style={{ position: 'fixed', left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)', zIndex: 200000, display: 'flex', alignItems: 'center', gap: '2px', background: '#111', border: '1px solid rgba(34,197,94,0.4)', borderRadius: '10px', padding: '5px 6px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
      {[{ cmd: 'bold', label: <strong style={{ fontSize: '13px' }}>B</strong> }, { cmd: 'italic', label: <em style={{ fontSize: '13px' }}>I</em> }, { cmd: 'underline', label: <u style={{ fontSize: '12px' }}>U</u> }].map(({ cmd, label }) => (
        <button key={cmd} onClick={() => exec(cmd)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{label}</button>
      ))}
      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />
      {[{ color: '#C8842D', label: '골드' }, { color: '#DC2626', label: '빨강' }, { color: '#1D4ED8', label: '파랑' }, { color: '#FFFFFF', label: '흰색' }].map(({ color, label }) => (
        <button key={color} onClick={() => exec('foreColor', color)} title={label} style={{ width: '20px', height: '20px', borderRadius: '50%', background: color, cursor: 'pointer', border: 'none', outline: color === '#FFFFFF' ? '1.5px solid rgba(255,255,255,0.5)' : 'none', outlineOffset: '1px' }} />
      ))}
    </div>
  )
}

type SupplierProduct = {
  id: string; name: string; description: string
  category_id: string
  suggested_wholesale_price: number; suggested_retail_price: number
  wholesale_price: number; retail_price: number
  stock: number; unit: string; image_url: string
  approval_status: string
}

type Props = {
  show: boolean
  onClose: () => void
  products: SupplierProduct[]
  onDone: () => void
}

const BG_PRESETS = {
  dark:  { label: '블랙',  bg: '#0d0d0d' },
  warm:  { label: '골드',  bg: 'linear-gradient(160deg,#1a0e08,#3d2010)' },
  white: { label: '화이트', bg: '#f5f5f5' },
}

export default function SupplierAiLandingEditor({ show, onClose, products, onDone }: Props) {
  const supabase = createClient()

  const [aiTab, setAiTab] = useState<'ai' | 'manual' | 'html' | 'images'>('ai')
  const [aiStep, setAiStep] = useState<1 | 2 | 3>(1)
  const [aiDark, setAiDark] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null)
  const [aiImage, setAiImage] = useState<File | null>(null)
  const [aiImagePreview, setAiImagePreview] = useState('')
  // AI 생성용 추가 사진 (대표 외 여러 장 → 원산지·스토리·레시피·보관 섹션 자동 배치)
  const [aiExtraImages, setAiExtraImages] = useState<{ id: number; file: File; preview: string }[]>([])
  const [aiSelectedBg, setAiSelectedBg] = useState('dark')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLoadingMsg, setAiLoadingMsg] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiPersona, setAiPersona] = useState('shohost')
  const [aiMeta, setAiMeta] = useState({ name: '', category_id: '', unit: 'kg', suggested_wholesale_price: '', suggested_retail_price: '', stock: '' })
  const [aiLandingHtml, setAiLandingHtml] = useState('')
  const [aiLandingData, setAiLandingData] = useState<LandingData | null>(null)
  const [aiPresetKey, setAiPresetKey] = useState<PresetKey>('gold' as PresetKey)
  const [aiTemplateKey, setAiTemplateKey] = useState<TemplateKey>('premium')
  const [showBuyerPreview, setShowBuyerPreview] = useState<'mobile' | 'desktop' | false>(false)
  const [manualBlocks, setManualBlocks] = useState<{ id: number; type: 'image' | 'video' | 'text'; content: string; file: File | null }[]>([])
  // HTML 붙여넣기 탭
  const [htmlCode, setHtmlCode] = useState('')
  const [htmlProduct, setHtmlProduct] = useState<SupplierProduct | null>(null)
  // 이미지 다중 업로드 탭
  const [imgFiles, setImgFiles] = useState<{ id: number; file: File; preview: string }[]>([])
  const [imgProduct, setImgProduct] = useState<SupplierProduct | null>(null)
  const aiLoadingTimer = useRef<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!show) return null

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

  const handleImageUpload = async (file: File) => {
    setAiImage(file); setAiError('')
    try {
      const { base64, mimeType } = await resizeImg(file)
      setAiImagePreview('data:' + mimeType + ';base64,' + base64)
    } catch { setAiError('이미지 로드 실패') }
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

  const selectProductForAI = (p: SupplierProduct) => {
    setSelectedProduct(p)
    setAiMeta({
      name: p.name,
      category_id: p.category_id || '',
      unit: p.unit || 'kg',
      suggested_wholesale_price: String(p.suggested_wholesale_price || ''),
      suggested_retail_price: String(p.suggested_retail_price || ''),
      stock: String(p.stock || ''),
    })
    if (p.image_url) setAiImagePreview(p.image_url)
    setAiExtraImages([])
  }

  const handleGenerateLanding = async () => {
    if (!aiImage && !selectedProduct?.image_url) return setAiError('이미지를 먼저 올려주세요.')
    setAiLoading(true); setAiError('')
    const steps = ['🔍 이미지 분석 중...', '✍️ 상품 스토리 작성 중...', '📋 특징 · 비교표 정리 중...', '⭐ 후기 · FAQ 작성 중...', '🎨 상세페이지 완성 중...']
    let idx = 0; setAiLoadingMsg(steps[0])
    aiLoadingTimer.current = setInterval(() => { idx = Math.min(idx + 1, steps.length - 1); setAiLoadingMsg(steps[idx]) }, 5000)
    try {
      // 대표 이미지 + 추가 사진 전부 수집 → 여러 장을 API가 섹션별 자동 배치
      const images: { base64: string; mimeType: string }[] = []
      if (aiImage) {
        images.push(await resizeImg(aiImage))
      } else if (selectedProduct?.image_url) {
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
        body: JSON.stringify({
          images, persona: aiPersona, theme: 'premium',
          productName: aiMeta.name,
          retailPrice: aiMeta.suggested_retail_price,
          wholesalePrice: aiMeta.suggested_wholesale_price,
          unit: aiMeta.unit,
        })
      })
      const data = await res.json()
      if (data.error) {
        console.error('[supplier landing generate] failed', data)
        return setAiError('상세페이지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
      setAiLandingData(data.data || null)
      setAiLandingHtml(data.html)
      setAiPresetKey('gold' as PresetKey); setAiTemplateKey('premium')
      setAiStep(3)
    } catch (e: any) {
      console.error('[supplier landing generate] unexpected error', e)
      setAiError('상세페이지 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
    finally { setAiLoading(false); clearInterval(aiLoadingTimer.current); setAiLoadingMsg('') }
  }

  const handleChangePreset = (key: PresetKey) => {
    if (!aiLandingData) return
    const html = renderLanding(aiLandingData, key, aiTemplateKey)
    setAiLandingHtml(html); setAiPresetKey(key)
    const el = document.getElementById('supplier-landing-preview'); if (el) el.innerHTML = html
  }

  const handleChangeTemplate = (key: TemplateKey) => {
    if (!aiLandingData) return
    const html = renderLanding(aiLandingData, aiPresetKey, key)
    setAiLandingHtml(html); setAiTemplateKey(key)
    const el = document.getElementById('supplier-landing-preview'); if (el) el.innerHTML = html
  }

  const handleAiRegister = async () => {
    if (!selectedProduct) return setAiError('상품을 먼저 선택해주세요.')
    setAiLoading(true); setAiError('')
    try {
      let mainImgUrl = selectedProduct.image_url || ''
      if (aiImage) {
        const ext = aiImage.name.split('.').pop() || 'jpg'
        const fn = Date.now() + '.' + ext
        const { error: upErr } = await supabase.storage.from('products').upload(fn, aiImage, { upsert: true })
        if (!upErr) mainImgUrl = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
      }
      const finalHtml = document.getElementById('supplier-landing-preview')?.innerHTML || aiLandingHtml
      const updateData: any = {
        description: finalHtml,
        approval_status: selectedProduct.approval_status === '거절' ? '대기중' : selectedProduct.approval_status,
      }
      if (mainImgUrl) updateData.image_url = mainImgUrl
      await supabase.from('products').update(updateData).eq('id', selectedProduct.id)
      reset(); onDone()
    } catch (e: any) {
      console.error('[supplier landing save] failed', e)
      setAiError('상세페이지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
    finally { setAiLoading(false) }
  }

  const handleManualRegister = async () => {
    if (!selectedProduct) return setAiError('상품을 먼저 선택해주세요.')
    setAiLoading(true); setAiError('')
    try {
      const html = manualBlocks.map((b, idx) => {
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
      await supabase.from('products').update({ description: html }).eq('id', selectedProduct.id)
      reset(); onDone()
    } catch (e: any) {
      console.error('[supplier manual landing save] failed', e)
      setAiError('상세페이지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
    finally { setAiLoading(false) }
  }

  const reset = () => {
    clearInterval(aiLoadingTimer.current)
    setAiLoading(false); setAiLoadingMsg(''); setAiStep(1); setAiTab('ai')
    setAiImage(null); setAiImagePreview('')
    setAiLandingHtml(''); setAiError(''); setAiSelectedBg('dark'); setShowBuyerPreview(false)
    setSelectedProduct(null); setManualBlocks([])
    setHtmlCode(''); setHtmlProduct(null)
    setImgFiles([]); setImgProduct(null)
  }

  const handleClose = () => { reset(); onClose() }

  const addBlock = (type: 'image' | 'video' | 'text') => setManualBlocks(p => [...p, { id: Date.now(), type, content: '', file: null }])
  const updateBlock = (id: number, content: string) => setManualBlocks(p => p.map(b => b.id === id ? { ...b, content } : b))
  const removeBlock = (id: number) => setManualBlocks(p => p.filter(b => b.id !== id))
  const uploadManualImage = (id: number, file: File) => {
    const reader = new FileReader()
    reader.onload = () => setManualBlocks(p => p.map(b => b.id === id ? { ...b, content: reader.result as string, file } : b))
    reader.readAsDataURL(file)
  }

  const Header = () => (
    <div style={{ height: '52px', background: aiDark ? 'linear-gradient(135deg,#1a1a1a,#2d2d2d)' : 'linear-gradient(135deg,#f5f5f5,#e8e8e8)', borderBottom: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', flexShrink: 0 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <p style={{ color: '#22c55e', fontWeight: 900, fontSize: '14px', margin: 0, flexShrink: 0 }}>✨ 상세페이지 제작</p>
        <div style={{ display: 'flex', gap: '4px', background: aiDark ? 'rgba(255,255,255,0.06)' : '#fafafa', borderRadius: '8px', padding: '3px' }}>
          {[{ k: 'ai', label: '✨ AI 생성' }, { k: 'manual', label: '✏️ 직접 만들기' }, { k: 'html', label: '</> HTML 붙여넣기' }, { k: 'images', label: '🖼 이미지 올리기' }].map(t => (
            <button key={t.k} onClick={() => setAiTab(t.k as any)}
              style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', background: aiTab === t.k ? '#22c55e' : 'transparent', color: aiTab === t.k ? '#111' : aiDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
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
      {/* ── AI 탭 ── */}
      {aiTab === 'ai' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: aiDark ? 'rgba(0,0,0,0.95)' : 'rgba(240,240,240,0.97)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
          <Header />

          {/* STEP 1: 상품 선택 + 이미지 */}
          {aiStep === 1 && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', gap: '20px', minHeight: 0 }}>
              {/* 상품 리스트 */}
              <div style={{ width: isMobile ? '100%' : '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '1px' }}>📦 내 상품 선택</p>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {products.map(p => (
                    <button key={p.id} onClick={() => selectProductForAI(p)}
                      style={{ padding: '10px 12px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', border: '2px solid ' + (selectedProduct?.id === p.id ? '#22c55e' : 'rgba(255,255,255,0.08)'), background: selectedProduct?.id === p.id ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.image_url ? <img src={p.image_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🧺</div>}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ color: aiDark ? 'white' : '#111', fontSize: '12px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                          <p style={{ color: aiDark ? 'rgba(255,255,255,0.4)' : '#666', fontSize: '10px', margin: '2px 0 0' }}>소매 공급가 {p.suggested_retail_price?.toLocaleString()}원</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {products.length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: aiDark ? 'rgba(255,255,255,0.3)' : '#888', fontSize: '12px' }}><p>등록된 상품이 없어요</p></div>}
                </div>
              </div>

              {/* 이미지 + 메타 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '1px' }}>📸 대표 이미지</p>
                <input id="supplier-ai-img" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                {!aiImagePreview ? (
                  <div onClick={() => document.getElementById('supplier-ai-img')?.click()}
                    style={{ height: '180px', border: '2px dashed rgba(34,197,94,0.4)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(34,197,94,0.03)' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📸</div>
                    <p style={{ color: '#22c55e', fontSize: '14px', fontWeight: 700 }}>클릭해서 이미지 올리기</p>
                    <p style={{ color: aiDark ? 'rgba(255,255,255,0.3)' : '#888', fontSize: '11px' }}>JPG · PNG · WEBP</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={aiImagePreview} alt="" style={{ width: '140px', height: '140px', objectFit: 'contain', borderRadius: '12px', background: '#111' }} />
                      <button onClick={() => document.getElementById('supplier-ai-img')?.click()}
                        style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: 'white', fontSize: '10px', cursor: 'pointer' }}>교체</button>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#666', fontSize: '11px', fontWeight: 700, margin: 0 }}>배경색 선택</p>
                      {Object.entries(BG_PRESETS).map(([k, v]) => (
                        <button key={k} onClick={() => setAiSelectedBg(k)} style={{ padding: '8px 12px', borderRadius: '8px', border: '2px solid ' + (aiSelectedBg === k ? '#22c55e' : 'rgba(255,255,255,0.1)'), background: 'transparent', color: aiDark ? 'white' : '#111', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: v.bg, flexShrink: 0 }} />
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 추가 사진 (여러 장 → 원산지·스토리·레시피·보관 섹션 자동 배치) */}
                <div>
                  <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '1px' }}>
                    🖼 추가 사진 <span style={{ fontWeight: 400, letterSpacing: 0, color: aiDark ? 'rgba(255,255,255,0.35)' : '#888' }}>(선택 · 여러 장 올리면 상세페이지가 더 풍성해져요)</span>
                  </p>
                  <input id="supplier-ai-extra" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) addExtraImages(e.target.files); e.target.value = '' }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {aiExtraImages.map(ex => (
                      <div key={ex.id} style={{ position: 'relative', width: '64px', height: '64px' }}>
                        <img src={ex.preview} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', background: '#111' }} />
                        <button onClick={() => removeExtraImage(ex.id)} title="삭제"
                          style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '12px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    ))}
                    <button onClick={() => document.getElementById('supplier-ai-extra')?.click()} title="사진 추가"
                      style={{ width: '64px', height: '64px', borderRadius: '8px', border: '2px dashed rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.03)', color: '#22c55e', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>＋</button>
                  </div>
                </div>

                {/* 메타 정보 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: '상품명', key: 'name', placeholder: '예) 온종일팜 신선상품', full: true },
                    { label: '도매 공급가', key: 'suggested_wholesale_price', placeholder: '원' },
                    { label: '소매 공급가', key: 'suggested_retail_price', placeholder: '원' },
                    { label: '재고', key: 'stock', placeholder: '수량' },
                  ].map(f => (
                    <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : undefined }}>
                      <label style={{ display: 'block', fontSize: '10px', color: aiDark ? 'rgba(255,255,255,0.4)' : '#666', marginBottom: '4px', fontWeight: 700 }}>{f.label}</label>
                      <input value={(aiMeta as any)[f.key]} onChange={e => setAiMeta(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: aiDark ? 'rgba(255,255,255,0.05)' : 'white', color: aiDark ? 'white' : '#111', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>

                {/* 페르소나 */}
                <div>
                  <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '10px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '1px' }}>✍️ 작성 스타일</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[{ k: 'shohost', l: '🎙 홈쇼핑' }, { k: 'grandma', l: '👵 정감있게' }, { k: 'expert', l: '🔬 전문가' }, { k: 'parent', l: '👨‍👩‍👧 가족건강' }].map(p => (
                      <button key={p.k} onClick={() => setAiPersona(p.k)}
                        style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid ' + (aiPersona === p.k ? '#22c55e' : 'rgba(255,255,255,0.1)'), background: aiPersona === p.k ? 'rgba(34,197,94,0.15)' : 'transparent', color: aiPersona === p.k ? '#22c55e' : aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        {p.l}
                      </button>
                    ))}
                  </div>
                </div>

                {aiError && <p style={{ color: '#f87171', fontSize: '12px', margin: 0 }}>{aiError}</p>}

                <button onClick={() => { if (!selectedProduct) return setAiError('상품을 먼저 선택해주세요.'); if (!aiImagePreview) return setAiError('이미지를 먼저 올려주세요.'); setAiStep(2); handleGenerateLanding() }}
                  disabled={aiLoading || !selectedProduct || !aiImagePreview}
                  style={{ padding: '14px', borderRadius: '12px', background: aiLoading || !selectedProduct || !aiImagePreview ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg,#22c55e,#4ade80)', color: aiLoading || !selectedProduct || !aiImagePreview ? 'rgba(255,255,255,0.3)' : '#111', fontSize: '14px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>
                  ✨ AI 상세페이지 생성하기
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 생성 중 */}
          {aiStep === 2 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <div style={{ width: '60px', height: '60px', border: '4px solid rgba(34,197,94,0.2)', borderTop: '4px solid #22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: '#22c55e', fontSize: '16px', fontWeight: 700 }}>{aiLoadingMsg || 'AI가 상세페이지를 만들고 있어요...'}</p>
              {aiError && <p style={{ color: '#f87171', fontSize: '13px' }}>{aiError}</p>}
            </div>
          )}

          {/* STEP 3: 결과 */}
          {aiStep === 3 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              {/* 상단 툴바 - admin과 동일 */}
              <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 700, flexShrink: 0, letterSpacing: '0.05em' }}>디자인</span>
                {TEMPLATES.map((t: any) => (
                  <button key={t.key} onClick={() => handleChangeTemplate(t.key as TemplateKey)} title={t.desc}
                    style={{ padding: '6px 11px', borderRadius: '8px', border: '1.5px solid', borderColor: aiTemplateKey === t.key ? '#22c55e' : 'rgba(255,255,255,0.15)', background: aiTemplateKey === t.key ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.04)', color: aiTemplateKey === t.key ? '#4ade80' : 'rgba(255,255,255,0.6)', fontSize: '11.5px', fontWeight: aiTemplateKey === t.key ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {t.emoji} {t.name}
                  </button>
                ))}
                <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', flexShrink: 0 }}>🎨</span>
                {([
                  { k: 'gold' as PresetKey,  label: '골드',  bg: '#C8842D', border: '#E8B87A' },
                  { k: 'dark' as PresetKey,  label: '검정',  bg: '#0D0D0D', border: '#555' },
                  { k: 'blue' as PresetKey,  label: '파랑',  bg: '#1D4ED8', border: '#60A5FA' },
                  { k: 'red'  as PresetKey,  label: '빨강',  bg: '#DC2626', border: '#F87171' },
                  { k: 'pink' as PresetKey,  label: '핑크',  bg: '#DB2777', border: '#F9A8D4' },
                  { k: 'white' as PresetKey, label: '하양',  bg: '#F5F5F5', border: '#374151' },
                ]).map(t => (
                  <button key={t.k} onClick={() => handleChangePreset(t.k)} title={t.label}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', flexShrink: 0, border: '2px solid ' + (aiPresetKey === t.k ? t.border : 'transparent'), background: t.bg, boxShadow: aiPresetKey === t.k ? `0 0 8px ${t.bg}99` : 'none', transform: aiPresetKey === t.k ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s' }} />
                ))}
                <div style={{ flex: 1 }} />
                <button onClick={() => { setAiStep(1); setAiLandingHtml(''); setAiError('') }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>← 설정</button>
                <button onClick={handleGenerateLanding} disabled={aiLoading} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.5)', background: 'transparent', color: '#22c55e', fontSize: '10px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🔄 재생성</button>
                <button onClick={() => setShowBuyerPreview('mobile')} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(100,200,100,0.4)', background: 'rgba(100,200,100,0.07)', color: '#6ee7b7', fontSize: '10px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>📱 모바일</button>
                <button onClick={() => setShowBuyerPreview('desktop')} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(147,197,253,0.4)', background: 'rgba(147,197,253,0.07)', color: '#93c5fd', fontSize: '10px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🖥️ PC</button>
                <button onClick={handleAiRegister} disabled={aiLoading} style={{ padding: '5px 14px', borderRadius: '6px', background: 'linear-gradient(135deg,#22c55e,#4ade80)', color: '#111', fontSize: '11px', fontWeight: 900, border: 'none', cursor: aiLoading ? 'not-allowed' : 'pointer', opacity: aiLoading ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  {aiLoading ? '저장 중...' : '💾 저장'}
                </button>
              </div>
              {aiError && <p style={{ color: '#f87171', fontSize: '12px', padding: '6px 12px', background: 'rgba(239,68,68,0.1)', margin: 0, flexShrink: 0 }}>{aiError}</p>}

              {/* 미리보기 */}
              <div style={{ flex: 1, overflowY: 'auto', background: '#d0d0d0', display: 'flex', justifyContent: 'center', padding: '16px' }}>
                <div style={{ width: '100%', maxWidth: '390px', background: 'white', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', borderRadius: '16px', overflow: 'hidden' }}>
                  {aiImagePreview && (
                    <div style={{ width: '100%', aspectRatio: '1', background: BG_PRESETS[aiSelectedBg as keyof typeof BG_PRESETS]?.bg || '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={aiImagePreview} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <FloatingToolbar previewId="supplier-landing-preview" />
                  <div id="supplier-landing-preview" contentEditable suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: aiLandingHtml }}
                    style={{ outline: 'none' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 직접 만들기 탭 ── */}
      {aiTab === 'manual' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: aiDark ? 'rgba(0,0,0,0.95)' : 'rgba(240,240,240,0.97)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0', minHeight: 0, overflow: isMobile ? 'auto' : 'hidden' }}>
            {/* 왼쪽 편집 */}
            <div style={{ width: isMobile ? '100%' : '320px', flexShrink: 0, background: aiDark ? '#111' : '#fafafa', borderRight: '1px solid rgba(34,197,94,0.15)', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '1px' }}>📦 상품 선택</p>
                <select value={selectedProduct?.id || ''} onChange={e => { const p = products.find(p => p.id === e.target.value); if (p) selectProductForAI(p) }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: aiDark ? '#1a1a1a' : 'white', color: aiDark ? 'white' : '#111', fontSize: '12px', outline: 'none' }}>
                  <option value="">상품 선택...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ t: 'image' as const, l: '🖼 이미지' }, { t: 'video' as const, l: '🎬 영상' }, { t: 'text' as const, l: '✍️ 텍스트' }].map(({ t, l }) => (
                  <button key={t} onClick={() => addBlock(t)}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.3)', background: 'transparent', color: '#22c55e', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>+ {l}</button>
                ))}
              </div>

              {manualBlocks.map((block, idx) => (
                <div key={block.id} style={{ background: aiDark ? 'rgba(255,255,255,0.04)' : 'white', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#22c55e', fontSize: '11px', fontWeight: 700 }}>#{idx + 1} {block.type === 'image' ? '🖼 이미지' : block.type === 'video' ? '🎬 영상' : '✍️ 텍스트'}</span>
                    <button onClick={() => removeBlock(block.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                  </div>
                  {block.type === 'image' && (
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadManualImage(block.id, f) }} />
                      <div style={{ width: '100%', height: '40px', borderRadius: '6px', border: '2px dashed rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(34,197,94,0.6)', fontSize: '12px' }}>
                        {block.content ? '✅ 이미지 선택됨' : '클릭해서 이미지 선택'}
                      </div>
                    </label>
                  )}
                  {block.type === 'video' && (
                    <input value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="YouTube URL 입력"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: aiDark ? 'rgba(255,255,255,0.05)' : 'white', color: aiDark ? 'white' : '#111', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                  )}
                  {block.type === 'text' && (
                    <textarea value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="내용을 입력하세요..." rows={4}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: aiDark ? 'rgba(255,255,255,0.07)' : 'white', color: aiDark ? 'white' : '#111', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
                  )}
                </div>
              ))}

              {aiError && <p style={{ color: '#f87171', fontSize: '12px' }}>{aiError}</p>}
              <button onClick={handleManualRegister} disabled={aiLoading || !selectedProduct}
                style={{ padding: '14px', borderRadius: '12px', background: aiLoading || !selectedProduct ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg,#22c55e,#4ade80)', color: aiLoading || !selectedProduct ? 'rgba(255,255,255,0.3)' : '#111', fontSize: '14px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>
                {aiLoading ? '저장 중...' : '💾 상세페이지 저장'}
              </button>
            </div>

            {/* 오른쪽 미리보기 */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#d0d0d0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '16px' }}>
              <div style={{ width: '100%', maxWidth: '390px', background: 'white', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px' }}>
                {selectedProduct?.image_url && (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                {manualBlocks.map(block => (
                  <div key={block.id}>
                    {block.type === 'image' && block.content && <img src={block.content} alt="" style={{ width: '100%', display: 'block' }} />}
                    {block.type === 'video' && block.content && (
                      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                        <iframe src={getYoutubeEmbedUrl(block.content)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                      </div>
                    )}
                    {block.type === 'text' && block.content && (
                      <div style={{ padding: '28px 24px', fontSize: '15px', lineHeight: 2, background: '#fff', borderBottom: '8px solid #f5f5f5' }} dangerouslySetInnerHTML={{ __html: block.content.split('\n').join('<br/>') }} />
                    )}
                  </div>
                ))}
                {manualBlocks.length === 0 && <div style={{ padding: '40px 24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>왼쪽에서 섹션을 추가하면 미리볼 수 있어요</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 구매자 미리보기 ── */}
      {showBuyerPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#111', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, flex: 1 }}>
              {showBuyerPreview === 'mobile' ? '📱 모바일 미리보기' : '🖥️ PC 미리보기'}
            </p>
            <button onClick={() => setShowBuyerPreview('mobile')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: showBuyerPreview === 'mobile' ? '#6ee7b7' : 'rgba(255,255,255,0.1)', color: showBuyerPreview === 'mobile' ? '#111' : 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>📱</button>
            <button onClick={() => setShowBuyerPreview('desktop')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: showBuyerPreview === 'desktop' ? '#93c5fd' : 'rgba(255,255,255,0.1)', color: showBuyerPreview === 'desktop' ? '#111' : 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>🖥️</button>
            <button onClick={() => setShowBuyerPreview(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '7px 14px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>← 수정으로</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '20px', background: '#1a1a1a' }}>
            {showBuyerPreview === 'mobile' ? (
              <div style={{ width: '100%', maxWidth: '390px', minHeight: '844px', background: 'white', borderRadius: '36px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.8)', border: '8px solid #333', flexShrink: 0 }}>
                {aiImagePreview && <div style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG_PRESETS[aiSelectedBg as keyof typeof BG_PRESETS]?.bg || '#0d0d0d' }}><img src={aiImagePreview} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} /></div>}
                <div dangerouslySetInnerHTML={{ __html: aiLandingHtml }} />
              </div>
            ) : (
              <div style={{ width: '100%', maxWidth: '1200px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div dangerouslySetInnerHTML={{ __html: aiLandingHtml }} />
              </div>
            )}
          </div>
        </div>
      )}

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
                  <button onClick={() => { const el = document.getElementById('html-preview'); if (el) el.innerHTML = htmlCode }} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(34,197,94,0.2)', border: 'none', color: '#22c55e', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>미리보기 갱신</button>
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
                    console.error('[supplier html save] failed', e)
                    setAiError('상세페이지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
                  }
                  finally { setAiLoading(false) }
                }}
                disabled={aiLoading || !htmlProduct || !htmlCode.trim()}
                style={{ padding: '14px', borderRadius: '12px', background: aiLoading || !htmlProduct || !htmlCode.trim() ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg,#22c55e,#4ade80)', color: aiLoading || !htmlProduct || !htmlCode.trim() ? 'rgba(255,255,255,0.3)' : '#111', fontSize: '14px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>
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
                <div id="html-preview" dangerouslySetInnerHTML={{ __html: htmlCode }} style={{ fontSize: '13px' }} />
                {!htmlCode && <div style={{ padding: '40px 24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>HTML 코드를 붙여넣고 "미리보기 갱신"을 눌러보세요</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 이미지 다중 업로드 탭 ── */}
      {aiTab === 'images' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: aiDark ? 'rgba(0,0,0,0.95)' : 'rgba(240,240,240,0.97)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 0, minHeight: 0, overflow: isMobile ? 'auto' : 'hidden' }}>
            {/* 왼쪽 편집 */}
            <div style={{ width: isMobile ? '100%' : '360px', flexShrink: 0, background: aiDark ? '#111' : '#fafafa', borderRight: '1px solid rgba(34,197,94,0.15)', display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflowY: 'auto' }}>
              <div>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '1px' }}>📦 상품 선택</p>
                <select value={imgProduct?.id || ''} onChange={e => { const p = products.find(p => p.id === e.target.value); setImgProduct(p || null) }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: aiDark ? '#1a1a1a' : 'white', color: aiDark ? 'white' : '#111', fontSize: '13px', outline: 'none' }}>
                  <option value="">상품 선택...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* 이미지 업로드 영역 */}
              <div>
                <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '1px' }}>🖼 상세페이지 이미지 (여러 장)</p>
                <input id="multi-img-input" type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={e => {
                    const files = Array.from(e.target.files || [])
                    files.forEach(file => {
                      const reader = new FileReader()
                      reader.onload = () => setImgFiles(prev => [...prev, { id: Date.now() + Math.random(), file, preview: reader.result as string }])
                      reader.readAsDataURL(file)
                    })
                    e.target.value = ''
                  }}
                />
                <div onClick={() => document.getElementById('multi-img-input')?.click()}
                  style={{ border: '2px dashed rgba(34,197,94,0.4)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(34,197,94,0.03)' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>📁</div>
                  <p style={{ color: '#22c55e', fontSize: '13px', fontWeight: 700, margin: '0 0 4px' }}>클릭해서 이미지 추가</p>
                  <p style={{ color: aiDark ? 'rgba(255,255,255,0.3)' : '#888', fontSize: '11px', margin: 0 }}>여러 장 동시 선택 가능 · JPG / PNG / WEBP</p>
                </div>
              </div>

              {/* 업로드된 이미지 목록 */}
              {imgFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', fontSize: '11px', fontWeight: 700, margin: 0 }}>순서 조정 (드래그 예정)</p>
                    <button onClick={() => setImgFiles([])} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}>전체 삭제</button>
                  </div>
                  {imgFiles.map((img, idx) => (
                    <div key={img.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: aiDark ? 'rgba(255,255,255,0.04)' : 'white', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '8px 10px' }}>
                      <span style={{ color: aiDark ? 'rgba(255,255,255,0.3)' : '#888', fontSize: '11px', fontWeight: 700, width: '20px', textAlign: 'center' }}>{idx + 1}</span>
                      <img src={img.preview} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '11px', color: aiDark ? 'rgba(255,255,255,0.5)' : '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.file.name}</span>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button onClick={() => setImgFiles(p => { const a = [...p]; if (idx > 0) { [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; } return a; })} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                        <button onClick={() => setImgFiles(p => { const a = [...p]; if (idx < a.length-1) { [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; } return a; })} disabled={idx === imgFiles.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: idx === imgFiles.length - 1 ? 0.3 : 1 }}>↓</button>
                        <button onClick={() => setImgFiles(p => p.filter(f => f.id !== img.id))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px', padding: '10px 12px', fontSize: '11px', color: aiDark ? 'rgba(255,255,255,0.4)' : '#666', lineHeight: 1.6 }}>
                💡 상세페이지 이미지를 순서대로 올리면 자동으로 세로로 쌓아서 저장됩니다
              </div>

              {aiError && <p style={{ color: '#f87171', fontSize: '12px', margin: 0 }}>{aiError}</p>}

              <button
                onClick={async () => {
                  if (!imgProduct) return setAiError('상품을 먼저 선택해주세요.')
                  if (imgFiles.length === 0) return setAiError('이미지를 1장 이상 올려주세요.')
                  setAiLoading(true); setAiError('')
                  try {
                    // 각 이미지를 Supabase Storage에 업로드
                    const uploadedUrls: string[] = []
                    for (const img of imgFiles) {
                      const ext = img.file.name.split('.').pop() || 'jpg'
                      const fn = `detail_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
                      const { error: upErr } = await supabase.storage.from('products').upload(fn, img.file, { upsert: true })
                      if (!upErr) {
                        const url = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
                        uploadedUrls.push(url)
                      }
                    }
                    // 이미지들을 세로로 쌓는 HTML 생성
                    const html = uploadedUrls.map(url =>
                      `<div style="width:100%;overflow:hidden;"><img src="${url}" style="width:100%;display:block;" /></div>`
                    ).join('')
                    await supabase.from('products').update({ description: html }).eq('id', imgProduct.id)
                    reset(); onDone()
                  } catch (e: any) {
                    console.error('[supplier image landing save] failed', e)
                    setAiError('상세페이지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
                  }
                  finally { setAiLoading(false) }
                }}
                disabled={aiLoading || !imgProduct || imgFiles.length === 0}
                style={{ padding: '14px', borderRadius: '12px', background: aiLoading || !imgProduct || imgFiles.length === 0 ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg,#22c55e,#4ade80)', color: aiLoading || !imgProduct || imgFiles.length === 0 ? 'rgba(255,255,255,0.3)' : '#111', fontSize: '14px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>
                {aiLoading ? '업로드 중...' : `💾 이미지 ${imgFiles.length}장으로 상세페이지 저장`}
              </button>
            </div>

            {/* 오른쪽 미리보기 */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#d0d0d0', display: 'flex', justifyContent: 'center', padding: '16px' }}>
              <div style={{ width: '100%', maxWidth: '390px', background: 'white', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px' }}>
                {imgProduct?.image_url && (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={imgProduct.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                {imgFiles.map((img, idx) => (
                  <div key={img.id}>
                    <img src={img.preview} alt={`${idx+1}`} style={{ width: '100%', display: 'block' }} />
                  </div>
                ))}
                {imgFiles.length === 0 && <div style={{ padding: '40px 24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>이미지를 올리면 여기서 미리볼 수 있어요</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
