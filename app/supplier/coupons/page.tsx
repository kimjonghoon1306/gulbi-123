'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import SupplierLayout from '../_layout/layout'
import { useSupplierTheme } from '../_layout/theme-context'

type Coupon = {
  id: string; code: string; description: string
  discount_type: 'percent' | 'amount'; discount_value: number
  min_amount: number; max_discount: number | null
  usage_limit: number | null; used_count: number
  expires_at: string | null; is_active: boolean; created_at: string
}

const EMPTY = {
  code: '', description: '', discount_type: 'percent' as 'percent' | 'amount',
  discount_value: '', min_amount: '', max_discount: '', usage_limit: '', expires_at: '',
}

function CouponsContent() {
  const t = useSupplierTheme()
  const router = useRouter()
  const supabase = createClient()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uid, setUid] = useState('')
  const [discByCode, setDiscByCode] = useState<Record<string, number>>({})  // 내 쿠폰별 총 할인 제공(=내 부담)

  useEffect(() => { init() }, [])
  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/supplier/login'); return }
    setUid(user.id)
    // 공급사 페이지 = 본인이 발행한 공급사(supplier) 쿠폰만 (본사 쿠폰과 분리)
    const { data } = await supabase.from('coupons').select('*').eq('created_by', user.id).eq('created_by_role', 'supplier').order('created_at', { ascending: false })
    setCoupons((data as any) || [])
    await loadUsage(user.id)
    setLoading(false)
  }

  // 내 쿠폰이 부담한 할인액 집계 (주문항목→부모주문 조인, 주문 단위 중복제거)
  const loadUsage = async (myId: string) => {
    try {
      const tables = [
        { items: 'general_order_items', ord: 'general_orders' },
        { items: 'retail_order_items', ord: 'retail_orders' },
        { items: 'wholesale_order_items', ord: 'wholesale_orders' },
      ]
      const seen = new Set<string>()
      const byCode: Record<string, number> = {}
      for (const t of tables) {
        const { data } = await supabase.from(t.items)
          .select(`order_id, ${t.ord}(coupon_code, coupon_owner, coupon_discount)`)
          .eq('supplier_id', myId)
        for (const row of (data || []) as any[]) {
          const o = row[t.ord]
          if (!o || o.coupon_owner !== myId) continue   // 내가 부담하는 쿠폰만
          const key = t.ord + ':' + row.order_id
          if (seen.has(key)) continue
          seen.add(key)
          if (o.coupon_code) byCode[o.coupon_code] = (byCode[o.coupon_code] || 0) + (o.coupon_discount || 0)
        }
      }
      setDiscByCode(byCode)
    } catch (e) { console.error('loadUsage error:', e) }
  }

  const genCode = () => {
    const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let c = ''; for (let i = 0; i < 7; i++) c += s[Math.floor(Math.random() * s.length)]
    setForm(f => ({ ...f, code: '공' + c }))  // 공급사 발행 식별자
  }

  const save = async () => {
    if (!form.code.trim()) return alert('쿠폰 코드를 입력하거나 자동생성하세요.')
    if (!form.discount_value) return alert('할인 값을 입력하세요.')
    setSaving(true)
    const raw = form.code.trim().toUpperCase()
    const { error } = await supabase.from('coupons').insert({
      code: raw.startsWith('공') ? raw : '공' + raw,  // 공급사 발행 식별자 보장
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_amount: Number(form.min_amount) || 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: true, created_by: uid, created_by_role: 'supplier',
    })
    setSaving(false)
    if (error) { alert(error.message.includes('duplicate') ? '이미 있는 코드예요. 다른 코드를 쓰세요.' : '저장 실패: ' + error.message); return }
    setForm(EMPTY); setShowForm(false); init()
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

  const card: React.CSSProperties = { background: t.card, border: `1px solid ${t.border}`, borderRadius: '20px' }
  const inp: React.CSSProperties = { width: '100%', padding: '14px 16px', borderRadius: '12px', border: `2px solid ${t.border}`, background: t.input, color: t.text, fontSize: '16px', outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 700, color: t.textMuted, marginBottom: '8px' }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: t.text, margin: 0 }}>🎟️ 내 쿠폰</h1>
          <p style={{ fontSize: '13px', color: t.textMuted, margin: '6px 0 0' }}>발급한 쿠폰은 손님이 쿠폰함에서 &lsquo;받기&rsquo; 후 결제할 때 사용해요. (공급사 발행)</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }}
          style={{ padding: '13px 20px', borderRadius: '14px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '15px', fontWeight: 800, background: 'linear-gradient(135deg,#34d399,#10b981)', whiteSpace: 'nowrap' }}>
          + 쿠폰 발급
        </button>
      </div>

      {/* 사용량 요약 (내 쿠폰이 얼만큼 쓰였는지) */}
      {!loading && coupons.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', margin: '14px 0 4px' }}>
          {[
            { k: '발행 쿠폰', v: `${coupons.length}개`, icon: '🎟️' },
            { k: '총 사용', v: `${coupons.reduce((s, c) => s + (c.used_count || 0), 0)}회`, icon: '✅' },
            { k: '사용중', v: `${coupons.filter(c => c.is_active && !expired(c)).length}개`, icon: '🟢' },
          ].map(s => (
            <div key={s.k} style={{ ...card, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted }}>{s.k}</span><span>{s.icon}</span>
              </div>
              <p style={{ fontSize: '22px', fontWeight: 900, color: t.text, margin: '4px 0 0' }}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: t.textMuted }}>불러오는 중...</div>
      ) : coupons.length === 0 ? (
        <div style={{ ...card, padding: '50px 20px', textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '44px', margin: '0 0 12px' }}>🎟️</p>
          <p style={{ fontSize: '15px', color: t.textMuted, margin: 0 }}>아직 발급한 쿠폰이 없어요. "쿠폰 발급"으로 만들어 보세요.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '14px', marginTop: '20px' }}>
          {coupons.map(c => (
            <div key={c.id} style={{ ...card, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '1px', color: t.text }}>{c.code}</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: c.is_active && !expired(c) ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.15)', color: c.is_active && !expired(c) ? '#10b981' : '#94a3b8' }}>
                      {expired(c) ? '만료' : c.is_active ? '사용중' : '중지'}
                    </span>
                  </div>
                  {c.description && <p style={{ fontSize: '12px', color: t.textMuted, margin: '6px 0 0' }}>{c.description}</p>}
                </div>
                <button onClick={() => remove(c.id)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '13px', cursor: 'pointer' }}>삭제</button>
              </div>
              <p style={{ fontSize: '17px', fontWeight: 800, color: '#10b981', margin: 0 }}>{discountText(c)}</p>
              <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '8px', lineHeight: 1.7 }}>
                {c.min_amount > 0 && <p style={{ margin: 0 }}>· {c.min_amount.toLocaleString()}원 이상 주문 시</p>}
                <p style={{ margin: 0 }}>· 사용 {c.used_count}회{c.usage_limit ? ` / ${c.usage_limit}회` : ' (무제한)'}</p>
                <p style={{ margin: 0 }}>· 할인 제공 <b style={{ color: t.text }}>{(discByCode[c.code] || 0).toLocaleString()}원</b> <span style={{ color: t.textMuted }}>(내 부담)</span></p>
                {c.expires_at && <p style={{ margin: 0 }}>· {new Date(c.expires_at).toLocaleDateString('ko-KR')}까지</p>}
              </div>
              <button onClick={() => toggleActive(c)}
                style={{ marginTop: '14px', width: '100%', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 800, color: c.is_active ? t.textMuted : 'white', background: c.is_active ? t.input : 'linear-gradient(135deg,#34d399,#10b981)' }}>
                {c.is_active ? '사용 중지' : '다시 사용'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ ...card, width: '100%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${t.border}` }}>
              <p style={{ fontSize: '18px', fontWeight: 800, color: t.text, margin: 0 }}>🎟️ 쿠폰 발급</p>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: t.textMuted, fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={lbl}>쿠폰 코드 *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="예: FARM10" style={inp} />
                  <button onClick={genCode} style={{ padding: '0 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: t.input, color: t.text, whiteSpace: 'nowrap' }}>자동생성</button>
                </div>
              </div>
              <div><label style={lbl}>쿠폰 이름/설명</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="예: 신상품 출시 쿠폰" style={inp} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lbl}>할인 방식</label>
                  <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))} style={inp}>
                    <option value="percent">정률(%)</option><option value="amount">정액(원)</option>
                  </select></div>
                <div><label style={lbl}>{form.discount_type === 'percent' ? '할인율(%)' : '할인액(원)'} *</label>
                  <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder={form.discount_type === 'percent' ? '10' : '5000'} style={inp} /></div>
              </div>
              {form.discount_type === 'percent' && (
                <div><label style={lbl}>최대 할인액(원) · 선택</label>
                  <input type="number" value={form.max_discount} onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))} placeholder="비우면 무제한" style={inp} /></div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lbl}>최소 주문금액 · 선택</label>
                  <input type="number" value={form.min_amount} onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))} placeholder="0" style={inp} /></div>
                <div><label style={lbl}>사용 횟수 · 선택</label>
                  <input type="number" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} placeholder="무제한" style={inp} /></div>
              </div>
              <div><label style={lbl}>만료일 · 선택</label>
                <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} style={inp} /></div>
              <button onClick={save} disabled={saving} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', color: 'white', fontSize: '16px', fontWeight: 800, background: 'linear-gradient(135deg,#34d399,#10b981)', opacity: saving ? 0.6 : 1 }}>
                {saving ? '발급 중...' : '쿠폰 발급하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SupplierCouponsPage() {
  return <SupplierLayout><CouponsContent /></SupplierLayout>
}
