'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import ProductList from './components/ProductList'
import { ProductFormModal } from './components/ProductFormModal'
import type { ProductForm } from './components/ProductFormModal'
import AiLandingEditor from './components/AiLandingEditor'

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
  subscribable: false, subscribe_discount: '', shipping_type: 'free', shipping_fee: '', free_shipping_threshold: ''
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
  const remakeDetail = (p: Product) => { setAiInitialProduct(p); setShowAiForm(true) }

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ])
    setCategories(cats || [])
    setProducts((prods || []).filter((p: any) => !p.supplier_id))
    setLoading(false)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({ name: p.name, description: p.description || '', origin: p.origin || '', category_id: p.category_id || '', wholesale_price: String(p.wholesale_price), member_price: String(p.member_price || 0), retail_price: String(p.retail_price), stock: String(p.stock), unit: p.unit || 'kg', weight: p.weight != null ? String(p.weight) : '', image_url: p.image_url || '', is_active: p.is_active, is_taxable: p.is_taxable ?? false, subscribable: p.subscribable ?? false, subscribe_discount: p.subscribe_discount != null ? String(p.subscribe_discount) : '', shipping_type: p.shipping_type === 'paid' ? 'paid' : 'free', shipping_fee: p.shipping_fee != null ? String(p.shipping_fee) : '', free_shipping_threshold: p.free_shipping_threshold != null ? String(p.free_shipping_threshold) : '' })
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
    const data = { ...form, origin: form.origin.trim() || null, wholesale_price: Number(form.wholesale_price), member_price: Number(form.member_price) || 0, retail_price: Number(form.retail_price), stock: Number(form.stock), weight: form.weight.trim() === '' ? null : Number(form.weight), subscribable: !!form.subscribable, subscribe_discount: form.subscribe_discount.trim() === '' ? 0 : Number(form.subscribe_discount), shipping_type: form.shipping_type, shipping_fee: form.shipping_type === 'paid' ? Number(form.shipping_fee) : 0, free_shipping_threshold: form.shipping_type === 'paid' && form.free_shipping_threshold.trim() ? Number(form.free_shipping_threshold) : null }
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

      <AiLandingEditor
        show={showAiForm}
        onClose={() => { setShowAiForm(false); setAiInitialProduct(null) }}
        products={products}
        initialProduct={aiInitialProduct}
        onDone={() => { setAiInitialProduct(null); fetchAll() }}
      />
    </div>
  )
}
