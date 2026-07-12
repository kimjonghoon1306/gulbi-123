'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import DashboardView from './_DashboardView'

export default function DashboardPage() {
  const [stats, setStats] = useState({ todayOrders: 0, unshipped: 0, lowStock: 0, monthRevenue: 0 })
  const [channelStats, setChannelStats] = useState({ general: 0, retail: 0, wholesale: 0 })
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number }[]>([])
  const [dailyData, setDailyData] = useState<{ day: string; revenue: number; orders: number }[]>([])
  const [orderStatusStats, setOrderStatusStats] = useState<{ status: string; count: number; color: string }[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const [chartType, setChartType] = useState<'bar' | 'line'>('line')
  const [brief, setBrief] = useState<{ headline: string; summary: string; actions: { label: string; why: string }[]; provider?: string; note?: string } | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [briefError, setBriefError] = useState('')
  const supabase = createClient()

  const getBrief = async () => {
    setBriefLoading(true); setBriefError(''); setBrief(null)
    try {
      const res = await fetch('/api/admin-brief')
      const data = await res.json()
      if (!res.ok) {
        console.error('[admin brief] failed', data)
        setBriefError('AI 브리핑을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
        return
      }
      setBrief(data)
    } catch {
      setBriefError('네트워크 오류로 브리핑을 불러오지 못했어요.')
    } finally {
      setBriefLoading(false)
    }
  }

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
      { data: gOrders }, { data: wOrders }, { data: rOrders }, { data: products },
      { data: gRecent }, { data: wRecent }, { data: rRecent },
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
    const unshipped = allOrders.filter(o => o.status === '입금완료' || o.status === '접수' || o.status === '준비중').length
    const lowStockList = (products || []).filter(p => p.min_stock > 0 && p.stock <= p.min_stock)
    const monthRevenue = allOrders.filter(o => o.created_at >= firstDay && o.status === '완료').reduce((s, o) => s + (o.total_amount || 0), 0)

    const gRevenue = (gOrders || []).filter(o => o.created_at >= firstDay).reduce((s, o) => s + (o.total_amount || 0), 0)
    const rRevenue = (rOrders || []).filter(o => o.created_at >= firstDay).reduce((s, o) => s + (o.total_amount || 0), 0)
    const wRevenue = (wOrders || []).filter(o => o.created_at >= firstDay).reduce((s, o) => s + (o.total_amount || 0), 0)

    // 최근 6개월 월별
    const monthly: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthly.push({ month: `${d.getMonth() + 1}월`, revenue: allOrders.filter(o => o.created_at?.startsWith(monthStr)).reduce((s, o) => s + (o.total_amount || 0), 0) })
    }

    // 최근 14일 일별
    const daily: { day: string; revenue: number; orders: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const dayStr = d.toISOString().split('T')[0]
      const dayOrders = allOrders.filter(o => o.created_at?.startsWith(dayStr))
      daily.push({ day: `${d.getMonth() + 1}/${d.getDate()}`, revenue: dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0), orders: dayOrders.length })
    }

    // 주문 상태별
    const statusMap: Record<string, { count: number; color: string }> = {
      '접수':  { count: 0, color: '#16a34a' },
      '준비중': { count: 0, color: '#f59e0b' },
      '출고':  { count: 0, color: '#8b5cf6' },
      '완료':  { count: 0, color: '#10b981' },
      '취소':  { count: 0, color: '#ef4444' },
    }
    allOrders.forEach(o => { if (o.status && statusMap[o.status]) statusMap[o.status].count++ })
    const statusStats = Object.entries(statusMap).map(([status, { count, color }]) => ({ status, count, color })).filter(s => s.count > 0)

    const combined = [
      ...(gRecent || []).map(o => ({ name: o.customer_name, amount: o.total_amount, status: o.status, date: o.created_at, type: '일반' })),
      ...(wRecent || []).map(o => ({ name: o.company_name, amount: o.total_amount, status: o.status, date: o.created_at, type: '도매' })),
      ...(rRecent || []).map(o => ({ name: o.customer_name, amount: o.total_amount, status: o.status, date: o.created_at, type: '소매' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

    // 🏆 베스트셀러 상품 (주문 아이템 3종 집계)
    const [{ data: gItems }, { data: rItems }, { data: wItems }] = await Promise.all([
      supabase.from('general_order_items').select('product_name, quantity, total_price'),
      supabase.from('retail_order_items').select('product_name, quantity, total_price'),
      supabase.from('wholesale_order_items').select('product_name, quantity, total_price'),
    ])
    const itemMap: Record<string, { qty: number; revenue: number }> = {}
    ;[...(gItems || []), ...(rItems || []), ...(wItems || [])].forEach((it: any) => {
      const key = it.product_name || '(이름없음)'
      if (!itemMap[key]) itemMap[key] = { qty: 0, revenue: 0 }
      itemMap[key].qty += Number(it.quantity || 0)
      itemMap[key].revenue += Number(it.total_price || 0)
    })
    const top = Object.entries(itemMap)
      .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    setStats({ todayOrders, unshipped, lowStock: lowStockList.length, monthRevenue })
    setChannelStats({ general: gRevenue, retail: rRevenue, wholesale: wRevenue })
    setMonthlyData(monthly)
    setDailyData(daily)
    setOrderStatusStats(statusStats)
    setRecentOrders(combined)
    setLowStockItems(lowStockList)
    setTopProducts(top)
    setLoading(false)
  }


  return (
    <DashboardView
      stats={stats}
      channelStats={channelStats}
      monthlyData={monthlyData}
      dailyData={dailyData}
      orderStatusStats={orderStatusStats}
      recentOrders={recentOrders}
      lowStockItems={lowStockItems}
      topProducts={topProducts}
      loading={loading}
      greeting={greeting}
      chartType={chartType}
      setChartType={setChartType}
      brief={brief}
      briefLoading={briefLoading}
      briefError={briefError}
      getBrief={getBrief}
    />
  )
}
