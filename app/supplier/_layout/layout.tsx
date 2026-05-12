'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ThemeContext, darkTheme, lightTheme } from './theme-context'

const menus = [
  { href: '/supplier/dashboard', icon: '⚡', label: '대시보드' },
  { href: '/supplier/products',  icon: '📦', label: '상품 관리' },
]

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

  const t = {
    bg:        isDark ? '#0d1117' : '#f4f6f9',
    sidebar:   isDark ? '#161b22' : '#ffffff',
    border:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    text:      isDark ? 'white' : '#1a1a2e',
    textMuted: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    textRed:   isDark ? 'rgba(239,68,68,0.7)' : '#ef4444',
  }

  const ThemeBtn = () => (
    <button onClick={toggleTheme} title="테마 전환" style={{
      width: '34px', height: '34px', borderRadius: '10px', border: `1px solid ${t.border}`,
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      cursor: 'pointer', fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {isDark ? '☀️' : '🌙'}
    </button>
  )

  const badgeStyle: Record<string, React.CSSProperties> = {
    '승인':   { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' },
    '대기중': { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' },
    '거절':   { background: 'rgba(239,68,68,0.15)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
  }
  const badgeLabel: Record<string, string> = { '승인': '승인됨', '대기중': '심사중', '거절': '거절됨' }

  // ── 모바일: 상단 헤더 + 하단 탭바 ──────────────────────────────
  if (isMobile) {
    return (
      <ThemeContext.Provider value={isDark ? darkTheme : lightTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: t.bg, color: t.text }}>

        {/* 모바일 상단 헤더 */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: '56px',
          background: isDark ? 'rgba(22,27,34,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
            }}>🏭</div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: t.text, margin: 0, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {companyName || '공급업체'}
              </p>
              {status && (
                <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 7px', borderRadius: '20px', display: 'inline-block', ...(badgeStyle[status] || {}) }}>
                  {badgeLabel[status] || status}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeBtn />
            <button onClick={handleLogout} style={{
              padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.25)',
              background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>로그아웃</button>
          </div>
        </header>

        {/* 컨텐츠 */}
        <main style={{ flex: 1, paddingTop: '56px', paddingBottom: '72px', minHeight: '100vh' }}>
          {children}
        </main>

        {/* 모바일 하단 탭바 */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          height: '64px',
          background: isDark ? 'rgba(22,27,34,0.97)' : 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          borderTop: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {menus.map(menu => {
            const active = pathname === menu.href
            return (
              <Link key={menu.href} href={menu.href} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', textDecoration: 'none',
                color: active ? '#f59e0b' : t.textMuted,
                position: 'relative',
                transition: 'color 0.2s',
              }}>
                {active && (
                  <div style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
                    background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                    borderRadius: '0 0 4px 4px',
                  }} />
                )}
                <span style={{ fontSize: '22px', lineHeight: 1 }}>{menu.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500 }}>{menu.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
      </ThemeContext.Provider>
    )
  }

  // ── 데스크톱/태블릿: 사이드바 ──────────────────────────────────
  return (
    <ThemeContext.Provider value={isDark ? darkTheme : lightTheme}>
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, color: t.text }}>

      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 40,
        width: collapsed ? '72px' : '220px',
        background: t.sidebar,
        borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        boxShadow: isDark ? '4px 0 24px rgba(0,0,0,0.4)' : '4px 0 24px rgba(0,0,0,0.08)',
      }}>

        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
          }}>🏭</div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: t.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {companyName || '공급업체'}
              </p>
              {status && (
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', marginTop: '4px', display: 'inline-block', ...(badgeStyle[status] || {}) }}>
                  {badgeLabel[status] || status}
                </span>
              )}
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menus.map(menu => {
            const active = pathname === menu.href
            return (
              <Link key={menu.href} href={menu.href} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '10px',
                textDecoration: 'none', transition: 'all 0.2s',
                background: active ? 'rgba(245,158,11,0.15)' : 'transparent',
                border: `1px solid ${active ? 'rgba(245,158,11,0.25)' : 'transparent'}`,
                color: active ? '#f59e0b' : t.textMuted,
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{menu.icon}</span>
                {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>{menu.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button onClick={toggleTheme} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '10px', border: 'none',
            background: 'transparent', color: t.textMuted, cursor: 'pointer', fontSize: '13px',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{isDark ? '☀️' : '🌙'}</span>
            {!collapsed && <span style={{ fontWeight: 500 }}>{isDark ? '라이트 모드' : '다크 모드'}</span>}
          </button>
          <button onClick={() => setCollapsed(v => !v)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '10px', border: 'none',
            background: 'transparent', color: t.textMuted, cursor: 'pointer', fontSize: '13px',
          }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{collapsed ? '▶' : '◀'}</span>
            {!collapsed && <span style={{ fontWeight: 500 }}>접기</span>}
          </button>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '10px', border: 'none',
            background: 'transparent', color: t.textRed, cursor: 'pointer', fontSize: '13px',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>🚪</span>
            {!collapsed && <span style={{ fontWeight: 500 }}>로그아웃</span>}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: collapsed ? '72px' : '220px', minHeight: '100vh', transition: 'margin-left 0.3s ease' }}>
        {children}
      </main>
    </div>
    </ThemeContext.Provider>
  )
}
