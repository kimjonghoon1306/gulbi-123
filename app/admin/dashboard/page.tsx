'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Stat = { label: string; value: string; icon: string; color: string; bg: string; darkBg: string }

export default function DashboardPage() {
  const [stats, setStats] = useState({ todayOrders: 0, unshipped: 0, lowStock: 0, monthRevenue: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
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

    const [
      { data: wOrders },
      { data: rOrders },
      { data: products },
      { data: wRecent },
      { data: rRecent }
    ] = await Promise.all([
      supabase.from('wholesale_orders').select('id, status, total_amount, created_at'),
      supabase.from('retail_orders').select('id, status, total_amount, created_at'),
      supabase.from('products').select('id, stock, min_stock'),
      supabase.from('wholesale_orders').select('company_name, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('retail_orders').select('customer_name, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5)
    ])

    const allOrders = [...(wOrders || []), ...(rOrders || [])]
    const todayOrders = allOrders.filter(o => o.created_at?.startsWith(today)).length
    const unshipped = allOrders.filter(o => o.status === '접수' || o.status === '준비중').length
    const lowStock = (products || []).filter(p => p.min_stock > 0 && p.stock <= p.min_stock).length
    const monthRevenue = allOrders
      .filter(o => o.created_at >= firstDay)
      .reduce((sum, o) => sum + (o.total_amount || 0), 0)

    setStats({ todayOrders, unshipped, lowStock, monthRevenue })

    const combined = [
      ...(wRecent || []).map(o => ({ name: o.company_name, amount: o.total_amount, status: o.status, date: o.created_at, type: '도매' })),
      ...(rRecent || []).map(o => ({ name: o.customer_name, amount: o.total_amount, status: o.status, date: o.created_at, type: '소매' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)
    setRecentOrders(combined)
    setLoading(false)
  }

  const STATUS_COLOR: Record<string, string> = {
    '접수': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    '준비중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    '출고': 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    '완료': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  }

  const statCards = [
    { label: '오늘 주문', value: `${stats.todayOrders}건`, icon: '📋', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-100 dark:border-sky-800' },
    { label: '미출고', value: `${stats.unshipped}건`, icon: '📦', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800' },
    { label: '재고 부족', value: `${stats.lowStock}개`, icon: '⚠️', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800' },
    { label: '이번달 매출', value: `${stats.monthRevenue.toLocaleString()}원`, icon: '💰', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800' },
  ]

  return (
    <div className="animate-fadeIn">
      {/* 인사말 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{greeting}</h1>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">오늘도 굴비가게 화이팅! 🐟</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={card.label}
            className={`${card.bg} border ${card.border} rounded-2xl p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300`}
            style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              {loading && <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{loading ? '-' : card.value}</p>
          </div>
        ))}
      </div>

      {/* 최근 주문 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-gray-700">
          <h2 className="font-bold text-slate-800 dark:text-white">최근 주문</h2>
          <div className="flex gap-2">
            <a href="/admin/orders/wholesale" className="text-xs text-sky-500 hover:text-sky-600 font-medium">도매 →</a>
            <a href="/admin/orders/retail" className="text-xs text-violet-500 hover:text-violet-600 font-medium">소매 →</a>
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
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${o.type === '도매' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'}`}>
                {o.type}
              </span>
              <span className="text-sm font-medium text-slate-800 dark:text-white">{o.name}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]}`}>{o.status}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-white">{o.amount.toLocaleString()}원</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(o.date).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
