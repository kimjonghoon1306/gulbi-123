'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import ProductList from './components/ProductList'
import { ProductFormModal, CategoryFormModal } from './components/ProductFormModal'
import type { ProductForm } from './components/ProductFormModal'
import AiLandingEditor from './components/AiLandingEditor'
import SupplierApprovalTab from './_SupplierApprovalTab'
import SupplierReviewModal from './_SupplierReviewModal'

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
  const [okMsg, setOkMsg] = useState('')

  useEffect(() => { fetchAll() }, [])

  // 성공 토스트 4초 후 자동 사라짐
  useEffect(() => {
    if (!okMsg) return
    const id = setTimeout(() => setOkMsg(''), 4000)
    return () => clearTimeout(id)
  }, [okMsg])

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
      // 도매 공급가 ← 확정값 있으면 그것, 없으면 도매 공급가
      wholesale_price: String(p.wholesale_price || p.suggested_wholesale_price || ''),
      // 소매 공급가 ← 확정값 있으면 그것, 없으면 소매 공급가
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
    if (!reviewForm.retail_price || Number(reviewForm.retail_price) <= 0) { alert('일반 구매가를 입력해주세요.'); return }
    setReviewLoading(true)
    const { error } = await supabase.from('products').update({
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
      rejection_reason: null,
    }).eq('id', reviewProduct.id)
    setReviewLoading(false)
    if (error) {
      console.error('[admin product approve] failed', error)
      alert('상품 승인 저장에 실패했습니다. 서버 로그를 확인해 주세요.')
      return
    }   // 실패 시 모달 유지 + 원인 표시
    setReviewProduct(null)
    setOkMsg('✅ 가격이 확정되어 쇼핑몰에 노출되었습니다.')
    fetchAll()
  }

  // ── 거절 ──
  const handleReject = async () => {
    if (!reviewProduct || !rejectReason.trim()) return
    setReviewLoading(true)
    const { error } = await supabase.from('products').update({
      approval_status: '거절',
      is_active: false,
      rejection_reason: rejectReason.trim(),
    }).eq('id', reviewProduct.id)
    setReviewLoading(false)
    if (error) {
      console.error('[admin product reject] failed', error)
      alert('상품 거절 처리에 실패했습니다. 서버 로그를 확인해 주세요.')
      return
    }
    setReviewProduct(null); setShowRejectInput(false)
    setOkMsg('거절 처리되었습니다. 공급업체에 사유가 전달됩니다.')
    fetchAll()
  }

  // ── 수정요청 ──
  const handleRequestRevision = async () => {
    if (!reviewProduct || !rejectReason.trim()) return
    setReviewLoading(true)
    const { error } = await supabase.from('products').update({
      approval_status: '수정요청',
      is_active: false,
      rejection_reason: rejectReason.trim(),
    }).eq('id', reviewProduct.id)
    setReviewLoading(false)
    if (error) {
      console.error('[admin product revision request] failed', error)
      alert('수정요청 저장에 실패했습니다. 서버 로그를 확인해 주세요.')
      return
    }
    setReviewProduct(null); setShowRejectInput(false)
    setOkMsg('수정요청을 보냈습니다. 공급업체가 수정 후 재신청합니다.')
    fetchAll()
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
      {/* 성공 토스트 (가격 확정/거절/수정요청 안내) */}
      {okMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 8px 30px rgba(22,163,74,0.45)', maxWidth: '90vw', textAlign: 'center' }}>
          {okMsg}
        </div>
      )}

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
        <SupplierApprovalTab
          loading={loading}
          approvalFilter={approvalFilter}
          setApprovalFilter={setApprovalFilter}
          supplierProducts={supplierProducts}
          filteredSupplierProducts={filteredSupplierProducts}
          statusStyle={statusStyle}
          openReview={openReview}
        />
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
      <SupplierReviewModal
        reviewProduct={reviewProduct}
        setReviewProduct={setReviewProduct}
        reviewForm={reviewForm}
        setReviewForm={setReviewForm}
        categories={categories}
        showRejectInput={showRejectInput}
        setShowRejectInput={setShowRejectInput}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        reviewLoading={reviewLoading}
        handleApprove={handleApprove}
        handleReject={handleReject}
        handleRequestRevision={handleRequestRevision}
      />
    </div>
  )
}
