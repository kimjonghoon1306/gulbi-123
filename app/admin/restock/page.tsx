'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Alert = {
  id: string; product_id: string; name: string; contact: string
  notified: boolean; created_at: string
  products?: { name: string; stock: number; image_url: string }
}

export default function AdminRestockPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'done'>('pending')
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])
  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase.from('restock_alerts')
      .select('*, products(name, stock, image_url)')
      .order('created_at', { ascending: false })
    setAlerts((data as any) || [])
    setLoading(false)
  }

  const markNotified = async (a: Alert) => {
    await supabase.from('restock_alerts').update({ notified: !a.notified }).eq('id', a.id)
    setAlerts(prev => prev.map(x => x.id === a.id ? { ...x, notified: !x.notified } : x))
  }
  const remove = async (id: string) => {
    if (!confirm('이 신청을 삭제할까요?')) return
    await supabase.from('restock_alerts').delete().eq('id', id)
    setAlerts(prev => prev.filter(x => x.id !== id))
  }

  const filtered = alerts.filter(a => tab === 'pending' ? !a.notified : a.notified)
  // 상품별 신청 수
  const countByProduct: Record<string, number> = {}
  alerts.filter(a => !a.notified).forEach(a => { countByProduct[a.product_id] = (countByProduct[a.product_id] || 0) + 1 })

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">🔔 재입고 알림 신청</h1>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">품절 상품에 손님이 신청한 알림 목록이에요. 재입고하면 연락처로 안내하고 “처리완료”로 표시하세요.</p>
      </div>

      <div className="flex gap-2">
        {([['pending', `대기 ${alerts.filter(a => !a.notified).length}`], ['done', `처리완료 ${alerts.filter(a => a.notified).length}`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === k ? 'text-white' : 'bg-slate-100 dark:bg-gray-700 text-slate-500'}`}
            style={tab === k ? { background: 'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">{tab === 'pending' ? '대기 중인 신청이 없어요.' : '처리완료된 신청이 없어요.'}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {filtered.map((a, i) => (
            <div key={a.id} className={`flex items-center gap-3 px-5 py-4 ${i > 0 ? 'border-t border-slate-50 dark:border-gray-700/50' : ''}`}>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-gray-700">
                {a.products?.image_url
                  ? <img src={a.products.image_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">🧺</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{a.products?.name || '(삭제된 상품)'}</p>
                  {(a.products?.stock ?? 0) > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">재입고됨 {a.products?.stock}</span>}
                  {!a.notified && countByProduct[a.product_id] > 1 && <span className="text-[10px] text-slate-400">외 {countByProduct[a.product_id] - 1}명 더</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.name || '익명'} · {a.contact || '연락처 없음'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => markNotified(a)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold ${a.notified ? 'bg-slate-100 dark:bg-gray-700 text-slate-500' : 'text-white'}`}
                  style={!a.notified ? { background: 'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
                  {a.notified ? '↩ 대기로' : '✓ 처리완료'}
                </button>
                <button onClick={() => remove(a.id)} className="px-3 py-2 rounded-lg text-xs font-bold border border-red-200 dark:border-red-900 text-red-500">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
