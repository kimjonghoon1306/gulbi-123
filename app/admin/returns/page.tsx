'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'

type ReturnReq = {
  id: string
  order_id: string
  order_type: 'general' | 'retail' | 'wholesale'
  user_id: string
  type: '반품' | '교환'
  reason: string
  image_urls: string[]
  status: '접수' | '처리중' | '완료' | '반려'
  admin_memo: string | null
  created_at: string
  updated_at: string
}

const TYPE_META: Record<string, string> = {
  '반품': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  '교환': 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
}

const STATUS_META: Record<string, string> = {
  '접수': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  '처리중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  '완료': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  '반려': 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
}

const ORDER_LABEL: Record<string, string> = {
  general: '일반',
  retail: '소매',
  wholesale: '도매',
}

const orderTable = (type: string) => type === 'wholesale' ? 'wholesale_orders' : type === 'retail' ? 'retail_orders' : 'general_orders'
const itemTable = (type: string) => type === 'wholesale' ? 'wholesale_order_items' : type === 'retail' ? 'retail_order_items' : 'general_order_items'

export default function AdminReturnsPage() {
  const supabase = createClient()
  const [returns, setReturns] = useState<ReturnReq[]>([])
  const [orders, setOrders] = useState<Record<string, any>>({})
  const [items, setItems] = useState<Record<string, any[]>>({})
  const [memo, setMemo] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [tab, setTab] = useState<'active' | 'done' | 'all'>('active')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase.from('order_returns').select('*').order('created_at', { ascending: false })
    const list = (data as ReturnReq[]) || []
    setReturns(list)
    setMemo(Object.fromEntries(list.map(r => [r.id, r.admin_memo || ''])))

    const orderMap: Record<string, any> = {}
    const itemMap: Record<string, any[]> = {}
    await Promise.all((['general', 'retail', 'wholesale'] as const).map(async (type) => {
      const ids = list.filter(r => r.order_type === type).map(r => r.order_id)
      if (ids.length === 0) return
      const [{ data: ords }, { data: its }] = await Promise.all([
        supabase.from(orderTable(type)).select('*').in('id', ids),
        supabase.from(itemTable(type)).select('*').in('order_id', ids),
      ])
      ;(ords || []).forEach((o: any) => { orderMap[`${type}:${o.id}`] = o })
      ;(its || []).forEach((it: any) => {
        const key = `${type}:${it.order_id}`
        if (!itemMap[key]) itemMap[key] = []
        itemMap[key].push(it)
      })
    }))
    setOrders(orderMap)
    setItems(itemMap)
    setLoading(false)
  }

  const updateReturn = async (r: ReturnReq, nextStatus: string) => {
    setSaving(r.id)
    const { error } = await supabase.from('order_returns').update({
      status: nextStatus,
      admin_memo: memo[r.id] || null,
      updated_at: new Date().toISOString(),
    }).eq('id', r.id)
    setSaving('')
    if (error) { alert('저장 실패: ' + error.message); return }
    await fetchAll()
  }

  const filtered = useMemo(() => returns.filter(r => {
    if (tab === 'active') return r.status === '접수' || r.status === '처리중'
    if (tab === 'done') return r.status === '완료' || r.status === '반려'
    return true
  }), [returns, tab])

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">↩️ 반품/교환 요청</h1>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">손님이 접수한 반품·교환 요청을 확인하고 처리 상태를 관리합니다. 실제 환불은 별도 처리하세요.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['active', `처리필요 ${returns.filter(r => r.status === '접수' || r.status === '처리중').length}`],
          ['done', `종료 ${returns.filter(r => r.status === '완료' || r.status === '반려').length}`],
          ['all', `전체 ${returns.length}`],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${tab === k ? 'text-white shadow-md' : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600'}`}
            style={tab === k ? { background:'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">↩️</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">표시할 요청이 없어요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => {
            const key = `${r.order_type}:${r.order_id}`
            const order = orders[key]
            const orderItems = items[key] || []
            return (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex flex-wrap items-start gap-3 mb-4">
                  <span className={`text-sm font-black px-3 py-1.5 rounded-full ${TYPE_META[r.type]}`}>{r.type}</span>
                  <span className={`text-sm font-black px-3 py-1.5 rounded-full ${STATUS_META[r.status]}`}>{r.status}</span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-500">{ORDER_LABEL[r.order_type]} 주문</span>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString('ko-KR')}</p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-300">{order?.order_number || `#${r.order_id.slice(0, 8).toUpperCase()}`}</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_360px] gap-4">
                  <div className="space-y-3">
                    <div className="rounded-xl bg-slate-50 dark:bg-gray-700/50 p-4">
                      <p className="text-xs font-black text-slate-400 mb-2">주문 정보</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{order?.customer_name || '고객'} · {order?.contact || '연락처 없음'}</p>
                      {order?.address && <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">📍 {order.address}</p>}
                      {orderItems.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {orderItems.map((it: any) => (
                            <p key={it.id} className="text-xs text-slate-500 dark:text-slate-300">{it.product_name} × {it.quantity}{it.unit}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-slate-50 dark:bg-gray-700/50 p-4">
                      <p className="text-xs font-black text-orange-500 mb-2">신청 사유</p>
                      <p className="text-sm text-slate-700 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">{r.reason}</p>
                    </div>

                    {Array.isArray(r.image_urls) && r.image_urls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {r.image_urls.map((url, i) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="block w-24 h-24 rounded-xl overflow-hidden border border-slate-100 dark:border-gray-700 bg-slate-100">
                            <img src={url} alt={`첨부사진 ${i + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={memo[r.id] || ''}
                      onChange={e => setMemo(prev => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="처리 메모를 입력하세요"
                      rows={5}
                      className="w-full rounded-xl border-2 border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-800 dark:text-white text-sm p-4 outline-none focus:border-emerald-500 resize-none leading-relaxed"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {(['접수', '처리중', '완료', '반려'] as const).map(status => (
                        <button key={status} onClick={() => updateReturn(r, status)} disabled={saving === r.id}
                          className={`py-3 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-60 ${r.status === status ? 'text-white shadow-md' : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600'}`}
                          style={r.status === status ? { background:'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
                          {saving === r.id && r.status !== status ? '...' : status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
