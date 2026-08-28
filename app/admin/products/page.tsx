'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import ProductList from './components/ProductList'
import { ProductFormModal } from './components/ProductFormModal'
import type { ProductForm } from './components/ProductFormModal'
import { emptyProductOption, optionLabelError, optionRepresentative, optionsForInsert } from '@/lib/product-options'
import AiLandingEditor from './components/AiLandingEditor'
import AiLandingStudio from './components/AiLandingStudio'

// 새 모던 에디터 사용 여부. 문제 생기면 false 로 바꾸면 옛 에디터로 즉시 복귀(안전 스위치).
const USE_STUDIO = true

type Category = { id: string; name: string; sort_order: number }
type Product = {
  id: string; name: string; description: string
  origin?: string | null
  category_id: string; wholesale_price: number; member_price: number; retail_price: number
  stock: number; unit: string; weight?: number | null; image_url: string; is_active: boolean; is_taxable: boolean
  subscribable?: boolean; subscribe_discount?: number | null
  shipping_type?: 'free' | 'paid'; shipping_fee?: number | null; free_shipping_threshold?: number | null
}
const EMPTY_FORM: ProductForm = {
  name: '', description: '', origin: '', category_id: '', wholesale_price: '',
  member_price: '', retail_price: '', stock: '', unit: 'kg', weight: '', image_url: '', is_active: true, is_taxable: false,
  subscribable: false, subscribe_discount: '', shipping_type: 'free', shipping_fee: '', free_shipping_threshold: '', use_options: false, options: [emptyProductOption()]
}

export default function ProductsPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // 상품 폼
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)

  // AI 에디터
  const [showAiForm, setShowAiForm] = useState(false)
  const [aiInitialProduct, setAiInitialProduct] = useState<Product | null>(null)
  // 상세페이지 재생성: 목록엔 description이 없으므로 그 상품만 따로 불러와 채운다.
  const remakeDetail = async (p: Product) => {
    setShowAiForm(true); setAiInitialProduct(p)
    const { data } = await supabase.from('products').select('description').eq('id', p.id).single()
    setAiInitialProduct({ ...p, description: data?.description || '' })
  }

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      // ★ 목록은 description(상세페이지 HTML, base64 이미지 포함 수 MB) 제외 → 상품 많아도 빠름.
      //   description은 편집/상세재생성 진입 시 그 상품만 따로 조회한다.
      supabase.from('products')
        .select('id,name,origin,category_id,wholesale_price,member_price,retail_price,stock,unit,weight,image_url,is_active,is_taxable,subscribable,subscribe_discount,shipping_type,shipping_fee,free_shipping_threshold,supplier_id,created_at')
        .order('created_at', { ascending: false }),
    ])
    setCategories(cats || [])
    // description은 목록에서 제외했으므로 빈 문자열로 채움(편집/재생성 시 따로 조회).
    setProducts((prods || []).filter((p: any) => !p.supplier_id).map((p: any) => ({ ...p, description: '' })))
    setLoading(false)
  }

  const openEdit = async (p: Product) => {
    // 목록엔 description이 없으므로 편집 진입 시 그 상품만 따로 조회(옵션과 함께).
    const [{ data: optionRows }, { data: descRow }] = await Promise.all([
      supabase.from('product_options').select('*').eq('product_id', p.id).order('sort_order'),
      supabase.from('products').select('description').eq('id', p.id).single(),
    ])
    p = { ...p, description: descRow?.description || '' }
    setEditProduct(p)
    setForm({ name: p.name, description: p.description || '', origin: p.origin || '', category_id: p.category_id || '', wholesale_price: String(p.wholesale_price), member_price: String(p.member_price || 0), retail_price: String(p.retail_price), stock: p.stock == null ? '' : String(p.stock), unit: p.unit || 'kg', weight: p.weight != null ? String(p.weight) : '', image_url: p.image_url || '', is_active: p.is_active, is_taxable: p.is_taxable ?? false, subscribable: p.subscribable ?? false, subscribe_discount: p.subscribe_discount != null ? String(p.subscribe_discount) : '', shipping_type: p.shipping_type === 'paid' ? 'paid' : 'free', shipping_fee: p.shipping_fee != null ? String(p.shipping_fee) : '', free_shipping_threshold: p.free_shipping_threshold != null ? String(p.free_shipping_threshold) : '', use_options: !!optionRows?.length, options: optionRows?.length ? optionRows.map(o => ({ client_id: String(o.id), label: o.label, unit: o.unit || 'kg', weight: o.weight == null ? '' : String(o.weight), wholesale_price: String(o.wholesale_price || 0), member_price: String(o.member_price || 0), retail_price: String(o.retail_price || ''), stock: o.stock == null ? '' : String(o.stock) })) : [emptyProductOption()] })
    setShowForm(true)
  }

  const saveProduct = async () => {
    if (form.shipping_type === 'paid' && (!form.shipping_fee.trim() || Number(form.shipping_fee) < 0)) {
      alert('유료배송의 기본 택배비를 0원 이상으로 입력해주세요.')
      return
    }
    if (form.free_shipping_threshold.trim() && Number(form.free_shipping_threshold) <= 0) {
      alert('무료배송 기준금액은 0원보다 크게 입력하거나 비워주세요.')
      return
    }
    if (!form.name.trim()) { alert('상품명을 입력해 주세요.'); return }
    const labelError = form.use_options ? optionLabelError(form.options) : null
    if (labelError) { alert(labelError); return }
    if (form.use_options && form.options.some(o => !o.retail_price.trim())) { alert('모든 옵션의 일반구매가를 입력해 주세요.'); return }
    const representative = form.use_options ? optionRepresentative(form.options) : null
    const { use_options, options, ...productForm } = form
    const data = { ...productForm, category_id: form.category_id || null, origin: form.origin.trim() || null, wholesale_price: representative?.wholesale_price ?? Number(form.wholesale_price), member_price: representative?.member_price ?? (Number(form.member_price) || 0), retail_price: representative?.retail_price ?? Number(form.retail_price), stock: representative ? representative.stock : (form.stock.trim() === '' ? null : Number(form.stock)), unit: representative?.unit ?? form.unit, weight: representative ? representative.weight : (form.weight.trim() === '' ? null : Number(form.weight)), subscribable: !!form.subscribable, subscribe_discount: form.subscribe_discount.trim() === '' ? 0 : Number(form.subscribe_discount), shipping_type: form.shipping_type, shipping_fee: form.shipping_type === 'paid' ? Number(form.shipping_fee) : 0, free_shipping_threshold: form.shipping_type === 'paid' && form.free_shipping_threshold.trim() ? Number(form.free_shipping_threshold) : null }
    const result = editProduct
      ? await supabase.from('products').update(data).eq('id', editProduct.id).select('id').single()
      : await supabase.from('products').insert(data).select('id').single()
    const { error } = result
    if (error) {
      console.error('[admin product save] failed', error)
      alert(`상품 저장에 실패했습니다.\n\n원인: ${error.message}\n\n(누락된 컬럼 안내가 뜨면 캡처해서 관리자에게 전달해 주세요.)`)
      return
    }
    const productId = result.data.id
    // 옵션 저장 실패 시, 방금 새로 만든 상품은 롤백(삭제)해 중복 상품 생성을 막는다.
    const rollbackIfNew = async () => { if (!editProduct) await supabase.from('products').delete().eq('id', productId) }
    const { error: deleteError } = await supabase.from('product_options').delete().eq('product_id', productId)
    if (deleteError) { await rollbackIfNew(); alert(`옵션 정리에 실패했습니다: ${deleteError.message}`); return }
    if (form.use_options) {
      const optionsToSave = form.options.map(option => ({ ...option, label: option.label.trim() }))
      const { error: optionError } = await supabase.from('product_options').insert(optionsForInsert(productId, optionsToSave))
      if (optionError) { await rollbackIfNew(); alert(`옵션 저장에 실패했습니다: ${optionError.message}`); return }
    }
    setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM); fetchAll()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchAll()
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">상품관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm mt-0.5">자체 상품 등록 및 상세페이지 관리</p>
        </div>
          <div className="flex gap-2">
            <button onClick={() => { setAiInitialProduct(null); setShowAiForm(true) }}
              className="text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#ec4899,#f43f5e)', boxShadow: '0 4px 15px rgba(236,72,153,0.35)' }}>
              ✨ AI 상세
            </button>
            <button onClick={() => { setEditProduct(null); setForm(EMPTY_FORM); setShowForm(true) }}
              className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-green-600/20">
              + 등록
            </button>
          </div>
      </div>

      <ProductList
        products={products} categories={categories} loading={loading}
        onEdit={openEdit} onDelete={deleteProduct} onRemake={remakeDetail}
      />

      {/* 상품 폼 모달 */}
      <ProductFormModal
        show={showForm}
        onClose={() => { setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM) }}
        editProduct={editProduct}
        form={form} setForm={setForm}
        onSave={saveProduct}
        categories={categories}
      />

      {USE_STUDIO ? (
        <AiLandingStudio
          show={showAiForm}
          onClose={() => { setShowAiForm(false); setAiInitialProduct(null) }}
          products={products}
          initialProduct={aiInitialProduct}
          onDone={() => { setAiInitialProduct(null); fetchAll() }}
        />
      ) : (
        <AiLandingEditor
          show={showAiForm}
          onClose={() => { setShowAiForm(false); setAiInitialProduct(null) }}
          products={products}
          initialProduct={aiInitialProduct}
          onDone={() => { setAiInitialProduct(null); fetchAll() }}
        />
      )}
    </div>
  )
}
