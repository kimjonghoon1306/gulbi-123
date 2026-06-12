'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Coupon = {
  id: string; code: string; description: string
  discount_type: 'percent' | 'amount'; discount_value: number
  min_amount: number; max_discount: number | null
  usage_limit: number | null; used_count: number
  starts_at: string | null; expires_at: string | null
  is_active: boolean; created_at: string
}

const EMPTY = {
  code: '', description: '', discount_type: 'percent' as 'percent' | 'amount',
  discount_value: '', min_amount: '', max_discount: '', usage_limit: '', expires_at: '',
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [discByCode, setDiscByCode] = useState<Record<string, number>>({})   // 쿠폰별 총 할인 제공액
  const [burdenBySupplier, setBurdenBySupplier] = useState<{ id: string | null; name: string; amount: number }[]>([])
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    // 관리자 페이지 = 본사(admin) 발행 쿠폰만 (공급사 쿠폰과 분리)
    const { data } = await supabase.from('coupons').select('*').eq('created_by_role', 'admin').order('created_at', { ascending: false })
    setCoupons((data as any) || [])
    await loadUsage()
    setLoading(false)
  }

  // 주문 3종에서 쿠폰 사용액 집계 (쿠폰별 할인 + 공급사별 부담)
  const loadUsage = async () => {
    try {
      const tables = ['general_orders', 'retail_orders', 'wholesale_orders']
      const rows: any[] = []
      for (const t of tables) {
        const { data } = await supabase.from(t).select('coupon_code, coupon_owner, coupon_discount').gt('coupon_discount', 0)
        if (data) rows.push(...data)
      }
      const byCode: Record<string, number> = {}
      const byOwner: Record<string, number> = {}
      for (const r of rows) {
        if (r.coupon_code) byCode[r.coupon_code] = (byCode[r.coupon_code] || 0) + (r.coupon_discount || 0)
        const key = r.coupon_owner || '__hq__'  // null = 본사
        byOwner[key] = (byOwner[key] || 0) + (r.coupon_discount || 0)
      }
      setDiscByCode(byCode)
      // 공급사 이름 조인
      const supIds = Object.keys(byOwner).filter(k => k !== '__hq__')
      let names: Record<string, string> = {}
      if (supIds.length) {
        const { data: sups } = await supabase.from('suppliers').select('id, company_name').in('id', supIds)
        names = Object.fromEntries((sups || []).map((s: any) => [s.id, s.company_name]))
      }
      const burden = Object.entries(byOwner).map(([k, amount]) => ({
        id: k === '__hq__' ? null : k,
        name: k === '__hq__' ? '본사 부담' : (names[k] || '공급사'),
        amount,
      })).sort((a, b) => b.amount - a.amount)
      setBurdenBySupplier(burden)
    } catch (e) { console.error('loadUsage error:', e) }
  }

  const genCode = () => {
    const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let c = ''
    for (let i = 0; i < 7; i++) c += s[Math.floor(Math.random() * s.length)]
    setForm(f => ({ ...f, code: '본' + c }))  // 본사 발행 식별자
  }

  const save = async () => {
    if (!form.code.trim()) return alert('쿠폰 코드를 입력하거나 자동생성하세요.')
    if (!form.discount_value) return alert('할인 값을 입력하세요.')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const raw = form.code.trim().toUpperCase()
    const payload = {
      code: raw.startsWith('본') ? raw : '본' + raw,  // 본사 발행 식별자 보장
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_amount: Number(form.min_amount) || 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: true,
      created_by: user?.id,
      created_by_role: 'admin',
    }
    const { error } = await supabase.from('coupons').insert(payload)
    setSaving(false)
    if (error) { alert(error.message.includes('duplicate') ? '이미 있는 코드예요. 다른 코드를 쓰세요.' : '저장 실패: ' + error.message); return }
    setForm(EMPTY); setShowForm(false); fetchAll()
  }

  const toggleActive = async (c: Coupon) => {
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id)
    setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
  }

  const remove = async (id: string) => {
    if (!confirm('이 쿠폰을 삭제할까요?')) return
    await supabase.from('coupons').delete().eq('id', id)
    setCoupons(prev => prev.filter(x => x.id !== id))
  }

  const discountText = (c: Coupon) =>
    c.discount_type === 'percent' ? `${c.discount_value}% 할인${c.max_discount ? ` (최대 ${c.max_discount.toLocaleString()}원)` : ''}` : `${c.discount_value.toLocaleString()}원 할인`

  const expired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date()

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">🎟️ 쿠폰 관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">발급한 쿠폰은 손님이 쿠폰함에서 &lsquo;받기&rsquo; 후 결제할 때 사용해요. (본사 발행)</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }}
          className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 15px rgba(22,163,74,0.3)' }}>
          + 쿠폰 발급
        </button>
      </div>

      {/* 사용량 요약 (어떤 쿠폰이 얼만큼 쓰였는지 한눈에) */}
      {!loading && coupons.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { k: '발행 쿠폰', v: `${coupons.length}개`, icon: '🎟️' },
            { k: '총 사용', v: `${coupons.reduce((s, c) => s + (c.used_count || 0), 0)}회`, icon: '✅' },
            { k: '사용중', v: `${coupons.filter(c => c.is_active && !expired(c)).length}개`, icon: '🟢' },
          ].map(s => (
            <div key={s.k} className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{s.k}</span><span>{s.icon}</span>
              </div>
              <p className="text-2xl font-black mt-1 text-slate-700 dark:text-slate-100">{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* 공급사별 쿠폰 부담 (정산에서 차감할 금액) */}
      {!loading && burdenBySupplier.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-5">
          <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">💸 쿠폰 부담 정산</p>
          <p className="text-xs text-slate-400 mb-3">공급사 발행 쿠폰의 할인액은 그 공급사 정산에서 차감하세요. (본사 쿠폰은 본사 부담)</p>
          <div className="space-y-2">
            {burdenBySupplier.map(b => (
              <div key={b.id || 'hq'} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-gray-900/40">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {b.id ? `🏭 ${b.name}` : '🏢 본사 부담'}
                </span>
                <span className={`text-sm font-black ${b.id ? 'text-amber-600' : 'text-slate-500'}`}>−{b.amount.toLocaleString()}원</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">불러오는 중...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">🎟️</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">아직 발급한 쿠폰이 없어요. 우측 상단 "쿠폰 발급"으로 만들어 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-wider text-slate-800 dark:text-white">{c.code}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.is_active && !expired(c) ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-gray-700 text-slate-400'}`}>
                      {expired(c) ? '만료' : c.is_active ? '사용중' : '중지'}
                    </span>
                  </div>
                  {c.description && <p className="text-xs text-slate-400 mt-1">{c.description}</p>}
                </div>
                <button onClick={() => remove(c.id)} className="text-red-400 hover:text-red-500 text-sm">삭제</button>
              </div>
              <p className="text-base font-bold" style={{ color: '#15803d' }}>{discountText(c)}</p>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 space-y-0.5">
                {c.min_amount > 0 && <p>· {c.min_amount.toLocaleString()}원 이상 주문 시</p>}
                <p>· 사용 {c.used_count}회{c.usage_limit ? ` / ${c.usage_limit}회` : ' (무제한)'}</p>
                <p>· 할인 제공 <b className="text-slate-600 dark:text-slate-300">{(discByCode[c.code] || 0).toLocaleString()}원</b></p>
                {c.expires_at && <p>· {new Date(c.expires_at).toLocaleDateString('ko-KR')}까지</p>}
              </div>
              <button onClick={() => toggleActive(c)}
                className={`mt-3 w-full py-2 rounded-xl text-xs font-bold ${c.is_active ? 'bg-slate-100 dark:bg-gray-700 text-slate-500' : 'text-white'}`}
                style={!c.is_active ? { background: 'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
                {c.is_active ? '사용 중지' : '다시 사용'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 발급 모달 */}
      {showForm && (
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
      )}
    </div>
  )
}
