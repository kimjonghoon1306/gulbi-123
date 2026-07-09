'use client'

import type { Dispatch, SetStateAction } from 'react'
import { IMAGE_LIBRARY } from './_imageLibrary'

type Banner = {
  id: string
  tag: string | null
  title: string | null
  subtitle: string | null
  cta_label: string | null
  image_url: string
  product_id: string | null
  link_url: string | null
  sort_order: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at: string
}

type ProductLite = { id: string; name: string }
type FormState = {
  tag: string; title: string; subtitle: string; cta_label: string; image_url: string; product_id: string; link_url: string
  sort_order: string; starts_at: string; ends_at: string; is_active: boolean
}
type Status = 'live' | 'scheduled' | 'expired' | 'off'

const statusOf = (b: Banner): Status => {
  if (!b.is_active) return 'off'
  const now = Date.now()
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return 'scheduled'
  if (b.ends_at && new Date(b.ends_at).getTime() < now) return 'expired'
  return 'live'
}
const STATUS_META: Record<Status, { label: string; cls: string; dot: string }> = {
  live:      { label: '노출중',  cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  scheduled: { label: '예약',    cls: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',                 dot: 'bg-sky-500' },
  expired:   { label: '종료',    cls: 'bg-slate-100 dark:bg-gray-700 text-slate-400',                                  dot: 'bg-slate-400' },
  off:       { label: '꺼짐',    cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',          dot: 'bg-amber-500' },
}

const fmtRange = (b: Banner) => {
  const f = (iso: string | null) => iso ? new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
  const s = f(b.starts_at), e = f(b.ends_at)
  if (!s && !e) return '상시 노출'
  return `${s || '지금부터'} ~ ${e || '무기한'}`
}

type AdsViewProps = {
  banners: Banner[]
  products: ProductLite[]
  loading: boolean
  showForm: boolean
  setShowForm: Dispatch<SetStateAction<boolean>>
  editId: string | null
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
  saving: boolean
  uploading: boolean
  showLibrary: boolean
  setShowLibrary: Dispatch<SetStateAction<boolean>>
  libCat: string
  setLibCat: Dispatch<SetStateAction<string>>
  openNew: () => void
  openEdit: (b: Banner) => void
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  save: () => Promise<void>
  toggleActive: (b: Banner) => Promise<void>
  remove: (id: string) => Promise<void>
  productName: (id: string | null) => string | null
  counts: { total: number; live: number; scheduled: number; ended: number }
}

export default function AdsView({
  banners, products, loading, showForm, setShowForm, editId, form, setForm, saving, uploading,
  showLibrary, setShowLibrary, libCat, setLibCat, openNew, openEdit, handleImageUpload, save,
  toggleActive, remove, productName, counts,
}: AdsViewProps) {
  return (
    <div className="animate-fadeIn space-y-6">
      {/* ── 헤더 ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white"
        style={{ background: 'linear-gradient(135deg,#14532d 0%,#15803d 55%,#16a34a 100%)' }}>
        <div className="absolute -right-8 -top-10 text-[140px] opacity-10 select-none pointer-events-none">📢</div>
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">📢 광고 배너 관리</h1>
            <p className="text-white/80 text-sm mt-2 leading-relaxed max-w-xl">
              본사에 광고비를 입금한 업체의 배너를 등록하세요. 여러 광고가 쇼핑몰 메인 상단 슬라이더에서<br className="hidden md:block" />
              자동으로 번갈아 노출됩니다. 광고마다 <b>노출 시작·종료 일시</b>를 정할 수 있어요.
            </p>
          </div>
          <button onClick={openNew}
            className="shrink-0 px-5 py-3 rounded-2xl font-bold text-sm bg-white text-green-700 shadow-lg transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-xl">
            + 광고 등록
          </button>
        </div>
      </div>

      {/* ── 통계 카드 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { k: '전체 광고', v: counts.total, icon: '🗂️', tint: 'from-slate-500/10 to-slate-500/5', num: 'text-slate-700 dark:text-slate-200' },
          { k: '노출중', v: counts.live, icon: '🟢', tint: 'from-emerald-500/15 to-emerald-500/5', num: 'text-emerald-600' },
          { k: '예약 대기', v: counts.scheduled, icon: '⏰', tint: 'from-sky-500/15 to-sky-500/5', num: 'text-sky-600' },
          { k: '종료/꺼짐', v: counts.ended, icon: '⛔', tint: 'from-amber-500/15 to-amber-500/5', num: 'text-amber-600' },
        ].map(c => (
          <div key={c.k} className={`rounded-2xl border border-slate-100 dark:border-gray-700 bg-gradient-to-br ${c.tint} p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{c.k}</span>
              <span className="text-lg">{c.icon}</span>
            </div>
            <p className={`text-3xl font-black mt-1 ${c.num}`}>{c.v}</p>
          </div>
        ))}
      </div>

      {/* ── 목록 ── */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">불러오는 중...</div>
      ) : banners.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 p-14 text-center">
          <p className="text-5xl mb-3">📢</p>
          <p className="font-bold text-slate-600 dark:text-slate-300">아직 등록한 광고가 없어요</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">우측 상단 &ldquo;광고 등록&rdquo;을 눌러 첫 배너를 만들어 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {banners.map(b => {
            const st = statusOf(b)
            const meta = STATUS_META[st]
            return (
              <div key={b.id} className="group bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* 배너 미리보기 */}
                <div className="relative aspect-[5/2] bg-slate-100 dark:bg-gray-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.image_url} alt={b.title || '배너'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${meta.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${st === 'live' ? 'animate-pulse' : ''}`} />
                    {meta.label}
                  </span>
                  <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-lg bg-black/55 text-white backdrop-blur">
                    순서 {b.sort_order}
                  </span>
                  {b.title && <p className="absolute bottom-3 left-3 right-3 text-white font-black text-lg drop-shadow truncate">{b.title}</p>}
                </div>

                {/* 정보 */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="text-slate-400">🕒</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{fmtRange(b)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">🔗</span>
                    <span className="font-medium text-slate-500 dark:text-slate-400 truncate">
                      {productName(b.product_id) ? `상품: ${productName(b.product_id)}` : b.link_url ? b.link_url : '연결 없음 (클릭 시 이동 안 함)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => toggleActive(b)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${b.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-slate-100 dark:bg-gray-700 text-slate-400 hover:bg-slate-200'}`}>
                      {b.is_active ? '✓ 켜짐' : '꺼짐'}
                    </button>
                    <button onClick={() => openEdit(b)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 transition-all active:scale-95">
                      수정
                    </button>
                    <button onClick={() => remove(b.id)}
                      className="px-3 py-2 rounded-xl text-sm font-bold bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-all active:scale-95">
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 등록/수정 모달 ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-3 md:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl my-4 max-h-[94vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-100 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-t-3xl">
              <h2 className="text-lg font-black text-slate-800 dark:text-white">{editId ? '✏️ 광고 수정' : '📢 새 광고 등록'}</h2>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-xl leading-none">✕</button>
            </div>

            <div className="p-5 space-y-5">
              {/* 라이브 미리보기 */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">실제 노출 미리보기</label>
                <div className="relative aspect-[5/2] rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-900">
                  {form.image_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.image_url} alt="미리보기" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex flex-col justify-center gap-1.5 p-5"
                        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.34) 42%, rgba(0,0,0,0) 72%)' }}>
                        {form.tag && <span className="self-start text-[10px] font-extrabold tracking-widest uppercase text-white px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)' }}>{form.tag}</span>}
                        {form.title && <p className="text-white font-black leading-tight drop-shadow" style={{ fontSize: 'clamp(16px,3vw,26px)', maxWidth: '70%' }}>{form.title}</p>}
                        {form.subtitle && <p className="text-white/90 font-semibold leading-snug drop-shadow" style={{ fontSize: 'clamp(11px,1.6vw,15px)', maxWidth: '60%' }}>{form.subtitle}</p>}
                        {(form.product_id || form.link_url) && (
                          <span className="self-start mt-1 inline-flex items-center gap-1.5 text-green-700 bg-white font-extrabold px-4 py-2 rounded-full shadow-lg" style={{ fontSize: 'clamp(11px,1.4vw,14px)' }}>
                            {form.cta_label || '자세히 보기'} →
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                      <span className="text-4xl mb-1">🖼️</span>
                      <span className="text-xs font-semibold">이미지를 올리면 여기에 표시돼요</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">배너 이미지 <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploading ? 'opacity-60 pointer-events-none' : 'border-green-200 dark:border-green-900/40 hover:bg-green-50 dark:hover:bg-green-900/10'}`}>
                    <span className="text-green-600 font-bold text-sm">{uploading ? '⏳ 올리는 중...' : '📤 직접 업로드'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button type="button" onClick={() => setShowLibrary(true)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                    <span className="text-amber-600 font-bold text-sm">📚 이미지 라이브러리</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">넣을 이미지가 없으면 <b className="text-amber-600">📚 라이브러리</b>에서 골라 쓰세요. 가로로 긴 이미지(권장 5:2)가 예뻐요.</p>
              </div>

              {/* 문구 (라벨/제목/부제/버튼) */}
              <div className="rounded-2xl border border-slate-100 dark:border-gray-700 p-4 space-y-3 bg-slate-50/60 dark:bg-gray-900/40">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">✍️ 배너 문구 <span className="text-slate-300 font-normal">(이미지 위에 표시 · 전부 선택)</span></p>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">라벨 <span className="text-slate-300">(작은 윗줄 · 예: 이벤트 / 신상품 / 브랜드명)</span></label>
                  <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}
                    placeholder="예: 특가 이벤트"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">제목 <span className="text-slate-300">(큰 헤드라인)</span></label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="예: 햇사과 특가 50% 할인"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">부제 <span className="text-slate-300">(한 줄 설명)</span></label>
                  <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="예: 산지직송 햇사과를 가장 신선하게, 오늘만 이 가격"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">버튼 문구 <span className="text-slate-300">(클릭 연결 있을 때 표시 · 비우면 &ldquo;자세히 보기&rdquo;)</span></label>
                  <input value={form.cta_label} onChange={e => setForm({ ...form, cta_label: e.target.value })}
                    placeholder="자세히 보기"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {/* 연결 대상 */}
              <div className="rounded-2xl border border-slate-100 dark:border-gray-700 p-4 space-y-3 bg-slate-50/60 dark:bg-gray-900/40">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">🔗 클릭하면 이동할 곳 <span className="text-slate-300 font-normal">(선택)</span></p>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">상품 선택</label>
                  <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">— 상품 연결 안 함 —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">또는 직접 링크 (상품 미선택 시)</label>
                  <input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {/* 노출 일정 */}
              <div className="rounded-2xl border border-slate-100 dark:border-gray-700 p-4 space-y-3 bg-slate-50/60 dark:bg-gray-900/40">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">🕒 노출 일정 <span className="text-slate-300 font-normal">(비우면 상시 노출)</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">시작 일시</label>
                    <input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">종료 일시</label>
                    <input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
              </div>

              {/* 순서 + 활성 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">슬라이드 순서</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                  <p className="text-[11px] text-slate-400 mt-1">작을수록 먼저 나와요.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">노출 상태</label>
                  <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${form.is_active
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                      : 'bg-slate-100 dark:bg-gray-700 text-slate-400'}`}>
                    {form.is_active ? '✓ 켜짐 (노출)' : '꺼짐 (숨김)'}
                  </button>
                </div>
              </div>
            </div>

            {/* 모달 하단 */}
            <div className="sticky bottom-0 flex items-center gap-3 p-5 border-t border-slate-100 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-b-3xl">
              <button onClick={() => setShowForm(false)}
                className="px-5 py-3 rounded-xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
                취소
              </button>
              <button onClick={save} disabled={saving || uploading}
                className="flex-1 py-3 rounded-xl font-black text-sm text-white transition-all active:scale-95 hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 15px rgba(22,163,74,0.35)' }}>
                {saving ? '저장 중...' : editId ? '수정 저장' : '광고 등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 이미지 라이브러리 모달 ── */}
      {showLibrary && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLibrary(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-gray-700">
              <div>
                <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">📚 이미지 라이브러리</h3>
                <p className="text-xs text-slate-400 mt-0.5">카테고리를 고르고 이미지를 누르면 배너에 들어가요.</p>
              </div>
              <button onClick={() => setShowLibrary(false)}
                className="w-9 h-9 rounded-full grid place-items-center text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 text-lg">✕</button>
            </div>
            {/* 카테고리 탭 */}
            <div className="flex gap-2 overflow-x-auto px-5 py-3 border-b border-slate-100 dark:border-gray-700">
              {IMAGE_LIBRARY.map(g => (
                <button key={g.key} onClick={() => setLibCat(g.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${libCat === g.key ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200'}`}>
                  <span>{g.emoji}</span><span>{g.name}</span>
                </button>
              ))}
            </div>
            {/* 이미지 그리드 */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-3">
                {(IMAGE_LIBRARY.find(g => g.key === libCat) || IMAGE_LIBRARY[0]).images.map(img => (
                  <button key={img.file} type="button"
                    onClick={() => { setForm(prev => ({ ...prev, image_url: img.file })); setShowLibrary(false) }}
                    className="group relative rounded-2xl overflow-hidden aspect-square border border-slate-200 dark:border-gray-700 hover:border-green-500 hover:ring-2 hover:ring-green-500/30 transition-all active:scale-95">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.file} alt={img.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs font-bold text-center py-1.5 pt-4">{img.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

}