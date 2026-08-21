'use client'

import type { Dispatch, SetStateAction } from 'react'
import { createClient } from '@/lib/supabase'
import StockImagePicker from '@/components/StockImagePicker'
import { PRODUCT_OPTION_UNITS, digitsOnly, emptyProductOption, formatWon, type ProductOptionForm } from '@/lib/product-options'

type Category = { id: string; name: string; sort_order: number }
type Product = {
  id: string; name: string; description: string
  origin?: string | null
  category_id: string; wholesale_price: number; member_price: number; retail_price: number
  stock: number; unit: string; weight?: number | null; image_url: string; is_active: boolean; is_taxable: boolean
  subscribable?: boolean; subscribe_discount?: number | null
  shipping_type?: 'free' | 'paid'; shipping_fee?: number | null; free_shipping_threshold?: number | null
}

export type ProductForm = {
  name: string; description: string; origin: string; category_id: string
  wholesale_price: string; member_price: string; retail_price: string
  stock: string; unit: string; weight: string; image_url: string; is_active: boolean; is_taxable: boolean
  subscribable: boolean; subscribe_discount: string
  shipping_type: 'free' | 'paid'; shipping_fee: string; free_shipping_threshold: string
  use_options: boolean; options: ProductOptionForm[]
}

export type CatForm = { name: string }

type ProductModalProps = {
  show: boolean
  onClose: () => void
  editProduct: Product | null
  form: ProductForm
  setForm: Dispatch<SetStateAction<ProductForm>>
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
      setForm(current => ({ ...current, image_url: url }))
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
            <StockImagePicker onPick={(url) => setForm(current => ({ ...current, image_url: url }))} />
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

          <div className="rounded-xl border border-slate-200 dark:border-gray-600 p-4 flex items-center gap-3">
            <button type="button" role="switch" aria-checked={form.use_options}
              onClick={() => setForm(current => ({ ...current, use_options: !current.use_options, options: current.options.length ? current.options : [emptyProductOption()] }))}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.use_options ? 'bg-green-600' : 'bg-slate-300 dark:bg-gray-600'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.use_options ? 'left-7' : 'left-1'}`} />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">상품 옵션 사용</p>
              <p className="text-[11px] text-slate-400">중량·구성별 가격과 재고를 따로 관리합니다.</p>
            </div>
          </div>

          {!form.use_options ? <div className="grid grid-cols-2 gap-4">
            {[
              { label: '🛒 일반 구매가 (원)', key: 'retail_price', isMoney: true, placeholder: '예: 30,000' },
              { label: '🏪 소매 공급가 (원)', key: 'member_price', isMoney: true, placeholder: '예: 25,000' },
              { label: '🏭 도매 공급가 (원)', key: 'wholesale_price', isMoney: true, placeholder: '예: 20,000' },
              { label: '재고 수량 (비우면 무제한)', key: 'stock', isMoney: false, placeholder: '비워두면 무제한' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                <input type={f.isMoney ? 'text' : 'number'} inputMode="numeric" placeholder={f.placeholder} value={f.isMoney ? formatWon((form as any)[f.key]) : (form as any)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: f.isMoney ? digitsOnly(e.target.value) : e.target.value })}
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
          </div> : (
            <div className="space-y-3">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-700 dark:text-white">상품 옵션</p>
                <button type="button" onClick={() => setForm(current => ({ ...current, options: [...current.options, emptyProductOption()] }))} className="text-xs font-bold text-green-600">+ 옵션 추가</button>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-3 py-2.5">
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">📌 손님에게 보이는 무게는 <u>여기 옵션에 넣은 것만</u> 나옵니다.</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-500 leading-relaxed mt-0.5">상품명에 적은 무게(예: 1.4kg)는 옵션에 자동으로 안 들어가요. 팔 무게를 옵션에 <b>하나씩 다</b> 추가하세요. (맨 위 옵션이 대표로 먼저 보여요)</p>
              </div>
              <div className="space-y-3">
                {form.options.map((option, index) => {
                  const update = (key: keyof ProductOptionForm, value: string) => setForm(current => ({ ...current, options: current.options.map(item => item.client_id === option.client_id ? { ...item, [key]: value } : item) }))
                  const cls = 'w-full min-w-0 border border-slate-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600'
                  const lab = 'block text-[10px] font-semibold text-slate-400 mb-1'
                  return (
                    <div key={option.client_id} className="rounded-xl border border-slate-200 dark:border-gray-600 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-300">옵션 {index + 1}</p>
                        <button type="button" aria-label="옵션 삭제" disabled={form.options.length === 1} onClick={() => setForm(current => ({ ...current, options: current.options.filter(item => item.client_id !== option.client_id) }))} className="text-xs font-semibold text-red-400 disabled:text-slate-300">✕ 삭제</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className={lab}>옵션명 *</label><input value={option.label} onChange={e => update('label', e.target.value)} placeholder="직접 입력 (예: 1.4kg)" className={cls} /></div>
                        <div><label className={lab}>단위</label><select value={option.unit} onChange={e => update('unit', e.target.value)} className={cls}>{PRODUCT_OPTION_UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className={lab}>🏭 도매가</label><input inputMode="numeric" value={formatWon(option.wholesale_price)} onChange={e => update('wholesale_price', digitsOnly(e.target.value))} placeholder="20,000" className={cls} /></div>
                        <div><label className={lab}>🏪 소매가</label><input inputMode="numeric" value={formatWon(option.member_price)} onChange={e => update('member_price', digitsOnly(e.target.value))} placeholder="25,000" className={cls} /></div>
                        <div><label className={lab}>🛒 일반구매가 *</label><input inputMode="numeric" value={formatWon(option.retail_price)} onChange={e => update('retail_price', digitsOnly(e.target.value))} placeholder="30,000" className={cls} /></div>
                      </div>
                      <div className="w-1/2 pr-1"><label className={lab}>재고 (비우면 무제한)</label><input type="number" inputMode="numeric" value={option.stock} onChange={e => update('stock', e.target.value)} placeholder="무제한" className={cls} /></div>
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-slate-400">예시는 자동 입력값이 아닙니다. 각 옵션명을 직접 입력하세요. 빈 이름과 중복 이름은 저장할 수 없습니다.</p>
            </div>
          )}

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

          <div className="rounded-xl border-2 border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">🚚 상품별 택배비 설정</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">장바구니 전체가 아닌 이 상품의 가격 × 수량만으로 무료배송 조건을 판단합니다.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ ...form, shipping_type: 'free' })}
                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${form.shipping_type === 'free' ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20' : 'bg-white dark:bg-gray-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-gray-600'}`}>
                무료배송
              </button>
              <button type="button" onClick={() => setForm({ ...form, shipping_type: 'paid' })}
                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${form.shipping_type === 'paid' ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20' : 'bg-white dark:bg-gray-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-gray-600'}`}>
                유료배송
              </button>
            </div>
            {form.shipping_type === 'free' ? (
              <div className="rounded-xl bg-white/80 dark:bg-gray-800/80 px-4 py-3 border border-green-200 dark:border-green-900">
                <p className="text-xs font-bold text-green-700 dark:text-green-400">결제 시 배송비 0원</p>
                <p className="text-[11px] text-slate-400 mt-1">쇼핑몰 가격 옆에 ‘무료배송’으로 표시됩니다.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">기본 택배비 <span className="text-red-500">필수</span></label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" placeholder="예: 3,000" value={formatWon(form.shipping_fee)}
                      onChange={e => setForm({ ...form, shipping_fee: digitsOnly(e.target.value) })}
                      className="w-full border border-amber-300 dark:border-amber-700 rounded-xl pl-4 pr-10 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">얼마 이상 무료 <span className="font-normal text-slate-400">선택</span></label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" placeholder="예: 50,000" value={formatWon(form.free_shipping_threshold)}
                      onChange={e => setForm({ ...form, free_shipping_threshold: digitsOnly(e.target.value) })}
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl pl-4 pr-10 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">원</span>
                  </div>
                </div>
                <p className="sm:col-span-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">무료 기준을 비워두면 주문금액과 관계없이 기본 택배비가 항상 부과됩니다. 기준을 입력하면 이 상품의 단가 × 수량이 기준 이상일 때만 택배비가 전액 할인됩니다.</p>
              </div>
            )}
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
