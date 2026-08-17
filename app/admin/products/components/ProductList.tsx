'use client'

import { useState, useEffect } from 'react'
import { Pager } from '@/app/components/Pager'

type Category = { id: string; name: string; sort_order: number }
type Product = {
  id: string; name: string; description: string
  origin?: string | null
  category_id: string; wholesale_price: number; member_price: number; retail_price: number
  stock: number; unit: string; weight?: number | null; image_url: string; is_active: boolean; is_taxable: boolean
}

type Props = {
  products: Product[]
  categories: Category[]
  loading: boolean
  onEdit: (p: Product) => void
  onDelete: (id: string) => void
  onRemake: (p: Product) => void
}

const PER = 10

export default function ProductList({
  products, categories, loading, onEdit, onDelete, onRemake
}: Props) {
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || '-'
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(products.length / PER))
  const pg = Math.min(page, totalPages)
  const paged = products.slice((pg - 1) * PER, pg * PER)
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [totalPages, page])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">불러오는 중...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">
              <p className="text-4xl mb-3">🧺</p>
              <p className="text-sm">등록된 상품이 없습니다</p>
            </div>
          ) : (
            <>
              {/* PC: 테이블 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-gray-700">
                      {['상품명', '카테고리', '도매 공급가', '일반 구매가', '재고', '단위', '상태', ''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 px-5 py-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(p => (
                      <tr key={p.id} className="border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{p.name}</p>
                          {p.origin && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">원산지 {p.origin}</p>}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{getCatName(p.category_id)}</td>
                        <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{p.wholesale_price.toLocaleString()}원</td>
                        <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{p.retail_price.toLocaleString()}원</td>
                        <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{p.stock}</td>
                        <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{p.unit}{p.weight != null && Number(p.weight) > 0 ? ` · ${Number(p.weight)}${p.unit}` : ''}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-gray-700 text-slate-400'}`}>
                            {p.is_active ? '판매중' : '숨김'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => onRemake(p)} className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">📄 상세</button>
                            <button onClick={() => onEdit(p)} className="text-xs text-green-600 hover:text-green-700 font-medium">수정</button>
                            <button onClick={() => onDelete(p.id)} className="text-xs text-red-400 hover:text-red-500 font-medium">삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* 모바일: 카드형 */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-gray-700">
                {paged.map(p => (
                  <div key={p.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{p.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${p.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-gray-700 text-slate-400'}`}>
                          {p.is_active ? '판매중' : '숨김'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{getCatName(p.category_id)} · {p.stock}{p.unit}{p.weight != null && Number(p.weight) > 0 ? ` · 중량 ${Number(p.weight)}${p.unit}` : ''}</p>
                      {p.origin && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">원산지 {p.origin}</p>}
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-0.5">도매 공급가 {p.wholesale_price.toLocaleString()}원 / 일반 구매가 {p.retail_price.toLocaleString()}원</p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => onRemake(p)} className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-lg">📄 상세</button>
                      <button onClick={() => onEdit(p)} className="text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold px-3 py-1.5 rounded-lg">수정</button>
                      <button onClick={() => onDelete(p.id)} className="text-xs bg-red-50 dark:bg-red-900/30 text-red-400 font-bold px-3 py-1.5 rounded-lg">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <Pager page={pg} totalPages={totalPages} onChange={setPage} dark={typeof document !== 'undefined' && document.documentElement.classList.contains('dark')} />
              </div>
            </>
          )}
    </div>
  )
}
