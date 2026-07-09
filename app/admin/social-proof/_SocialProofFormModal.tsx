'use client'

import type { Dispatch, SetStateAction } from 'react'

type Comment = {
  id: string
  author: string
  content: string
  rating: number
  avatar_color: string
  avatar_color2: string
  created_label: string
  is_active: boolean
  sort_order: number
  product_id: string | null
}

type Product = { id: string; name: string; image_url: string }

type FormState = {
  author: string
  content: string
  rating: number
  avatar_color: string
  avatar_color2: string
  created_label: string
  is_active: boolean
  sort_order: number
  product_id: string | null
}

type Props = {
  showForm: boolean
  setShowForm: Dispatch<SetStateAction<boolean>>
  editItem: Comment | null
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
  products: Product[]
  timeLabels: string[]
  avatarPresets: string[][]
  save: () => Promise<void>
}

export default function SocialProofFormModal({
  showForm,
  setShowForm,
  editItem,
  form,
  setForm,
  products,
  timeLabels,
  avatarPresets,
  save,
}: Props) {
  if (!showForm) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editItem ? '후기 수정' : '후기 추가'}</h2>
          <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">

          {/* 상품 선택 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">적용 상품</label>
            <select
              value={form.product_id || ''}
              onChange={e => setForm({...form, product_id: e.target.value || null})}
              className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400">
              <option value="">🌐 전체 상품 공통 (선택 안 함)</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              {form.product_id ? '선택한 상품 상세페이지에만 표시됩니다' : '모든 상품 상세페이지에 표시됩니다'}
            </p>
          </div>

          {/* 아바타 컬러 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">아바타 색상</label>
            <div className="flex gap-2">
              {avatarPresets.map(([c1,c2]) => (
                <button key={c1} onClick={() => setForm({...form,avatar_color:c1,avatar_color2:c2})}
                  style={{background:`linear-gradient(135deg,${c1},${c2})`}}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${form.avatar_color===c1 ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">작성자 이름</label>
            <input value={form.author} onChange={e => setForm({...form,author:e.target.value})} placeholder="예) 김민준"
              className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">후기 내용</label>
            <textarea value={form.content} onChange={e => setForm({...form,content:e.target.value})} rows={4} placeholder="후기 내용을 입력하세요"
              className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">별점</label>
              <select value={form.rating} onChange={e => setForm({...form,rating:Number(e.target.value)})}
                className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400">
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{'⭐'.repeat(r)} {r}점</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">작성 시간</label>
              <select value={form.created_label} onChange={e => setForm({...form,created_label:e.target.value})}
                className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400">
                {timeLabels.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-500">표시 여부</label>
            <button onClick={() => setForm({...form,is_active:!form.is_active})}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.is_active ? 'bg-green-600' : 'bg-slate-300 dark:bg-gray-600'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.is_active ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
          <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 text-sm font-medium">취소</button>
          <button onClick={save} className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95" style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)'}}>
            {editItem ? '수정 완료' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}
