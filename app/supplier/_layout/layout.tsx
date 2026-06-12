'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ThemeContext, darkTheme, lightTheme } from './theme-context'
import SupplierGuide from './SupplierGuide'

const menus = [
  { href: '/supplier/dashboard', icon: '🏠', label: '대시보드' },
  { href: '/supplier/products',  icon: '🧺', label: '상품 관리' },
  { href: '/supplier/sales',     icon: '📊', label: '매출 현황' },
  { href: '/supplier/settings',  icon: '⚙️', label: '설정' },
]

const mobileMenus = [
  { href: '/supplier/dashboard', icon: '🏠', label: '홈' },
  { href: '/supplier/products',  icon: '🧺', label: '상품' },
  { href: '/supplier/sales',     icon: '📊', label: '매출' },
  { href: '/supplier/settings',  icon: '⚙️', label: '설정' },
]

function SupplierLogoSVG({ size = 30, uid = 'sup' }: { size?: number; uid?: string }) {
  const gid = `supGrad_${uid}`
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="30" y2="30">
          <stop offset="0%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#15803d"/>
        </linearGradient>
      </defs>
      <rect width="30" height="30" rx="8" fill={`url(#${gid})`}/>
      <path d="M8 20 Q15 10 22 20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="15" cy="13" r="4" fill="white" fillOpacity="0.9"/>
      <path d="M11 22 h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="15" cy="13" r="1.5" fill={`url(#${gid})`}/>
    </svg>
  )
}

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [status, setStatus] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    fetchInfo()
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    const saved = localStorage.getItem('supplier-theme')
    if (saved) setIsDark(saved === 'dark')
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('supplier-theme', next ? 'dark' : 'light')
  }

  const fetchInfo = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/supplier/login'); return }
    const { data } = await supabase.from('suppliers').select('company_name, status').eq('id', user.id).single()
    setCompanyName(data?.company_name || '관리자')
    setStatus(data?.status || '승인')
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/supplier/login')
  }

  const t = isDark ? darkTheme : lightTheme

  const statusColor = status === '승인' ? '#22c55e' : status === '대기중' ? '#f59e0b' : '#ef4444'
  const statusBg    = status === '승인' ? 'rgba(34,197,94,0.12)' : status === '대기중' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'

  return (
    <ThemeContext.Provider value={isDark ? darkTheme : lightTheme}>
      <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, color: t.text, fontFamily: 'Noto Sans KR, sans-serif' }}>

        {/* ── 사이드바 (데스크탑) ── */}
        {!isMobile && (
          <aside style={{
            width: collapsed ? 60 : 220,
            minHeight: '100vh',
            background: isDark ? '#111827' : '#ffffff',
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,163,74,0.1)'}`,
            display: 'flex', flexDirection: 'column',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
            boxShadow: isDark ? '4px 0 20px rgba(0,0,0,0.3)' : '4px 0 20px rgba(22,163,74,0.06)',
          }}>

            {/* 로고 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '18px 14px',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,163,74,0.1)'}`,
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <SupplierLogoSVG size={32} uid="sidebar" />
                <span style={{ position: 'absolute', bottom: -2, right: -4, fontSize: 10 }}>🌾</span>
              </div>
              {!collapsed && (
                <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 900, fontSize: 13, color: t.text, margin: 0, whiteSpace: 'nowrap' }}>온종일팜</p>
                  <p style={{ fontSize: 10, color: '#22c55e', margin: 0 }}>공급업체 포털</p>
                </div>
              )}
              <button onClick={() => setCollapsed(!collapsed)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                padding: 4, borderRadius: 6, flexShrink: 0,
                transition: 'color 0.2s, transform 0.2s',
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d={collapsed ? 'M4 2l4 4-4 4' : 'M8 2L4 6l4 4'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* 업체 정보 */}
            {!collapsed && companyName && (
              <div style={{
                margin: '12px', padding: '12px',
                background: 'rgba(22,163,74,0.08)',
                borderRadius: 12,
                border: '1px solid rgba(22,163,74,0.15)',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: t.text, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {companyName}
                </p>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: statusBg, color: statusColor,
                }}>
                  {status === '승인' ? '✅ 승인됨' : status === '대기중' ? '⏳ 심사중' : '❌ 거절'}
                </span>
              </div>
            )}

            {/* 메뉴 */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {menus.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: collapsed ? '10px' : '10px 12px',
                      borderRadius: 12, marginBottom: 3,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      background: active ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'transparent',
                      color: active ? 'white' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                      fontWeight: active ? 700 : 500, fontSize: 13,
                      transition: 'all 0.2s',
                      boxShadow: active ? '0 3px 10px rgba(22,163,74,0.3)' : 'none',
                      cursor: 'pointer',
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* 하단 버튼 */}
            <div style={{ padding: 8, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,163,74,0.1)'}` }}>
              <button onClick={toggleTheme} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: 'none', border: 'none', cursor: 'pointer',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                borderRadius: 12, fontSize: 13, fontWeight: 500,
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</span>
                {!collapsed && <span>{isDark ? '라이트' : '다크'}</span>}
              </button>
              <button onClick={handleLogout} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#f87171', borderRadius: 12, fontSize: 13, fontWeight: 500,
                transition: 'all 0.2s',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {!collapsed && <span>로그아웃</span>}
              </button>
            </div>
          </aside>
        )}

        {/* ── 메인 ── */}
        <main style={{
          flex: 1,
          marginLeft: isMobile ? 0 : (collapsed ? 60 : 220),
          paddingBottom: isMobile ? 80 : 0,
          transition: 'margin-left 0.3s',
          minHeight: '100vh',
        }}>
          {/* 모바일 헤더 */}
          {isMobile && (
            <header style={{
              position: 'sticky', top: 0, zIndex: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              background: isDark ? '#111827' : '#ffffff',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,163,74,0.1)'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SupplierLogoSVG size={28} uid="mobile" />
                <div>
                  <p style={{ fontWeight: 900, fontSize: 13, color: t.text, margin: 0 }}>온종일팜</p>
                  <p style={{ fontSize: 9, color: '#22c55e', margin: 0 }}>{companyName || '공급업체 포털'}</p>
                </div>
              </div>
              <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
                {isDark ? '☀️' : '🌙'}
              </button>
            </header>
          )}
          <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {children}
          </div>
        </main>

        {/* 📖 사용 방법 고정 버튼 (모든 공급업체 화면 공통) */}
        <SupplierGuide t={t} isMobile={isMobile} />

        {/* ── 모바일 하단 탭 ── */}
        {isMobile && (
          <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: isDark ? '#111827' : '#ffffff',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,163,74,0.1)'}`,
            display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 8px)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          }}>
            {mobileMenus.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href} style={{ flex: 1, textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '8px 4px 6px',
                    background: active ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'transparent',
                    margin: '4px 3px',
                    borderRadius: 12,
                    transition: 'all 0.2s',
                    transform: active ? 'scale(1.05)' : 'scale(1)',
                  }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, marginTop: 2, color: active ? 'white' : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </nav>
        )}

      </div>
    </ThemeContext.Provider>
  )
}
