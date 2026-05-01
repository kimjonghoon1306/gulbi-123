'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import SupplierLayout from '../_layout/layout'

type Product = {
  id: string; name: string; description: string
  category_id: string; suggested_wholesale_price: number; suggested_retail_price: number
  wholesale_price: number; retail_price: number
  stock: number; unit: string; image_url: string
  approval_status: string; created_at: string
}

type Category = { id: string; name: string }

const APPROVAL_COLOR: Record<string, string> = {
  '대기중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  '승인':   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  '거절':   'bg-red-100 dark:bg-red-900/30 text-red-500',
}

const EMPTY_FORM = {
  name: '', category_id: '', suggested_wholesale_price: '', suggested_retail_price: '',
  stock: '', unit: 'kg', image_url: '', description: ''
}

export default function SupplierProductsPage() {
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

  useEffect(() => { init() }, [])

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
      setSupplierStatus(sup?.status || '승인') // suppliers에 없으면 관리자 → 승인으로 처리
      setCategories(cats || [])
      setProducts(prods || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
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

  const handleSave = async () => {
    if (!form.name || !form.suggested_wholesale_price || !form.suggested_retail_price) {
      return setError('상품명, 도매 제안가, 소매 제안가는 필수입니다.')
    }
    setSaving(true); setError('')

    const data = {
      name: form.name,
      description: form.description,
      category_id: form.category_id || null,
      suggested_wholesale_price: Number(form.suggested_wholesale_price),
      suggested_retail_price: Number(form.suggested_retail_price),
      wholesale_price: 0,
      retail_price: 0,
      member_price: 0,
      stock: Number(form.stock) || 0,
      unit: form.unit,
      image_url: form.image_url,
      supplier_id: supplierId,
      approval_status: '대기중',
      is_active: false,  // 관리자 승인 전까지 비노출
    }

    if (editProduct) {
      // 이미 승인된 상품 수정 시 다시 대기중으로
      await supabase.from('products').update({
        ...data,
        approval_status: editProduct.approval_status === '승인' ? '대기중' : editProduct.approval_status
      }).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert(data)
    }

    setSaving(false)
    setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM)
    init()
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({
      name: p.name, category_id: p.category_id || '',
      suggested_wholesale_price: String(p.suggested_wholesale_price),
      suggested_retail_price: String(p.suggested_retail_price),
      stock: String(p.stock), unit: p.unit || 'kg',
      image_url: p.image_url || '', description: p.description || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('products').delete().eq('id', id)
    init()
  }

  if (loading) return (
    <SupplierLayout>
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">불러오는 중...</p>
      </div>
    </SupplierLayout>
  )

  return (
    <SupplierLayout>
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">상품 관리</h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">상품 등록 후 관리자 승인 시 쇼핑몰에 노출됩니다</p>
          </div>
          {supplierStatus === '승인' && (
            <button onClick={() => { setEditProduct(null); setForm(EMPTY_FORM); setShowForm(true) }}
              className="bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-violet-500/20">
              + 상품 등록
            </button>
          )}
        </div>

        {supplierStatus !== '승인' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-6">
            <p className="text-amber-700 dark:text-amber-400 font-semibold">⏳ 관리자 승인 후 상품 등록이 가능합니다</p>
          </div>
        )}

        {/* 상품 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">등록된 상품이 없습니다</p>
            </div>
          ) : (
            <table className="w-full supplier-table">
              <thead>
                <tr className="border-b border-slate-100 dark:border-gray-700">
                  {['상품명', '제안 도매가', '제안 소매가', '확정 가격', '재고', '상태', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {p.image_url && <img src={p.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}
                        <span className="text-sm font-medium text-slate-800 dark:text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400" data-label="제안 도매가">{p.suggested_wholesale_price?.toLocaleString()}원</td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400" data-label="제안 소매가">{p.suggested_retail_price?.toLocaleString()}원</td>
                    <td className="px-5 py-4 text-sm">
                      {p.wholesale_price > 0
                        ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">{p.wholesale_price.toLocaleString()}원</span>
                        : <span className="text-slate-300 dark:text-slate-600">미확정</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200" data-label="재고">{p.stock}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${APPROVAL_COLOR[p.approval_status] || APPROVAL_COLOR['대기중']}`}>
                        {p.approval_status || '대기중'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {p.approval_status !== '승인' && (
                          <button onClick={() => openEdit(p)} className="text-xs text-violet-500 hover:text-violet-600 font-medium">수정</button>
                        )}
                        <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-500 font-medium">삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 상품 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {editProduct ? '상품 수정' : '상품 등록'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM); setError('') }}
                className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {editProduct?.approval_status === '거절' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-red-600 dark:text-red-400 text-sm font-semibold">거절된 상품입니다. 수정 후 재신청하세요.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">상품명 *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="상품명 입력"
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">대표 이미지</label>
                <input id="sup-img" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                <div onClick={() => document.getElementById('sup-img')?.click()}
                  style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                  {form.image_url
                    ? <img src={form.image_url} alt="" style={{ height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block', borderRadius: '8px' }} />
                    : <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>📸 클릭해서 이미지 올리기</p>
                  }
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">카테고리</label>
                <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">카테고리 선택</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400">💡 가격 제안 (관리자가 최종 확정합니다)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">🏭 도매 제안가 (원) *</label>
                    <input type="number" value={form.suggested_wholesale_price}
                      onChange={e => setForm(p => ({ ...p, suggested_wholesale_price: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">🛒 소매 제안가 (원) *</label>
                    <input type="number" value={form.suggested_retail_price}
                      onChange={e => setForm(p => ({ ...p, suggested_retail_price: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">재고 수량</label>
                  <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">단위</label>
                  <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                    {['kg', 'g', '박스', '마리', '개', '묶음'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">상품 설명</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  placeholder="상품에 대한 간단한 설명을 입력하세요"
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={() => { setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM); setError('') }}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                취소
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold transition-colors active:scale-95 disabled:opacity-50">
                {saving ? '저장 중...' : editProduct ? '수정 후 재신청' : '등록 신청'}
              </button>
            </div>
          </div>
        </div>
      )}
    <style>{`
        @media (max-width: 640px) {
          /* 테이블을 카드형으로 변환 */
          .supplier-table thead { display: none !important; }
          .supplier-table tbody tr {
            display: flex !important;
            flex-direction: column !important;
            padding: 16px !important;
            margin-bottom: 8px !important;
            background: var(--row-bg, transparent);
            border-radius: 12px !important;
            border: 1px solid rgba(255,255,255,0.06) !important;
          }
          .supplier-table td {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 6px 0 !important;
            border: none !important;
            font-size: 13px !important;
          }
          .supplier-table td:before {
            content: attr(data-label);
            font-size: 11px;
            color: rgba(255,255,255,0.4);
            font-weight: 600;
          }
        }
      `}</style>
    </SupplierLayout>
  )
}
