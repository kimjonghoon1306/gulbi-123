// 판매자 책임 고지 (KG이니시스 심사 요구 문구)
// 상품 상세 / 주문·결제 모달 / 이용약관 등 여러 곳에서 재사용.
export function SellerNotice({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const bg = dark ? '#14251b' : '#f8fafc'
  const border = dark ? '#2a5738' : '#e2e8f0'
  const text = dark ? '#cbd5e1' : '#475569'
  const strong = dark ? '#f1f5f9' : '#0f172a'
  const accent = dark ? '#4ade80' : '#15803d'
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '14px',
        padding: compact ? '13px 15px' : '16px 18px',
        fontSize: compact ? '12.5px' : '13.5px',
        color: text,
        lineHeight: 1.75,
        margin: compact ? '0' : '0 auto',
        maxWidth: compact ? undefined : '760px',
        width: '100%',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <div>
        <p style={{ margin: '0 0 3px', fontWeight: 800, color: strong }}>판매자 고지</p>
        모든 거래에 대한 책임과 배송·교환·환불 민원 등의 처리는{' '}
        <strong style={{ color: strong }}>주식회사 유안에프앤비</strong>에서 진행합니다.<br />
        자세한 문의는{' '}
        <a href="mailto:tarry9653@daum.net" style={{ color: accent, fontWeight: 700, textDecoration: 'none' }}>tarry9653@daum.net</a>
        {' '}또는 유선{' '}
        <a href="tel:010-7432-3888" style={{ color: accent, fontWeight: 700, textDecoration: 'none' }}>010-7432-3888</a>
        {' '}으로 가능합니다.
      </div>
    </div>
  )
}
