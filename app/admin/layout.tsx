'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const menuGroups = [
  {
    label: '운영',
    items: [
      { href: '/admin/dashboard',  icon: '🏠', label: '대시보드' },
      { href: '/admin/categories', icon: '🏷️', label: '카테고리' },
    ],
  },
  {
    label: '상품/재고',
    items: [
      { href: '/admin/products',  icon: '🧺', label: '상품관리' },
      { href: '/admin/inventory', icon: '📦', label: '재고관리', badge: true },
      { href: '/admin/restock',   icon: '🔔', label: '재입고알림' },
    ],
  },
  {
    label: '주문',
    items: [
      { href: '/admin/orders/wholesale', icon: '📋', label: '도매주문' },
      { href: '/admin/orders/retail',    icon: '🛒', label: '소매주문' },
      { href: '/admin/orders/general',   icon: '📝', label: '일반주문' },
    ],
  },
  {
    label: '회원',
    items: [
      { href: '/admin/members',   icon: '👥', label: '회원관리' },
      { href: '/admin/suppliers', icon: '🏭', label: '공급업체' },
    ],
  },
  {
    label: '기타',
    items: [
      { href: '/admin/ads',          icon: '📢', label: '광고배너' },
      { href: '/admin/coupons',      icon: '🎟️', label: '쿠폰' },
      { href: '/admin/tax',          icon: '🧾', label: '세금계산서' },
      { href: '/admin/social-proof', icon: '⭐', label: '소셜프루프' },
      { href: '/admin/settings',     icon: '⚙️', label: '설정' },
    ],
  },
]

const mobileMenus = [
  { href: '/admin/dashboard',        icon: '🏠', label: '홈' },
  { href: '/admin/products',         icon: '🧺', label: '상품' },
  { href: '/admin/orders/general',   icon: '📝', label: '주문' },
  { href: '/admin/members',          icon: '👥', label: '회원' },
  { href: '/admin/settings',         icon: '⚙️', label: '설정' },
]

// SVG 로고 컴포넌트
function FarmLogo({ size = 32, uid = 'a' }: { size?: number; uid?: string }) {
  const gid = `farmGrad_${uid}`
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#15803d"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gid})`}/>
      <path d="M10 20 Q16 10 22 20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="16" cy="14" r="3" fill="white" fillOpacity="0.9"/>
      <path d="M13 22 h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    localStorage.setItem('farm_admin', '1')
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') setDark(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    const fetchLowStock = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('products').select('id, stock, min_stock')
      if (data) setLowStockCount(data.filter(p => p.min_stock > 0 && p.stock <= p.min_stock).length)
    }
    fetchLowStock()
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark, mounted])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (!mounted) return null

  return (
    <div className={`flex min-h-screen ${dark ? 'dark text-gray-100' : 'bg-slate-50 text-slate-800'}`} style={dark ? { background: '#071a0e' } : {}}>

      {/* ── 사이드바 (데스크탑) ── */}
      <aside className={`
        hidden md:flex fixed top-0 left-0 h-full z-40 flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-56'}
        ${dark ? 'bg-[#0a1f10] border-r border-green-900/30' : 'bg-white border-r border-green-50'}
        shadow-lg shadow-green-900/5
      `}>

        {/* 로고 */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b ${dark ? 'border-green-900/30' : 'border-green-50'}`}>
          <div className="relative flex-shrink-0">
            <FarmLogo size={34} uid="sidebar" />
            <span className="absolute -bottom-1 -right-1 text-xs">🌾</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className={`font-black text-sm leading-tight ${dark ? 'text-white' : 'text-slate-800'}`}>온종일팜</p>
              <p className={`text-[10px] font-medium ${dark ? 'text-green-400' : 'text-green-600'}`}>농축수산물 도매</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`ml-auto p-1.5 rounded-lg transition-all duration-200 hover:scale-110
              ${dark ? 'text-green-300/70 hover:bg-green-900/40' : 'text-slate-400 hover:bg-green-50'}`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d={collapsed ? 'M5 2l4 5-4 5' : 'M9 2L5 7l4 5'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {menuGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className={`text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5
                  ${dark ? 'text-green-700/60' : 'text-slate-300'}`}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={`
                        relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200 cursor-pointer group
                        ${active
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md shadow-green-500/20'
                          : dark
                            ? 'text-green-300/70 hover:bg-green-900/40 hover:text-white'
                            : 'text-slate-500 hover:bg-green-50 hover:text-green-700'}
                      `}>
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-300 rounded-r-full"/>
                        )}
                        <span className="text-base flex-shrink-0">{item.icon}</span>
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {!collapsed && item.badge && lowStockCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                            {lowStockCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* 하단 */}
        <div className={`p-3 border-t ${dark ? 'border-green-900/30' : 'border-green-50'} space-y-1`}>
          {/* 쇼핑몰 가기 */}
          <Link href="/shop"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
              ${dark ? 'bg-green-700/20 hover:bg-green-700/40 text-green-300' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}
          >
            <span className="text-base">🛒</span>
            {!collapsed && <span>쇼핑몰 바로가기</span>}
          </Link>
          {/* 대문으로 */}
          <Link href="/landing"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${dark ? 'text-green-300/50 hover:bg-green-900/30 hover:text-green-300/80' : 'text-slate-400 hover:bg-green-50'}`}
          >
            <span className="text-base">🏡</span>
            {!collapsed && <span>대문으로</span>}
          </Link>
          <button
            onClick={() => setDark(!dark)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${dark ? 'text-green-300/70 hover:bg-green-900/40' : 'text-slate-500 hover:bg-green-50'}`}
          >
            <span className="text-base">{dark ? '☀️' : '🌙'}</span>
            {!collapsed && <span>{dark ? '라이트 모드' : '다크 모드'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${dark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-400 hover:bg-red-50'}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {!collapsed && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <main className={`
        flex-1 min-h-screen overflow-x-hidden
        transition-all duration-300
        ${isMobile ? 'ml-0 pb-20' : collapsed ? 'md:ml-16' : 'md:ml-56'}
      `}>
        {/* 상단 헤더 (모바일) */}
        <header className={`
          md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3
          ${dark ? 'bg-[#0a1f10] border-b border-green-900/30' : 'bg-white border-b border-green-50'}
          shadow-sm
        `}>
          <div className="flex items-center gap-2">
            <FarmLogo size={32} uid="mobile" />
            <div>
              <p className={`font-black text-sm ${dark ? 'text-white' : 'text-slate-800'}`}>온종일팜</p>
              <p className={`text-[9px] ${dark ? 'text-green-400' : 'text-green-600'}`}>농축수산물 도매</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {lowStockCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {lowStockCount}
              </span>
            )}
            <Link href="/shop"
              className={`p-2 rounded-xl transition-colors ${dark ? 'text-green-300 hover:bg-green-900/40' : 'text-green-700 hover:bg-green-50'}`}
              style={{ fontSize: '24px' }} title="쇼핑몰">🛒</Link>
            <Link href="/landing"
              className={`p-2 rounded-xl transition-colors ${dark ? 'text-green-300/60 hover:bg-green-900/30' : 'text-slate-400 hover:bg-slate-50'}`}
              style={{ fontSize: '24px' }} title="대문">🏡</Link>
            <button
              onClick={() => setDark(!dark)}
              className={`p-2 rounded-xl transition-colors ${dark ? 'text-green-300/70 hover:bg-green-900/40' : 'text-slate-400 hover:bg-green-50'}`}
              style={{ fontSize: '24px' }}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleLogout}
              className={`p-2 rounded-xl transition-colors ${dark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-400 hover:bg-red-50'}`}
              style={{ fontSize: '24px' }} title="로그아웃">🚪</button>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <div className="p-4 md:p-6 animate-fadeIn">
          {children}
        </div>
      </main>

      {/* ── 모바일 하단 탭바 ── */}
      <nav className={`
        md:hidden fixed bottom-0 left-0 right-0 z-50
        ${dark ? 'bg-[#0a1f10] border-t border-green-900/30' : 'bg-white border-t border-green-100'}
        pb-safe shadow-2xl shadow-green-900/10
      `}>
        <div className="flex items-center justify-around px-2 py-2">
          {mobileMenus.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div className={`
                  flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl mx-0.5
                  transition-all duration-200
                  ${active
                    ? 'bg-green-600 text-white scale-105 shadow-md shadow-green-500/30'
                    : dark ? 'text-green-300/50' : 'text-slate-400'}
                `}>
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className={`text-[9px] font-bold leading-none ${active ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
