'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type LogRow = {
  id: number; area: string; severity: string; message: string
  detail: string; user_email: string; path: string; created_at: string
}

const AREA_LABEL: Record<string, string> = {
  'ai-generate': '🤖 AI 생성', 'ai-image': '🖼️ AI 이미지', 'shop-order': '🛒 쇼핑몰 주문',
  'shop-checkout': '💳 결제', 'supplier': '🏭 공급업체', 'payment': '💳 결제',
  'admin': '⚙️ 관리자', 'auth': '🔐 인증', 'product': '🧺 상품', 'unknown': '❓ 기타',
}

const AREAS = ['', 'ai-generate', 'ai-image', 'shop-order', 'shop-checkout', 'payment', 'supplier', 'product', 'admin', 'auth']

export default function AdminLogsPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [area, setArea] = useState('')
  const [severity, setSeverity] = useState('')
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [todayCount, setTodayCount] = useState(0)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(300)
    if (area) query = query.eq('area', area)
    if (severity) query = query.eq('severity', severity)
    const { data } = await query
    let rows = (data || []) as LogRow[]
    if (q.trim()) {
      const kw = q.trim().toLowerCase()
      rows = rows.filter(r => (r.message + r.detail + r.user_email).toLowerCase().includes(kw))
    }
    setLogs(rows)
    // 오늘 에러 수
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { count } = await supabase.from('error_logs').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString())
    setTodayCount(count || 0)
    setLoading(false)
  }, [supabase, area, severity, q])

  useEffect(() => { fetchLogs() }, [area, severity]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearOld = async () => {
    if (!confirm('30일 이전 로그를 삭제할까요?')) return
    const d = new Date(); d.setDate(d.getDate() - 30)
    await supabase.from('error_logs').delete().lt('created_at', d.toISOString())
    fetchLogs()
  }

  const fmt = (s: string) => new Date(s).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">🩺 시스템 로그</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm mt-0.5">어느 기능에서 문제가 생기는지 한눈에 확인하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold px-3 py-2 rounded-xl ${todayCount > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'}`}>
            오늘 {todayCount}건
          </span>
          <button onClick={fetchLogs} className="px-3 py-2 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-sm font-bold">↻ 새로고침</button>
          <button onClick={clearOld} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 text-sm font-medium">🗑️ 30일전 정리</button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {AREAS.map(a => (
          <button key={a || 'all'} onClick={() => setArea(a)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${area === a ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-gray-700 text-slate-500'}`}>
            {a ? (AREA_LABEL[a] || a) : '전체'}
          </button>
        ))}
        <span className="w-px bg-slate-200 dark:bg-gray-600 mx-1" />
        {[['', '심각도 전체'], ['error', '🔴 에러'], ['warning', '🟡 경고']].map(([v, lb]) => (
          <button key={v} onClick={() => setSeverity(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${severity === v ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-gray-700 text-slate-500'}`}>{lb}</button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchLogs()}
          placeholder="메시지·이메일 검색 후 Enter"
          className="flex-1 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-green-600" />
        <button onClick={fetchLogs} className="px-5 rounded-xl bg-green-600 text-white text-sm font-bold">검색</button>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">불러오는 중…</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">🎉 로그가 없어요. 문제가 없다는 뜻이에요.</div>
      ) : (
        <div className="space-y-2">
          {logs.map(r => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 overflow-hidden">
              <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <span className={`flex-none w-2.5 h-2.5 rounded-full ${r.severity === 'warning' ? 'bg-amber-400' : 'bg-red-500'}`} />
                <span className="flex-none text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-gray-700 text-slate-500">{AREA_LABEL[r.area] || r.area}</span>
                <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{r.message}</span>
                <span className="flex-none text-xs text-slate-400">{fmt(r.created_at)}</span>
              </button>
              {expanded === r.id && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-gray-700 text-xs space-y-1.5">
                  {r.user_email && <p className="text-slate-500"><b>사용자:</b> {r.user_email}</p>}
                  {r.path && <p className="text-slate-500"><b>위치:</b> {r.path}</p>}
                  {r.detail && <pre className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all">{r.detail}</pre>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
