'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Category = { id: string; name: string; sort_order: number; product_count?: number }

export default function CategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [inputName, setInputName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('category_id'),
    ])
    const countMap: Record<string, number> = {}
    prods?.forEach(p => { if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1 })
    setCategories((cats || []).map(c => ({ ...c, product_count: countMap[c.id] || 0 })))
    setLoading(false)
  }

  const openAdd = () => { setEditTarget(null); setInputName(''); setError(''); setShowForm(true) }
  const openEdit = (c: Category) => { setEditTarget(c); setInputName(c.name); setError(''); setShowForm(true) }

  const handleSave = async () => {
    const name = inputName.trim()
    if (!name) return setError('카테고리명을 입력해주세요.')
    if (categories.some(c => c.name === name && c.id !== editTarget?.id))
      return setError('이미 존재하는 카테고리명입니다.')
    setSaving(true)
    if (editTarget) {
      await supabase.from('categories').update({ name }).eq('id', editTarget.id)
    } else {
      const maxOrder = categories.length ? Math.max(...categories.map(c => c.sort_order)) : 0
      await supabase.from('categories').insert({ name, sort_order: maxOrder + 1 })
    }
    setSaving(false); setShowForm(false); fetchAll()
  }

  const handleDelete = async (cat: Category) => {
    await supabase.from('categories').delete().eq('id', cat.id)
    setConfirmDelete(null); fetchAll()
  }

  const moveOrder = async (idx: number, dir: -1 | 1) => {
    const target = categories[idx]
    const swap = categories[idx + dir]
    if (!swap) return
    await Promise.all([
      supabase.from('categories').update({ sort_order: swap.sort_order }).eq('id', target.id),
      supabase.from('categories').update({ sort_order: target.sort_order }).eq('id', swap.id),
    ])
    fetchAll()
  }

  return (
    <div className="animate-fadeIn">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">카테고리 관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            쇼핑몰 상품 분류를 추가·수정·삭제·순서 변경할 수 있습니다
          </p>
        </div>
        <button onClick={openAdd}
          className="bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-green-600/20 flex items-center gap-2">
          <span>＋</span> 카테고리 추가
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: '전체 카테고리', value: categories.length, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: '🏷️' },
          { label: '상품 있음', value: categories.filter(c => (c.product_count || 0) > 0).length, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: '✅' },
          { label: '비어있음', value: categories.filter(c => (c.product_count || 0) === 0).length, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: '📭' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">불러오는 중...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🏷️</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">등록된 카테고리가 없습니다</p>
            <button onClick={openAdd} className="bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95">
              첫 카테고리 추가하기
            </button>
          </div>
        ) : (
          <div>
            <div className="hidden sm:grid grid-cols-12 px-5 py-3 border-b border-slate-100 dark:border-gray-700 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <div className="col-span-1">순서</div>
              <div className="col-span-5">카테고리명</div>
              <div className="col-span-2 text-center">상품 수</div>
              <div className="col-span-4 text-right">관리</div>
            </div>

            {categories.map((cat, idx) => (
              <div key={cat.id}
                className="flex sm:grid sm:grid-cols-12 items-center px-5 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors gap-3">

                {/* 순서 */}
                <div className="hidden sm:block col-span-1">
                  <span className="text-xs font-bold text-slate-300 dark:text-gray-600">#{idx + 1}</span>
                </div>

                {/* 이름 */}
                <div className="flex-1 sm:col-span-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    🏷️
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-white text-sm">{cat.name}</span>
                    <span className="sm:hidden ml-2 text-xs text-slate-400">#{idx + 1}</span>
                  </div>
                </div>

                {/* 상품 수 */}
                <div className="sm:col-span-2 sm:text-center">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                    ${(cat.product_count || 0) > 0
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-gray-700 text-slate-400'}`}>
                    {cat.product_count || 0}개
                  </span>
                </div>

                {/* 관리 */}
                <div className="sm:col-span-4 flex items-center justify-end gap-1">
                  <button onClick={() => moveOrder(idx, -1)} disabled={idx === 0}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-xs">
                    ▲
                  </button>
                  <button onClick={() => moveOrder(idx, 1)} disabled={idx === categories.length - 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-xs">
                    ▼
                  </button>
                  <button onClick={() => openEdit(cat)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-green-600 hover:text-green-700 border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                    수정
                  </button>
                  <button onClick={() => setConfirmDelete(cat)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {editTarget ? '카테고리 수정' : '카테고리 추가'}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700">
                ✕
              </button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">카테고리명 *</label>
              <input type="text" value={inputName}
                onChange={e => { setInputName(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="예: 고등어, 갈치, 새우..."
                autoFocus
                className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                취소
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors active:scale-95 disabled:opacity-50 shadow-md shadow-green-600/20">
                {saving ? '저장 중...' : editTarget ? '수정 완료' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <p className="text-4xl mb-3">🗑️</p>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">카테고리 삭제</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-700 dark:text-white">'{confirmDelete.name}'</strong>을 삭제할까요?
                {(confirmDelete.product_count || 0) > 0 && (
                  <span className="block mt-2 text-amber-500 font-semibold">
                    ⚠️ 상품 {confirmDelete.product_count}개가 연결돼 있습니다.
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                취소
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-bold transition-colors active:scale-95 shadow-md shadow-red-500/20">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

