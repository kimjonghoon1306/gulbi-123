'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import EditorToolbar from './components/EditorToolbar'

type Category = { id: string; name: string; sort_order: number }
type Product = {
  id: string; name: string; description: string
  category_id: string; wholesale_price: number; member_price: number; retail_price: number
  stock: number; unit: string; image_url: string; is_active: boolean
}

const BG_PRESETS = {
  dark:  { label:'블랙',  bg:'#0d0d0d' },
  warm:  { label:'골드',  bg:'linear-gradient(160deg,#1a0e08,#3d2010)' },
  white: { label:'화이트', bg:'#f5f5f5' },
}

export default function ProductsPage() {
  const [tab, setTab] = useState<'products' | 'categories'>('products')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [catName, setCatName] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', category_id: '', wholesale_price: '',
    member_price: '', retail_price: '', stock: '', unit: 'kg', image_url: '', is_active: true
  })
  const [showAiForm, setShowAiForm] = useState(false)
  const [aiTab, setAiTab] = useState<'ai'|'manual'>('ai')
  const [aiStep, setAiStep] = useState<1|2|3>(1)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [manualBlocks, setManualBlocks] = useState<{id:number,type:'image'|'video'|'text',content:string,file:File|null}[]>([])
  const [aiImage, setAiImage] = useState<File | null>(null)
  const [aiImagePreview, setAiImagePreview] = useState('')
  const [aiBgRemovedPreview, setAiBgRemovedPreview] = useState('')
  const [aiBgRemovedBase64, setAiBgRemovedBase64] = useState('')
  const [aiSelectedBg, setAiSelectedBg] = useState('dark')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiBgLoading, setAiBgLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiLandingHtml, setAiLandingHtml] = useState('')
  const [aiPersona, setAiPersona] = useState('shohost')
  const [aiMeta, setAiMeta] = useState({name:'',category_id:'',unit:'kg',wholesale_price:'',member_price:'',retail_price:'',stock:''})
  const [aiDark, setAiDark] = useState(true)
  const [showBuyerPreview, setShowBuyerPreview] = useState<'mobile'|'desktop'|false>(false)
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [unsplashResults, setUnsplashResults] = useState<any[]>([])
  const [unsplashLoading, setUnsplashLoading] = useState(false)
  const [showUnsplash, setShowUnsplash] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('created_at', { ascending: false })
    ])
    setCategories(cats || [])
    setProducts(prods || [])
    setLoading(false)
  }

  const resizeImg = (file: File): Promise<{base64:string;mimeType:string}> =>
    new Promise(resolve => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1024; let {width: w, height: h} = img
        if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h*MAX/w); w=MAX } else { w=Math.round(w*MAX/h); h=MAX } }
        const c = document.createElement('canvas'); c.width=w; c.height=h
        c.getContext('2d')!.drawImage(img,0,0,w,h)
        const d = c.toDataURL('image/jpeg',0.85)
        resolve({base64:d.split(',')[1], mimeType:'image/jpeg'})
      }
      img.src=url
    })

  const handleImageUpload = async (file: File) => {
    setAiImage(file); setAiBgLoading(true); setAiError('')
    try {
      const {base64, mimeType} = await resizeImg(file)
      const originalUrl = 'data:' + mimeType + ';base64,' + base64
      setAiImagePreview(originalUrl)
      const res = await fetch('/api/remove-bg', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({base64, mimeType})
      })
      const data = await res.json()
      if (data.error) {
        setAiError('배경제거 실패 — 원본으로 진행해요')
        setAiBgRemovedPreview(originalUrl)
        setAiBgRemovedBase64(base64)
      } else {
        setAiBgRemovedPreview('data:image/png;base64,' + data.base64)
        setAiBgRemovedBase64(data.base64)
      }
    } catch { setAiError('배경제거 실패 — 원본으로 진행해요') }
    finally { setAiBgLoading(false) }
  }

  const selectProductForAI = (product: any) => {
    setSelectedProduct(product)
    setAiMeta({
      name: product.name,
      category_id: product.category_id || '',
      unit: product.unit || 'kg',
      wholesale_price: String(product.wholesale_price || ''),
      member_price: String(product.member_price || ''),
      retail_price: String(product.retail_price || ''),
      stock: String(product.stock || ''),
    })
    if (product.image_url) {
      setAiImagePreview(product.image_url)
      setAiBgRemovedPreview(product.image_url)
    }
  }

  const getYoutubeEmbedUrl = (url: string): string => {
    const regexes = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/embed\/([^?]+)/,
    ]
    for (const regex of regexes) {
      const match = url.match(regex)
      if (match) return 'https://www.youtube.com/embed/' + match[1]
    }
    return url
  }

  const addManualBlock = (type: 'image'|'video'|'text') => {
    setManualBlocks(prev => [...prev, {id:Date.now(), type, content:'', file:null}])
  }

  const updateManualBlock = (id: number, content: string) => {
    setManualBlocks(prev => prev.map(b => b.id===id ? {...b, content} : b))
  }

  const removeManualBlock = (id: number) => {
    setManualBlocks(prev => prev.filter(b => b.id!==id))
  }

  const handleManualImageUpload = (id: number, file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setManualBlocks(prev => prev.map(b => b.id===id ? {...b, content: reader.result as string, file} : b))
    }
    reader.readAsDataURL(file)
  }

  const handleManualRegister = async () => {
    if (!selectedProduct) return setAiError('상품을 먼저 선택해주세요.')
    setAiLoading(true); setAiError('')
    try {
      const html = manualBlocks.map((b, idx) => {
        if (!b.content) return ''
        if (b.type==='image') return '<div style="width:100%;overflow:hidden;"><img src="' + b.content + '" style="width:100%;display:block;object-fit:cover;" /></div>'
        if (b.type==='video') {
          const isYT = b.content.includes('youtube') || b.content.includes('youtu.be')
          if (isYT) { const eu = getYoutubeEmbedUrl(b.content); return '<div style="width:100%;position:relative;padding-bottom:56.25%;background:#000;"><iframe src="' + eu + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe></div>' }
          return '<div style="width:100%;background:#000;"><video controls style="width:100%;display:block;"><source src="' + b.content + '" /></video></div>'
        }
        if (b.type==='text') {
          const bg = idx === 0 ? 'background:linear-gradient(135deg,#1a1a1a,#2d2d2d);color:white;' : 'background:#fff;border-bottom:8px solid #f5f5f5;'
          return '<div style="padding:28px 24px;font-size:15px;line-height:2;' + bg + '">' + b.content.split('\n').join('<br/>') + '</div>'
        }
        return ''
      }).filter(Boolean).join('')
      await supabase.from('products').update({ description: html }).eq('id', selectedProduct.id)
      resetAiForm(); fetchAll()
    } catch(e:any) { setAiError('저장 오류: ' + e.message) }
    finally { setAiLoading(false) }
  }

  const handleGenerateLanding = async () => {
    if (!aiImage && !selectedProduct?.image_url) return setAiError('[v3] 이미지를 먼저 올려주세요.')
    setAiLoading(true); setAiError('')
    try {
      let base64 = ''
      let mimeType = 'image/jpeg'

      // 우선순위: 배경제거된 이미지 > 새로 업로드한 이미지 > 기존 상품 이미지 URL
      if (aiBgRemovedBase64) {
        base64 = aiBgRemovedBase64
        mimeType = 'image/png'
      } else if (aiImage) {
        const resized = await resizeImg(aiImage)
        base64 = resized.base64
        mimeType = resized.mimeType
      } else if (selectedProduct?.image_url) {
        // 기존 상품 이미지 URL을 fetch해서 base64로 변환
        try {
          const imgRes = await fetch(selectedProduct.image_url)
          if (!imgRes.ok) throw new Error('이미지 로드 실패')
          const blob = await imgRes.blob()
          mimeType = blob.type || 'image/jpeg'
          const file = new File([blob], 'product.jpg', { type: mimeType })
          const resized = await resizeImg(file)
          base64 = resized.base64
          mimeType = resized.mimeType
        } catch (fetchErr: any) {
          setAiLoading(false)
          return setAiError('[v3] 상품 이미지를 불러올 수 없어요. 이미지를 새로 업로드해주세요.')
        }
      }

      if (!base64) {
        setAiLoading(false)
        return setAiError('[v3] 이미지가 준비되지 않았어요. 이미지를 업로드해주세요.')
      }

      const res = await fetch('/api/generate-landing', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          base64,
          mimeType,
          persona: aiPersona, theme: 'premium',
          productName: aiMeta.name,
          retailPrice: aiMeta.retail_price,
          wholesalePrice: aiMeta.wholesale_price,
          unit: aiMeta.unit,
        })
      })
      const data = await res.json()
      if (data.error) return setAiError(data.error)
      setAiLandingHtml(data.html)
      setAiStep(3)
    } catch(e:any) { setAiError('[v3] 오류: ' + e.message) }
    finally { setAiLoading(false) }
  }

  const translateToEnglish = async (query: string): Promise<string> => {
    const dict: Record<string,string> = {
      '조리법':'cooking recipe','조리':'cooking','요리':'food cooking','보관':'food storage',
      '굴비':'dried yellow corvina fish','수산물':'seafood','생선':'fish','해산물':'seafood',
      '김치':'kimchi','나물':'korean vegetables','된장':'doenjang soybean paste',
      '포장':'packaging gift box','배송':'delivery shipping','냉동':'frozen food',
      '신선':'fresh food','건어물':'dried fish','소금':'salt','전통':'traditional korean',
    }
    for (const [ko, en] of Object.entries(dict)) {
      if (query.includes(ko)) return en
    }
    if (/[가-힣]/.test(query)) return 'korean food ' + query
    return query
  }

  const searchUnsplash = async () => {
    if (!unsplashQuery.trim()) return
    setUnsplashLoading(true)
    try {
      const translated = await translateToEnglish(unsplashQuery)
      const res = await fetch('/api/unsplash-search?q=' + encodeURIComponent(translated))
      const data = await res.json()
      setUnsplashResults(data.results || [])
    } catch(e) { console.error(e) }
    finally { setUnsplashLoading(false) }
  }

  const insertUnsplashImage = (imgUrl: string) => {
    const preview = document.getElementById('landing-preview')
    if (!preview) return
    const imgHtml = '<div style="width:100%;margin:16px 0;border-radius:12px;overflow:hidden;"><img src="' + imgUrl + '" style="width:100%;display:block;object-fit:cover;" /></div>'
    preview.insertAdjacentHTML('beforeend', imgHtml)
    setShowUnsplash(false); setUnsplashResults([]); setUnsplashQuery('')
  }

  const handleAiRegister = async () => {
    setAiLoading(true); setAiError('')
    try {
      let mainImgUrl = ''
      if (aiImage) {
        const ext = aiBgRemovedBase64 ? 'png' : (aiImage.name.split('.').pop()||'jpg')
        const fn = Date.now() + '.' + ext
        let blob: Blob = aiImage
        if (aiBgRemovedBase64) {
          const bytes = atob(aiBgRemovedBase64)
          const arr = new Uint8Array(bytes.length)
          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
          blob = new Blob([arr], {type:'image/png'})
        }
        const {error:upErr} = await supabase.storage.from('products').upload(fn, blob, {upsert:true})
        if (!upErr) mainImgUrl = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
      }
      const previewEl = document.getElementById('landing-preview')
      const finalHtml = previewEl ? previewEl.innerHTML : aiLandingHtml
      await supabase.from('products').insert({
        name: aiMeta.name || '상품',
        description: finalHtml,
        category_id: aiMeta.category_id || null,
        wholesale_price: Number(aiMeta.wholesale_price)||0,
        retail_price: Number(aiMeta.retail_price)||0,
        stock: Number(aiMeta.stock)||0,
        unit: aiMeta.unit||'개',
        member_price: Number(aiMeta.member_price)||0,
        image_url: mainImgUrl,
        is_active: true,
      })
      setShowAiForm(false); setAiStep(1)
      setAiImage(null); setAiImagePreview(''); setAiBgRemovedPreview(''); setAiBgRemovedBase64('')
      setAiLandingHtml(''); setAiError(''); setAiSelectedBg('dark')
      setShowBuyerPreview(false); setUnsplashResults([]); setShowUnsplash(false)
      fetchAll()
    } catch(e:any) { setAiError('등록 오류: ' + e.message) }
    finally { setAiLoading(false) }
  }

  const resetAiForm = () => {
    setShowAiForm(false); setAiStep(1); setAiTab('ai')
    setAiImage(null); setAiImagePreview(''); setAiBgRemovedPreview(''); setAiBgRemovedBase64('')
    setAiLandingHtml(''); setAiError(''); setAiSelectedBg('dark')
    setShowBuyerPreview(false); setUnsplashResults([]); setShowUnsplash(false)
    setSelectedProduct(null); setManualBlocks([])
  }

  const handleFormImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const fn = Date.now() + '.' + (f.name.split('.').pop()||'jpg')
    const {error} = await supabase.storage.from('products').upload(fn, f, {upsert:true})
    if (!error) {
      const url = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
      setForm(prev => ({...prev, image_url: url}))
    }
  }

  const resetForm = () => {
    setForm({ name: '', description: '', category_id: '', wholesale_price: '', member_price: '', retail_price: '', stock: '', unit: 'kg', image_url: '', is_active: true })
    setEditProduct(null)
    setShowForm(false)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({ name: p.name, description: p.description || '', category_id: p.category_id || '', wholesale_price: String(p.wholesale_price), member_price: String(p.member_price||0), retail_price: String(p.retail_price), stock: String(p.stock), unit: p.unit || 'kg', image_url: p.image_url || '', is_active: p.is_active })
    setShowForm(true)
  }

  const saveProduct = async () => {
    const data = { ...form, wholesale_price: Number(form.wholesale_price), member_price: Number(form.member_price)||0, retail_price: Number(form.retail_price), stock: Number(form.stock) }
    if (editProduct) {
      await supabase.from('products').update(data).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert(data)
    }
    resetForm()
    fetchAll()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchAll()
  }

  const saveCat = async () => {
    if (!catName.trim()) return
    if (editCat) {
      await supabase.from('categories').update({ name: catName }).eq('id', editCat.id)
    } else {
      await supabase.from('categories').insert({ name: catName, sort_order: categories.length + 1 })
    }
    setCatName(''); setEditCat(null); setShowCatForm(false); fetchAll()
  }

  const deleteCat = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchAll()
  }

  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || '-'

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">상품관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">수산물 상품 및 카테고리 관리</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setAiStep(1); setAiImage(null); setAiImagePreview(''); setAiBgRemovedPreview(''); setAiBgRemovedBase64(''); setAiLandingHtml(''); setAiError(''); setAiSelectedBg('dark'); setShowUnsplash(false); setShowBuyerPreview(false); setShowAiForm(true) }}
            className="text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
            style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)',boxShadow:'0 4px 15px rgba(236,72,153,0.35)'}}
          >
            ✨ AI 상세페이지
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-sky-500/20"
          >
            + 상품 등록
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[{ key: 'products', label: '🐟 상품 목록' }, { key: 'categories', label: '📂 카테고리 관리' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${tab === t.key ? 'bg-sky-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 border border-slate-100 dark:border-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">불러오는 중...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">
              <p className="text-4xl mb-3">🐟</p>
              <p className="text-sm">등록된 상품이 없습니다</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-gray-700">
                  {['상품명', '카테고리', '도매가', '소매가', '재고', '단위', '상태', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-slate-800 dark:text-white">{p.name}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{getCatName(p.category_id)}</td>
                    <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{p.wholesale_price.toLocaleString()}원</td>
                    <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{p.retail_price.toLocaleString()}원</td>
                    <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{p.stock}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{p.unit}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-gray-700 text-slate-400'}`}>
                        {p.is_active ? '판매중' : '숨김'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-xs text-sky-500 hover:text-sky-600 font-medium">수정</button>
                        <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-400 hover:text-red-500 font-medium">삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setCatName(''); setEditCat(null); setShowCatForm(true) }}
              className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95">
              + 카테고리 추가
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                <span className="text-sm font-medium text-slate-800 dark:text-white">📂 {c.name}</span>
                <div className="flex gap-3">
                  <button onClick={() => { setEditCat(c); setCatName(c.name); setShowCatForm(true) }} className="text-xs text-sky-500 hover:text-sky-600 font-medium">수정</button>
                  <button onClick={() => deleteCat(c.id)} className="text-xs text-red-400 hover:text-red-500 font-medium">삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAiForm && (
        <div style={{position:'fixed',inset:0,zIndex:9999,background:aiDark?'rgba(0,0,0,0.95)':'rgba(240,240,240,0.97)',backdropFilter:'blur(10px)',display:'flex',flexDirection:'column'}}>

          <div style={{height:'52px',background:aiDark?'linear-gradient(135deg,#1a1a1a,#2d2d2d)':'linear-gradient(135deg,#f5f5f5,#e8e8e8)',borderBottom:'1px solid rgba(200,169,110,0.25)',display:'flex',alignItems:'center',padding:'0 16px',gap:'10px',flexShrink:0}}>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:'10px'}}>
              <p style={{color:'#c8a96e',fontWeight:900,fontSize:'14px',margin:0,flexShrink:0}}>✨ 상세페이지 제작</p>
              <div style={{display:'flex',gap:'4px',background:aiDark?'rgba(255,255,255,0.06)':'#fafafa',borderRadius:'8px',padding:'3px'}}>
                <button onClick={() => setAiTab('ai')}
                  style={{padding:'4px 12px',borderRadius:'6px',border:'none',fontSize:'11px',fontWeight:700,cursor:'pointer',
                    background:aiTab==='ai'?'#c8a96e':'transparent',color:aiTab==='ai'?'#111':'rgba(255,255,255,0.5)'}}>
                  ✨ AI 생성
                </button>
                <button onClick={() => setAiTab('manual')}
                  style={{padding:'4px 12px',borderRadius:'6px',border:'none',fontSize:'11px',fontWeight:700,cursor:'pointer',
                    background:aiTab==='manual'?'#c8a96e':'transparent',color:aiTab==='manual'?'#111':'rgba(255,255,255,0.5)'}}>
                  ✏️ 직접 만들기
                </button>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
              {([1,2,3] as const).map((s,i) => (
                <div key={s} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                  <div style={{width:'26px',height:'26px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:900,
                    background:aiStep>=s?'#c8a96e':'rgba(255,255,255,0.1)',color:aiStep>=s?'#111':'rgba(255,255,255,0.4)'}}>
                    {aiStep>s?'✓':s}
                  </div>
                  {i<2&&<div style={{width:'16px',height:'1px',background:aiStep>s?'#c8a96e':'rgba(255,255,255,0.15)'}}/>}
                </div>
              ))}
            </div>
            <button onClick={() => setAiDark(v => !v)}
              style={{background:aiDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.12)',border:'none',borderRadius:'8px',width:'34px',height:'34px',fontSize:'18px',cursor:'pointer',transition:'all 0.2s'}}>
              {aiDark ? '🌙' : '☀️'}
            </button>
            <button onClick={resetAiForm} style={{background:aiDark?'rgba(255,255,255,0.08)':'#f0f0f0',border:'none',borderRadius:'8px',width:'34px',height:'34px',color:aiDark?'rgba(255,255,255,0.6)':'#444',fontSize:'18px',cursor:'pointer'}}>✕</button>
          </div>

          {aiTab==='ai' && aiStep===1 && (
            <div style={{flex:1,overflowY:'auto',padding:'20px',display:'flex',gap:'20px',minHeight:0}}>

              <div style={{width:'260px',flexShrink:0,display:'flex',flexDirection:'column',gap:'8px'}}>
                <p style={{color:aiDark?'rgba(255,255,255,0.5)':'#555',fontSize:'11px',fontWeight:700,margin:'0 0 4px',letterSpacing:'1px'}}>📦 상품 선택</p>
                <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'6px'}}>
                  {products.filter(p=>p.is_active).map(p => (
                    <button key={p.id} onClick={() => selectProductForAI(p)}
                      style={{padding:'10px 12px',borderRadius:'12px',textAlign:'left',cursor:'pointer',
                        border:'2px solid '+(selectedProduct?.id===p.id?'#c8a96e':'rgba(255,255,255,0.08)'),
                        background:selectedProduct?.id===p.id?'rgba(200,169,110,0.12)':'rgba(255,255,255,0.03)',
                        transition:'all 0.15s'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        {p.image_url
                          ? <img src={p.image_url} alt="" style={{width:'36px',height:'36px',borderRadius:'6px',objectFit:'cover',flexShrink:0}} />
                          : <div style={{width:'36px',height:'36px',borderRadius:'6px',background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>🐟</div>
                        }
                        <div style={{minWidth:0}}>
                          <p style={{color:aiDark?'white':'#111',fontSize:'12px',fontWeight:700,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</p>
                          <p style={{color:aiDark?'rgba(255,255,255,0.4)':'#666',fontSize:'10px',margin:'2px 0 0'}}>{p.retail_price?.toLocaleString()}원</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {products.length === 0 && (
                    <div style={{textAlign:'center',padding:'24px',color:aiDark?'rgba(255,255,255,0.3)':'#888',fontSize:'12px'}}>
                      <p>등록된 상품이 없어요</p>
                      <p>먼저 상품을 등록해주세요</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{flex:1,display:'flex',flexDirection:'column',gap:'14px'}}>
                <p style={{color:aiDark?'rgba(255,255,255,0.5)':'#555',fontSize:'11px',fontWeight:700,margin:'0 0 4px',letterSpacing:'1px'}}>
                  📸 {selectedProduct ? '대표 이미지 (선택한 상품 이미지 사용 또는 교체)' : '대표 이미지'}
                </p>

                <input id="ai-img-input" type="file" accept="image/*" style={{display:'none'}}
                  onChange={e => { const f=e.target.files?.[0]; if(f) handleImageUpload(f) }} />

                {!aiImagePreview ? (
                  <div onClick={() => document.getElementById('ai-img-input')?.click()}
                    style={{flex:1,border:'2px dashed rgba(200,169,110,0.4)',borderRadius:'16px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',background:'rgba(200,169,110,0.03)',minHeight:'200px'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#c8a96e'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(200,169,110,0.4)'}}>
                    <div style={{fontSize:'40px',marginBottom:'10px'}}>📸</div>
                    <p style={{color:'#c8a96e',fontSize:'15px',fontWeight:700,marginBottom:'4px'}}>클릭해서 이미지 올리기</p>
                    <p style={{color:aiDark?'rgba(255,255,255,0.3)':'#888',fontSize:'12px'}}>JPG · PNG · WEBP</p>
                  </div>
                ) : (
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                      {Object.entries(BG_PRESETS).map(([key,bg]) => (
                        <button key={key} onClick={() => setAiSelectedBg(key)}
                          style={{borderRadius:'10px',overflow:'hidden',border:'3px solid '+(aiSelectedBg===key?'#c8a96e':'transparent'),cursor:'pointer',background:'none',padding:0}}>
                          <div style={{height:'70px',display:'flex',alignItems:'center',justifyContent:'center',background:bg.bg}}>
                            {(aiBgRemovedPreview||aiImagePreview) && <img src={aiBgRemovedPreview||aiImagePreview} alt="" style={{height:'60px',objectFit:'contain'}} />}
                          </div>
                          <div style={{background:aiSelectedBg===key?'#c8a96e':'rgba(255,255,255,0.08)',padding:'4px',textAlign:'center'}}>
                            <p style={{color:aiSelectedBg===key?'#111':'rgba(255,255,255,0.6)',fontSize:'10px',fontWeight:700,margin:0}}>{bg.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div style={{flex:1,borderRadius:'12px',overflow:'hidden',border:'1px solid rgba(200,169,110,0.2)',minHeight:'160px',display:'flex',alignItems:'center',justifyContent:'center',
                      background:aiSelectedBg==='warm'?'linear-gradient(160deg,#1a0e08,#3d2010)':aiSelectedBg==='white'?'#f5f5f5':'#0d0d0d'}}>
                      {aiBgLoading ? <p style={{color:aiDark?'rgba(255,255,255,0.4)':'#666',fontSize:'12px'}}>⏳ 배경 제거 중...</p>
                        : <img src={aiBgRemovedPreview||aiImagePreview} alt="" style={{maxHeight:'180px',maxWidth:'100%',objectFit:'contain'}} />}
                    </div>
                    <button onClick={() => { setAiImagePreview(''); setAiBgRemovedPreview(''); setAiBgRemovedBase64(''); setAiError('') }}
                      style={{padding:'8px',borderRadius:'8px',border:'1px solid '+(aiDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'),background:'transparent',color:aiDark?'rgba(255,255,255,0.5)':'#555',fontSize:'12px',cursor:'pointer'}}>
                      🔄 이미지 다시 올리기
                    </button>
                  </div>
                )}

                {aiError && <p style={{color:'#fbbf24',fontSize:'12px'}}>{aiError}</p>}

                <button onClick={() => setAiStep(2)}
                  disabled={!selectedProduct}
                  style={{padding:'14px',borderRadius:'12px',
                    background:!selectedProduct?'rgba(200,169,110,0.2)':'linear-gradient(135deg,#c8a96e,#e8c878)',
                    color:!selectedProduct?'rgba(255,255,255,0.3)':'#111',
                    fontSize:'14px',fontWeight:900,border:'none',cursor:!selectedProduct?'not-allowed':'pointer',
                    transition:'all 0.2s'}}>
                  {!selectedProduct ? '상품을 먼저 선택해주세요' : `"${selectedProduct.name}" 으로 다음 단계 →`}
                </button>
              </div>
            </div>
          )}

          {aiTab==='ai' && aiStep===2 && (
            <div style={{flex:1,overflowY:'auto',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 20px',background:aiDark?'transparent':'#f8f8f8'}}>
              <div style={{width:'100%',maxWidth:'520px',display:'flex',flexDirection:'column',gap:'22px'}}>

                <div>
                  <h3 style={{color:aiDark?'white':'#111',fontSize:'18px',fontWeight:900,margin:'0 0 12px'}}>📋 상품 정보</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <input value={aiMeta.name} onChange={e=>setAiMeta(p=>({...p,name:e.target.value}))}
                      placeholder="상품명 (예: 영광 법성포 보리굴비)"
                      style={{padding:'15px 16px',borderRadius:'12px',
                        border:'2px solid '+(aiDark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.15)'),
                        background:aiDark?'rgba(255,255,255,0.07)':'white',
                        color:aiDark?'white':'#111',fontSize:'15px',fontWeight:600,outline:'none'}}
                      onFocus={e=>{e.target.style.borderColor='#c8a96e'}}
                      onBlur={e=>{e.target.style.borderColor=aiDark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.15)'}} />
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                      <div>
                        <p style={{color:aiDark?'rgba(255,255,255,0.5)':'#666',fontSize:'10px',fontWeight:700,margin:'0 0 5px',letterSpacing:'0.5px'}}>🛒 일반 소매가</p>
                        <input type="number" value={aiMeta.retail_price} onChange={e=>setAiMeta(p=>({...p,retail_price:e.target.value}))}
                          placeholder="원"
                          style={{width:'100%',padding:'12px 10px',borderRadius:'10px',
                            border:'2px solid rgba(99,102,241,0.3)',
                            background:aiDark?'rgba(99,102,241,0.06)':'white',
                            color:aiDark?'white':'#111',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
                          onFocus={e=>{e.target.style.borderColor='#6366f1'}}
                          onBlur={e=>{e.target.style.borderColor='rgba(99,102,241,0.3)'}} />
                      </div>
                      <div>
                        <p style={{color:aiDark?'rgba(255,255,255,0.5)':'#666',fontSize:'10px',fontWeight:700,margin:'0 0 5px',letterSpacing:'0.5px'}}>🏪 소매 유통가</p>
                        <input type="number" value={aiMeta.member_price} onChange={e=>setAiMeta(p=>({...p,member_price:e.target.value}))}
                          placeholder="원"
                          style={{width:'100%',padding:'12px 10px',borderRadius:'10px',
                            border:'2px solid rgba(15,118,110,0.3)',
                            background:aiDark?'rgba(15,118,110,0.06)':'white',
                            color:aiDark?'white':'#111',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
                          onFocus={e=>{e.target.style.borderColor='#0f766e'}}
                          onBlur={e=>{e.target.style.borderColor='rgba(15,118,110,0.3)'}} />
                      </div>
                      <div>
                        <p style={{color:aiDark?'rgba(255,255,255,0.5)':'#666',fontSize:'10px',fontWeight:700,margin:'0 0 5px',letterSpacing:'0.5px'}}>🏭 도매 유통가</p>
                        <input type="number" value={aiMeta.wholesale_price} onChange={e=>setAiMeta(p=>({...p,wholesale_price:e.target.value}))}
                          placeholder="원"
                          style={{width:'100%',padding:'12px 10px',borderRadius:'10px',
                            border:'2px solid rgba(236,72,153,0.3)',
                            background:aiDark?'rgba(236,72,153,0.06)':'white',
                            color:aiDark?'white':'#111',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
                          onFocus={e=>{e.target.style.borderColor='#ec4899'}}
                          onBlur={e=>{e.target.style.borderColor='rgba(236,72,153,0.3)'}} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{color:aiDark?'white':'#111',fontSize:'18px',fontWeight:900,margin:'0 0 12px'}}>🎭 어떤 말투로 쓸까요?</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    {([
                      {key:'shohost',emoji:'🎤',title:'쇼호스트',desc:'지금 바로! 놀라운 퀄리티!',color:'#f97316'},
                      {key:'grandma',emoji:'👵',title:'할머니',desc:'정겹고 따뜻한 말투',color:'#ec4899'},
                      {key:'expert', emoji:'👨‍⚕️',title:'전문가',desc:'신뢰감 있는 전문 설명',color:'#3b82f6'},
                      {key:'parent', emoji:'👨‍👩‍👧',title:'엄마아빠',desc:'온가족 건강을 생각해요',color:'#22c55e'},
                    ] as const).map(p => (
                      <button key={p.key} onClick={() => setAiPersona(p.key)}
                        style={{padding:'16px 12px',borderRadius:'14px',textAlign:'left',cursor:'pointer',
                          border:'2px solid '+(aiPersona===p.key?p.color:aiDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.1)'),
                          background:aiPersona===p.key?p.color+'18':aiDark?'rgba(255,255,255,0.03)':'white',
                          boxShadow:aiPersona===p.key?'0 0 20px '+p.color+'33':'none',transition:'all 0.2s'}}>
                        <div style={{fontSize:'28px',marginBottom:'6px'}}>{p.emoji}</div>
                        <p style={{color:aiDark?'white':'#111',fontSize:'14px',fontWeight:800,margin:'0 0 3px'}}>{p.title}</p>
                        <p style={{color:aiDark?'rgba(255,255,255,0.4)':'#888',fontSize:'11px',margin:0}}>{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {aiError && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'10px',padding:'10px 14px'}}><p style={{color:'#f87171',fontSize:'13px',margin:0}}>{aiError}</p></div>}

                <div style={{display:'flex',gap:'10px'}}>
                  <button onClick={() => setAiStep(1)}
                    style={{flex:1,padding:'15px',borderRadius:'12px',
                      border:'1.5px solid '+(aiDark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.15)'),
                      background:'transparent',color:aiDark?'rgba(255,255,255,0.5)':'#555',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>
                    ← 이전
                  </button>
                  <button onClick={handleGenerateLanding} disabled={aiLoading||!aiMeta.name.trim()}
                    style={{flex:3,padding:'15px',borderRadius:'12px',
                      background:aiLoading||!aiMeta.name.trim()?'rgba(200,169,110,0.25)':'linear-gradient(135deg,#c8a96e,#e8c878)',
                      color:aiLoading||!aiMeta.name.trim()?'rgba(255,255,255,0.3)':'#111',
                      fontSize:'15px',fontWeight:900,border:'none',cursor:aiLoading||!aiMeta.name.trim()?'not-allowed':'pointer',
                      boxShadow:aiLoading||!aiMeta.name.trim()?'none':'0 8px 24px rgba(200,169,110,0.3)',transition:'all 0.2s'}}>
                    {aiLoading?'⏳ AI가 상세페이지 만드는 중...':'✨ 상세페이지 자동 생성'}
                  </button>
                </div>
                {!aiMeta.name.trim()&&<p style={{color:aiDark?'rgba(255,255,255,0.3)':'#888',fontSize:'12px',textAlign:'center',margin:'-10px 0 0'}}>상품명을 입력해야 생성할 수 있어요</p>}
              </div>
            </div>
          )}

          {aiTab==='ai' && aiStep===3 && (
            <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0,overflow:'hidden'}}>
              <div style={{background:'#111',borderBottom:'1px solid rgba(255,255,255,0.1)',padding:'8px 12px',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'7px'}}>
                  <p style={{color:aiDark?'rgba(255,255,255,0.4)':'#666',fontSize:'10px',margin:0,flex:1}}>📌 배경 선택</p>
                  {[
                    {k:'dark', label:'블랙', bg:'#111',    color:'#fff'},
                    {k:'warm', label:'골드', bg:'linear-gradient(135deg,#2c1810,#5c3a1e)', color:'#c8a96e'},
                    {k:'white',label:'화이트',bg:'#eee',   color:'#333'},
                  ].map(t => (
                    <button key={t.k} onClick={() => setAiSelectedBg(t.k)}
                      style={{padding:'5px 14px',borderRadius:'8px',
                        border:'2px solid '+(aiSelectedBg===t.k?'#c8a96e':'rgba(255,255,255,0.12)'),
                        background:t.bg,color:t.color,fontSize:'11px',fontWeight:700,cursor:'pointer',
                        boxShadow:aiSelectedBg===t.k?'0 0 10px rgba(200,169,110,0.4)':'none',transition:'all 0.15s'}}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'}}>
                  <p style={{color:aiDark?'rgba(255,255,255,0.3)':'#888',fontSize:'10px',margin:0,flex:1}}>💡 텍스트 클릭하면 바로 수정</p>
                  <button onClick={() => setShowUnsplash(v=>!v)}
                    style={{padding:'6px 10px',borderRadius:'8px',border:'1px solid rgba(147,197,253,0.4)',background:'rgba(147,197,253,0.08)',color:'#93c5fd',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                    🖼️ 이미지 검색
                  </button>
                  <button onClick={() => setAiStep(2)}
                    style={{padding:'6px 10px',borderRadius:'8px',border:'1px solid '+(aiDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'),background:'transparent',color:aiDark?'rgba(255,255,255,0.5)':'#555',fontSize:'11px',fontWeight:600,cursor:'pointer'}}>
                    ← 설정
                  </button>
                  <button onClick={handleGenerateLanding} disabled={aiLoading}
                    style={{padding:'6px 10px',borderRadius:'8px',border:'1px solid rgba(200,169,110,0.5)',background:'transparent',color:'#c8a96e',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                    🔄 재생성
                  </button>
                  <button onClick={() => setShowBuyerPreview('mobile')}
                    style={{padding:'6px 10px',borderRadius:'8px',border:'1px solid rgba(100,200,100,0.4)',background:'rgba(100,200,100,0.07)',color:'#6ee7b7',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                    📱 모바일
                  </button>
                  <button onClick={() => setShowBuyerPreview('desktop')}
                    style={{padding:'6px 10px',borderRadius:'8px',border:'1px solid rgba(147,197,253,0.4)',background:'rgba(147,197,253,0.07)',color:'#93c5fd',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                    🖥️ PC
                  </button>
                  <button onClick={handleAiRegister} disabled={aiLoading}
                    style={{padding:'6px 16px',borderRadius:'8px',background:'linear-gradient(135deg,#c8a96e,#e8c878)',color:'#111',fontSize:'12px',fontWeight:900,border:'none',cursor:aiLoading?'not-allowed':'pointer',opacity:aiLoading?0.6:1}}>
                    {aiLoading?'등록 중...':'🛍️ 등록'}
                  </button>
                </div>
              </div>
              {aiError&&<p style={{color:'#f87171',fontSize:'12px',padding:'6px 12px',background:'rgba(239,68,68,0.1)',margin:0,flexShrink:0}}>{aiError}</p>}

              {showUnsplash && (
                <div style={{background:'#1a1a2e',borderBottom:'2px solid rgba(147,197,253,0.3)',padding:'14px',flexShrink:0,maxHeight:'45%',overflowY:'auto'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                    <p style={{color:'#93c5fd',fontSize:'13px',fontWeight:700,margin:0,flex:1}}>🖼️ 무료 이미지 검색 (Unsplash)</p>
                    <button onClick={() => setShowUnsplash(false)} style={{background:'none',border:'none',color:aiDark?'rgba(255,255,255,0.5)':'#555',fontSize:'16px',cursor:'pointer'}}>✕</button>
                  </div>
                  <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
                    <input value={unsplashQuery} onChange={e=>setUnsplashQuery(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter') searchUnsplash()}}
                      placeholder="예: seafood, dried fish, korean food..."
                      style={{flex:1,padding:'9px 12px',borderRadius:'8px',border:'1.5px solid rgba(147,197,253,0.3)',background:aiDark?'rgba(255,255,255,0.07)':'white',color:aiDark?'white':'#111',fontSize:'13px',outline:'none'}} />
                    <button onClick={() => { setUnsplashResults([]); searchUnsplash() }}
                      style={{padding:'9px 14px',borderRadius:'8px',background:'#3b82f6',color:aiDark?'white':'#111',border:'none',fontSize:'13px',fontWeight:700,cursor:'pointer',flexShrink:0}}>
                      {unsplashLoading?'⏳':'검색'}
                    </button>
                  </div>
                  <p style={{color:aiDark?'rgba(255,255,255,0.35)':'#777',fontSize:'11px',margin:'0 0 8px'}}>💡 이미지 클릭하면 상세페이지 하단에 삽입돼요</p>
                  {unsplashResults.length > 0 && (
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:'6px'}}>
                      {unsplashResults.map((img:any) => (
                        <div key={img.id} onClick={() => insertUnsplashImage(img.urls.regular)}
                          style={{borderRadius:'6px',overflow:'hidden',cursor:'pointer',aspectRatio:'1',border:'2px solid transparent',transition:'border 0.15s'}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor='#93c5fd'}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent'}}>
                          <img src={img.urls.thumb} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{flex:1,overflowY:'scroll',WebkitOverflowScrolling:'touch',background:'#d0d0d0',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'16px'}}>
                <div style={{width:'100%',maxWidth:'390px',background:'white',boxShadow:'0 24px 60px rgba(0,0,0,0.4)',borderRadius:'16px',overflow:'hidden',marginBottom:'40px'}}>
                  {aiBgRemovedPreview && (
                    <div style={{width:'100%',aspectRatio:'1/1',display:'flex',alignItems:'center',justifyContent:'center',
                      background:aiSelectedBg==='warm'?'linear-gradient(160deg,#1a0e08,#3d2010)':aiSelectedBg==='white'?'#f5f5f5':'#0d0d0d'}}>
                      <img src={aiBgRemovedPreview} alt="" style={{width:'85%',height:'85%',objectFit:'contain'}} />
                    </div>
                  )}
                  <div id="landing-preview" dangerouslySetInnerHTML={{__html:aiLandingHtml}} />
                </div>
              </div>
              <EditorToolbar />
            </div>
          )}
        </div>
      )}

      {showAiForm && aiTab==='manual' && (
        <div style={{position:'fixed',inset:0,zIndex:9999,background:aiDark?'rgba(0,0,0,0.95)':'rgba(240,240,240,0.97)',backdropFilter:'blur(10px)',display:'flex',flexDirection:'column'}}>

          <div style={{height:'52px',background:aiDark?'linear-gradient(135deg,#1a1a1a,#2d2d2d)':'linear-gradient(135deg,#f5f5f5,#e8e8e8)',borderBottom:'1px solid rgba(200,169,110,0.25)',display:'flex',alignItems:'center',padding:'0 16px',gap:'10px',flexShrink:0}}>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:'10px'}}>
              <p style={{color:'#c8a96e',fontWeight:900,fontSize:'14px',margin:0,flexShrink:0}}>✏️ 직접 만들기</p>
              <div style={{display:'flex',gap:'4px',background:aiDark?'rgba(255,255,255,0.06)':'#fafafa',borderRadius:'8px',padding:'3px'}}>
                <button onClick={() => setAiTab('ai')}
                  style={{padding:'4px 12px',borderRadius:'6px',border:'none',fontSize:'11px',fontWeight:700,cursor:'pointer',background:'transparent',color:aiDark?'rgba(255,255,255,0.5)':'#555'}}>
                  ✨ AI 생성
                </button>
                <button onClick={() => setAiTab('manual')}
                  style={{padding:'4px 12px',borderRadius:'6px',border:'none',fontSize:'11px',fontWeight:700,cursor:'pointer',background:'#c8a96e',color:'#111'}}>
                  ✏️ 직접 만들기
                </button>
              </div>
            </div>
            <button onClick={() => setAiDark(v=>!v)} style={{background:aiDark?'rgba(255,255,255,0.08)':'#f0f0f0',border:'none',borderRadius:'8px',width:'34px',height:'34px',fontSize:'18px',cursor:'pointer'}}>{aiDark?'🌙':'☀️'}</button>
            <button onClick={resetAiForm} style={{background:aiDark?'rgba(255,255,255,0.08)':'#f0f0f0',border:'none',borderRadius:'8px',width:'34px',height:'34px',color:aiDark?'rgba(255,255,255,0.6)':'#444',fontSize:'18px',cursor:'pointer'}}>✕</button>
          </div>

          <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0}}>

            <div style={{width:'360px',flexShrink:0,background:aiDark?'#111':'#f8f8f8',borderRight:'1px solid rgba(200,169,110,0.15)',display:'flex',flexDirection:'column',overflowY:'auto',padding:'20px',gap:'14px'}}>

              <div>
                <p style={{color:aiDark?'rgba(255,255,255,0.5)':'#555',fontSize:'11px',fontWeight:700,margin:'0 0 8px',letterSpacing:'1px'}}>📦 상품 선택</p>
                <select onChange={e => {
                    const p = products.find(p=>p.id===e.target.value)
                    if(p) setSelectedProduct(p)
                  }}
                  value={selectedProduct?.id||''}
                  style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1.5px solid rgba(200,169,110,0.3)',background:aiDark?'rgba(255,255,255,0.07)':'white',color:aiDark?'white':'#111',fontSize:'13px',outline:'none'}}>
                  <option value="">-- 상품 선택 --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <p style={{color:aiDark?'rgba(255,255,255,0.5)':'#555',fontSize:'11px',fontWeight:700,margin:'0 0 8px',letterSpacing:'1px'}}>➕ 섹션 추가</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px'}}>
                  {[
                    {type:'image' as const, label:'🖼️ 이미지'},
                    {type:'video' as const, label:'🎬 영상'},
                    {type:'text'  as const, label:'✏️ 텍스트'},
                  ].map(b => (
                    <button key={b.type} onClick={() => addManualBlock(b.type)}
                      style={{padding:'8px 4px',borderRadius:'8px',border:'1.5px solid rgba(200,169,110,0.3)',background:'rgba(200,169,110,0.06)',color:'#c8a96e',fontSize:'11px',fontWeight:700,cursor:'pointer',textAlign:'center'}}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {manualBlocks.map((block, idx) => (
                  <div key={block.id} style={{background:aiDark?'rgba(255,255,255,0.05)':'#fafafa',borderRadius:'10px',padding:'10px',border:'1px solid rgba(255,255,255,0.08)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                      <p style={{color:'#c8a96e',fontSize:'11px',fontWeight:700,margin:0}}>
                        {block.type==='image'?'🖼️ 이미지':block.type==='video'?'🎬 영상':'✏️ 텍스트'} #{idx+1}
                      </p>
                      <button onClick={() => removeManualBlock(block.id)}
                        style={{background:'rgba(239,68,68,0.15)',border:'none',borderRadius:'5px',color:'#f87171',fontSize:'11px',cursor:'pointer',padding:'2px 7px'}}>삭제</button>
                    </div>

                    {block.type==='image' && (
                      <label style={{cursor:'pointer',display:'block'}}>
                        <input type="file" accept="image/*" style={{display:'none'}}
                          onChange={e => { const f=e.target.files?.[0]; if(f) handleManualImageUpload(block.id, f) }} />
                        {block.content
                          ? <img src={block.content} alt="" style={{width:'100%',borderRadius:'6px',maxHeight:'100px',objectFit:'cover'}} />
                          : <div style={{width:'100%',height:'50px',borderRadius:'6px',border:'2px dashed rgba(200,169,110,0.3)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(200,169,110,0.6)',fontSize:'12px'}}>클릭해서 이미지 선택</div>
                        }
                      </label>
                    )}

                    {block.type==='video' && (
                      <div>
                        <label style={{cursor:'pointer',display:'block'}}>
                          <input type="file" accept="video/*" style={{display:'none'}}
                            onChange={e => { const f=e.target.files?.[0]; if(f) handleManualImageUpload(block.id, f) }} />
                          <div style={{width:'100%',height:'40px',borderRadius:'6px',border:'2px dashed rgba(200,169,110,0.3)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(200,169,110,0.6)',fontSize:'12px'}}>
                            {block.content ? '✅ 영상 선택됨' : '클릭해서 영상 선택'}
                          </div>
                        </label>
                        <input value={block.content.startsWith('http')?block.content:''} onChange={e => updateManualBlock(block.id, e.target.value)}
                          placeholder="또는 URL 직접 입력"
                          style={{width:'100%',marginTop:'4px',padding:'6px 8px',borderRadius:'6px',border:'1px solid '+(aiDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'),background:aiDark?'rgba(255,255,255,0.05)':'#fafafa',color:aiDark?'white':'#111',fontSize:'11px',outline:'none',boxSizing:'border-box'}} />
                      </div>
                    )}

                    {block.type==='text' && (
                      <div>
                        <textarea value={block.content} onChange={e => updateManualBlock(block.id, e.target.value)}
                          placeholder="내용을 입력하세요... (줄바꿈 가능)"
                          rows={4}
                          style={{width:'100%',padding:'10px',borderRadius:'8px',border:'1px solid '+(aiDark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.15)'),background:aiDark?'rgba(255,255,255,0.07)':'white',color:aiDark?'white':'#111',fontSize:'13px',outline:'none',resize:'vertical',boxSizing:'border-box',lineHeight:1.6}} />
                        <div style={{display:'flex',gap:'4px',marginTop:'4px'}}>
                          {['굵게','제목','소제목'].map((s,i) => (
                            <button key={s} onClick={() => {
                              const tags = ['<strong>내용</strong>','<h2 style="font-size:20px;font-weight:900;margin:16px 0 8px;">제목</h2>','<h3 style="font-size:16px;font-weight:700;margin:12px 0 6px;color:#c8a96e;">소제목</h3>']
                              updateManualBlock(block.id, (block.content||'') + '\n' + tags[i])
                            }}
                              style={{padding:'3px 8px',borderRadius:'5px',border:'1px solid rgba(200,169,110,0.3)',background:'transparent',color:'rgba(200,169,110,0.8)',fontSize:'10px',cursor:'pointer'}}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {aiError && <p style={{color:'#f87171',fontSize:'12px'}}>{aiError}</p>}

              <button onClick={handleManualRegister} disabled={aiLoading||!selectedProduct}
                style={{padding:'14px',borderRadius:'12px',
                  background:aiLoading||!selectedProduct?'rgba(200,169,110,0.2)':'linear-gradient(135deg,#c8a96e,#e8c878)',
                  color:aiLoading||!selectedProduct?'rgba(255,255,255,0.3)':'#111',fontSize:'14px',fontWeight:900,border:'none',
                  cursor:aiLoading||!selectedProduct?'not-allowed':'pointer'}}>
                {aiLoading?'저장 중...':'💾 상세페이지 저장'}
              </button>
            </div>

            <div style={{flex:1,overflowY:'auto',background:'#d0d0d0',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'16px'}}>
              <div style={{width:'100%',maxWidth:'390px',background:'white',boxShadow:'0 24px 60px rgba(0,0,0,0.3)',borderRadius:'16px',overflow:'hidden',marginBottom:'40px'}}>
                {selectedProduct?.image_url && (
                  <div style={{width:'100%',aspectRatio:'1',background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                    <img src={selectedProduct.image_url} alt={selectedProduct.name}
                      style={{width:'100%',height:'100%',objectFit:'cover'}}
                      onError={e => { e.currentTarget.style.display='none' }} />
                  </div>
                )}
                {manualBlocks.map((block, idx) => (
                  <div key={block.id}>
                    {block.type==='image' && block.content && (
                      <img src={block.content} alt="" style={{width:'100%',display:'block',objectFit:'cover'}} />
                    )}
                    {block.type==='video' && block.content && (
                      block.content.includes('youtube') || block.content.includes('youtu.be')
                        ? <div style={{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',background:'#000'}}>
                            <iframe src={getYoutubeEmbedUrl(block.content)} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}} allowFullScreen />
                          </div>
                        : <video controls style={{width:'100%',display:'block'}}><source src={block.content} /></video>
                    )}
                    {block.type==='text' && block.content && (
                      <div style={{
                        padding:'28px 24px', fontSize:'15px', lineHeight:2,
                        background: idx===0 ? 'linear-gradient(135deg,#1a1a1a,#2d2d2d)' : '#fff',
                        color: idx===0 ? 'white' : '#333',
                        borderBottom: idx===0 ? 'none' : '8px solid #f5f5f5'
                      }}
                        dangerouslySetInnerHTML={{__html: block.content.split('\n').join('<br/>')}}
                      />
                    )}
                  </div>
                ))}
                {manualBlocks.length===0 && (
                  <div style={{padding:'40px 24px',textAlign:'center',color:'#999',fontSize:'13px'}}>
                    왼쪽에서 섹션을 추가하면 여기서 미리볼 수 있어요
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBuyerPreview && (
        <div style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.95)',display:'flex',flexDirection:'column'}}>
          <div style={{background:'#111',padding:'10px 16px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display:'flex',gap:'6px'}}>
              <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#ff5f57'}}/>
              <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#ffbd2e'}}/>
              <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#28c840'}}/>
            </div>
            <div style={{flex:1,background:aiDark?'rgba(255,255,255,0.07)':'white',borderRadius:'6px',padding:'4px 12px',textAlign:'center'}}>
              <p style={{color:aiDark?'rgba(255,255,255,0.35)':'#777',fontSize:'11px',margin:0}}>
                {showBuyerPreview==='mobile' ? '📱 모바일 미리보기 (390px)' : '🖥️ PC 미리보기 (1200px)'}
              </p>
            </div>
            <div style={{display:'flex',gap:'6px'}}>
              <button onClick={() => setShowBuyerPreview('mobile')}
                style={{padding:'6px 10px',borderRadius:'6px',border:'none',background:showBuyerPreview==='mobile'?'#6ee7b7':'rgba(255,255,255,0.1)',color:showBuyerPreview==='mobile'?'#111':'rgba(255,255,255,0.6)',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                📱
              </button>
              <button onClick={() => setShowBuyerPreview('desktop')}
                style={{padding:'6px 10px',borderRadius:'6px',border:'none',background:showBuyerPreview==='desktop'?'#93c5fd':'rgba(255,255,255,0.1)',color:showBuyerPreview==='desktop'?'#111':'rgba(255,255,255,0.6)',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                🖥️
              </button>
            </div>
            <button onClick={() => setShowBuyerPreview(false)}
              style={{background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'8px',padding:'7px 14px',color:aiDark?'white':'#111',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
              ← 수정으로 돌아가기
            </button>
          </div>
          <div style={{flex:1,overflow:'auto',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'20px',background:'#1a1a1a'}}>
            {showBuyerPreview==='mobile' ? (
              <div style={{width:'390px',minHeight:'844px',background:'white',borderRadius:'36px',overflow:'hidden',boxShadow:'0 40px 80px rgba(0,0,0,0.8)',border:'8px solid #333',flexShrink:0}}>
                {aiBgRemovedPreview && (
                  <div style={{width:'100%',aspectRatio:'1/1',display:'flex',alignItems:'center',justifyContent:'center',
                    background:aiSelectedBg==='warm'?'linear-gradient(160deg,#1a0e08,#3d2010)':aiSelectedBg==='white'?'#f5f5f5':'#0d0d0d'}}>
                    <img src={aiBgRemovedPreview} alt="" style={{width:'85%',height:'85%',objectFit:'contain'}} />
                  </div>
                )}
                <div dangerouslySetInnerHTML={{__html:aiLandingHtml}} />
              </div>
            ) : (
              <div style={{width:'100%',maxWidth:'1200px',background:'white',borderRadius:'12px',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
                <div style={{background:'#f0f0f0',padding:'10px 16px',display:'flex',gap:'6px',alignItems:'center',borderBottom:'1px solid #ddd'}}>
                  <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#ff5f57'}}/>
                  <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#ffbd2e'}}/>
                  <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#28c840'}}/>
                  <div style={{flex:1,background:'white',borderRadius:'6px',padding:'3px 12px',marginLeft:'8px'}}>
                    <p style={{fontSize:'11px',color:'#999',margin:0}}>gulbi-store.vercel.app/shop/product/...</p>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:'600px'}}>
                  {aiBgRemovedPreview && (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'40px',
                      background:aiSelectedBg==='warm'?'linear-gradient(160deg,#1a0e08,#3d2010)':aiSelectedBg==='white'?'#f5f5f5':'#0d0d0d'}}>
                      <img src={aiBgRemovedPreview} alt="" style={{maxWidth:'100%',maxHeight:'400px',objectFit:'contain'}} />
                    </div>
                  )}
                  <div style={{overflowY:'auto',maxHeight:'700px'}}>
                    <div dangerouslySetInnerHTML={{__html:aiLandingHtml}} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        [contenteditable]:focus { outline: 2px solid #c8a96e !important; border-radius: 2px; }
      `}</style>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editProduct ? '상품 수정' : '상품 등록'}</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">상품명</label>
                <input type="text" placeholder="상품명 입력" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">대표 이미지</label>
                <input id="form-img-input" type="file" accept="image/*" style={{display:'none'}} onChange={handleFormImageUpload} />
                <div onClick={() => document.getElementById('form-img-input')?.click()}
                  style={{border:'2px dashed #e2e8f0',borderRadius:'12px',padding:'16px',textAlign:'center',cursor:'pointer',background:'#f8fafc'}}>
                  {form.image_url
                    ? <img src={form.image_url} alt="" style={{height:'80px',objectFit:'contain',margin:'0 auto',display:'block',borderRadius:'8px'}} />
                    : <p style={{color:'#94a3b8',fontSize:'13px',margin:0}}>📸 클릭해서 이미지 올리기</p>
                  }
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">카테고리</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="">선택</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '🛒 일반 소매가 (원)', key: 'retail_price' },
                  { label: '🏪 소매 유통가 (원)', key: 'member_price' },
                  { label: '🏭 도매 유통가 (원)', key: 'wholesale_price' },
                  { label: '재고 수량', key: 'stock' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                    <input type="number" value={(form as any)[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">단위</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                    {['kg', 'g', '박스', '마리', '개', '묶음'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">설명</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="상품 설명을 입력하세요"
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">판매 상태</label>
                <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.is_active ? 'bg-sky-500' : 'bg-slate-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.is_active ? 'left-7' : 'left-1'}`} />
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">{form.is_active ? '판매중' : '숨김'}</span>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">취소</button>
              <button onClick={saveProduct} className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-colors active:scale-95">
                {editProduct ? '수정 완료' : '등록 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCatForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editCat ? '카테고리 수정' : '카테고리 추가'}</h2>
              <button onClick={() => { setShowCatForm(false); setEditCat(null); setCatName('') }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">카테고리명</label>
              <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="예) 어류"
                className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={() => { setShowCatForm(false); setEditCat(null); setCatName('') }} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">취소</button>
              <button onClick={saveCat} className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-colors active:scale-95">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
