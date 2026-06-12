'use client'

type Category = { id: string; name: string; sort_order: number }
type Product = {
  id: string; name: string; description: string
  category_id: string; wholesale_price: number; member_price: number; retail_price: number
  stock: number; unit: string; image_url: string; is_active: boolean; is_taxable: boolean
}

type Props = {
  tab: 'products' | 'categories'
  setTab: (t: 'products' | 'categories') => void
  products: Product[]
  categories: Category[]
  loading: boolean
  onEdit: (p: Product) => void
  onDelete: (id: string) => void
  onEditCat: (c: Category) => void
  onDeleteCat: (id: string) => void
  onAddCat: () => void
}

export default function ProductList({
  tab, setTab, products, categories, loading,
  onEdit, onDelete, onEditCat, onDeleteCat, onAddCat
}: Props) {
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || '-'

  return (
    <>
      <div className="flex gap-2 mb-6">
        {[{ key: 'products', label: '🧺 상품 목록' }, { key: 'categories', label: '📂 카테고리 관리' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${tab === t.key ? 'bg-green-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 border border-slate-100 dark:border-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && (
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
                      {['상품명', '카테고리', '도매가', '소매가', '재고', '단위', '상태', ''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 px-5 py-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-5 py-4 text-sm font-medium text-slate-800 dark:text-white">{p.name}</td>
                        <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{getCatName(p.category_id)}</td>
                        <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{p.wholesale_price.toLocaleString()}원</td>
                        <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{p.retail_price.toLocaleString()}원</td>
                        <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{p.stock}</td>
                        <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{p.unit}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-gray-700 text-slate-400'}`}>
                            {p.is_active ? '판매중' : '숨김'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
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
                {products.map(p => (
                  <div key={p.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{p.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${p.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-gray-700 text-slate-400'}`}>
                          {p.is_active ? '판매중' : '숨김'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{getCatName(p.category_id)} · {p.stock}{p.unit}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-0.5">도매 {p.wholesale_price.toLocaleString()}원 / 소매 {p.retail_price.toLocaleString()}원</p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => onEdit(p)} className="text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold px-3 py-1.5 rounded-lg">수정</button>
                      <button onClick={() => onDelete(p.id)} className="text-xs bg-red-50 dark:bg-red-900/30 text-red-400 font-bold px-3 py-1.5 rounded-lg">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={onAddCat}
              className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95">
              + 카테고리 추가
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
            {categories.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                <p className="text-sm">등록된 카테고리가 없습니다</p>
              </div>
            ) : categories.map(c => (
              <div key={c.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                <span className="text-sm font-medium text-slate-800 dark:text-white">📂 {c.name}</span>
                <div className="flex gap-3">
                  <button onClick={() => onEditCat(c)} className="text-xs text-green-600 hover:text-green-700 font-medium">수정</button>
                  <button onClick={() => onDeleteCat(c.id)} className="text-xs text-red-400 hover:text-red-500 font-medium">삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
