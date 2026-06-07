'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const menus = [
  { href: '/admin/dashboard', icon: '🏠', label: '대시보드' },
  { href: '/admin/products', icon: '🧺', label: '상품관리' },
  { href: '/admin/orders/wholesale', icon: '📋', label: '도매주문' },
  { href: '/admin/orders/retail', icon: '🛒', label: '소매주문' },
  { href: '/admin/orders/general', icon: '🧑‍💼', label: '일반구매' },
  { href: '/admin/members', icon: '👥', label: '회원관리' },
  { href: '/admin/inventory', icon: '📦', label: '재고관리' },
  { href: '/admin/tax', icon: '🧾', label: '세금계산서' },
  { href: '/admin/social-proof', icon: '⭐', label: '소셜 프루프' },
  { href: '/admin/settings', icon: '⚙️', label: '설정' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') setDark(true)
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

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${dark ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'}`}>

      {/* 사이드바 */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out shadow-2xl
          ${collapsed ? 'w-16' : 'w-56'}
          ${dark ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-slate-100'}`}
      >
        {/* 로고 */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b ${dark ? 'border-gray-800' : 'border-slate-100'}`}>
          <span className="text-2xl">🧺</span>
          {!collapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <p className={`font-bold text-sm leading-tight ${dark ? 'text-white' : 'text-slate-800'}`}>온종일팜</p>
              <p className={`text-xs ${dark ? 'text-gray-400' : 'text-slate-400'}`}>도매 관리 시스템</p>
            </div>
          )}
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menus.map((menu) => {
            const active = pathname === menu.href
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-xl mb-0.5 transition-all duration-200 group
                  ${active
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : dark
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
              >
                <span className={`text-lg transition-transform duration-200 group-hover:scale-110 ${active ? 'scale-110' : ''}`}>
                  {menu.icon}
                </span>
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                    {menu.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* 하단 버튼들 */}
        <div className={`p-3 border-t ${dark ? 'border-gray-800' : 'border-slate-100'} space-y-2`}>
          {/* 테마 토글 */}
          <button
            onClick={() => setDark(!dark)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${dark ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            <span className="text-lg transition-transform duration-300" style={{ transform: dark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
              {dark ? '🌙' : '☀️'}
            </span>
            {!collapsed && (
              <span className="text-xs font-medium">{dark ? '다크모드' : '라이트모드'}</span>
            )}
          </button>

          {/* 로그아웃 */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${dark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
          >
            <span className="text-lg">🚪</span>
            {!collapsed && <span className="text-xs font-medium">로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}>

        {/* 상단 헤더 */}
        <header className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b transition-colors duration-300
          ${dark ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110
              ${dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-200 text-slate-500'}`}
          >
            <span className="text-lg">{collapsed ? '▶' : '◀'}</span>
          </button>

          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-medium
              ${dark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
              관리자
            </span>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  )
}
