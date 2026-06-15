'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Supplier = { id: string; company_name: string; representative?: string; commission_rate?: number | null }
type Settlement = {
  id: string; supplier_id: string; period_start: string; period_end: string
  total_sales: number; commission_rate: number; commission: number
  settlement_amount: number; status: string; note: string | null; settled_at: string | null; created_at: string
}

const ITEM_TABLES = [
  { name: 'general_order_items', orderTable: 'general_orders' },
  { name: 'retail_order_items', orderTable: 'retail_orders' },
  { name: 'wholesale_order_items', orderTable: 'wholesale_orders' },
]
// 정산 대상 주문 상태(매출 확정된 것만)
const PAID_STATUS = ['입금완료', '결제완료', '준비중', '출고', '완료']

const won = (n: number) => '₩' + Math.round(n || 0).toLocaleString('ko-KR')
const today = () => new Date().toISOString().split('T')[0]
const monthAgo = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] }

export default function SettlementsPage() {
  const supabase = createClient()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [supplierId, setSupplierId] = useState('')
  const [from, setFrom] = useState(monthAgo())
  const [to, setTo] = useState(today())
  const [rate, setRate] = useState(10)
  const [calc, setCalc] = useState<{ sales: number; orders: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: sup }, { data: set }] = await Promise.all([
      supabase.from('suppliers').select('id, company_name, representative, commission_rate').order('company_name'),
      supabase.from('settlements').select('*').order('created_at', { ascending: false }),
    ])
    setSuppliers(sup || [])
    setSettlements(set || [])
    setLoading(false)
  }

  // 선택 공급사+기간의 판매액 집계
  const calculate = async () => {
    if (!supplierId) { setMsg('공급사를 선택하세요.'); return }
    setBusy(true); setMsg(''); setCalc(null)
    try {
      let sales = 0, orderCount = 0
      const seen = new Set<string>()
      for (const t of ITEM_TABLES) {
        const { data } = await supabase
          .from(t.name)
          .select(`total_price, order_id, ${t.orderTable}(created_at, status)`)
          .eq('supplier_id', supplierId)
        for (const it of (data || []) as any[]) {
          const o = it[t.orderTable]
          if (!o) continue
          const d = (o.created_at || '').split('T')[0]
          if (d < from || d > to) continue
          if (!PAID_STATUS.includes(o.status)) continue
          sales += Number(it.total_price) || 0
          if (!seen.has(t.name + it.order_id)) { seen.add(t.name + it.order_id); orderCount++ }
        }
      }
      setCalc({ sales, orders: orderCount })
      if (sales === 0) setMsg('해당 기간에 정산할 매출이 없어요. (결제·입금 완료된 주문 기준)')
    } finally { setBusy(false) }
  }

  // 공급사 선택 시 기본 수수료율 반영
  useEffect(() => {
    const s = suppliers.find(x => x.id === supplierId)
    if (s?.commission_rate != null) setRate(Number(s.commission_rate))
    setCalc(null)
  }, [supplierId, suppliers])

  const create = async () => {
    if (!supplierId || !calc || calc.sales <= 0) { setMsg('먼저 매출을 계산하세요.'); return }
    setBusy(true); setMsg('')
    const commission = Math.round(calc.sales * rate / 100)
    const settlement_amount = calc.sales - commission
    const { error } = await supabase.from('settlements').insert({
      supplier_id: supplierId,
      period_start: from, period_end: to,
      total_sales: calc.sales, commission_rate: rate, commission,
      settlement_amount, status: '정산예정',
      note: null,
    })
    setBusy(false)
    if (error) { setMsg('정산 생성 실패: ' + error.message); return }
    setMsg('✅ 정산을 생성했어요. 공급사 매출 화면에 표시됩니다.')
    setCalc(null)
    fetchAll()
  }

  const markPaid = async (id: string) => {
    if (!confirm('이 정산을 지급완료로 처리할까요?')) return
    await supabase.from('settlements').update({ status: '정산완료', settled_at: new Date().toISOString() }).eq('id', id)
    fetchAll()
  }
  const remove = async (id: string) => {
    if (!confirm('이 정산을 삭제할까요?')) return
    await supabase.from('settlements').delete().eq('id', id)
    fetchAll()
  }

  const supName = (id: string) => suppliers.find(s => s.id === id)?.company_name || id.slice(0, 8)
  const card = 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl'
  const input = 'rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-emerald-500'

  return (
    <div className="animate-fadeIn">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">공급사 정산</h1>
      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5 mb-5">공급사별 판매액을 집계해 수수료를 떼고 정산 금액을 만들어요. 만든 정산은 공급사 매출 화면에 표시돼요.</p>

      {/* 정산 만들기 */}
      <div className={card + ' p-5 mb-5'}>
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">＋ 정산 만들기</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">공급사</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={input + ' min-w-[160px]'}>
              <option value="">선택하세요</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">시작일</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={input} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">종료일</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={input} />
          </div>
          <button onClick={calculate} disabled={busy}
            className="rounded-lg bg-slate-700 dark:bg-gray-600 text-white text-sm font-bold px-4 py-2 disabled:opacity-50">
            {busy ? '계산 중…' : '매출 계산'}
          </button>
        </div>

        {calc && calc.sales > 0 && (
          <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800 p-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="text-slate-600 dark:text-slate-300">기간 매출 <b className="text-slate-900 dark:text-white">{won(calc.sales)}</b> ({calc.orders}건)</span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                수수료율
                <input type="number" value={rate} min={0} max={100} onChange={e => setRate(Number(e.target.value) || 0)} className={input + ' w-16 py-1'} />%
              </span>
              <span className="text-slate-600 dark:text-slate-300">수수료 <b className="text-rose-500">−{won(Math.round(calc.sales * rate / 100))}</b></span>
              <span className="text-slate-700 dark:text-slate-200 font-bold">정산금액 <b className="text-emerald-600 dark:text-emerald-400">{won(calc.sales - Math.round(calc.sales * rate / 100))}</b></span>
            </div>
            <button onClick={create} disabled={busy}
              className="mt-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 disabled:opacity-50">
              이 내용으로 정산 생성
            </button>
          </div>
        )}
        {msg && <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{msg}</p>}
      </div>

      {/* 정산 내역 */}
      <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">정산 내역 ({settlements.length})</p>
      {loading ? (
        <div className={card + ' p-10 text-center text-slate-400'}>불러오는 중…</div>
      ) : settlements.length === 0 ? (
        <div className={card + ' p-10 text-center text-slate-400'}>아직 만든 정산이 없어요. 위에서 공급사·기간을 골라 정산을 만들어 보세요.</div>
      ) : (
        <div className="space-y-2">
          {settlements.map(s => (
            <div key={s.id} className={card + ' p-4 flex flex-wrap items-center gap-3'}>
              <div className="flex-1 min-w-[180px]">
                <p className="font-bold text-slate-800 dark:text-white text-sm">{supName(s.supplier_id)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.period_start} ~ {s.period_end} · 매출 {won(s.total_sales)} · 수수료 {s.commission_rate}%</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{won(s.settlement_amount)}</p>
                <span className={`text-xs font-bold ${s.status === '정산완료' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {s.status === '정산완료' ? '✅ 지급완료' : '⏳ 정산예정'}
                </span>
              </div>
              <div className="flex gap-2">
                {s.status !== '정산완료' && (
                  <button onClick={() => markPaid(s.id)} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5">지급완료</button>
                )}
                <button onClick={() => remove(s.id)} className="text-xs text-rose-400 hover:text-rose-500 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-1.5">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
