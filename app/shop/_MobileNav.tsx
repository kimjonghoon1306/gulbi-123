'use client'

import Link from 'next/link'

// 쇼핑몰 모바일 하단 네비 — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  headerBg: string
  border: string
  gtext: string
  sub: string
  dark: boolean
  setDark: (v: boolean) => void
  cartCount: number
  user: any
  handleLogout: () => void
}

export function MobileNav({ headerBg, border, gtext, sub, dark, setDark, cartCount, user, handleLogout }: Props) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: headerBg, backdropFilter: 'blur(24px)',
      borderTop: `1px solid ${border}`,
      padding: '10px 0 24px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 40, boxShadow: '0 -8px 32px rgba(0,0,0,0.08)'
    }} className="mobile-nav">

      {/* 홈 */}
      <Link href="/shop" className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: gtext, flex: 1 }}>
        <span style={{ fontSize: '24px' }}>🏠</span>
        <span style={{ fontSize: '10px', fontWeight: 800 }}>홈</span>
      </Link>

      {/* 장바구니 */}
      <Link href="/shop/cart" className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: gtext, flex: 1 }}>
        <span style={{ fontSize: '24px', position: 'relative' }}>
          🛒
          {cartCount > 0 && (
            <span style={{ position: 'absolute', top: '-4px', right: '-10px', minWidth: '16px', height: '16px', padding: '0 4px', borderRadius: '8px', background: '#ec4899', color: 'white', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, boxSizing: 'border-box' }}>
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 800 }}>장바구니</span>
      </Link>

      {/* 테마 */}
      <button onClick={() => setDark(!dark)} className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: sub, flex: 1 }}>
        <span style={{ fontSize: '24px' }}>{dark ? '🌙' : '☀️'}</span>
        <span style={{ fontSize: '10px', fontWeight: 700 }}>테마</span>
      </button>

      {/* 마이페이지 / 로그인 */}
      {user ? (
        <Link href="/shop/mypage" className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: gtext, flex: 1 }}>
          <span style={{ fontSize: '24px' }}>👤</span>
          <span style={{ fontSize: '10px', fontWeight: 800 }}>마이</span>
        </Link>
      ) : (
        <Link href="/shop/login" className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: sub, flex: 1 }}>
          <span style={{ fontSize: '24px' }}>👤</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>로그인</span>
        </Link>
      )}

      {/* 로그아웃 (로그인 시에만) */}
      {user ? (
        <button onClick={handleLogout} className="nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: sub, flex: 1 }}>
          <span style={{ fontSize: '24px' }}>🚪</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>로그아웃</span>
        </button>
      ) : (
        <div style={{ flex: 1 }} />
      )}
    </div>
  )
}
