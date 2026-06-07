'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Order = {
  id: string; order_number: string; customer_name: string; contact: string
  address: string; note: string; payment_method: string; status: string
  total_amount: number; created_at: string
}
type OrderItem = {
  id?: string; product_id: string; product_name: string
  quantity: number; unit: string; unit_price: number; total_price: number
}
type Product = { id: string; name: string; retail_price: number; unit: string }

const STATUS_LIST = ['접수', '준비중', '출고', '완료']
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  '접수':  { color: 'text-green-700 dark:text-green-500',     bg: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',     icon: '📋' },
  '준비중':{ color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800', icon: '📦' },
  '출고':  { color: 'text-violet-600 dark:text-violet-400',bg: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800',icon: '🚚' },
  '완료':  { color: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',icon: '✅' },
}
const PAYMENT_LIST = ['계좌이체', '현금', '카드', '외상']

export default function GeneralOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [viewItems, setViewItems] = useState<OrderItem[]>([])
  const [filterStatus, setFilterStatus] = useState('전체')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    customer_name: '', contact: '', address: '', note: '',
    payment_method: '계좌이체', status: '접수'
  })
  const [items, setItems] = useState<OrderItem[]>([
    { product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }
  ])
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: o }, { data: p }] = await Promise.all([
      supabase.from('general_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, retail_price, unit').eq('is_active', true)
    ])
    setOrders(o || [])
    setProducts(p || [])
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ customer_name: '', contact: '', address: '', note: '', payment_method: '계좌이체', status: '접수' })
    setItems([{ product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }])
    setEditOrder(null)
    setShowForm(false)
  }

  const openEdit = async (o: Order) => {
    setEditOrder(o)
    setForm({ customer_name: o.customer_name, contact: o.contact || '', address: o.address || '', note: o.note || '', payment_method: o.payment_method, status: o.status })
    const { data } = await supabase.from('general_order_items').select('*').eq('order_id', o.id)
    setItems(data && data.length > 0 ? data : [{ product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }])
    setShowForm(true)
  }

  const openView = async (o: Order) => {
    setViewOrder(o)
    const { data } = await supabase.from('general_order_items').select('*').eq('order_id', o.id)
    setViewItems(data || [])
  }

  const addItem = () => setItems([...items, { product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items]
    if (field === 'product_id') {
      const p = products.find(p => p.id === value)
      if (p) {
        updated[i] = { ...updated[i], product_id: p.id, product_name: p.name, unit_price: p.retail_price, unit: p.unit, total_price: p.retail_price * updated[i].quantity }
      }
    } else {
      updated[i] = { ...updated[i], [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        updated[i].total_price = Number(updated[i].quantity) * Number(updated[i].unit_price)
      }
    }
    setItems(updated)
  }

  const totalAmount = items.reduce((s, i) => s + (i.total_price || 0), 0)


  const downloadExcel = () => {
    const headers = ['주문번호', '고객명', '연락처', '배송지', '결제방법', '상태', '금액', '주문일시']
    const rows = filtered.map(o => [
      o.order_number || '',
      o.customer_name || '',
      o.contact || '',
      o.address || '',
      o.payment_method || '',
      o.status || '',
      String(o.total_amount || 0),
      new Date(o.created_at).toLocaleString('ko-KR'),
    ])
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const headerRow = headers.map(h => '<Cell ss:StyleID="h"><Data ss:Type="String">' + escape(h) + '</Data></Cell>').join('')
    const dataRows = rows.map(row =>
      '<Row>' + row.map(cell => '<Cell><Data ss:Type="String">' + escape(cell) + '</Data></Cell>').join('') + '</Row>'
    ).join('\n   ')
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<?mso-application progid="Excel.Sheet"?>\n' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n' +
      '<Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/></Style></Styles>\n' +
      '<Worksheet ss:Name="일반주문"><Table>\n' +
      '<Row>' + headerRow + '</Row>\n   ' +
      dataRows +
      '\n</Table></Worksheet></Workbook>'
    const blob = new Blob(['\uFEFF' + xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '일반주문_' + new Date().toLocaleDateString('ko-KR').replace(/\./g, '').replace(/ /g, '') + '.xls'
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveOrder = async () => {
    if (!form.customer_name) return alert('고객명을 입력해주세요.')
    if (!form.address) return alert('배송지를 입력해주세요.')
    if (editOrder) {
      await supabase.from('general_orders').update({ ...form, total_amount: totalAmount, updated_at: new Date().toISOString() }).eq('id', editOrder.id)
      await supabase.from('general_order_items').delete().eq('order_id', editOrder.id)
      await supabase.from('general_order_items').insert(items.filter(i => i.product_name).map(i => ({ ...i, order_id: editOrder.id })))
    } else {
      const { data } = await supabase.from('general_orders').insert({ ...form, total_amount: totalAmount }).select().single()
      if (data) await supabase.from('general_order_items').insert(items.filter(i => i.product_name).map(i => ({ ...i, order_id: data.id })))
    }
    resetForm(); fetchAll()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('general_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    fetchAll()
    if (viewOrder?.id === id) setViewOrder({ ...viewOrder, status })
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('주문을 삭제하시겠습니까?')) return
    await supabase.from('general_orders').delete().eq('id', id)
    if (viewOrder?.id === id) setViewOrder(null)
    fetchAll()
  }

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === '전체' || o.status === filterStatus
    const matchSearch = !search || o.customer_name?.includes(search) || o.contact?.includes(search) || o.order_number?.includes(search)
    return matchStatus && matchSearch
  })

  // 통계
  const stats = {
    total: orders.length,
    today: orders.filter(o => o.created_at?.startsWith(new Date().toISOString().split('T')[0])).length,
    pending: orders.filter(o => o.status === '접수').length,
    revenue: orders.filter(o => o.status === '완료').reduce((s, o) => s + (o.total_amount || 0), 0),
  }

  return (
    <div className="animate-fadeIn">

      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">일반주문 관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm mt-0.5">일반 소비자 주문 접수 및 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadExcel}
            className="text-white text-sm font-bold px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
            📥 <span className="hidden sm:inline">엑셀 다운로드</span><span className="sm:hidden">엑셀</span>
          </button>
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="text-white text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            + <span className="hidden sm:inline">주문 등록</span><span className="sm:hidden">등록</span>
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 mb-4">
      <div className="grid grid-cols-4 gap-3 min-w-[480px]">
        {[
          { label: '전체 주문', value: stats.total + '건', icon: '📋', color: 'from-slate-500 to-slate-600' },
          { label: '오늘 접수', value: stats.today + '건', icon: '🌅', color: 'from-green-600 to-blue-600' },
          { label: '처리 대기', value: stats.pending + '건', icon: '⏳', color: 'from-amber-500 to-orange-500' },
          { label: '완료 매출', value: (stats.revenue / 10000).toFixed(0) + '만원', icon: '💰', color: 'from-emerald-500 to-teal-500' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs font-medium opacity-75 bg-white/20 px-2 py-0.5 rounded-full">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
      </div>

      {/* 필터 + 검색 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5">
        <div className="overflow-x-auto pb-1"><div className="flex gap-2 flex-nowrap">
          {['전체', ...STATUS_LIST].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5
                ${filterStatus === s
                  ? 'text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700'}`}
              style={filterStatus === s ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : {}}>
              {s !== '전체' && STATUS_CONFIG[s]?.icon} {s}
              {s !== '전체' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterStatus === s ? 'bg-white/20' : 'bg-slate-100 dark:bg-gray-700'}`}>
                  {orders.filter(o => o.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div></div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 고객명 / 연락처 / 주문번호"
          className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      {/* 주문 목록 */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center border border-slate-100 dark:border-gray-700">
            <p className="text-5xl mb-4">🛒</p>
            <p className="font-bold text-slate-600 dark:text-slate-300 mb-1">주문이 없어요</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">새 주문이 들어오면 여기서 확인할 수 있어요</p>
          </div>
        ) : filtered.map(o => {
          const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG['접수']
          return (
            <div key={o.id} onClick={() => openView(o)}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* 상태 뱃지 */}
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${sc.bg} ${sc.color}`}>
                    <span>{sc.icon}</span> {o.status}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 dark:text-white">{o.customer_name}</p>
                      <span className="text-xs text-slate-300 dark:text-slate-600">{o.order_number}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {o.contact && <p className="text-xs text-slate-400 dark:text-slate-500">📞 {o.contact}</p>}
                      {o.address && <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">📍 {o.address}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{o.total_amount.toLocaleString()}원</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{o.payment_method} · {new Date(o.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(o)}
                      className="text-xs text-indigo-500 hover:text-indigo-600 font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                      수정
                    </button>
                    <button onClick={() => deleteOrder(o.id)}
                      className="text-xs text-red-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      삭제
                    </button>
                  </div>
                </div>
              </div>

              {/* 상태 변경 바 */}
              <div className="overflow-x-auto mt-3 pt-3 border-t border-slate-50 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                {STATUS_LIST.map(s => (
                  <button key={s} onClick={() => updateStatus(o.id, s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                      ${o.status === s
                        ? 'text-white shadow-md'
                        : 'bg-slate-50 dark:bg-gray-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-600'}`}
                    style={o.status === s ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : {}}>
                    {STATUS_CONFIG[s].icon} {s}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 상세 보기 모달 */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewOrder(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={e => e.stopPropagation()}>

            {/* 모달 헤더 */}
            <div className="p-6 border-b border-slate-100 dark:border-gray-700" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs mb-1">{viewOrder.order_number}</p>
                  <h2 className="text-xl font-bold text-white">{viewOrder.customer_name}</h2>
                </div>
                <button onClick={() => setViewOrder(null)} className="text-white/70 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">✕</button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {STATUS_CONFIG[viewOrder.status]?.icon} {viewOrder.status}
                </span>
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{viewOrder.payment_method}</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* 정보 그리드 */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '📞 연락처', value: viewOrder.contact || '-' },
                  { label: '📅 주문일시', value: new Date(viewOrder.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  { label: '📍 배송지', value: viewOrder.address || '-', full: true },
                ].map(item => (
                  <div key={item.label} className={`bg-slate-50 dark:bg-gray-700/50 rounded-xl p-3 ${item.full ? 'col-span-2' : ''}`}>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {viewOrder.note && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-800">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-1">💬 요청사항</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{viewOrder.note}</p>
                </div>
              )}

              {/* 주문 상품 */}
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">주문 상품</p>
                <div className="space-y-2">
                  {viewItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-gray-700/50 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.product_name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{item.quantity}{item.unit} × {item.unit_price.toLocaleString()}원</p>
                      </div>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{item.total_price.toLocaleString()}원</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 px-4 py-3 rounded-xl" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08))' }}>
                  <span className="font-bold text-slate-800 dark:text-white">합계</span>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{viewOrder.total_amount.toLocaleString()}원</span>
                </div>
              </div>

              {/* 상태 변경 */}
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">상태 변경</p>
                <div className="flex gap-2 flex-nowrap">
                  {STATUS_LIST.map(s => (
                    <button key={s} onClick={() => updateStatus(viewOrder.id, s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all
                        ${viewOrder.status === s ? 'text-white shadow-md' : 'bg-slate-50 dark:bg-gray-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-600'}`}
                      style={viewOrder.status === s ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : {}}>
                      {STATUS_CONFIG[s].icon}<br />{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* 수정/삭제 */}
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setViewOrder(null); openEdit(viewOrder) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                  ✏️ 수정
                </button>
                <button onClick={() => deleteOrder(viewOrder.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  🗑️ 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {editOrder ? '주문 수정' : '✨ 일반 주문 등록'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">일반 소비자 주문</p>
              </div>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-xl">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* 고객 정보 */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">👤 고객 정보</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: '고객명 *', key: 'customer_name', placeholder: '예) 홍길동', col: 1 },
                    { label: '연락처', key: 'contact', placeholder: '010-0000-0000', col: 1 },
                    { label: '배송지 *', key: 'address', placeholder: '배송 주소를 입력해주세요', col: 2 },
                  ].map(f => (
                    <div key={f.key} className={f.col === 2 ? 'col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">결제방법</label>
                    <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      {PAYMENT_LIST.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">상태</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">요청사항</label>
                    <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2}
                      placeholder="특이사항 또는 배송 요청사항"
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                  </div>
                </div>
              </div>

              {/* 주문 상품 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">🛒 주문 상품</p>
                  <button onClick={addItem} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                    + 상품 추가
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-gray-600">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">상품 선택</label>
                          <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                            className="w-full border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                            <option value="">직접 입력</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.retail_price.toLocaleString()}원/{p.unit})</option>)}
                          </select>
                        </div>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-500 text-lg mt-5 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">✕</button>
                        )}
                      </div>
                      {!item.product_id && (
                        <input type="text" placeholder="상품명 직접 입력" value={item.product_name}
                          onChange={e => updateItem(i, 'product_name', e.target.value)}
                          className="w-full border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                      )}
                      <div className="grid grid-cols-3 gap-2 min-w-max">
                        {[
                          { label: '수량', key: 'quantity', type: 'number' },
                          { label: '단가(원)', key: 'unit_price', type: 'number' },
                          { label: '단위', key: 'unit', type: 'text' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">{f.label}</label>
                            <input type={f.type} value={(item as any)[f.key]}
                              onChange={e => updateItem(i, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                              className="w-full border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                          </div>
                        ))}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">소계 </span>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{item.total_price.toLocaleString()}원</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 합계 */}
                <div className="flex justify-between items-center mt-4 px-4 py-3 rounded-xl" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08))' }}>
                  <span className="font-bold text-slate-800 dark:text-white">합계</span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                취소
              </button>
              <button onClick={saveOrder}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-lg"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
                {editOrder ? '✅ 수정 완료' : '✨ 주문 등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .animate-fadeIn { animation: fadeIn 0.2s ease }
      `}</style>
    </div>
  )
}
