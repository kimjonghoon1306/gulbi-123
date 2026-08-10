'use client'

import type { Dispatch, SetStateAction } from 'react'

type Product = {
  id: string; name: string; description: string
  origin?: string | null
  category_id: string; suggested_wholesale_price: number; suggested_retail_price: number
  wholesale_price: number; retail_price: number
  stock: number; unit: string; image_url: string
  approval_status: string; rejection_reason?: string; created_at: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  '대기중':   { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', label: '⏳ 대기중' },
  '승인':     { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', label: '✅ 승인' },
  '거절':     { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', label: '❌ 거절' },
  '수정요청': { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', label: '✏️ 수정요청' },
}

type Props = {
  t: any
  products: Product[]
  supplierStatus: string
  setShowForm: Dispatch<SetStateAction<boolean>>
  openEdit: (p: Product) => void
  handleDelete: (id: string) => Promise<void>
  onRemake: (p: Product) => void
}

export default function SupplierProductList({
  t,
  products,
  supplierStatus,
  setShowForm,
  openEdit,
  handleDelete,
  onRemake,
}: Props) {
  return products.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: t.card, borderRadius: '20px', border: `1px solid ${t.border}` }}>
      <p style={{ fontSize: '40px', marginBottom: '12px' }}>📦</p>
      <p style={{ color: t.textMuted, fontSize: '14px', margin: '0 0 16px' }}>등록된 상품이 없습니다</p>
      {supplierStatus === '승인' && (
        <button onClick={() => setShowForm(true)}
          style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(245,158,11,0.25)', cursor: 'pointer' }}>
          + 첫 상품 등록하기
        </button>
      )}
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {products.map(p => {
        const s = STATUS_STYLE[p.approval_status] || STATUS_STYLE['대기중']
        return (
          <div key={p.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0, overflow: 'hidden', background: t.input, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '22px' }}>🧺</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: t.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', flexShrink: 0, background: s.bg, color: s.color }}>{s.label}</span>
              </div>
              <p style={{ fontSize: '11px', color: t.textMuted, margin: 0 }}>
                도매 공급가 {p.suggested_wholesale_price?.toLocaleString()}원
                {p.wholesale_price > 0 && <span style={{ color: '#34d399', marginLeft: '6px' }}>→ 도매 공급가 {p.wholesale_price.toLocaleString()}원</span>}
                {p.stock > 0 && <span style={{ marginLeft: '8px' }}>재고 {p.stock}{p.unit}</span>}
              </p>
              {p.origin && <p style={{ fontSize: '11px', color: t.textMuted, margin: '3px 0 0' }}>원산지 {p.origin}</p>}
              {(p.approval_status === '거절' || p.approval_status === '수정요청') && p.rejection_reason && (
                <p style={{ fontSize: '11px', color: p.approval_status === '거절' ? '#f87171' : '#818cf8', margin: '4px 0 0', fontWeight: 600 }}>
                  💬 {p.rejection_reason}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => onRemake(p)} title="AI 상세페이지 다시 만들기 / 수정"
                style={{ padding: '7px 12px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}>📄 {p.description ? '상세 수정' : '상세 만들기'}</button>
              <button onClick={() => openEdit(p)}
                style={{ padding: '7px 12px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.input, color: t.textMuted, fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>수정</button>
              <button onClick={() => handleDelete(p.id)}
                style={{ padding: '7px 12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>삭제</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
