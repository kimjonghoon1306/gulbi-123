'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Supplier = {
  id: string; email: string; company_name: string; representative: string
  business_number: string; contact: string; address: string; category: string
  status: string; note: string; created_at: string
}

type SupplierProduct = {
  id: string; name: string; image_url: string
  suggested_wholesale_price: number; suggested_retail_price: number
  wholesale_price: number; retail_price: number; member_price: number
  stock: number; unit: string; approval_status: string; supplier_id: string
  category_id: string
}

const STATUS_COLOR: Record<string, string> = {
  '대기중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  '승인':   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  '거절':   'bg-red-100 dark:bg-red-900/30 text-red-500',
}

export default function AdminSuppliersPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'suppliers' | 'products'>('suppliers')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Supplier | null>(null)
  const [note, setNote] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null)
  const [priceForm, setPriceForm] = useState({ wholesale_price: '', retail_price: '', member_price: '' })
  const [filterStatus, setFilterStatus] = useState('전체')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: sups }, { data: prods }] = await Promise.all([
      supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').not('supplier_id', 'is', null).order('created_at', { ascending: false })
    ])
    setSuppliers(sups || [])
    setProducts(prods || [])
    setLoading(false)
  }

  // ── 공급업체 승인/거절 ──────────────────────────────────
  const updateSupplierStatus = async (id: string, status: string) => {
    await supabase.from('suppliers').update({ status, note }).eq('id', id)
    setSelected(null); setNote(''); fetchAll()
  }

  // ── 상품 가격 확정 + 승인 ──────────────────────────────
  const approveProduct = async () => {
    if (!selectedProduct) return
    if (!priceForm.wholesale_price || !priceForm.retail_price) return alert('도매가와 소매가를 입력해주세요.')

    await supabase.from('products').update({
      wholesale_price: Number(priceForm.wholesale_price),
      retail_price: Number(priceForm.retail_price),
      member_price: Number(priceForm.member_price) || 0,
      approval_status: '승인',
      is_active: true,
    }).eq('id', selectedProduct.id)

    setSelectedProduct(null); setPriceForm({ wholesale_price: '', retail_price: '', member_price: '' })
    fetchAll()
  }

  const rejectProduct = async (id: string) => {
    await supabase.from('products').update({ approval_status: '거절', is_active: false }).eq('id', id)
    setSelectedProduct(null); fetchAll()
  }

  const pendingSuppliers = suppliers.filter(s => s.status === '대기중').length
  const pendingProducts  = products.filter(p => p.approval_status === '대기중').length

  const filteredSuppliers = suppliers.filter(s =>
    filterStatus === '전체' || s.status === filterStatus
  )

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">공급업체 관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            공급업체 승인 및 상품 가격 확정
            {(pendingSuppliers > 0 || pendingProducts > 0) && (
              <span className="ml-2 inline-flex gap-1">
                {pendingSuppliers > 0 && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">업체 대기 {pendingSuppliers}</span>}
                {pendingProducts  > 0 && <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold px-2 py-0.5 rounded-full">상품 대기 {pendingProducts}</span>}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'suppliers', label: '🏭 공급업체 목록' },
          { key: 'products',  label: `📦 상품 승인 ${pendingProducts > 0 ? `(대기 ${pendingProducts})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${tab === t.key ? 'bg-violet-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 공급업체 목록 탭 ── */}
      {tab === 'suppliers' && (
        <>
          <div className="flex gap-2 mb-4">
            {['전체', '대기중', '승인', '거절'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${filterStatus === s ? 'bg-violet-500 text-white' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700'}`}>
                {s} <span className="ml-1 opacity-70">{s === '전체' ? suppliers.length : suppliers.filter(sup => sup.status === s).length}</span>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-slate-400">불러오는 중...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-4xl mb-3">🏭</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">공급업체가 없습니다</p>
              </div>
            ) : filteredSuppliers.map(s => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-lg">🏭</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">{s.company_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status] || STATUS_COLOR['대기중']}`}>{s.status}</span>
                      {s.category && <span className="text-xs text-slate-400 dark:text-slate-500">{s.category}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-slate-400 dark:text-slate-500">{s.email}</p>
                      {s.contact && <p className="text-xs text-slate-400 dark:text-slate-500">📞 {s.contact}</p>}
                      {s.business_number && <p className="text-xs text-slate-400 dark:text-slate-500">{s.business_number}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-300 dark:text-slate-600 hidden md:block">{new Date(s.created_at).toLocaleDateString('ko-KR')}</p>
                  <button onClick={() => { setSelected(s); setNote(s.note || '') }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${s.status === '대기중' ? 'bg-violet-500 hover:bg-violet-400 text-white' : 'text-slate-400 border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700'}`}>
                    {s.status === '대기중' ? '심사하기' : '수정'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 상품 승인 탭 ── */}
      {tab === 'products' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">공급업체 상품이 없습니다</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-gray-700">
                  {['상품명', '제안 도매가', '제안 소매가', '확정 가격', '재고', '상태', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const supplierName = suppliers.find(s => s.id === p.supplier_id)?.company_name || '-'
                  return (
                    <tr key={p.id} className="border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.image_url && <img src={p.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{p.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">🏭 {supplierName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">{p.suggested_wholesale_price?.toLocaleString()}원</td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">{p.suggested_retail_price?.toLocaleString()}원</td>
                      <td className="px-5 py-4 text-sm">
                        {p.wholesale_price > 0
                          ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">{p.wholesale_price.toLocaleString()}원</span>
                          : <span className="text-slate-300 dark:text-slate-600">미확정</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{p.stock}{p.unit}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[p.approval_status] || STATUS_COLOR['대기중']}`}>
                          {p.approval_status || '대기중'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {p.approval_status === '대기중' && (
                          <button onClick={() => {
                            setSelectedProduct(p)
                            setPriceForm({
                              wholesale_price: String(p.suggested_wholesale_price || ''),
                              retail_price: String(p.suggested_retail_price || ''),
                              member_price: '',
                            })
                          }} className="text-xs bg-violet-500 hover:bg-violet-400 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
                            가격 확정
                          </button>
                        )}
                        {p.approval_status === '승인' && (
                          <button onClick={() => rejectProduct(p.id)} className="text-xs text-red-400 hover:text-red-500 font-medium">
                            취소
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 공급업체 심사 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">공급업체 심사</h2>
              <button onClick={() => { setSelected(null); setNote('') }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">업체명</span><span className="font-semibold text-slate-800 dark:text-white">{selected.company_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">대표자</span><span className="text-slate-700 dark:text-slate-300">{selected.representative || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">사업자번호</span><span className="text-slate-700 dark:text-slate-300">{selected.business_number || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">연락처</span><span className="text-slate-700 dark:text-slate-300">{selected.contact || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">취급 품목</span><span className="text-slate-700 dark:text-slate-300">{selected.category || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">주소</span><span className="text-slate-700 dark:text-slate-300 text-right max-w-48">{selected.address || '-'}</span></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">메모 (선택)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  placeholder="거절 사유 등 메모"
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => updateSupplierStatus(selected.id, '거절')}
                  className="py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800 text-sm font-bold hover:bg-red-100 transition-colors active:scale-95">
                  ❌ 거절
                </button>
                <button onClick={() => updateSupplierStatus(selected.id, '승인')}
                  className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors active:scale-95 shadow-md shadow-emerald-500/20">
                  ✅ 승인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상품 가격 확정 모달 */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">가격 확정</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4">
                {selectedProduct.image_url && <img src={selectedProduct.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedProduct.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    공급업체 제안 — 도매 {selectedProduct.suggested_wholesale_price?.toLocaleString()}원 / 소매 {selectedProduct.suggested_retail_price?.toLocaleString()}원
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">🏭 확정 도매가 (원) *</label>
                  <input type="number" value={priceForm.wholesale_price} onChange={e => setPriceForm(p => ({ ...p, wholesale_price: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">🏪 소매 유통가 (원)</label>
                  <input type="number" value={priceForm.member_price} onChange={e => setPriceForm(p => ({ ...p, member_price: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">🛒 확정 소매가 (원) *</label>
                  <input type="number" value={priceForm.retail_price} onChange={e => setPriceForm(p => ({ ...p, retail_price: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => rejectProduct(selectedProduct.id)}
                  className="py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800 text-sm font-bold hover:bg-red-100 transition-colors active:scale-95">
                  ❌ 거절
                </button>
                <button onClick={approveProduct}
                  className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors active:scale-95 shadow-md shadow-emerald-500/20">
                  ✅ 가격 확정 + 노출
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

