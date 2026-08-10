'use client'

import { createClient } from '@/lib/supabase'
import StockImagePicker from '@/components/StockImagePicker'

type Category = { id: string; name: string; sort_order: number }
type Product = {
  id: string; name: string; description: string
  origin?: string | null
  category_id: string; wholesale_price: number; member_price: number; retail_price: number
  stock: number; unit: string; weight?: number | null; image_url: string; is_active: boolean; is_taxable: boolean
  subscribable?: boolean; subscribe_discount?: number | null
}

export type ProductForm = {
  name: string; description: string; origin: string; category_id: string
  wholesale_price: string; member_price: string; retail_price: string
  stock: string; unit: string; weight: string; image_url: string; is_active: boolean; is_taxable: boolean
  subscribable: boolean; subscribe_discount: string
}

export type CatForm = { name: string }

type ProductModalProps = {
  show: boolean
  onClose: () => void
  editProduct: Product | null
  form: ProductForm
  setForm: (f: ProductForm) => void
  onSave: () => void
  categories: Category[]
}

type CatModalProps = {
  show: boolean
  onClose: () => void
  editCat: Category | null
  catName: string
  setCatName: (v: string) => void
  onSave: () => void
}

export function ProductFormModal({ show, onClose, editProduct, form, setForm, onSave, categories }: ProductModalProps) {
  if (!show) return null
  const supabase = createClient()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const fn = Date.now() + '.' + (f.name.split('.').pop() || 'jpg')
    const { error } = await supabase.storage.from('products').upload(fn, f, { upsert: true })
    if (!error) {
      const url = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
      setForm({ ...form, image_url: url })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {editProduct ? '상품 수정' : '상품 등록'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">상품명</label>
            <input type="text" placeholder="상품명 입력" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">대표 이미지</label>
            <input id="form-img-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <div onClick={() => document.getElementById('form-img-input')?.click()}
              style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
              {form.image_url
                ? <img src={form.image_url} alt="" style={{ height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block', borderRadius: '8px' }} />
                : <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>📸 클릭해서 이미지 올리기</p>
              }
            </div>
            <StockImagePicker onPick={(url) => setForm({ ...form, image_url: url })} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">카테고리</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
              className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600">
              <option value="">선택</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">원산지 <span className="font-normal text-slate-400">(선택)</span></label>
            <input type="text" placeholder="예: 국내산 · 전남 영광 / 중국산" value={form.origin}
              onChange={e => setForm({ ...form, origin: e.target.value })}
              maxLength={100}
              className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
            <p className="text-[11px] text-slate-400 mt-1.5">상품에 표시할 국가나 지역을 입력하세요. 비식품 등 해당 사항이 없으면 비워둘 수 있어요.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '🛒 일반 구매가 (원)', key: 'retail_price' },
              { label: '🏪 소매 공급가 (원)', key: 'member_price' },
              { label: '🏭 도매 공급가 (원)', key: 'wholesale_price' },
              { label: '재고 수량', key: 'stock' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                <input type="number" value={(form as any)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">단위</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600">
                {['kg', 'g', '박스', '마리', '개', '묶음'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">중량 / 수량 <span className="font-normal text-slate-400">(예: 1.5 → 1.5{form.unit || 'kg'})</span></label>
              <div className="relative">
                <input type="number" inputMode="decimal" step="any" min="0" placeholder="수치만 입력 (선택)" value={form.weight}
                  onChange={e => setForm({ ...form, weight: e.target.value })}
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl pl-4 pr-16 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-green-600 pointer-events-none">{form.unit || 'kg'}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">생선처럼 마리마다 무게가 다른 상품은 수치를 적어주세요. 뒤에 단위가 자동으로 붙어요.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">설명</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              placeholder="상품 설명을 입력하세요"
              className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">부가세 구분</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ ...form, is_taxable: false })}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${!form.is_taxable ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-gray-600'}`}>
                면세 (미가공 농수산물)
              </button>
              <button type="button" onClick={() => setForm({ ...form, is_taxable: true })}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${form.is_taxable ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-gray-600'}`}>
                과세 (가공식품)
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">미가공 농·축·수산물은 면세, 젓갈·조미김·밀키트 등 가공식품은 과세입니다. 세금계산서 부가세 계산에 반영됩니다.</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-gray-600 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm({ ...form, subscribable: !form.subscribable })}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.subscribable ? 'bg-green-600' : 'bg-slate-300 dark:bg-gray-600'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.subscribable ? 'left-7' : 'left-1'}`} />
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">🔁 정기배송 가능</p>
                <p className="text-[11px] text-slate-400">켜면 손님이 이 상품을 정기배송(구독)으로 신청할 수 있어요.</p>
              </div>
            </div>
            {form.subscribable && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">정기배송 할인율 (%)</label>
                <div className="relative">
                  <input type="number" inputMode="decimal" step="any" min="0" max="100" placeholder="예: 5 (5% 할인)" value={form.subscribe_discount}
                    onChange={e => setForm({ ...form, subscribe_discount: e.target.value })}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl pl-4 pr-10 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-green-600 pointer-events-none">%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">구독 신청 시 회차 단가에서 이 비율만큼 할인돼요. (0이면 할인 없음)</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">판매 상태</label>
            <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.is_active ? 'bg-green-600' : 'bg-slate-300 dark:bg-gray-600'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.is_active ? 'left-7' : 'left-1'}`} />
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">{form.is_active ? '판매중' : '숨김'}</span>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
            취소
          </button>
          <button onClick={onSave} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors active:scale-95">
            {editProduct ? '수정 완료' : '등록 완료'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CategoryFormModal({ show, onClose, editCat, catName, setCatName, onSave }: CatModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {editCat ? '카테고리 수정' : '카테고리 추가'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">카테고리명</label>
          <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="예) 어류"
            className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
        </div>
        <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
            취소
          </button>
          <button onClick={onSave} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors active:scale-95">
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
