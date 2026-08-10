export default function ShopLoading() {
  const skeleton = '#e7ece8'

  return (
    <main style={{ minHeight: '100vh', background: '#f5f8f5', color: '#0f172a', fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <header style={{ height: 68, background: 'rgba(245,248,245,0.96)', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: '#166534' }} />
          <div style={{ width: 86, height: 16, borderRadius: 6, background: skeleton }} />
          <div style={{ flex: 1, maxWidth: 520, height: 42, margin: '0 auto', borderRadius: 14, background: skeleton }} />
        </div>
      </header>

      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>
        <div style={{ minHeight: 'clamp(180px,36vw,480px)', borderRadius: 18, background: skeleton }} />
      </div>

      <section style={{ padding: '28px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ width: 120, height: 24, borderRadius: 6, background: skeleton, marginBottom: 12 }} />
          <div style={{ width: 'min(520px, 85%)', height: 38, borderRadius: 8, background: skeleton, marginBottom: 10 }} />
          <div style={{ width: 'min(390px, 70%)', height: 18, borderRadius: 6, background: skeleton }} />
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 20px 120px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflow: 'hidden' }}>
          {[0, 1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: 64, height: 82, borderRadius: 16, background: skeleton, flexShrink: 0 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} style={{ height: 320, borderRadius: 16, background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }} />)}
        </div>
      </section>
    </main>
  )
}
