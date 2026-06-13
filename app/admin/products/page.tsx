'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import ProductList from './components/ProductList'
import { ProductFormModal, CategoryFormModal } from './components/ProductFormModal'
import type { ProductForm } from './components/ProductFormModal'
import AiLandingEditor from './components/AiLandingEditor'

type Category = { id: string; name: string; sort_order: number }
type Product = {
  id: string; name: string; description: string
  category_id: string; wholesale_price: number; member_price: number; retail_price: number
  stock: number; unit: string; image_url: string; is_active: boolean; is_taxable: boolean
}
type SupplierProduct = {
  id: string; name: string; description: string
  category_id: string; image_url: string; unit: string; stock: number
  suggested_wholesale_price: number; suggested_retail_price: number
  wholesale_price: number; retail_price: number; member_price: number
  approval_status: string; supplier_id: string; is_active: boolean; created_at: string
  suppliers?: { company_name: string; contact: string }
}

const EMPTY_FORM: ProductForm = {
  name: '', description: '', category_id: '', wholesale_price: '',
  member_price: '', retail_price: '', stock: '', unit: 'kg', image_url: '', is_active: true, is_taxable: false
}

export default function ProductsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'products' | 'supplier' | 'categories'>('products')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // 상품 폼
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)

  // 카테고리 폼
  const [showCatForm, setShowCatForm] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [catName, setCatName] = useState('')

  // AI 에디터
  const [showAiForm, setShowAiForm] = useState(false)

  // 공급업체 승인
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
  const [approvalFilter, setApprovalFilter] = useState<'대기중' | '승인' | '거절' | '수정요청'>('대기중')
  const [reviewProduct, setReviewProduct] = useState<SupplierProduct | null>(null)
  const [reviewForm, setReviewForm] = useState({
    name: '', wholesale_price: '', retail_price: '', member_price: '',
    category_id: '', unit: '', stock: '', description: '',
  })
  const [rejectReason, setRejectReason] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [showRejectInput, setShowRejectInput] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: cats }, { data: prods }, { data: supProds }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('products')
        .select('*, suppliers(company_name, contact)')
        .not('supplier_id', 'is', null)
        .order('created_at', { ascending: false }),
    ])
    setCategories(cats || [])
    setProducts((prods || []).filter((p: any) => !p.supplier_id))
    setSupplierProducts(supProds || [])
    setLoading(false)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({ name: p.name, description: p.description || '', category_id: p.category_id || '', wholesale_price: String(p.wholesale_price), member_price: String(p.member_price || 0), retail_price: String(p.retail_price), stock: String(p.stock), unit: p.unit || 'kg', image_url: p.image_url || '', is_active: p.is_active, is_taxable: p.is_taxable ?? false })
    setShowForm(true)
  }

  const saveProduct = async () => {
    const data = { ...form, wholesale_price: Number(form.wholesale_price), member_price: Number(form.member_price) || 0, retail_price: Number(form.retail_price), stock: Number(form.stock) }
    if (editProduct) {
      await supabase.from('products').update(data).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert(data)
    }
    setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM); fetchAll()
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

  // ── 공급업체 상품 검토 열기 ──
  const openReview = (p: SupplierProduct) => {
    setReviewProduct(p)
    setReviewForm({
      name: p.name,
      // 도매 유통가 ← 확정값 있으면 그것, 없으면 도매 공급가
      wholesale_price: String(p.wholesale_price || p.suggested_wholesale_price || ''),
      // 소매 유통가 ← 확정값 있으면 그것, 없으면 소매 공급가
      member_price: String(p.member_price || p.suggested_retail_price || ''),
      // 일반 구매가 ← 확정값만 사용, 없으면 관리자가 직접 입력 (소매 공급가 자동 채움 안 함)
      retail_price: String(p.retail_price || ''),
      category_id: p.category_id || '',
      unit: p.unit || 'kg',
      stock: String(p.stock || ''),
      description: p.description || '',
    })
    setRejectReason('')
    setShowRejectInput(false)
  }

  // ── 승인 ──
  const handleApprove = async () => {
    if (!reviewProduct) return
    setReviewLoading(true)
    await supabase.from('products').update({
      name: reviewForm.name,
      wholesale_price: Number(reviewForm.wholesale_price) || 0,
      retail_price: Number(reviewForm.retail_price) || 0,
      member_price: Number(reviewForm.member_price) || 0,
      category_id: reviewForm.category_id || null,
      unit: reviewForm.unit,
      stock: Number(reviewForm.stock) || 0,
      description: reviewForm.description,
      approval_status: '승인',
      is_active: true,
      updated_at: new Date().toISOString(),
    }).eq('id', reviewProduct.id)
    setReviewProduct(null); setReviewLoading(false); fetchAll()
  }

  // ── 거절 ──
  const handleReject = async () => {
    if (!reviewProduct || !rejectReason.trim()) return
    setReviewLoading(true)
    await supabase.from('products').update({
      approval_status: '거절',
      is_active: false,
      rejection_reason: rejectReason.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', reviewProduct.id)
    setReviewProduct(null); setReviewLoading(false); setShowRejectInput(false); fetchAll()
  }

  // ── 수정요청 ──
  const handleRequestRevision = async () => {
    if (!reviewProduct || !rejectReason.trim()) return
    setReviewLoading(true)
    await supabase.from('products').update({
      approval_status: '수정요청',
      is_active: false,
      rejection_reason: rejectReason.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', reviewProduct.id)
    setReviewProduct(null); setReviewLoading(false); setShowRejectInput(false); fetchAll()
  }

  const filteredSupplierProducts = supplierProducts.filter(p => p.approval_status === approvalFilter)

  const statusStyle: Record<string, { bg: string; color: string }> = {
    '대기중':   { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
    '승인':     { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
    '거절':     { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
    '수정요청': { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8' },
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">상품관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm mt-0.5">상품 · 공급업체 승인 · 카테고리 관리</p>
        </div>
        {tab === 'products' && (
          <div className="flex gap-2">
            <button onClick={() => setShowAiForm(true)}
              className="text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#ec4899,#f43f5e)', boxShadow: '0 4px 15px rgba(236,72,153,0.35)' }}>
              ✨ AI 상세
            </button>
            <button onClick={() => { setEditProduct(null); setForm(EMPTY_FORM); setShowForm(true) }}
              className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-green-600/20">
              + 등록
            </button>
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="overflow-x-auto -mx-4 px-4 pb-1 mb-5">
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-max">
        {[
          { key: 'products',  label: '📦 상품 목록' },
          { key: 'supplier',  label: `🏭 공급업체 승인 ${supplierProducts.filter(p => p.approval_status === '대기중').length > 0 ? `(${supplierProducts.filter(p => p.approval_status === '대기중').length})` : ''}` },
          { key: 'categories', label: '🗂 카테고리' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
            {t.label}
          </button>
        ))}
      </div>
      </div>

      {/* 상품 목록 탭 */}
      {tab === 'products' && (
        <ProductList
          tab="products" setTab={() => {}}
          products={products} categories={categories} loading={loading}
          onEdit={openEdit} onDelete={deleteProduct}
          onEditCat={c => { setEditCat(c); setCatName(c.name); setShowCatForm(true) }}
          onDeleteCat={deleteCat}
          onAddCat={() => { setCatName(''); setEditCat(null); setShowCatForm(true) }}
        />
      )}

      {/* 공급업체 승인 탭 */}
      {tab === 'supplier' && (
        <div>
          {/* 상태 필터 */}
          <div className="flex gap-2 mb-4">
            {(['대기중', '승인', '거절', '수정요청'] as const).map(s => (
              <button key={s} onClick={() => setApprovalFilter(s)}
                style={{
                  padding: '8px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                  background: approvalFilter === s ? statusStyle[s].bg : 'transparent',
                  color: approvalFilter === s ? statusStyle[s].color : '#94a3b8',
                  boxShadow: approvalFilter === s ? '0 0 0 1px ' + statusStyle[s].color + '40' : 'none',
                }}>
                {s} ({supplierProducts.filter(p => p.approval_status === s).length})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSupplierProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-slate-400 text-sm">{approvalFilter} 상태의 공급업체 상품이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredSupplierProducts.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 hover:border-amber-400/50 transition-colors cursor-pointer"
                  onClick={() => openReview(p)}>
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
                    {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🧺</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{p.name}</p>
                      <span style={{ ...statusStyle[p.approval_status], padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                        {p.approval_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      공급업체: {(p.suppliers as any)?.company_name || '-'}
                      {' · '}도매 공급가 {p.suggested_wholesale_price?.toLocaleString()}원
                      {' · '}소매 공급가 {p.suggested_retail_price?.toLocaleString()}원
                    </p>
                    <p className="text-xs text-slate-300 dark:text-slate-500 mt-0.5">
                      등록일 {new Date(p.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 text-lg flex-shrink-0">›</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 카테고리 탭 */}
      {tab === 'categories' && (
        <ProductList
          tab="categories" setTab={() => {}}
          products={products} categories={categories} loading={loading}
          onEdit={openEdit} onDelete={deleteProduct}
          onEditCat={c => { setEditCat(c); setCatName(c.name); setShowCatForm(true) }}
          onDeleteCat={deleteCat}
          onAddCat={() => { setCatName(''); setEditCat(null); setShowCatForm(true) }}
        />
      )}

      {/* 상품 폼 모달 */}
      <ProductFormModal
        show={showForm}
        onClose={() => { setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM) }}
        editProduct={editProduct}
        form={form} setForm={setForm}
        onSave={saveProduct}
        categories={categories}
      />

      <CategoryFormModal
        show={showCatForm}
        onClose={() => { setShowCatForm(false); setEditCat(null); setCatName('') }}
        editCat={editCat}
        catName={catName} setCatName={setCatName}
        onSave={saveCat}
      />

      <AiLandingEditor
        show={showAiForm}
        onClose={() => setShowAiForm(false)}
        products={products}
        onDone={fetchAll}
      />

      {/* ── 공급업체 상품 검토 모달 ── */}
      {reviewProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden" style={{ maxWidth: '1000px', maxHeight: '90vh', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

            {/* 왼쪽: 상품 정보 + 수정 */}
            <div className="flex-1 md:overflow-y-auto p-6 flex flex-col gap-4 md:border-r md:border-black/[0.08]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 dark:text-white">🔍 상품 검토</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>공급업체: {(reviewProduct.suppliers as any)?.company_name || '-'}</span>
                  <span>·</span>
                  <span>{(reviewProduct.suppliers as any)?.contact || '-'}</span>
                </div>
              </div>

              {/* 이미지 */}
              {reviewProduct.image_url && (
                <div className="w-full rounded-2xl overflow-hidden bg-slate-100" style={{ maxHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={reviewProduct.image_url} alt="" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}

              {/* 공급가 표시 */}
              <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <p className="font-bold text-purple-400 mb-1">💡 공급업체 공급가 (참고용)</p>
                <p className="text-slate-400">
                  도매 {reviewProduct.suggested_wholesale_price?.toLocaleString()}원
                  {' · '}소매 {reviewProduct.suggested_retail_price?.toLocaleString()}원
                </p>
              </div>

              {/* 수정 가능 필드들 */}
              {[
                { label: '상품명', key: 'name', type: 'text', full: true },
                { label: '일반 구매가 (원)', key: 'retail_price', type: 'number' },
                { label: '소매 유통가 (원)', key: 'member_price', type: 'number' },
                { label: '도매 유통가 (원)', key: 'wholesale_price', type: 'number' },
                { label: '재고', key: 'stock', type: 'number' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : undefined }}>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">{f.label}</label>
                  <input type={f.type} value={(reviewForm as any)[f.key]}
                    onChange={e => setReviewForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-400" />
                </div>
              ))}

              {/* 카테고리 */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">카테고리</label>
                <select value={reviewForm.category_id}
                  onChange={e => setReviewForm(p => ({ ...p, category_id: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none">
                  <option value="">카테고리 없음</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* 단위 */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">단위</label>
                <select value={reviewForm.unit}
                  onChange={e => setReviewForm(p => ({ ...p, unit: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none">
                  {['kg', 'g', '박스', '마리', '개', '묶음'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* 오른쪽: 상세페이지 미리보기 + 버튼 */}
            <div className="flex flex-col w-full md:w-[360px] md:flex-shrink-0">
              {/* 상세페이지 미리보기 */}
              <div className="min-h-[220px] md:flex-1" style={{ overflowY: 'auto', background: '#f0f0f0', padding: '12px', display: 'flex', justifyContent: 'center' }}>
                {reviewProduct.description ? (
                  <div style={{ width: '100%', maxWidth: '320px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    {reviewProduct.image_url && (
                      <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src={reviewProduct.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: reviewProduct.description }}
                      style={{ pointerEvents: 'none', userSelect: 'none', fontSize: '12px' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '32px' }}>📄</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>상세페이지 없음</p>
                  </div>
                )}
              </div>

              {/* 거절/수정요청 사유 입력 */}
              {showRejectInput && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(239,68,68,0.04)' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>거절/수정요청 사유 *</label>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                    placeholder="공급업체에게 전달할 사유를 입력해주세요"
                    style={{ width: '100%', background: 'white', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#1a1a1a', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <button onClick={handleReject} disabled={!rejectReason.trim() || reviewLoading}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: !rejectReason.trim() || reviewLoading ? 0.5 : 1 }}>
                      ❌ 거절 확정
                    </button>
                    <button onClick={handleRequestRevision} disabled={!rejectReason.trim() || reviewLoading}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: !rejectReason.trim() || reviewLoading ? 0.5 : 1 }}>
                      ✏️ 수정요청
                    </button>
                  </div>
                </div>
              )}

              {/* 버튼 영역 */}
              <div style={{ padding: '16px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <button onClick={handleApprove} disabled={reviewLoading}
                  style={{ padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #34d399, #10b981)', color: 'white', fontSize: '14px', fontWeight: 800, boxShadow: '0 4px 16px rgba(52,211,153,0.35)', opacity: reviewLoading ? 0.6 : 1 }}>
                  {reviewLoading ? '처리 중...' : '✅ 승인하기'}
                </button>
                <button onClick={() => setShowRejectInput(v => !v)}
                  style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  ❌ 거절 / ✏️ 수정요청
                </button>
                <button onClick={() => setReviewProduct(null)}
                  style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
