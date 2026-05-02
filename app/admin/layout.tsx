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
      { href: '/admin/products',   icon: '🐟', label: '상품관리' },
      { href: '/admin/inventory',  icon: '📦', label: '재고관리', badge: true },
    ],
  },
  {
    label: '주문',
    items: [
      { href: '/admin/orders/wholesale', icon: '📋', label: '도매주문' },
      { href: '/admin/orders/retail',    icon: '🛒', label: '소매주문' },
      { href: '/admin/orders/general',   icon: '🧺', label: '일반주문' },
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
      { href: '/admin/tax',          icon: '🧾', label: '세금계산서' },
      { href: '/admin/social-proof', icon: '⭐', label: '소셜프루프' },
    ],
  },
]

// 모바일 하단 탭 (핵심 메뉴만)
const mobileMenus = [
  { href: '/admin/dashboard',        icon: '🏠', label: '홈' },
  { href: '/admin/products',         icon: '🐟', label: '상품' },
  { href: '/admin/orders/general',   icon: '🧺', label: '주문' },
  { href: '/admin/members',          icon: '👥', label: '회원' },
  { href: '/admin/settings',         icon: '⚙️', label: '설정' },
]

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

  // ── 모바일 레이아웃 ──────────────────────────────────────────
  if (isMobile) {
    return (
      <div className={`flex flex-col min-h-screen ${dark ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'}`}>

        {/* 모바일 상단 헤더 */}
        <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b
          ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-100'}`}
          style={{ backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🐟</span>
            <div>
              <p className={`text-sm font-bold leading-tight ${dark ? 'text-white' : 'text-slate-800'}`}>굴비가게</p>
              <p className={`text-[9px] tracking-widest uppercase ${dark ? 'text-gray-400' : 'text-slate-400'}`}>Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lowStockCount > 0 && (
              <Link href="/admin/inventory" className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-bold">
                📦 {lowStockCount}
              </Link>
            )}
            <button onClick={() => setDark(v => !v)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${dark ? 'bg-gray-800' : 'bg-slate-100'}`}>
              {dark ? '🌙' : '☀️'}
            </button>
            <button onClick={handleLogout}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${dark ? 'bg-gray-800 text-red-400' : 'bg-slate-100 text-red-500'}`}>
              🚪
            </button>
          </div>
        </header>

        {/* 컨텐츠 */}
        <main className="flex-1 pt-14 pb-20 px-4 py-4" style={{ paddingTop: '72px' }}>
          {children}
        </main>

        {/* 모바일 하단 탭바 */}
        <nav className={`fixed bottom-0 left-0 right-0 z-50 flex border-t
          ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-100'}`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)', backdropFilter: 'blur(16px)' }}>
          {mobileMenus.map(menu => {
            const active = pathname === menu.href || pathname.startsWith(menu.href + '/')
            return (
              <Link key={menu.href} href={menu.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative"
                style={{ color: active ? '#0ea5e9' : dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
                {active && (
                  <div className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-b bg-sky-500" />
                )}
                <span className="text-xl leading-none">{menu.icon}</span>
                <span className="text-[10px] font-semibold">{menu.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    )
  }

  // ── 데스크톱/태블릿 레이아웃 ────────────────────────────────
  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${dark ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'}`}>

      {/* 사이드바 */}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out shadow-2xl
        ${collapsed ? 'w-16' : 'w-56'}
        ${dark ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-slate-100'}`}>

        {/* 로고 */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b ${dark ? 'border-gray-800' : 'border-slate-100'}`}>
          <span className="text-2xl flex-shrink-0">🐟</span>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className={`font-bold text-sm leading-tight ${dark ? 'text-white' : 'text-slate-800'}`}>굴비가게</p>
              <p className={`text-xs ${dark ? 'text-gray-400' : 'text-slate-400'}`}>도매 관리 시스템</p>
            </div>
          )}
        </div>

        {/* 메뉴 그룹 */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {menuGroups.map(group => (
            <div key={group.label} className="mb-1">
              {/* 그룹 라벨 */}
              {!collapsed && (
                <p className={`px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase
                  ${dark ? 'text-gray-600' : 'text-slate-300'}`}>
                  {group.label}
                </p>
              )}
              {collapsed && <div className={`mx-3 my-1.5 h-px ${dark ? 'bg-gray-800' : 'bg-slate-100'}`} />}

              {group.items.map(menu => {
                const active = pathname === menu.href || pathname.startsWith(menu.href + '/')
                return (
                  <Link key={menu.href} href={menu.href}
                    className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl mb-0.5 transition-all duration-200 group
                      ${active
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-200 dark:shadow-sky-900'
                        : dark
                          ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}>
                    <span className={`text-base flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'scale-110' : ''}`}>
                      {menu.icon}
                    </span>
                    {!collapsed && (
                      <span className="text-sm font-medium whitespace-nowrap flex-1">{menu.label}</span>
                    )}
                    {!collapsed && (menu as any).badge && lowStockCount > 0 && (
                      <span className="text-xs font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {lowStockCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* 설정 — 단독 하단 고정 */}
        <div className={`border-t ${dark ? 'border-gray-800' : 'border-slate-100'}`}>
          <Link href="/admin/settings"
            className={`flex items-center gap-3 px-4 py-3 mx-2 my-1.5 rounded-xl transition-all duration-200 group
              ${pathname === '/admin/settings'
                ? 'bg-sky-500 text-white shadow-md'
                : dark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}>
            <span className="text-base flex-shrink-0 group-hover:scale-110 transition-transform">⚙️</span>
            {!collapsed && <span className="text-sm font-medium">설정</span>}
          </Link>
        </div>

        {/* 하단 액션 버튼들 */}
        <div className={`p-3 border-t ${dark ? 'border-gray-800' : 'border-slate-100'} space-y-2`}>
          <button onClick={() => setDark(!dark)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${dark ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
            <span className="text-base flex-shrink-0" style={{ transform: dark ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}>
              {dark ? '🌙' : '☀️'}
            </span>
            {!collapsed && <span className="text-xs font-medium">{dark ? '다크모드' : '라이트모드'}</span>}
          </button>

          <a href="/shop"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-md shadow-emerald-500/20">
            <span className="text-base flex-shrink-0">🛒</span>
            {!collapsed && <span className="text-xs font-bold">쇼핑몰 가기</span>}
          </a>

          <a href="/landing"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white shadow-md shadow-violet-500/20">
            <span className="text-base flex-shrink-0">🏠</span>
            {!collapsed && <span className="text-xs font-bold">대문으로</span>}
          </a>

          <button onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${dark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
            <span className="text-base flex-shrink-0">🚪</span>
            {!collapsed && <span className="text-xs font-medium">로그아웃</span>}
          </button>

          {/* 접기 버튼 */}
          <button onClick={() => setCollapsed(v => !v)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
              ${dark ? 'text-gray-600 hover:text-gray-400 hover:bg-gray-800' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}>
            <span className="text-sm flex-shrink-0">{collapsed ? '▶' : '◀'}</span>
            {!collapsed && <span className="text-xs">접기</span>}
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}>
        <header className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b transition-colors duration-300
          ${dark ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
          <button onClick={() => setCollapsed(!collapsed)}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110
              ${dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-200 text-slate-500'}`}>
            <span className="text-lg">{collapsed ? '▶' : '◀'}</span>
          </button>
          <div className="flex items-center gap-3">
            {lowStockCount > 0 && (
              <Link href="/admin/inventory"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-red-500 text-white animate-pulse">
                📦 재고 부족 {lowStockCount}건
              </Link>
            )}
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${dark ? 'bg-sky-900 text-sky-300' : 'bg-sky-100 text-sky-600'}`}>
              관리자
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  )
}
