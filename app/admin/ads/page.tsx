'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

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

const EMPTY = {
  tag: '', title: '', subtitle: '', cta_label: '', image_url: '', product_id: '', link_url: '',
  sort_order: '0', starts_at: '', ends_at: '', is_active: true,
}

// ISO → datetime-local 입력값 (로컬 타임존)
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

// 광고 상태 판정
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

export default function AdminAdsPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [products, setProducts] = useState<ProductLite[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from('ad_banners').select('*').order('sort_order').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').eq('is_active', true).order('name'),
    ])
    setBanners((b as any) || [])
    setProducts((p as any) || [])
    setLoading(false)
  }

  const openNew = () => { setEditId(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (b: Banner) => {
    setEditId(b.id)
    setForm({
      tag: b.tag || '', title: b.title || '', subtitle: b.subtitle || '', cta_label: b.cta_label || '',
      image_url: b.image_url, product_id: b.product_id || '',
      link_url: b.link_url || '', sort_order: String(b.sort_order),
      starts_at: toLocalInput(b.starts_at), ends_at: toLocalInput(b.ends_at), is_active: b.is_active,
    })
    setShowForm(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    const fn = 'banners/' + Date.now() + '.' + (f.name.split('.').pop() || 'jpg')
    const { error } = await supabase.storage.from('products').upload(fn, f, { upsert: true })
    if (!error) {
      const url = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
      setForm(prev => ({ ...prev, image_url: url }))
    } else {
      alert('이미지 업로드 실패: ' + error.message)
    }
    setUploading(false)
  }

  const save = async () => {
    if (!form.image_url) return alert('배너 이미지를 올려주세요.')
    if (form.starts_at && form.ends_at && new Date(form.starts_at) >= new Date(form.ends_at))
      return alert('종료 일시가 시작 일시보다 빨라요. 다시 확인해 주세요.')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload: any = {
      tag: form.tag.trim() || null,
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      cta_label: form.cta_label.trim() || null,
      image_url: form.image_url,
      product_id: form.product_id || null,
      link_url: form.link_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_active: form.is_active,
    }
    let error
    if (editId) {
      ({ error } = await supabase.from('ad_banners').update(payload).eq('id', editId))
    } else {
      payload.created_by = user?.id
      ;({ error } = await supabase.from('ad_banners').insert(payload))
    }
    setSaving(false)
    if (error) { alert('저장 실패: ' + error.message); return }
    setShowForm(false); setForm(EMPTY); setEditId(null); fetchAll()
  }

  const toggleActive = async (b: Banner) => {
    await supabase.from('ad_banners').update({ is_active: !b.is_active }).eq('id', b.id)
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x))
  }

  const remove = async (id: string) => {
    if (!confirm('이 광고 배너를 삭제할까요?')) return
    await supabase.from('ad_banners').delete().eq('id', id)
    setBanners(prev => prev.filter(x => x.id !== id))
  }

  const productName = (id: string | null) => id ? (products.find(p => p.id === id)?.name || '삭제된 상품') : null
  const counts = {
    total: banners.length,
    live: banners.filter(b => statusOf(b) === 'live').length,
    scheduled: banners.filter(b => statusOf(b) === 'scheduled').length,
    ended: banners.filter(b => ['expired', 'off'].includes(statusOf(b))).length,
  }

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
                <label className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploading ? 'opacity-60 pointer-events-none' : 'border-green-200 dark:border-green-900/40 hover:bg-green-50 dark:hover:bg-green-900/10'}`}>
                  <span className="text-green-600 font-bold text-sm">{uploading ? '⏳ 올리는 중...' : '📤 이미지 선택 / 변경'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <p className="text-[11px] text-slate-400 mt-1.5">가로로 긴 이미지(권장 비율 5:2, 예: 1000×400)가 가장 예쁘게 나와요.</p>
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
    </div>
  )
}
