'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const menus = [
  { href: '/supplier/dashboard', icon: '🏠', label: '대시보드' },
  { href: '/supplier/products',  icon: '📦', label: '상품 관리' },
]

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [status, setStatus] = useState('')
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('supplier-theme')
    if (saved === 'dark') setDark(true)
    fetchSupplierInfo()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('supplier-theme', dark ? 'dark' : 'light')
  }, [dark])

  const fetchSupplierInfo = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/supplier/login'); return }

    const { data } = await supabase
      .from('suppliers')
      .select('company_name, status')
      .eq('id', user.id)
      .single()

    if (!data) { router.push('/supplier/login'); return }
    setCompanyName(data.company_name)
    setStatus(data.status)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/supplier/login')
  }

  const statusStyleMap: Record<string, string> = {
    '승인':   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    '대기중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    '거절':   'bg-red-100 dark:bg-red-900/30 text-red-500',
  }
  const statusStyle = statusStyleMap[status] || ''

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${dark ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'}`}>

      {/* 사이드바 */}
      <aside className={`fixed top-0 left-0 h-full z-40 w-56 flex flex-col shadow-2xl transition-colors duration-300
        ${dark ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-slate-100'}`}>

        {/* 로고 */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b ${dark ? 'border-gray-800' : 'border-slate-100'}`}>
          <span className="text-2xl">🏭</span>
          <div className="overflow-hidden">
            <p className={`font-bold text-sm leading-tight ${dark ? 'text-white' : 'text-slate-800'}`}>공급업체 포털</p>
            <p className={`text-xs truncate ${dark ? 'text-gray-400' : 'text-slate-400'}`}>{companyName || '...'}</p>
          </div>
        </div>

        {/* 승인 상태 뱃지 */}
        {status && (
          <div className="px-4 py-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusStyle}`}>
              {status === '승인' ? '✅ 승인됨' : status === '대기중' ? '⏳ 승인 대기중' : '❌ 거절됨'}
            </span>
          </div>
        )}

        {/* 메뉴 */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menus.map(menu => {
            const active = pathname === menu.href
            return (
              <Link key={menu.href} href={menu.href}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl mb-1 transition-all duration-200 group
                  ${active
                    ? 'bg-violet-500 text-white shadow-md shadow-violet-200 dark:shadow-violet-900'
                    : dark
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}>
                <span className="text-lg">{menu.icon}</span>
                <span className="text-sm font-medium">{menu.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* 하단 */}
        <div className={`p-3 border-t ${dark ? 'border-gray-800' : 'border-slate-100'} space-y-2`}>
          <button onClick={() => setDark(!dark)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${dark ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
            <span className="text-lg">{dark ? '🌙' : '☀️'}</span>
            <span className="text-xs font-medium">{dark ? '다크모드' : '라이트모드'}</span>
          </button>
          <button onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${dark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
            <span className="text-lg">🚪</span>
            <span className="text-xs font-medium">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <div className="flex-1 ml-56 flex flex-col">
        <main className="flex-1 p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  )
}
