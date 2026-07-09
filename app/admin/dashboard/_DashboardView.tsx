'use client'

import type { Dispatch, SetStateAction } from 'react'
import Link from 'next/link'

type Stats = { todayOrders: number; unshipped: number; lowStock: number; monthRevenue: number }
type ChannelStats = { general: number; retail: number; wholesale: number }
type MonthlyData = { month: string; revenue: number }
type DailyData = { day: string; revenue: number; orders: number }
type OrderStatusStat = { status: string; count: number; color: string }
type TopProduct = { name: string; qty: number; revenue: number }
type Brief = { headline: string; summary: string; actions: { label: string; why: string }[]; provider?: string; note?: string }

type DashboardViewProps = {
  stats: Stats
  channelStats: ChannelStats
  monthlyData: MonthlyData[]
  dailyData: DailyData[]
  orderStatusStats: OrderStatusStat[]
  recentOrders: any[]
  lowStockItems: any[]
  topProducts: TopProduct[]
  loading: boolean
  greeting: string
  chartType: 'bar' | 'line'
  setChartType: Dispatch<SetStateAction<'bar' | 'line'>>
  brief: Brief | null
  briefLoading: boolean
  briefError: string
  getBrief: () => Promise<void>
}

const STATUS_COLOR: Record<string, string> = {
  '접수': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500',
  '준비중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  '출고': 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  '완료': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  '취소': 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
}
const TYPE_STYLE: Record<string, string> = {
  '일반': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  '도매': 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  '소매': 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
}

const LineChart = ({ data, color = '#14532d' }: { data: { revenue: number }[]; color?: string }) => {
  if (data.length < 2) return null
  const W = 500; const H = 110; const PAD = 8
  const maxVal = Math.max(...data.map(d => d.revenue), 1)
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((d.revenue / maxVal) * (H - PAD * 2)),
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PAD} L ${pts[0].x.toFixed(1)} ${H - PAD} Z`
  const gradId = `grad_${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((r, i) => (
        <line key={i} x1={PAD} y1={PAD + r * (H - PAD * 2)} x2={W - PAD} y2={PAD + r * (H - PAD * 2)}
          stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="white" strokeWidth="2" />
      ))}
    </svg>
  )
}

export default function DashboardView({
  stats, channelStats, monthlyData, dailyData, orderStatusStats, recentOrders,
  lowStockItems, topProducts, loading, greeting, chartType, setChartType,
  brief, briefLoading, briefError, getBrief,
}: DashboardViewProps) {
  const maxMonthly = Math.max(...monthlyData.map(d => d.revenue), 1)
  const totalChannel = channelStats.general + channelStats.retail + channelStats.wholesale || 1
  const totalStatusCount = orderStatusStats.reduce((s, o) => s + o.count, 0) || 1

  return (
    <div className="animate-fadeIn space-y-6">

      {/* 인사말 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{greeting}</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">오늘도 온종일팜 화이팅! 🧺</p>
        </div>
        <Link href="/admin/suppliers"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: 'white', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>
          🏭 공급업체 관리
        </Link>
      </div>

      {/* AI 아침 브리핑 */}
      <div className="rounded-2xl border border-violet-200 dark:border-violet-800/60 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h2 className="font-bold text-slate-800 dark:text-white">AI 아침 브리핑</h2>
            {brief?.provider && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-gray-800/60 text-slate-500 dark:text-slate-400 font-medium">
                {brief.provider === 'openai' ? 'GPT' : brief.provider === '기본' ? '기본' : 'Gemini'}
              </span>
            )}
          </div>
          <button onClick={getBrief} disabled={briefLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
            {briefLoading ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '✨'}
            {briefLoading ? '분석 중...' : brief ? '새로고침' : '브리핑 받기'}
          </button>
        </div>

        {!brief && !briefLoading && !briefError && (
          <p className="text-sm text-slate-500 dark:text-slate-400">버튼을 누르면 어제 매출·미출고·재고·승인대기를 AI가 한눈에 정리해 드려요. <span className="text-slate-400">(내 API 키 사용)</span></p>
        )}
        {briefError && (
          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
            {briefError}
            {briefError.includes('키') && <Link href="/admin/settings" className="ml-1 underline font-medium">설정에서 키 등록 →</Link>}
          </div>
        )}
        {brief && (
          <div className="mt-2 space-y-3">
            <p className="text-base font-bold text-slate-800 dark:text-white">{brief.headline}</p>
            {brief.summary && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{brief.summary}</p>}
            {brief.note && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                ⓘ {brief.note}
                {brief.note.includes('키') && <Link href="/admin/settings" className="ml-1 underline">설정 →</Link>}
              </p>
            )}
            {brief.actions?.length > 0 && (
              <div className="space-y-2 pt-1">
                {brief.actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 bg-white/70 dark:bg-gray-800/50 rounded-xl px-3 py-2">
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{a.label}</p>
                      {a.why && <p className="text-xs text-slate-500 dark:text-slate-400">{a.why}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 재고 부족 알림 */}
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
          { label: '오늘 주문', value: `${stats.todayOrders}건`, icon: '📋', color: 'text-green-700 dark:text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-800' },
          { label: '미출고', value: `${stats.unshipped}건`, icon: '📦', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800' },
          { label: '재고 부족', value: `${stats.lowStock}개`, icon: '⚠️', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800' },
          { label: '이번달 매출', value: loading ? '-' : `${(stats.monthRevenue / 10000).toFixed(0)}만원`, icon: '💰', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              {loading && <div className="w-4 h-4 border-2 border-slate-300 border-t-green-600 rounded-full animate-spin" />}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{loading ? '-' : card.value}</p>
          </div>
        ))}
      </div>

      {/* 월별 매출 차트 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800 dark:text-white">📈 월별 매출 추이 (최근 6개월)</h2>
          <div className="flex bg-slate-100 dark:bg-gray-700 rounded-xl p-1 gap-1">
            {(['line', 'bar'] as const).map(t => (
              <button key={t} onClick={() => setChartType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartType === t ? 'bg-white dark:bg-gray-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>
                {t === 'line' ? '꺾은선' : '막대'}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">불러오는 중...</div>
        ) : chartType === 'line' ? (
          <div>
            <div className="h-36 text-slate-200 dark:text-gray-700">
              <LineChart data={monthlyData} />
            </div>
            <div className="flex justify-between mt-3">
              {monthlyData.map((d, i) => (
                <div key={i} className="flex-1 text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500">{d.month}</p>
                  {d.revenue > 0 && <p className="text-xs font-bold text-teal-600 dark:text-teal-400">{(d.revenue / 10000).toFixed(0)}만</p>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {monthlyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs text-slate-400 font-medium">{d.revenue > 0 ? `${(d.revenue / 10000).toFixed(0)}만` : ''}</p>
                <div className="w-full rounded-t-lg transition-all duration-500 relative group"
                  style={{ height: `${Math.max((d.revenue / maxMonthly) * 120, d.revenue > 0 ? 8 : 2)}px`, background: i === 5 ? 'linear-gradient(180deg,#14532d,#15803d)' : 'linear-gradient(180deg,#cbd5e1,#e2e8f0)' }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                    {d.revenue.toLocaleString()}원
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{d.month}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 일별 매출 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
        <h2 className="font-bold text-slate-800 dark:text-white mb-5">📅 일별 매출 (최근 14일)</h2>
        {loading ? (
          <div className="h-32 flex items-center justify-center text-slate-400 text-sm">불러오는 중...</div>
        ) : (
          <>
            <div className="h-32 text-slate-200 dark:text-gray-700">
              <LineChart data={dailyData} color="#6366f1" />
            </div>
            <div className="flex justify-between mt-2">
              {dailyData.map((d, i) => (
                <div key={i} className="flex-1 text-center">
                  {(i === 0 || i === 6 || i === 13) && (
                    <p className="text-[9px] text-slate-400 dark:text-slate-500">{d.day}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: '오늘', value: dailyData[dailyData.length - 1]?.revenue || 0, orders: dailyData[dailyData.length - 1]?.orders || 0 },
                { label: '어제', value: dailyData[dailyData.length - 2]?.revenue || 0, orders: dailyData[dailyData.length - 2]?.orders || 0 },
                { label: '14일 평균', value: Math.round(dailyData.reduce((s, d) => s + d.revenue, 0) / 14), orders: Math.round(dailyData.reduce((s, d) => s + d.orders, 0) / 14) },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{item.label}</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{(item.value / 10000).toFixed(1)}만원</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.orders}건</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 주문 상태별 통계 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 dark:text-white mb-5">🎯 주문 상태별 현황</h2>
          {loading ? (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">불러오는 중...</div>
          ) : orderStatusStats.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center gap-2">
              <p className="text-3xl">🧺</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">주문 데이터가 없어요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderStatusStats.map(s => (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{Math.round((s.count / totalStatusCount) * 100)}%</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{s.count}건</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(s.count / totalStatusCount) * 100}%`, background: s.color }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 dark:border-gray-700 flex justify-between">
                <span className="text-xs text-slate-400">전체 주문</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">{totalStatusCount}건</span>
              </div>
            </div>
          )}
        </div>

        {/* 채널별 매출 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 dark:text-white mb-5">🥧 채널별 이번달 매출</h2>
          {loading ? (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">불러오는 중...</div>
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
              <div className="pt-2 border-t border-slate-100 dark:border-gray-700 flex justify-between">
                <span className="text-xs text-slate-400">총 매출</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {((channelStats.general + channelStats.retail + channelStats.wholesale) / 10000).toFixed(0)}만원
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🏆 베스트셀러 상품 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800 dark:text-white">🏆 베스트셀러 상품</h2>
          <Link href="/admin/products" className="text-xs text-amber-500 hover:text-amber-600 font-medium">상품 관리 →</Link>
        </div>
        {loading ? (
          <div className="py-8 text-center text-slate-400">불러오는 중...</div>
        ) : topProducts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">아직 판매 데이터가 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const maxQty = Math.max(...topProducts.map(t => t.qty), 1)
              const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}`
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-7 text-center text-base font-bold flex-shrink-0">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">{p.qty.toLocaleString()}개 · {p.revenue.toLocaleString()}원</p>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(p.qty / maxQty) * 100}%`, background: 'linear-gradient(90deg,#f59e0b,#f97316)' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
            <p className="text-4xl mb-3">🧺</p>
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