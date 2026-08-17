'use client'

import type { CSSProperties } from 'react'

// 목록 페이지네이션 ‹ 1 2 3 › — 관리자/공급업체 목록 공용. 10개 단위 등.
export function Pager({ page, totalPages, onChange, dark = false }: { page: number; totalPages: number; onChange: (p: number) => void; dark?: boolean }) {
  if (totalPages <= 1) return null
  const border = dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)'
  const btn = (active: boolean, disabled?: boolean): CSSProperties => ({
    minWidth: '38px', height: '38px', padding: '0 10px', borderRadius: '9px',
    border: `2px solid ${active ? '#16a34a' : border}`,
    background: active ? '#16a34a' : (dark ? 'rgba(255,255,255,0.05)' : '#fff'),
    color: active ? '#fff' : (dark ? '#e5e7eb' : '#111'),
    fontSize: '14px', fontWeight: 800, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
    fontFamily: 'inherit',
  })
  const nums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', flexWrap: 'wrap' }}>
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} style={btn(false, page === 1)}>‹</button>
      {nums.map((n, i) => (
        <span key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && n - nums[i - 1] > 1 && <span style={{ color: dark ? 'rgba(255,255,255,0.4)' : '#999', fontWeight: 700 }}>…</span>}
          <button onClick={() => onChange(n)} style={btn(n === page)}>{n}</button>
        </span>
      ))}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={btn(false, page === totalPages)}>›</button>
    </div>
  )
}
