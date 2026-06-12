import Link from 'next/link'
import { brand, gradient, surface } from '@/lib/theme'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: surface.light.bg, padding: 20, fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 80, marginBottom: 12 }}>🧺</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: brand.green900, margin: '0 0 8px' }}>페이지를 찾을 수 없어요</h1>
        <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
          주소가 바뀌었거나 사라진 페이지예요.<br />아래 버튼으로 쇼핑몰로 돌아가 주세요.
        </p>
        <Link href="/shop" style={{
          display: 'inline-block', padding: '14px 30px', borderRadius: 100,
          background: gradient.greenBtn, color: '#fff', fontWeight: 800, fontSize: 15,
          textDecoration: 'none', boxShadow: '0 8px 22px rgba(22,163,74,0.3)',
        }}>🛒 쇼핑몰로 가기</Link>
      </div>
    </div>
  )
}
