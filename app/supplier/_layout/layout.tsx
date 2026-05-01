'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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

  useEffect(() => { fetchInfo() }, [])

  const fetchInfo = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/supplier/login'); return }
    const { data } = await supabase
      .from('suppliers')
      .select('company_name, status')
      .eq('id', user.id)
      .single()
    // suppliers에 없으면 관리자 → 그냥 통과
    setCompanyName(data?.company_name || '관리자')
    setStatus(data?.status || '승인')
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/supplier/login')
  }

  const badgeStyle: Record<string, React.CSSProperties> = {
    '승인':   { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' },
    '대기중': { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' },
    '거절':   { background: 'rgba(239,68,68,0.15)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
  }
  const badgeLabel: Record<string, string> = { '승인': '승인됨', '대기중': '심사중', '거절': '거절됨' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1117', color: 'white' }}>

      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 40,
        width: collapsed ? '72px' : '220px',
        background: '#161b22',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      }}>

        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
          }}>🏭</div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: 'white', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                color: active ? '#f59e0b' : 'rgba(255,255,255,0.4)',
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{menu.icon}</span>
                {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>{menu.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button onClick={() => setCollapsed(v => !v)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '10px', border: 'none',
            background: 'transparent', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '13px',
          }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{collapsed ? '▶' : '◀'}</span>
            {!collapsed && <span style={{ fontWeight: 500 }}>접기</span>}
          </button>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '10px', border: 'none',
            background: 'transparent', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', fontSize: '13px',
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
  )
}
