'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import StockImagePicker from '@/components/StockImagePicker'
import { useRouter } from 'next/navigation'
import SupplierLayout from '../_layout/layout'
import { useSupplierTheme } from '../_layout/theme-context'
import SupplierAiLandingEditor from './components/AiLandingEditor'
import SupplierProductList from './_SupplierProductList'

type Product = {
  id: string; name: string; description: string
  category_id: string; suggested_wholesale_price: number; suggested_retail_price: number
  wholesale_price: number; retail_price: number
  stock: number; unit: string; image_url: string
  approval_status: string; rejection_reason?: string; created_at: string
}

type Category = { id: string; name: string }

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  '대기중':   { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', label: '⏳ 대기중' },
  '승인':     { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', label: '✅ 승인' },
  '거절':     { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', label: '❌ 거절' },
  '수정요청': { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', label: '✏️ 수정요청' },
}

const EMPTY_FORM = {
  name: '', category_id: '', suggested_wholesale_price: '', suggested_retail_price: '',
  stock: '', unit: 'kg', image_url: '', description: ''
}

function ProductsContent() {
  const t = useSupplierTheme()
  const router = useRouter()
  const supabase = createClient()
  const [supplierId, setSupplierId] = useState('')
  const [supplierStatus, setSupplierStatus] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAiEditor, setShowAiEditor] = useState(false)
  const [aiInitialProduct, setAiInitialProduct] = useState<Product | null>(null)
  const remakeDetail = (p: Product) => { setAiInitialProduct(p); setShowAiEditor(true) }
  const [aiFilling, setAiFilling] = useState(false)
  const [aiMsg, setAiMsg] = useState('')
  const [okMsg, setOkMsg] = useState('')

  useEffect(() => { init() }, [])

  // 성공 토스트 4초 후 자동 사라짐
  useEffect(() => {
    if (!okMsg) return
    const id = setTimeout(() => setOkMsg(''), 4000)
    return () => clearTimeout(id)
  }, [okMsg])

  const init = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/supplier/login'); return }
      const [{ data: sup }, { data: cats }, { data: prods }] = await Promise.all([
        supabase.from('suppliers').select('status').eq('id', user.id).single(),
        supabase.from('categories').select('id, name').order('sort_order'),
        supabase.from('products').select('*').eq('supplier_id', user.id).order('created_at', { ascending: false })
      ])
      setSupplierId(user.id)
      setSupplierStatus(sup?.status || '승인')
      setCategories(cats || [])
      setProducts(prods || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const fn = Date.now() + '.' + (f.name.split('.').pop() || 'jpg')
    const { error } = await supabase.storage.from('products').upload(fn, f, { upsert: true })
    if (!error) {
      const url = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
      setForm(p => ({ ...p, image_url: url }))
    }
  }

  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const res = reader.result as string
        resolve({ base64: res.split(',')[1] || '', mimeType: file.type || 'image/jpeg' })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  // 📸 사진 한 장 → AI가 상품명·카테고리·공급가·단위·설명 자동완성 (공급사 본인 키 사용)
  const handleAiFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    e.target.value = ''
    setAiFilling(true); setAiMsg(''); setError('')
    try {
      const { base64, mimeType } = await fileToBase64(f)
      // 1) 사진을 대표 이미지로도 업로드
      let imageUrl = ''
      const fn = Date.now() + '.' + (f.name.split('.').pop() || 'jpg')
      const up = await supabase.storage.from('products').upload(fn, f, { upsert: true })
      if (!up.error) imageUrl = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
      // 2) AI 분석
      const res = await fetch('/api/suggest-product', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType, categories }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('[supplier product ai fill] failed', data)
        setError('사진 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      const cat = categories.find(c => c.name === data.categoryName)
      setForm(p => ({
        ...p,
        name: data.name || p.name,
        category_id: cat?.id || p.category_id,
        suggested_wholesale_price: data.suggestedWholesale !== '' ? String(data.suggestedWholesale) : p.suggested_wholesale_price,
        suggested_retail_price: data.suggestedRetail !== '' ? String(data.suggestedRetail) : p.suggested_retail_price,
        unit: data.unit || p.unit,
        description: data.description || p.description,
        image_url: imageUrl || p.image_url,
      }))
      setAiMsg(`✨ ${data.provider === 'openai' ? 'GPT' : 'Gemini'}가 자동으로 채웠어요. 가격은 제안 초안이니 꼭 확인하세요.`)
    } catch (e) {
      console.error('[supplier product ai fill] unexpected error', e)
      setError('사진 분석 중 오류가 발생했어요.')
    } finally {
      setAiFilling(false)
    }
  }

  const handleSave = async () => {
    if (!form.name || !form.suggested_wholesale_price || !form.suggested_retail_price) {
      return setError('상품명, 도매 공급가, 소매 공급가는 필수입니다.')
    }
    setSaving(true); setError('')
    const data = {
      name: form.name, description: form.description,
      category_id: form.category_id || null,
      suggested_wholesale_price: Number(form.suggested_wholesale_price),
      suggested_retail_price: Number(form.suggested_retail_price),
      wholesale_price: 0, retail_price: 0, member_price: 0,
      stock: Number(form.stock) || 0, unit: form.unit,
      image_url: form.image_url, supplier_id: supplierId,
      approval_status: '대기중', is_active: false,
    }
    const wasResubmit = !!editProduct && (editProduct.approval_status === '거절' || editProduct.approval_status === '수정요청')
    if (editProduct) {
      // 공급업체가 수정하면 항상 재검토 대기열로 (거절/수정요청/승인 모두 → 대기중), 이전 거절사유 초기화
      await supabase.from('products').update({ ...data, approval_status: '대기중', rejection_reason: null }).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert(data)
    }
    setSaving(false); setShowForm(false)
    setOkMsg(
      wasResubmit ? '✅ 재신청 되었습니다! 관리자 검토를 기다려 주세요.'
      : editProduct ? '✅ 수정되었습니다. 관리자 재검토 후 쇼핑몰에 노출됩니다.'
      : '✅ 상품이 등록되었습니다. 관리자 승인 후 쇼핑몰에 노출됩니다.'
    )
    setEditProduct(null); setForm(EMPTY_FORM)
    init()
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({ name: p.name, category_id: p.category_id || '', suggested_wholesale_price: String(p.suggested_wholesale_price), suggested_retail_price: String(p.suggested_retail_price), stock: String(p.stock), unit: p.unit || 'kg', image_url: p.image_url || '', description: p.description || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('products').delete().eq('id', id)
    init()
  }

  const inputStyle = {
    width: '100%', background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: '12px', padding: '13px 16px', fontSize: '14px',
    color: t.text, outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 700,
    color: t.textMuted, marginBottom: '8px', letterSpacing: '0.5px',
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: t.textMuted, fontSize: '14px' }}>불러오는 중...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', padding: '20px 16px', background: t.bg }}>

      {/* 성공 토스트 (등록/수정/재신청 안내) */}
      {okMsg && (
        <div style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
          background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', padding: '13px 22px',
          borderRadius: '14px', fontSize: '14px', fontWeight: 700, boxShadow: '0 8px 30px rgba(22,163,74,0.45)',
          maxWidth: '90vw', textAlign: 'center' }}>
          {okMsg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: t.text, margin: '0 0 4px' }}>상품 관리</h1>
          <p style={{ color: t.textMuted, fontSize: '12px', margin: 0 }}>등록 후 관리자 승인 시 쇼핑몰 노출</p>
        </div>
        {supplierStatus === '승인' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setAiInitialProduct(null); setShowAiEditor(true) }}
              style={{ padding: '12px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: 'white', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(236,72,153,0.35)' }}>
              📄 상세페이지
            </button>
            <button onClick={() => { setEditProduct(null); setForm(EMPTY_FORM); setShowForm(true) }}
              style={{ padding: '12px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
              + 상품 등록
            </button>
          </div>
        )}
      </div>

      <SupplierProductList
        t={t}
        products={products}
        supplierStatus={supplierStatus}
        setShowForm={setShowForm}
        openEdit={openEdit}
        handleDelete={handleDelete}
        onRemake={remakeDetail}
      />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} className="modal-overlay">
          <div style={{ background: t.card, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${t.border}`, borderBottom: 'none' }} className="modal-desktop">

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: `1px solid ${t.border}`, flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '36px', height: '4px', borderRadius: '2px', background: t.inputBorder }} />
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: t.text, margin: 0 }}>{editProduct ? '상품 수정' : '상품 등록'}</h2>
              <button onClick={() => { setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM); setError('') }}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: t.input, color: t.textMuted, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* 📸 사진으로 자동 채우기 (AI) */}
              <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(99,102,241,0.08))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '14px', padding: '14px 16px' }}>
                <input id="sup-ai-img" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAiFill} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', margin: '0 0 2px' }}>✨ 사진으로 자동 채우기</p>
                    <p style={{ fontSize: '11px', color: t.textMuted, margin: 0 }}>상품 사진 한 장이면 이름·카테고리·공급가·설명을 AI가 채워줘요</p>
                  </div>
                  <button onClick={() => document.getElementById('sup-ai-img')?.click()} disabled={aiFilling}
                    style={{ flexShrink: 0, padding: '11px 16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: 'white', fontSize: '13px', fontWeight: 700, cursor: aiFilling ? 'default' : 'pointer', opacity: aiFilling ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                    {aiFilling ? '분석 중...' : '📸 사진 선택'}
                  </button>
                </div>
                {aiMsg && <p style={{ fontSize: '12px', color: '#34d399', margin: '10px 0 0', fontWeight: 600 }}>{aiMsg}</p>}
              </div>

              {editProduct?.approval_status === '거절' && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ color: '#f87171', fontSize: '13px', fontWeight: 600, margin: 0 }}>거절된 상품입니다. 수정 후 재신청하세요.</p>
                </div>
              )}

              <div>
                <label style={labelStyle}>상품명 *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="상품명 입력" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>대표 이미지</label>
                <input id="sup-img" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                <div onClick={() => document.getElementById('sup-img')?.click()}
                  style={{ border: `2px dashed ${t.inputBorder}`, borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: t.input }}>
                  {form.image_url
                    ? <img src={form.image_url} alt="" style={{ height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block', borderRadius: '8px' }} />
                    : <div>
                        <p style={{ fontSize: '24px', margin: '0 0 6px' }}>📸</p>
                        <p style={{ color: t.textMuted, fontSize: '13px', margin: 0 }}>탭해서 이미지 올리기</p>
                      </div>
                  }
                </div>
                <StockImagePicker onPick={(url) => setForm(p => ({ ...p, image_url: url }))} />
              </div>

              <div>
                <label style={labelStyle}>카테고리</label>
                <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                  style={{ ...inputStyle, background: t.input }}>
                  <option value="" style={{ background: t.optionBg }}>카테고리 선택</option>
                  {categories.map(c => <option key={c.id} value={c.id} style={{ background: t.optionBg }}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '14px', padding: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', margin: '0 0 12px' }}>💡 공급가 입력 (관리자가 최종 판매가를 확정합니다)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: '🏭 도매 공급가 (원) *', key: 'suggested_wholesale_price' },
                    { label: '🛒 소매 공급가 (원) *', key: 'suggested_retail_price' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '10px', color: t.textMuted, marginBottom: '6px' }}>{label}</label>
                      <input type="number" value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        style={{ ...inputStyle, borderRadius: '10px', padding: '11px 12px' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>재고 수량</label>
                  <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>단위</label>
                  <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                    style={{ ...inputStyle, background: t.input }}>
                    {['kg', 'g', '박스', '마리', '개', '묶음'].map(u => <option key={u} style={{ background: t.optionBg }}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>상품 설명</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  placeholder="상품에 대한 간단한 설명"
                  style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '13px 16px' }}>
                  <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', padding: '16px 20px', borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
              <button onClick={() => { setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM); setError('') }}
                style={{ flex: 1, padding: '14px', borderRadius: '14px', border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                취소
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.35)', opacity: saving ? 0.6 : 1 }}>
                {saving ? '저장 중...' : editProduct ? '수정 후 재신청' : '등록 신청'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SupplierAiLandingEditor
        show={showAiEditor}
        onClose={() => { setShowAiEditor(false); setAiInitialProduct(null) }}
        products={products}
        initialProduct={aiInitialProduct}
        onDone={() => { setShowAiEditor(false); setAiInitialProduct(null); init() }}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 640px) {
          .modal-overlay { align-items: center !important; padding: 20px !important; }
          .modal-desktop { border-radius: 20px !important; max-height: 85vh !important; }
        }
      `}</style>
    </div>
  )
}

export default function SupplierProductsPage() {
  return (
    <SupplierLayout>
      <ProductsContent />
    </SupplierLayout>
  )
}
