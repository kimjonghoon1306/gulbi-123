'use client'

// ─────────────────────────────────────────────────────────────
// 상세페이지 에디터 공용 로직 훅
//
// ★ 목적: 옛 AiLandingEditor.tsx 의 검증된 로직(생성·저장·연결)을 그대로 담아
//   새 에디터(AiLandingStudio)가 재사용한다. 옛 파일은 손대지 않는다(백업).
//   → 두 에디터의 "연결(generate-landing 호출 · renderLanding · products.description 저장)"
//     이 100% 동일하게 유지된다.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { renderLanding, type PresetKey, type TemplateKey, type LandingData } from '@/lib/landing-templates'
import { type LandingBasicInfo, type ProductGroup, type FreshType } from '@/app/components/LandingBasicInfoFields'

export type Product = {
  id: string; name: string; description: string
  origin?: string | null
  category_id: string; wholesale_price: number; member_price: number; retail_price: number
  stock: number; unit: string; image_url: string; is_active: boolean
}

export type EditorTab = 'ai' | 'manual' | 'html'
export type ManualBlock = { id: number; type: 'image' | 'video' | 'text'; content: string; file: File | null }

export function useLandingEditor(opts: {
  show: boolean
  products: Product[]
  onDone: () => void
  initialProduct?: Product | null
}) {
  const { show, products, onDone, initialProduct } = opts
  const supabase = createClient()

  const [aiTab, setAiTab] = useState<EditorTab>('ai')
  const [aiStep, setAiStep] = useState<1 | 2 | 3>(1)
  const [aiChoice, setAiChoice] = useState(false)
  const [aiDark, setAiDark] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [aiImage, setAiImage] = useState<File | null>(null)
  const [aiImagePreview, setAiImagePreview] = useState('')
  const [aiExtraImages, setAiExtraImages] = useState<{ id: number; file: File; preview: string }[]>([])
  const [aiBgRemovedPreview, setAiBgRemovedPreview] = useState('')
  const [aiBgRemovedBase64, setAiBgRemovedBase64] = useState('')
  const [aiSelectedBg, setAiSelectedBg] = useState('dark')
  const [aiBgLoading, setAiBgLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSaving, setAiSaving] = useState(false)
  const [aiLoadingMsg, setAiLoadingMsg] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiPersona, setAiPersona] = useState('shohost')
  const [aiMeta, setAiMeta] = useState({ name: '', origin: '', category_id: '', unit: 'kg', wholesale_price: '', member_price: '', retail_price: '', stock: '' })
  const [productGroup, setProductGroup] = useState<ProductGroup>('')
  const [freshType, setFreshType] = useState<FreshType>('')
  const [shipCutoff, setShipCutoff] = useState('')
  const [hasHaccp, setHasHaccp] = useState(false)
  const [haccpNo, setHaccpNo] = useState('')
  const [basicInfo, setBasicInfo] = useState<LandingBasicInfo>({})
  const [basicInfoLoading, setBasicInfoLoading] = useState(false)
  const [aiLandingHtml, setAiLandingHtml] = useState('')
  const [aiLandingData, setAiLandingData] = useState<LandingData | null>(null)
  const [aiPresetKey, setAiPresetKey] = useState<PresetKey>('gold' as PresetKey)
  const [aiTemplateKey, setAiTemplateKey] = useState<TemplateKey>('premium')
  const [manualBlocks, setManualBlocks] = useState<ManualBlock[]>([])
  const [htmlCode, setHtmlCode] = useState('')
  const [htmlProduct, setHtmlProduct] = useState<Product | null>(null)
  const aiLoadingTimer = useRef<any>(null)

  // ── 진입: 상품 지정 시 수정/새로만들기 선택 ─────────────────
  // ★ initialProduct는 "다른 상품으로 새로 열 때"만 재초기화한다.
  //   remakeDetail이 description을 나중에 비동기로 채워 같은 상품 객체를 다시 넘겨도
  //   (id가 같으면) 재초기화하지 않는다 → 생성 중 에디터가 1단계로 리셋되어 "튕기는" 버그 방지.
  const initedIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (show && initialProduct) {
      if (initedIdRef.current === initialProduct.id) {
        // 같은 상품: description이 뒤늦게 도착한 경우에만 수정용 HTML만 갱신(단계·상태는 유지)
        if (initialProduct.description?.trim() && !aiLandingHtml && aiStep === 3) {
          setAiLandingHtml(initialProduct.description)
        }
        return
      }
      initedIdRef.current = initialProduct.id
      selectProductForAI(initialProduct)
      const hasDetail = !!(initialProduct.description && initialProduct.description.trim())
      setAiChoice(hasDetail)
      if (!hasDetail) setAiStep(1)
    } else if (!show) {
      initedIdRef.current = null
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

  // ── helpers ────────────────────────────────────────────────
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

  // ── 기본정보 초안 ──────────────────────────────────────────
  const autoFillBasicInfo = async () => {
    if (!productGroup) return setAiError('상품군을 먼저 선택해주세요.')
    if (!aiImage && !selectedProduct?.image_url) return setAiError('대표 이미지를 먼저 준비해주세요.')
    setBasicInfoLoading(true); setAiError('')
    try {
      const images: { base64: string; mimeType: string }[] = []
      if (aiImage) images.push(await resizeImg(aiImage))
      // 업로드 이미지가 없으면 기존 대표이미지 URL을 받아 클라이언트에서 축소해 전송.
      // (원본이 20MB 넘는 경우가 있어 서버가 그대로 fetch하면 8MB 초과로 실패 → 여기서 1024px로 줄임)
      else if (selectedProduct?.image_url) {
        try {
          const imgRes = await fetch(selectedProduct.image_url)
          if (imgRes.ok) {
            const blob = await imgRes.blob()
            images.push(await resizeImg(new File([blob], 'product.jpg', { type: blob.type || 'image/jpeg' })))
          }
        } catch { /* 실패 시 아래 length 체크에서 안내 */ }
      }
      for (const extra of aiExtraImages) images.push(await resizeImg(extra.file))
      if (images.length === 0) { setBasicInfoLoading(false); return setAiError('대표 이미지를 불러오지 못했어요. 사진을 새로 올려주세요.') }
      const response = await fetch('/api/generate-landing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'basic-info', images, productName: aiMeta.name, productGroup, freshType }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setBasicInfo(data.basicInfo || {})
    } catch {
      setAiError('이미지는 등록됐지만 기본정보 초안은 만들지 못했어요. 직접 입력하거나 다시 올려주세요.')
    } finally { setBasicInfoLoading(false) }
  }

  // ── 이미지 업로드 + 배경제거 ───────────────────────────────
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
    setProductGroup(''); setBasicInfo({})
    setAiMeta({ name: p.name, origin: p.origin || '', category_id: p.category_id || '', unit: p.unit || 'kg', wholesale_price: String(p.wholesale_price || ''), member_price: String(p.member_price || ''), retail_price: String(p.retail_price || ''), stock: String(p.stock || '') })
    if (p.image_url) { setAiImagePreview(p.image_url); setAiBgRemovedPreview(p.image_url) }
    setAiExtraImages([])
  }

  // ── AI 생성 ────────────────────────────────────────────────
  const handleGenerateLanding = async () => {
    if (basicInfoLoading) return setAiError('상품 기본정보 초안이 완성될 때까지 잠시만 기다려주세요.')
    if (!aiImage && !selectedProduct?.image_url) return setAiError('이미지를 먼저 올려주세요.')
    setAiLoading(true); setAiError('')
    const steps = ['🔍 이미지 분석 중...', '✍️ 상품 스토리 작성 중...', '📋 특징 · 비교표 정리 중...', '⭐ 후기 · FAQ 작성 중...', '🎨 상세페이지 완성 중...']
    let idx = 0; setAiLoadingMsg(steps[0])
    aiLoadingTimer.current = setInterval(() => { idx = Math.min(idx + 1, steps.length - 1); setAiLoadingMsg(steps[idx]) }, 5000)
    try {
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
      for (const ex of aiExtraImages) { try { images.push(await resizeImg(ex.file)) } catch { /* skip */ } }
      if (images.length === 0) { setAiLoading(false); return setAiError('이미지가 준비되지 않았어요.') }

      const res = await fetch('/api/generate-landing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, persona: aiPersona, productName: aiMeta.name, origin: aiMeta.origin, retailPrice: aiMeta.retail_price, wholesalePrice: aiMeta.wholesale_price, unit: aiMeta.unit, productGroup, freshType, shipCutoff, hasHaccp, haccpNo, basicInfo })
      })
      const data = await res.json()
      if (data.error) { console.error('[studio generate] failed', data); return setAiError('상세페이지 생성에 실패했습니다. 서버 로그를 확인해 주세요.') }
      setAiLandingData(data.data || null)
      setAiLandingHtml(data.html)
      setAiPresetKey((data.presetKey as PresetKey) || 'gold'); setAiTemplateKey((data.templateKey as TemplateKey) || 'premium')
      setAiStep(3)
    } catch (e: any) {
      console.error('[studio generate] unexpected error', e)
      setAiError('상세페이지 생성 중 오류가 발생했습니다. 서버 로그를 확인해 주세요.')
    }
    finally { setAiLoading(false); clearInterval(aiLoadingTimer.current); setAiLoadingMsg('') }
  }

  // ── 컨셉(템플릿)/배색 변경 → 미리보기 갱신 ─────────────────
  const applyRender = (data: LandingData, preset: PresetKey, template: TemplateKey) => {
    const html = renderLanding(data, preset, template)
    setAiLandingHtml(html)
    const el = document.getElementById('landing-preview'); if (el) el.innerHTML = html
    return html
  }
  const handleChangePreset = (key: PresetKey) => { if (!aiLandingData) return; applyRender(aiLandingData, key, aiTemplateKey); setAiPresetKey(key) }
  const handleChangeTemplate = (key: TemplateKey) => { if (!aiLandingData) return; applyRender(aiLandingData, aiPresetKey, key); setAiTemplateKey(key) }

  // ── 저장 (AI) → products.description ───────────────────────
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
      console.error('[studio save] failed', e)
      setAiError('상세페이지 저장에 실패했습니다. 서버 로그를 확인해 주세요.')
    }
    finally { setAiSaving(false) }
  }

  // ── 직접 만들기 ────────────────────────────────────────────
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
      console.error('[studio manual save] failed', e)
      setAiError('상세페이지 저장에 실패했습니다. 서버 로그를 확인해 주세요.')
    }
    finally { setAiLoading(false) }
  }

  const addBlock = (type: 'image' | 'video' | 'text') => setManualBlocks(p => [...p, { id: Date.now(), type, content: '', file: null }])
  const updateBlock = (id: number, content: string) => setManualBlocks(p => p.map(b => b.id === id ? { ...b, content } : b))
  const removeBlock = (id: number) => setManualBlocks(p => p.filter(b => b.id !== id))
  const uploadManualImage = (id: number, file: File) => {
    const reader = new FileReader()
    reader.onload = () => setManualBlocks(p => p.map(b => b.id === id ? { ...b, content: reader.result as string, file } : b))
    reader.readAsDataURL(file)
  }

  // ── 코드로 만들기 저장 ─────────────────────────────────────
  const handleHtmlRegister = async () => {
    if (!htmlProduct) return setAiError('상품을 먼저 선택해주세요.')
    if (!htmlCode.trim()) return setAiError('HTML 코드를 입력해주세요.')
    setAiLoading(true); setAiError('')
    try {
      await supabase.from('products').update({ description: htmlCode }).eq('id', htmlProduct.id)
      reset(); onDone()
    } catch (e: any) {
      console.error('[studio html save] failed', e)
      setAiError('상세페이지 저장에 실패했습니다. 서버 로그를 확인해 주세요.')
    }
    finally { setAiLoading(false) }
  }

  const reset = () => {
    clearInterval(aiLoadingTimer.current)
    setAiLoading(false); setAiLoadingMsg(''); setAiStep(1); setAiTab('ai'); setAiChoice(false)
    setAiImage(null); setAiImagePreview(''); setAiBgRemovedPreview(''); setAiBgRemovedBase64(''); setAiExtraImages([])
    setAiLandingHtml(''); setAiError(''); setAiSelectedBg('dark')
    setSelectedProduct(null); setManualBlocks([])
    setProductGroup(''); setBasicInfo({})
    setHtmlCode(''); setHtmlProduct(null)
  }

  return {
    supabase, products, onDone,
    // state
    aiTab, setAiTab, aiStep, setAiStep, aiChoice, setAiChoice, aiDark, setAiDark,
    selectedProduct, setSelectedProduct, aiImage, aiImagePreview, aiExtraImages,
    aiBgRemovedPreview, aiBgRemovedBase64, aiSelectedBg, setAiSelectedBg, aiBgLoading,
    aiLoading, aiSaving, aiLoadingMsg, aiError, setAiError,
    aiPersona, setAiPersona, aiMeta, setAiMeta, productGroup, setProductGroup, freshType, setFreshType,
    shipCutoff, setShipCutoff, hasHaccp, setHasHaccp, haccpNo, setHaccpNo,
    basicInfo, setBasicInfo, basicInfoLoading,
    aiLandingHtml, setAiLandingHtml, aiLandingData, aiPresetKey, aiTemplateKey,
    manualBlocks, htmlCode, setHtmlCode, htmlProduct, setHtmlProduct,
    // handlers
    startEditExisting, startMakeNew, resizeImg, autoFillBasicInfo, handleImageUpload,
    addExtraImages, removeExtraImage, selectProductForAI, handleGenerateLanding,
    handleChangePreset, handleChangeTemplate, handleAiRegister, buildManualHtml,
    handleManualRegister, addBlock, updateBlock, removeBlock, uploadManualImage,
    handleHtmlRegister, reset, initialProduct,
  }
}
