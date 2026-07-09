'use client'

import type { Dispatch, SetStateAction } from 'react'

type SupplierProduct = {
  id: string; name: string; description: string
  category_id: string; image_url: string; unit: string; stock: number
  suggested_wholesale_price: number; suggested_retail_price: number
  wholesale_price: number; retail_price: number; member_price: number
  approval_status: string; supplier_id: string; is_active: boolean; created_at: string
  suppliers?: { company_name: string; contact: string }
}

type Props = {
  loading: boolean
  approvalFilter: '대기중' | '승인' | '거절' | '수정요청'
  setApprovalFilter: Dispatch<SetStateAction<'대기중' | '승인' | '거절' | '수정요청'>>
  supplierProducts: SupplierProduct[]
  filteredSupplierProducts: SupplierProduct[]
  statusStyle: Record<string, { bg: string; color: string }>
  openReview: (p: SupplierProduct) => void
}

export default function SupplierApprovalTab({
  loading,
  approvalFilter,
  setApprovalFilter,
  supplierProducts,
  filteredSupplierProducts,
  statusStyle,
  openReview,
}: Props) {
  return (
    <div>
      {/* 상태 필터 */}
      <div className="flex gap-2 mb-4">
        {(['대기중', '승인', '거절', '수정요청'] as const).map(s => (
          <button key={s} onClick={() => setApprovalFilter(s)}
            style={{
              padding: '8px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
              background: approvalFilter === s ? statusStyle[s].bg : 'transparent',
              color: approvalFilter === s ? statusStyle[s].color : '#94a3b8',
              boxShadow: approvalFilter === s ? '0 0 0 1px ' + statusStyle[s].color + '40' : 'none',
            }}>
            {s} ({supplierProducts.filter(p => p.approval_status === s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSupplierProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-400 text-sm">{approvalFilter} 상태의 공급업체 상품이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredSupplierProducts.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 hover:border-amber-400/50 transition-colors cursor-pointer"
              onClick={() => openReview(p)}>
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
                {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🧺</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{p.name}</p>
                  <span style={{ ...statusStyle[p.approval_status], padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                    {p.approval_status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  공급업체: {(p.suppliers as any)?.company_name || '-'}
                  {' · '}도매 공급가 {p.suggested_wholesale_price?.toLocaleString()}원
                  {' · '}소매 공급가 {p.suggested_retail_price?.toLocaleString()}원
                </p>
                <p className="text-xs text-slate-300 dark:text-slate-500 mt-0.5">
                  등록일 {new Date(p.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div className="text-slate-300 dark:text-slate-600 text-lg flex-shrink-0">›</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
