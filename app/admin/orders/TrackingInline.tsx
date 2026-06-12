'use client'

import { useState } from 'react'
import { COURIERS } from '@/lib/tracking'

// 주문 카드에 바로 보이는 택배사/송장 입력 (모달 없이 인라인)
export default function TrackingInline({
  courierCode, trackingNumber, color, onSave,
}: {
  courierCode?: string | null
  trackingNumber?: string | null
  color: string
  onSave: (courier: string, tracking: string) => Promise<void>
}) {
  const [courier, setCourier] = useState(courierCode || '')
  const [tracking, setTracking] = useState(trackingNumber || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const sel = 'border border-slate-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none'

  return (
    <div className="mt-3 pt-3 border-t border-slate-50 dark:border-gray-700" onClick={e => e.stopPropagation()}>
      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">🚚 택배사 / 송장번호</p>
      <div className="flex gap-1.5">
        <select value={courier} onChange={e => { setCourier(e.target.value); setSaved(false) }} className={`${sel} w-24 flex-shrink-0`}>
          <option value="">택배사</option>
          {COURIERS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <input value={tracking} onChange={e => { setTracking(e.target.value); setSaved(false) }}
          placeholder="송장번호" className={`${sel} flex-1 min-w-0`} />
        <button
          onClick={async () => { setSaving(true); await onSave(courier, tracking); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          disabled={saving}
          className="px-3 py-2 rounded-lg text-xs font-bold text-white flex-shrink-0"
          style={{ background: saved ? '#16a34a' : color }}>
          {saving ? '...' : saved ? '✓ 저장' : '저장'}
        </button>
      </div>
    </div>
  )
}
