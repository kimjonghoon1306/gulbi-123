'use client'

import type { Dispatch, SetStateAction } from 'react'

type CouponForm = {
  code: string
  description: string
  discount_type: 'percent' | 'amount'
  discount_value: string
  min_amount: string
  max_discount: string
  usage_limit: string
  expires_at: string
}

type Props = {
  showForm: boolean
  setShowForm: Dispatch<SetStateAction<boolean>>
  form: CouponForm
  setForm: Dispatch<SetStateAction<CouponForm>>
  saving: boolean
  genCode: () => void
  save: () => Promise<void>
}

export default function CouponFormModal({
  showForm,
  setShowForm,
  form,
  setForm,
  saving,
  genCode,
  save,
}: Props) {
  if (!showForm) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">🎟️ 쿠폰 발급</h2>
          <button onClick={() => setShowForm(false)} className="text-slate-400 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">쿠폰 코드 *</label>
            <div className="flex gap-2">
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="예: WELCOME10" className="flex-1 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white uppercase" />
              <button onClick={genCode} className="px-3 py-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 whitespace-nowrap">자동생성</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">쿠폰 이름/설명</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="예: 첫 구매 감사 쿠폰" className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">할인 방식</label>
              <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))}
                className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white">
                <option value="percent">정률(%)</option>
                <option value="amount">정액(원)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{form.discount_type === 'percent' ? '할인율(%)' : '할인액(원)'} *</label>
              <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                placeholder={form.discount_type === 'percent' ? '10' : '5000'} className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
            </div>
          </div>
          {form.discount_type === 'percent' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">최대 할인액(원) <span className="font-normal">선택</span></label>
              <input type="number" value={form.max_discount} onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))}
                placeholder="예: 10000 (비우면 무제한)" className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">최소 주문금액 <span className="font-normal">선택</span></label>
              <input type="number" value={form.min_amount} onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))}
                placeholder="0" className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">사용 횟수 제한 <span className="font-normal">선택</span></label>
              <input type="number" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))}
                placeholder="비우면 무제한" className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">만료일 <span className="font-normal">선택</span></label>
            <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
          </div>
          <button onClick={save} disabled={saving}
            className="w-full py-3.5 rounded-xl text-white font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
            {saving ? '발급 중...' : '쿠폰 발급하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
