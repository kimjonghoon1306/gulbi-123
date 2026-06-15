'use client'

// 주문 상태 배지 (HOME·ORDERS 탭 공용) — mypage에서 분리, 동일
const STATUS_STEP: Record<string, number> = { '입금대기': -1, '입금완료': 0, '접수': 0, '준비중': 1, '출고': 2, '완료': 3 }
const STATUS_ICON = ['📋', '📦', '🚚', '✅']

export function OrderBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    '입금대기':{ bg:'rgba(249,115,22,0.12)', color:'#f97316' },
    '입금완료':{ bg:'rgba(59,130,246,0.12)', color:'#3b82f6' },
    '접수':  { bg:'rgba(59,130,246,0.12)',   color:'#3b82f6' },
    '준비중':{ bg:'rgba(245,158,11,0.12)',   color:'#f59e0b' },
    '출고':  { bg:'rgba(13,148,136,0.12)',  color:'#0d9488' },
    '완료':  { bg:'rgba(34,197,94,0.12)',   color:'#22c55e' },
    '취소':  { bg:'rgba(239,68,68,0.12)',   color:'#ef4444' },
  }
  const s = styles[status] || styles['접수']
  const step = STATUS_STEP[status] || 0
  return (
    <span style={{ fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'20px', background:s.bg, color:s.color, flexShrink:0 }}>
      {STATUS_ICON[step]} {status}
    </span>
  )
}
