'use client'

import type { Dispatch, SetStateAction } from 'react'
import { sanitizeHtml } from '@/lib/sanitize-html'

type Category = { id: string; name: string; sort_order: number }
type SupplierProduct = {
  id: string; name: string; description: string
  category_id: string; image_url: string; unit: string; stock: number
  suggested_wholesale_price: number; suggested_retail_price: number
  wholesale_price: number; retail_price: number; member_price: number
  approval_status: string; supplier_id: string; is_active: boolean; created_at: string
  suppliers?: { company_name: string; contact: string }
}
type ReviewForm = {
  name: string; wholesale_price: string; retail_price: string; member_price: string
  category_id: string; unit: string; stock: string; description: string
}

type Props = {
  reviewProduct: SupplierProduct | null
  setReviewProduct: Dispatch<SetStateAction<SupplierProduct | null>>
  reviewForm: ReviewForm
  setReviewForm: Dispatch<SetStateAction<ReviewForm>>
  categories: Category[]
  showRejectInput: boolean
  setShowRejectInput: Dispatch<SetStateAction<boolean>>
  rejectReason: string
  setRejectReason: Dispatch<SetStateAction<string>>
  reviewLoading: boolean
  handleApprove: () => Promise<void>
  handleReject: () => Promise<void>
  handleRequestRevision: () => Promise<void>
}

export default function SupplierReviewModal({
  reviewProduct,
  setReviewProduct,
  reviewForm,
  setReviewForm,
  categories,
  showRejectInput,
  setShowRejectInput,
  rejectReason,
  setRejectReason,
  reviewLoading,
  handleApprove,
  handleReject,
  handleRequestRevision,
}: Props) {
  if (!reviewProduct) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden" style={{ maxWidth: '1000px', maxHeight: '90vh', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

        {/* 왼쪽: 상품 정보 + 수정 */}
        <div className="flex-1 md:overflow-y-auto p-6 flex flex-col gap-4 md:border-r md:border-black/[0.08]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800 dark:text-white">🔍 상품 검토</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>공급업체: {(reviewProduct.suppliers as any)?.company_name || '-'}</span>
              <span>·</span>
              <span>{(reviewProduct.suppliers as any)?.contact || '-'}</span>
            </div>
          </div>

          {/* 이미지 */}
          {reviewProduct.image_url && (
            <div className="w-full rounded-2xl overflow-hidden bg-slate-100" style={{ maxHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={reviewProduct.image_url} alt="" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }} />
            </div>
          )}

          {/* 공급가 표시 */}
          <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
            <p className="font-bold text-purple-400 mb-1">💡 공급업체 공급가 (참고용)</p>
            <p className="text-slate-400">
              도매 {reviewProduct.suggested_wholesale_price?.toLocaleString()}원
              {' · '}소매 {reviewProduct.suggested_retail_price?.toLocaleString()}원
            </p>
          </div>

          {/* 수정 가능 필드들 */}
          {[
            { label: '상품명', key: 'name', type: 'text', full: true },
            { label: '일반 구매가 (원)', key: 'retail_price', type: 'number' },
            { label: '소매 공급가 (원)', key: 'member_price', type: 'number' },
            { label: '도매 공급가 (원)', key: 'wholesale_price', type: 'number' },
            { label: '재고', key: 'stock', type: 'number' },
          ].map(f => (
            <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : undefined }}>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">{f.label}</label>
              <input type={f.type} value={(reviewForm as any)[f.key]}
                onChange={e => setReviewForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-400" />
            </div>
          ))}

          {/* 카테고리 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">카테고리</label>
            <select value={reviewForm.category_id}
              onChange={e => setReviewForm(p => ({ ...p, category_id: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none">
              <option value="">카테고리 없음</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* 단위 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">단위</label>
            <select value={reviewForm.unit}
              onChange={e => setReviewForm(p => ({ ...p, unit: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none">
              {['kg', 'g', '박스', '마리', '개', '묶음'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* 오른쪽: 상세페이지 미리보기 + 버튼 */}
        <div className="flex flex-col w-full md:w-[360px] md:flex-shrink-0">
          {/* 상세페이지 미리보기 */}
          <div className="min-h-[220px] md:flex-1" style={{ overflowY: 'auto', background: '#f0f0f0', padding: '12px', display: 'flex', justifyContent: 'center' }}>
            {reviewProduct.description ? (
              <div style={{ width: '100%', maxWidth: '320px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                {reviewProduct.image_url && (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={reviewProduct.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(reviewProduct.description) }}
                  style={{ pointerEvents: 'none', userSelect: 'none', fontSize: '12px' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '32px' }}>📄</p>
                <p style={{ color: '#94a3b8', fontSize: '12px' }}>상세페이지 없음</p>
              </div>
            )}
          </div>

          {/* 거절/수정요청 사유 입력 */}
          {showRejectInput && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(239,68,68,0.04)' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>거절/수정요청 사유 *</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                placeholder="공급업체에게 전달할 사유를 입력해주세요"
                style={{ width: '100%', background: 'white', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#1a1a1a', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button onClick={handleReject} disabled={!rejectReason.trim() || reviewLoading}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: !rejectReason.trim() || reviewLoading ? 0.5 : 1 }}>
                  ❌ 거절 확정
                </button>
                <button onClick={handleRequestRevision} disabled={!rejectReason.trim() || reviewLoading}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: !rejectReason.trim() || reviewLoading ? 0.5 : 1 }}>
                  ✏️ 수정요청
                </button>
              </div>
            </div>
          )}

          {/* 버튼 영역 */}
          <div style={{ padding: '16px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
            <button onClick={handleApprove} disabled={reviewLoading}
              style={{ padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #34d399, #10b981)', color: 'white', fontSize: '14px', fontWeight: 800, boxShadow: '0 4px 16px rgba(52,211,153,0.35)', opacity: reviewLoading ? 0.6 : 1 }}>
              {reviewLoading ? '처리 중...' : '✅ 승인하기'}
            </button>
            <button onClick={() => setShowRejectInput(v => !v)}
              style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              ❌ 거절 / ✏️ 수정요청
            </button>
            <button onClick={() => setReviewProduct(null)}
              style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
