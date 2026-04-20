'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Order = {
  id: string; order_number: string; company_name: string; contact: string
  address: string; note: string; payment_method: string; status: string
  total_amount: number; created_at: string
}
type OrderItem = {
  id?: string; product_id: string; product_name: string
  quantity: number; unit: string; unit_price: number; total_price: number
}
type Product = { id: string; name: string; wholesale_price: number; unit: string }

const STATUS_LIST = ['접수', '준비중', '출고', '완료']
const STATUS_COLOR: Record<string, string> = {
  '접수': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  '준비중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  '출고': 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  '완료': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
}
const PAYMENT_LIST = ['계좌이체', '현금', '외상']

export default function WholesalePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [viewItems, setViewItems] = useState<OrderItem[]>([])
  const [filterStatus, setFilterStatus] = useState('전체')
  const [form, setForm] = useState({ company_name: '', contact: '', address: '', note: '', payment_method: '계좌이체', status: '접수' })
  const [items, setItems] = useState<OrderItem[]>([{ product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }])
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: o }, { data: p }] = await Promise.all([
      supabase.from('wholesale_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, wholesale_price, unit').eq('is_active', true)
    ])
    setOrders(o || [])
    setProducts(p || [])
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ company_name: '', contact: '', address: '', note: '', payment_method: '계좌이체', status: '접수' })
    setItems([{ product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }])
    setEditOrder(null)
    setShowForm(false)
  }

  const openEdit = async (o: Order) => {
    setEditOrder(o)
    setForm({ company_name: o.company_name, contact: o.contact || '', address: o.address || '', note: o.note || '', payment_method: o.payment_method, status: o.status })
    const { data } = await supabase.from('wholesale_order_items').select('*').eq('order_id', o.id)
    setItems(data && data.length > 0 ? data : [{ product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }])
    setShowForm(true)
  }

  const openView = async (o: Order) => {
    setViewOrder(o)
    const { data } = await supabase.from('wholesale_order_items').select('*').eq('order_id', o.id)
    setViewItems(data || [])
  }

  const addItem = () => setItems([...items, { product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items]
    if (field === 'product_id') {
      const p = products.find(p => p.id === value)
      if (p) { updated[i] = { ...updated[i], product_id: p.id, product_name: p.name, unit_price: p.wholesale_price, unit: p.unit, total_price: p.wholesale_price * updated[i].quantity } }
    } else {
      updated[i] = { ...updated[i], [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        updated[i].total_price = Number(updated[i].quantity) * Number(updated[i].unit_price)
      }
    }
    setItems(updated)
  }

  const totalAmount = items.reduce((s, i) => s + (i.total_price || 0), 0)

  const saveOrder = async () => {
    if (!form.company_name) return alert('거래처명을 입력해주세요.')
    if (editOrder) {
      await supabase.from('wholesale_orders').update({ ...form, total_amount: totalAmount, updated_at: new Date().toISOString() }).eq('id', editOrder.id)
      await supabase.from('wholesale_order_items').delete().eq('order_id', editOrder.id)
      await supabase.from('wholesale_order_items').insert(items.filter(i => i.product_name).map(i => ({ ...i, order_id: editOrder.id })))
    } else {
      const { data } = await supabase.from('wholesale_orders').insert({ ...form, total_amount: totalAmount }).select().single()
      if (data) await supabase.from('wholesale_order_items').insert(items.filter(i => i.product_name).map(i => ({ ...i, order_id: data.id })))
    }
    resetForm(); fetchAll()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('wholesale_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    fetchAll()
    if (viewOrder?.id === id) setViewOrder({ ...viewOrder, status })
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('주문을 삭제하시겠습니까?')) return
    await supabase.from('wholesale_orders').delete().eq('id', id)
    fetchAll()
  }

  const filtered = filterStatus === '전체' ? orders : orders.filter(o => o.status === filterStatus)

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">도매주문관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">거래처 도매 주문 접수 및 관리</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-sky-500/20">
          + 주문 등록
        </button>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['전체', ...STATUS_LIST].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${filterStatus === s ? 'bg-sky-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700'}`}>
            {s} {s !== '전체' && <span className="ml-1 opacity-70">{orders.filter(o => o.status === s).length}</span>}
          </button>
        ))}
      </div>

      {/* 주문 목록 */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-gray-700">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">주문이 없습니다</p>
          </div>
        ) : filtered.map(o => (
          <div key={o.id} onClick={() => openView(o)}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLOR[o.status]}`}>{o.status}</span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{o.company_name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{o.order_number} · {o.contact}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-white">{o.total_amount.toLocaleString()}원</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{o.payment_method}</p>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(o)} className="text-xs text-sky-500 hover:text-sky-600 font-medium px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors">수정</button>
                  <button onClick={() => deleteOrder(o.id)} className="text-xs text-red-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">삭제</button>
                </div>
              </div>
            </div>

            {/* 상태 변경 버튼 */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-gray-700" onClick={e => e.stopPropagation()}>
              {STATUS_LIST.map(s => (
                <button key={s} onClick={() => updateStatus(o.id, s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                    ${o.status === s ? 'bg-sky-500 text-white' : 'bg-slate-50 dark:bg-gray-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 주문 상세 모달 */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{viewOrder.company_name}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{viewOrder.order_number}</p>
              </div>
              <button onClick={() => setViewOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '상태', value: <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[viewOrder.status]}`}>{viewOrder.status}</span> },
                  { label: '결제방법', value: viewOrder.payment_method },
                  { label: '연락처', value: viewOrder.contact || '-' },
                  { label: '배송지', value: viewOrder.address || '-' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
              {viewOrder.note && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-800">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">요청사항</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{viewOrder.note}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">주문 상품</p>
                <div className="space-y-2">
                  {viewItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-gray-700/50 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{item.product_name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{item.quantity}{item.unit} × {item.unit_price.toLocaleString()}원</p>
                      </div>
                      <p className="text-sm font-bold text-sky-500">{item.total_price.toLocaleString()}원</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-gray-700">
                <span className="font-bold text-slate-800 dark:text-white">합계</span>
                <span className="text-xl font-bold text-sky-500">{viewOrder.total_amount.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 주문 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editOrder ? '주문 수정' : '도매 주문 등록'}</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '거래처명 *', key: 'company_name', placeholder: '예) 목포 수산' },
                  { label: '연락처', key: 'contact', placeholder: '010-0000-0000' },
                  { label: '배송지', key: 'address', placeholder: '배송 주소' },
                ].map(f => (
                  <div key={f.key} className={f.key === 'address' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                    <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">결제방법</label>
                  <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                    {PAYMENT_LIST.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">상태</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                    {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">요청사항</label>
                  <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} placeholder="특이사항 또는 요청사항"
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                </div>
              </div>

              {/* 상품 목록 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">주문 상품</label>
                  <button onClick={addItem} className="text-xs text-sky-500 hover:text-sky-600 font-medium">+ 상품 추가</button>
                </div>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">상품 선택</label>
                          <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                            className="w-full border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                            <option value="">직접입력</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-500 text-sm mt-5">✕</button>
                        )}
                      </div>
                      {!item.product_id && (
                        <input type="text" placeholder="상품명 직접 입력" value={item.product_name}
                          onChange={e => updateItem(i, 'product_name', e.target.value)}
                          className="w-full border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: '수량', key: 'quantity', type: 'number' },
                          { label: '단가(원)', key: 'unit_price', type: 'number' },
                          { label: '단위', key: 'unit', type: 'text' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">{f.label}</label>
                            <input type={f.type} value={(item as any)[f.key]}
                              onChange={e => updateItem(i, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                              className="w-full border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                          </div>
                        ))}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 dark:text-slate-500">소계 </span>
                        <span className="text-sm font-bold text-sky-500">{item.total_price.toLocaleString()}원</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 px-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">합계</span>
                  <span className="text-xl font-bold text-sky-500">{totalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">취소</button>
              <button onClick={saveOrder} className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-colors active:scale-95">
                {editOrder ? '수정 완료' : '주문 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
