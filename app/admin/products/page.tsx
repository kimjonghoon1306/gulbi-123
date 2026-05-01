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
  stock: number; unit: string; image_url: string; is_active: boolean
}

const EMPTY_FORM: ProductForm = {
  name: '', description: '', category_id: '', wholesale_price: '',
  member_price: '', retail_price: '', stock: '', unit: 'kg', image_url: '', is_active: true
}

export default function ProductsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'products' | 'categories'>('products')
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

  // ── 상품 CRUD ────────────────────────────────────────────
  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({ name: p.name, description: p.description || '', category_id: p.category_id || '', wholesale_price: String(p.wholesale_price), member_price: String(p.member_price || 0), retail_price: String(p.retail_price), stock: String(p.stock), unit: p.unit || 'kg', image_url: p.image_url || '', is_active: p.is_active })
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

  // ── 카테고리 CRUD ─────────────────────────────────────────
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

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">상품관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">수산물 상품 및 카테고리 관리</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAiForm(true)}
            className="text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#ec4899,#f43f5e)', boxShadow: '0 4px 15px rgba(236,72,153,0.35)' }}>
            ✨ AI 상세페이지
          </button>
          <button onClick={() => { setEditProduct(null); setForm(EMPTY_FORM); setShowForm(true) }}
            className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-sky-500/20">
            + 상품 등록
          </button>
        </div>
      </div>

      <ProductList
        tab={tab} setTab={setTab}
        products={products} categories={categories} loading={loading}
        onEdit={openEdit} onDelete={deleteProduct}
        onEditCat={c => { setEditCat(c); setCatName(c.name); setShowCatForm(true) }}
        onDeleteCat={deleteCat}
        onAddCat={() => { setCatName(''); setEditCat(null); setShowCatForm(true) }}
      />

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
    </div>
  )
}
