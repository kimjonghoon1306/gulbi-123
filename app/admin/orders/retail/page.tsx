'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { COURIERS } from '@/lib/tracking'

type Order = {
  id: string; order_number: string; customer_name: string; contact: string
  address: string; note: string; payment_method: string; status: string
  total_amount: number; created_at: string; payment_key?: string; paid_amount?: number
  courier_code?: string | null; tracking_number?: string | null
}
type OrderItem = {
  id?: string; product_id: string; product_name: string
  quantity: number; unit: string; unit_price: number; total_price: number
}
type Product = { id: string; name: string; retail_price: number; unit: string }

const STATUS_LIST = ['접수', '준비중', '출고', '완료']
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  '접수':  { color: 'text-green-700 dark:text-green-500',      bg: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',      icon: '📋' },
  '준비중':{ color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',  icon: '📦' },
  '출고':  { color: 'text-violet-600 dark:text-violet-400',bg: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800',icon: '🚚' },
  '완료':  { color: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',icon: '✅' },
  '환불':  { color: 'text-red-500 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900',          icon: '↩️' },
}
const PAYMENT_LIST = ['계좌이체', '현금', '카드', '외상']

export default function RetailPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [viewItems, setViewItems] = useState<OrderItem[]>([])
  const [courierInput, setCourierInput] = useState('')
  const [trackingInput, setTrackingInput] = useState('')
  const [trackSaved, setTrackSaved] = useState(false)
  const [filterStatus, setFilterStatus] = useState('전체')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ customer_name: '', contact: '', address: '', note: '', payment_method: '계좌이체', status: '접수', courier_code: '', tracking_number: '' })
  const [items, setItems] = useState<OrderItem[]>([{ product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }])
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: o }, { data: p }] = await Promise.all([
      supabase.from('retail_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, retail_price, unit').eq('is_active', true)
    ])
    setOrders(o || [])
    setProducts(p || [])
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ customer_name: '', contact: '', address: '', note: '', payment_method: '계좌이체', status: '접수', courier_code: '', tracking_number: '' })
    setItems([{ product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }])
    setEditOrder(null)
    setShowForm(false)
  }

  const openEdit = async (o: Order) => {
    setEditOrder(o)
    setForm({ customer_name: o.customer_name, contact: o.contact || '', address: o.address || '', note: o.note || '', payment_method: o.payment_method, status: o.status, courier_code: o.courier_code || '', tracking_number: o.tracking_number || '' })
    const { data } = await supabase.from('retail_order_items').select('*').eq('order_id', o.id)
    setItems(data && data.length > 0 ? data : [{ product_id: '', product_name: '', quantity: 1, unit: 'kg', unit_price: 0, total_price: 0 }])
    setShowForm(true)
  }

  const openView = async (o: Order) => {
    setViewOrder(o)
    setCourierInput(o.courier_code || '')
    setTrackingInput(o.tracking_number || '')
    setTrackSaved(false)
    const { data } = await supabase.from('retail_order_items').select('*').eq('order_id', o.id)
    setViewItems(data || [])
  }

  const saveTracking = async () => {
    if (!viewOrder) return
    const patch = { courier_code: courierInput || null, tracking_number: trackingInput.trim() || null }
    await supabase.from('retail_orders').update(patch).eq('id', viewOrder.id)
    setViewOrder({ ...viewOrder, ...patch })
    setOrders(prev => prev.map(o => o.id === viewOrder.id ? { ...o, ...patch } : o))
    setTrackSaved(true)
    setTimeout(() => setTrackSaved(false), 2000)
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

  const saveOrder = async () => {
    if (!form.customer_name) return alert('고객명을 입력해주세요.')
    if (!form.address) return alert('배송지를 입력해주세요.')
    if (editOrder) {
      await supabase.from('retail_orders').update({ ...form, total_amount: totalAmount, updated_at: new Date().toISOString() }).eq('id', editOrder.id)
      await supabase.from('retail_order_items').delete().eq('order_id', editOrder.id)
      await supabase.from('retail_order_items').insert(items.filter(i => i.product_name).map(i => ({ ...i, order_id: editOrder.id })))
    } else {
      const { data } = await supabase.from('retail_orders').insert({ ...form, total_amount: totalAmount }).select().single()
      if (data) await supabase.from('retail_order_items').insert(items.filter(i => i.product_name).map(i => ({ ...i, order_id: data.id })))
    }
    resetForm(); fetchAll()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('retail_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    fetchAll()
    if (viewOrder?.id === id) setViewOrder({ ...viewOrder, status })
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('주문을 삭제하시겠습니까?')) return
    await supabase.from('retail_orders').delete().eq('id', id)
    if (viewOrder?.id === id) setViewOrder(null)
    fetchAll()
  }

  // 환불: 카드(토스)결제는 토스 결제취소 호출, 그 외(계좌이체/현금)는 수동 환불 후 상태만 변경
  const refundOrder = async (o: Order) => {
    if (o.status === '환불') return
    const isCard = (o.payment_method || '').includes('카드')
    if (!confirm(`${o.customer_name} 주문(${o.total_amount.toLocaleString()}원)을 환불 처리할까요?` + (isCard ? '\n카드결제 → 토스 결제취소가 즉시 실행됩니다.' : '\n계좌이체/현금 → 환불 송금 후 상태만 변경됩니다.'))) return
    if (isCard) {
      if (!o.payment_key) { alert('결제키(paymentKey)가 없어 자동취소가 불가합니다. 토스 콘솔에서 직접 취소 후 상태를 변경하세요.'); return }
      const res = await fetch('/api/payments/cancel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey: o.payment_key, cancelReason: '관리자 환불' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert('토스 환불 실패: ' + (data.message || '오류')); return }
    }
    await supabase.from('retail_orders').update({ status: '환불', updated_at: new Date().toISOString() }).eq('id', o.id)
    if (viewOrder?.id === o.id) setViewOrder({ ...viewOrder, status: '환불' })
    fetchAll()
    alert('환불 처리되었습니다.')
  }

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
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const hRow = headers.map(h => '<Cell ss:StyleID="h"><Data ss:Type="String">' + esc(h) + '</Data></Cell>').join('')
    const dRows = rows.map(row =>
      '<Row>' + row.map(c => '<Cell><Data ss:Type="String">' + esc(c) + '</Data></Cell>').join('') + '</Row>'
    ).join('\n')
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
      + '<?mso-application progid="Excel.Sheet"?>\n'
      + '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n'
      + '<Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/></Style></Styles>\n'
      + '<Worksheet ss:Name="소매주문"><Table>\n'
      + '<Row>' + hRow + '</Row>\n'
      + dRows
      + '\n</Table></Worksheet></Workbook>'
    const blob = new Blob(['\uFEFF' + xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '소매주문_' + new Date().toLocaleDateString('ko-KR').replace(/\./g, '').replace(/ /g, '') + '.xls'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === '전체' || o.status === filterStatus
    const matchSearch = !search || o.customer_name?.includes(search) || o.contact?.includes(search) || o.order_number?.includes(search)
    return matchStatus && matchSearch
  })

  const stats = {
    total: orders.length,
    today: orders.filter(o => o.created_at?.startsWith(new Date().toISOString().split('T')[0])).length,
    pending: orders.filter(o => o.status === '접수').length,
    revenue: orders.filter(o => o.status === '완료').reduce((s, o) => s + (o.total_amount || 0), 0),
  }

  return (
    <div className="animate-fadeIn overflow-x-hidden">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">소매주문 관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm mt-0.5">소매 고객 주문 접수 및 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadExcel}
            className="text-white text-sm font-bold px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
            📥 <span className="hidden sm:inline">엑셀 다운로드</span><span className="sm:hidden">엑셀</span>
          </button>
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="text-white text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#14532d,#15803d)' }}>
            + <span className="hidden sm:inline">주문 등록</span><span className="sm:hidden">등록</span>
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="overflow-x-auto pb-2 mb-4">
      <div className="grid grid-cols-4 gap-3 min-w-[480px]">
        {[
          { label: '전체 주문', value: stats.total + '건', icon: '📋', color: 'from-slate-500 to-slate-600' },
          { label: '오늘 접수', value: stats.today + '건', icon: '🌅', color: 'from-green-600 to-blue-600' },
          { label: '처리 대기', value: stats.pending + '건', icon: '⏳', color: 'from-amber-500 to-orange-500' },
          { label: '완료 매출', value: (stats.revenue / 10000).toFixed(0) + '만원', icon: '💰', color: 'from-emerald-500 to-teal-500' },
        ].map((s, i) => (
          <div key={i} className={'bg-gradient-to-br ' + s.color + ' rounded-2xl p-4 text-white'}>
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
        <div className="overflow-x-auto pb-1 min-w-0 flex-1"><div className="flex gap-2 flex-nowrap">
          {['전체', ...STATUS_LIST].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 '
                + (filterStatus === s ? 'text-white shadow-md' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700')}
              style={filterStatus === s ? { background: 'linear-gradient(135deg,#14532d,#15803d)' } : {}}>
              {s !== '전체' && STATUS_CONFIG[s]?.icon} {s}
              {s !== '전체' && (
                <span className={'text-xs px-1.5 py-0.5 rounded-full ' + (filterStatus === s ? 'bg-white/20' : 'bg-slate-100 dark:bg-gray-700')}>
                  {orders.filter(o => o.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div></div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 고객명 / 연락처 / 주문번호"
          className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>

      {/* 주문 목록 */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center border border-slate-100 dark:border-gray-700">
            <p className="text-5xl mb-4">🏪</p>
            <p className="font-bold text-slate-600 dark:text-slate-300 mb-1">주문이 없어요</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">새 주문이 들어오면 여기서 확인할 수 있어요</p>
          </div>
        ) : filtered.map(o => {
          const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG['접수']
          return (
            <div key={o.id} onClick={() => openView(o)}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-4 sm:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className={'flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border flex-shrink-0 ' + sc.bg + ' ' + sc.color}>
                    <span>{sc.icon}</span> {o.status}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{o.customer_name}</p>
                      <span className="text-xs text-slate-300 dark:text-slate-600 flex-shrink-0">{o.order_number}</span>
                    </div>
                    {o.contact && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">📞 {o.contact}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-base text-teal-600 dark:text-teal-400 whitespace-nowrap">{o.total_amount.toLocaleString()}원</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(o)} className="text-xs text-teal-500 font-medium px-2.5 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20">수정</button>
                    {o.status !== '환불' && (
                      <button onClick={() => refundOrder(o)} className="text-xs text-orange-500 font-medium px-2.5 py-1.5 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/20">환불</button>
                    )}
                    <button onClick={() => deleteOrder(o.id)} className="text-xs text-red-400 font-medium px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">삭제</button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto mt-3 pt-3 border-t border-slate-50 dark:border-gray-700" onClick={e => e.stopPropagation()}>
              <div className="flex gap-1.5 min-w-max">
                {STATUS_LIST.map(s => (
                  <button key={s} onClick={() => updateStatus(o.id, s)}
                    className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap '
                      + (o.status === s ? 'text-white shadow-md' : 'bg-slate-50 dark:bg-gray-700 text-slate-400 dark:text-slate-500')}
                    style={o.status === s ? { background: 'linear-gradient(135deg,#14532d,#15803d)' } : {}}>
                    {STATUS_CONFIG[s].icon} {s}
                  </button>
                ))}
              </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 상세 모달 */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewOrder(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-gray-700" style={{ background: 'linear-gradient(135deg,#14532d,#15803d)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs mb-1">{viewOrder.order_number}</p>
                  <h2 className="text-xl font-bold text-white">{viewOrder.customer_name}</h2>
                </div>
                <button onClick={() => setViewOrder(null)} className="text-white/70 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">✕</button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">{STATUS_CONFIG[viewOrder.status]?.icon} {viewOrder.status}</span>
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{viewOrder.payment_method}</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '📞 연락처', value: viewOrder.contact || '-' },
                  { label: '📅 주문일시', value: new Date(viewOrder.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  { label: '📍 배송지', value: viewOrder.address || '-', full: true },
                ].map(item => (
                  <div key={item.label} className={'bg-slate-50 dark:bg-gray-700/50 rounded-xl p-3 ' + (item.full ? 'col-span-2' : '')}>
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
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">주문 상품</p>
                <div className="space-y-2">
                  {viewItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-gray-700/50 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.product_name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{item.quantity}{item.unit} × {item.unit_price.toLocaleString()}원</p>
                      </div>
                      <p className="text-sm font-bold text-teal-600 dark:text-teal-400">{item.total_price.toLocaleString()}원</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 px-4 py-3 rounded-xl" style={{ background: 'linear-gradient(135deg,rgba(22,163,74,0.08),rgba(21,128,61,0.08))' }}>
                  <span className="font-bold text-slate-800 dark:text-white">합계</span>
                  <span className="text-xl font-bold text-teal-600 dark:text-teal-400">{viewOrder.total_amount.toLocaleString()}원</span>
                </div>
              </div>
              {/* 송장 / 배송추적 */}
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">🚚 송장 등록</p>
                <div className="flex gap-2">
                  <select value={courierInput} onChange={e => setCourierInput(e.target.value)}
                    className="w-32 px-3 py-2.5 rounded-xl text-sm border-2 border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-700 dark:text-slate-200 outline-none">
                    <option value="">택배사</option>
                    {COURIERS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                  <input value={trackingInput} onChange={e => setTrackingInput(e.target.value)}
                    placeholder="송장번호"
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm border-2 border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-700 dark:text-slate-200 outline-none" />
                  <button onClick={saveTracking}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md"
                    style={{ background: trackSaved ? '#16a34a' : 'linear-gradient(135deg,#14b8a6,#0d9488)' }}>
                    {trackSaved ? '✓ 저장' : '저장'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">송장 등록 시 손님이 마이페이지에서 실시간 배송조회를 할 수 있어요.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setViewOrder(null); openEdit(viewOrder) }} className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">✏️ 수정</button>
                <button onClick={() => deleteOrder(viewOrder.id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">🗑️ 삭제</button>
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
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editOrder ? '주문 수정' : '✨ 소매 주문 등록'}</h2>
                <p className="text-xs text-slate-400 mt-0.5">소매 고객 주문</p>
              </div>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
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
                        className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">결제방법</label>
                    <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                      {PAYMENT_LIST.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">상태</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                      {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">요청사항</label>
                    <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2}
                      placeholder="특이사항 또는 배송 요청사항"
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">🚚 택배사 / 송장번호</label>
                    <div className="flex gap-2">
                      <select value={form.courier_code} onChange={e => setForm({ ...form, courier_code: e.target.value })}
                        className="w-32 border border-slate-200 dark:border-gray-600 rounded-xl px-3 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                        <option value="">택배사</option>
                        {COURIERS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                      <input value={form.tracking_number} onChange={e => setForm({ ...form, tracking_number: e.target.value })}
                        placeholder="송장번호 (배송 시작 시 입력)"
                        className="flex-1 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">🛒 주문 상품</p>
                  <button onClick={addItem} className="text-xs font-bold text-teal-500 hover:text-teal-600 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors">+ 상품 추가</button>
                </div>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-gray-600">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">상품 선택</label>
                          <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                            className="w-full border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400">
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
                          className="w-full border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
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
                              className="w-full border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
                          </div>
                        ))}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">소계 </span>
                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{item.total_price.toLocaleString()}원</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 px-4 py-3 rounded-xl" style={{ background: 'linear-gradient(135deg,rgba(22,163,74,0.08),rgba(21,128,61,0.08))' }}>
                  <span className="font-bold text-slate-800 dark:text-white">합계</span>
                  <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">{totalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">취소</button>
              <button onClick={saveOrder}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-lg"
                style={{ background: 'linear-gradient(135deg,#14532d,#15803d)', boxShadow: '0 4px 15px rgba(22,163,74,0.35)' }}>
                {editOrder ? '✅ 수정 완료' : '✨ 주문 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
