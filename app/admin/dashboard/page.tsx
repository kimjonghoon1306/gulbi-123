'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({ todayOrders: 0, unshipped: 0, lowStock: 0, monthRevenue: 0 })
  const [channelStats, setChannelStats] = useState({ general: 0, retail: 0, wholesale: 0 })
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number }[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('좋은 아침이에요 ☀️')
    else if (h < 18) setGreeting('좋은 오후예요 🌤️')
    else setGreeting('좋은 저녁이에요 🌙')
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const [
      { data: gOrders },
      { data: wOrders },
      { data: rOrders },
      { data: products },
      { data: gRecent },
      { data: wRecent },
      { data: rRecent },
    ] = await Promise.all([
      supabase.from('general_orders').select('id, status, total_amount, created_at, customer_name'),
      supabase.from('wholesale_orders').select('id, status, total_amount, created_at, company_name'),
      supabase.from('retail_orders').select('id, status, total_amount, created_at, customer_name'),
      supabase.from('products').select('id, name, stock, min_stock, unit'),
      supabase.from('general_orders').select('customer_name, total_amount, status, created_at').order('created_at', { ascending: false }).limit(3),
      supabase.from('wholesale_orders').select('company_name, total_amount, status, created_at').order('created_at', { ascending: false }).limit(3),
      supabase.from('retail_orders').select('customer_name, total_amount, status, created_at').order('created_at', { ascending: false }).limit(3),
    ])

    const allOrders = [...(gOrders || []), ...(wOrders || []), ...(rOrders || [])]
    const todayOrders = allOrders.filter(o => o.created_at?.startsWith(today)).length
    const unshipped = allOrders.filter(o => o.status === '접수' || o.status === '준비중').length
    const lowStockList = (products || []).filter(p => p.min_stock > 0 && p.stock <= p.min_stock)
    const monthRevenue = allOrders
      .filter(o => o.created_at >= firstDay && o.status === '완료')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0)

    // 채널별 이번달 매출
    const gRevenue = (gOrders || []).filter(o => o.created_at >= firstDay).reduce((s, o) => s + (o.total_amount || 0), 0)
    const rRevenue = (rOrders || []).filter(o => o.created_at >= firstDay).reduce((s, o) => s + (o.total_amount || 0), 0)
    const wRevenue = (wOrders || []).filter(o => o.created_at >= firstDay).reduce((s, o) => s + (o.total_amount || 0), 0)

    // 최근 6개월 월별 매출
    const monthly: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const revenue = allOrders
        .filter(o => o.created_at?.startsWith(monthStr))
        .reduce((s, o) => s + (o.total_amount || 0), 0)
      monthly.push({ month: `${d.getMonth() + 1}월`, revenue })
    }

    // 최근 주문 합치기
    const combined = [
      ...(gRecent || []).map(o => ({ name: o.customer_name, amount: o.total_amount, status: o.status, date: o.created_at, type: '일반', color: 'indigo' })),
      ...(wRecent || []).map(o => ({ name: o.company_name, amount: o.total_amount, status: o.status, date: o.created_at, type: '도매', color: 'violet' })),
      ...(rRecent || []).map(o => ({ name: o.customer_name, amount: o.total_amount, status: o.status, date: o.created_at, type: '소매', color: 'teal' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

    setStats({ todayOrders, unshipped, lowStock: lowStockList.length, monthRevenue })
    setChannelStats({ general: gRevenue, retail: rRevenue, wholesale: wRevenue })
    setMonthlyData(monthly)
    setRecentOrders(combined)
    setLowStockItems(lowStockList)
    setLoading(false)
  }

  const STATUS_COLOR: Record<string, string> = {
    '접수':  'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
    '준비중':'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    '출고':  'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    '완료':  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  }

  const TYPE_STYLE: Record<string, string> = {
    '일반': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    '도매': 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    '소매': 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  }

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1)
  const totalChannel = channelStats.general + channelStats.retail + channelStats.wholesale || 1

  return (
    <div className="animate-fadeIn space-y-6">

      {/* 인사말 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{greeting}</h1>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">오늘도 굴비가게 화이팅! 🐟</p>
      </div>

      {/* 재고 부족 알림 배너 */}
      {!loading && lowStockItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚠️</span>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">재고 부족 상품 {lowStockItems.length}개</p>
            <Link href="/admin/inventory" className="ml-auto text-xs text-red-500 hover:text-red-600 font-medium">재고관리 →</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(p => (
              <span key={p.id} className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1 rounded-full font-medium">
                {p.name} ({p.stock}{p.unit} / 최소 {p.min_stock}{p.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 통계 카드 4개 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '오늘 주문', value: `${stats.todayOrders}건`, icon: '📋', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-100 dark:border-sky-800' },
          { label: '미출고', value: `${stats.unshipped}건`, icon: '📦', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800' },
          { label: '재고 부족', value: `${stats.lowStock}개`, icon: '⚠️', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800' },
          { label: '이번달 매출', value: loading ? '-' : `${(stats.monthRevenue / 10000).toFixed(0)}만원`, icon: '💰', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800' },
        ].map((card, i) => (
          <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              {loading && <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{loading ? '-' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 월별 매출 그래프 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4">📈 월별 매출</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">불러오는 중...</div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {monthlyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {d.revenue > 0 ? `${(d.revenue / 10000).toFixed(0)}만` : ''}
                  </p>
                  <div className="w-full rounded-t-lg transition-all duration-500 relative group"
                    style={{
                      height: `${Math.max((d.revenue / maxRevenue) * 120, d.revenue > 0 ? 8 : 2)}px`,
                      background: i === 5
                        ? 'linear-gradient(180deg,#0f766e,#0891b2)'
                        : 'linear-gradient(180deg,#cbd5e1,#e2e8f0)',
                    }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {d.revenue.toLocaleString()}원
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{d.month}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 채널별 매출 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4">🥧 채널별 이번달 매출</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">불러오는 중...</div>
          ) : (
            <div className="space-y-4">
              {[
                { label: '🛒 일반', value: channelStats.general, color: 'bg-indigo-500', link: '/admin/orders/general' },
                { label: '🏪 소매', value: channelStats.retail, color: 'bg-teal-500', link: '/admin/orders/retail' },
                { label: '🏭 도매', value: channelStats.wholesale, color: 'bg-violet-500', link: '/admin/orders/wholesale' },
              ].map(ch => (
                <div key={ch.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <Link href={ch.link} className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:underline">{ch.label}</Link>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{(ch.value / 10000).toFixed(0)}만원</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${ch.color} rounded-full transition-all duration-700`}
                      style={{ width: `${(ch.value / totalChannel) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">총 매출</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    {((channelStats.general + channelStats.retail + channelStats.wholesale) / 10000).toFixed(0)}만원
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 최근 주문 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-gray-700">
          <h2 className="font-bold text-slate-800 dark:text-white">최근 주문</h2>
          <div className="flex gap-3">
            <Link href="/admin/orders/general" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">일반 →</Link>
            <Link href="/admin/orders/retail" className="text-xs text-teal-500 hover:text-teal-600 font-medium">소매 →</Link>
            <Link href="/admin/orders/wholesale" className="text-xs text-violet-500 hover:text-violet-600 font-medium">도매 →</Link>
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400">불러오는 중...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🐟</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">아직 주문이 없어요</p>
          </div>
        ) : recentOrders.map((o, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_STYLE[o.type]}`}>{o.type}</span>
              <span className="text-sm font-medium text-slate-800 dark:text-white">{o.name || '-'}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]}`}>{o.status}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-white">{(o.amount || 0).toLocaleString()}원</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(o.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
