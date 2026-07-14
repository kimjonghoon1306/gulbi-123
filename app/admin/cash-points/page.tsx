'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Member = {
  id: string
  email: string | null
  name: string | null
  contact: string | null
  member_type: string | null
  business_name: string | null
}

type CashAccount = {
  user_id: string
  cash_balance: number | null
  point_balance: number | null
}

type CashWithdrawal = {
  id: string
  user_id: string
  amount: number
  bank_name: string | null
  bank_account: string | null
  bank_holder: string | null
  status: 'requested' | 'approved' | 'paid' | 'rejected'
  admin_memo: string | null
  requested_at: string
  processed_at: string | null
  processed_by: string | null
}

type AppSetting = {
  key: string
  value: unknown
}

type BalanceRow = {
  user_id: string
  cash_balance: number
  point_balance: number
  member?: Member
}

const WITHDRAW_STATUS_LABEL: Record<CashWithdrawal['status'], string> = {
  requested: '신청',
  approved: '승인',
  paid: '지급완료',
  rejected: '반려',
}

function formatWon(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString()}원`
}

function parseSettingBoolean(value: unknown) {
  if (value === true) return true
  if (value === false || value == null) return false
  if (typeof value === 'string') return value === 'true'
  if (typeof value === 'number') return value === 1
  return false
}

export default function CashPointsAdminPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [accounts, setAccounts] = useState<CashAccount[]>([])
  const [withdrawals, setWithdrawals] = useState<CashWithdrawal[]>([])
  const [pointEarnEnabled, setPointEarnEnabled] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingSetting, setSavingSetting] = useState(false)
  const [processingId, setProcessingId] = useState('')
  const [memoById, setMemoById] = useState<Record<string, string>>({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: accountRows }, { data: memberRows }, { data: withdrawalRows }, { data: settingRow }] = await Promise.all([
      supabase.from('cash_accounts').select('user_id,cash_balance,point_balance').order('cash_balance', { ascending: false }),
      supabase.from('shop_members').select('id,email,name,contact,member_type,business_name').order('created_at', { ascending: false }),
      supabase
        .from('cash_withdrawals')
        .select('id,user_id,amount,bank_name,bank_account,bank_holder,status,admin_memo,requested_at,processed_at,processed_by')
        .order('requested_at', { ascending: false })
        .limit(100),
      supabase.from('app_settings').select('key,value').eq('key', 'point_earn_enabled').maybeSingle(),
    ])
    setAccounts((accountRows as CashAccount[]) || [])
    setMembers((memberRows as Member[]) || [])
    setWithdrawals((withdrawalRows as CashWithdrawal[]) || [])
    setPointEarnEnabled(parseSettingBoolean((settingRow as AppSetting | null)?.value))
    setLoading(false)
  }

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const balanceRows = useMemo<BalanceRow[]>(() => {
    const rows = new Map<string, BalanceRow>()
    members.forEach((member) => rows.set(member.id, { user_id: member.id, cash_balance: 0, point_balance: 0, member }))
    accounts.forEach((account) => {
      rows.set(account.user_id, {
        user_id: account.user_id,
        cash_balance: Number(account.cash_balance || 0),
        point_balance: Number(account.point_balance || 0),
        member: memberById.get(account.user_id),
      })
    })
    return Array.from(rows.values()).sort((a, b) => (b.cash_balance + b.point_balance) - (a.cash_balance + a.point_balance))
  }, [accounts, memberById, members])

  const filteredBalances = balanceRows.filter((row) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const member = row.member
    return [
      member?.name,
      member?.email,
      member?.contact,
      member?.business_name,
      row.user_id,
    ].some((v) => String(v || '').toLowerCase().includes(q))
  })

  const requestedWithdrawals = withdrawals.filter((w) => w.status === 'requested')

  const togglePointEarn = async () => {
    const next = !pointEarnEnabled
    setSavingSetting(true)
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'point_earn_enabled', value: next }, { onConflict: 'key' })
    if (error) {
      console.error('[admin cash-points] setting update failed', error)
      alert('포인트 적립 설정 저장에 실패했습니다.')
    } else {
      setPointEarnEnabled(next)
    }
    setSavingSetting(false)
  }

  const processWithdrawal = async (id: string, status: 'approved' | 'paid' | 'rejected') => {
    const label = status === 'approved' ? '승인' : status === 'paid' ? '지급완료' : '반려'
    if (!confirm(`출금 신청을 ${label} 처리할까요?`)) return
    setProcessingId(id)
    const { error } = await supabase.rpc('cp_process_withdraw', {
      p_id: id,
      p_status: status,
      p_memo: memoById[id] || null,
    })
    if (error) {
      console.error('[admin cash-points] withdrawal process failed', error)
      alert(`출금 ${label} 처리에 실패했습니다.`)
    } else {
      await fetchAll()
    }
    setProcessingId('')
  }

  const totals = balanceRows.reduce((acc, row) => {
    acc.cash += row.cash_balance
    acc.point += row.point_balance
    return acc
  }, { cash: 0, point: 0 })

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">캐시·포인트 관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            캐시=온파트너 판매 정산금(출금 가능), 쇼핑포인트=온종일팜 결제 사용
          </p>
        </div>
        <button onClick={fetchAll}
          className="self-start rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-green-500/20 transition-colors hover:bg-green-500">
          새로고침
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-bold text-slate-400">총 캐시</p>
          <p className="mt-2 text-2xl font-black text-slate-800 dark:text-white">{formatWon(totals.cash)}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">온파트너 판매 정산금입니다. 회원은 온파트너에서 출금하거나 쇼핑포인트로 전환합니다.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-bold text-slate-400">총 쇼핑포인트</p>
          <p className="mt-2 text-2xl font-black text-green-600">{Number(totals.point).toLocaleString()} P</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">온종일팜 상품 구매에 사용하는 결제용 포인트입니다.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-400">온종일팜 자체 포인트 적립</p>
              <p className={`mt-2 text-xl font-black ${pointEarnEnabled ? 'text-green-600' : 'text-slate-400'}`}>{pointEarnEnabled ? 'ON' : 'OFF'}</p>
            </div>
            <button onClick={togglePointEarn} disabled={savingSetting}
              className={`relative h-8 w-14 rounded-full transition-colors ${pointEarnEnabled ? 'bg-green-600' : 'bg-slate-300 dark:bg-gray-600'} ${savingSetting ? 'opacity-60' : ''}`}>
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${pointEarnEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            켜면 온종일팜에서 구매·이벤트로 포인트를 지급할 수 있어요. 꺼도 온파트너에서 전환된 포인트는 사용 가능합니다.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-gray-700 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">회원별 캐시/포인트 잔액</h2>
            <p className="mt-1 text-xs text-slate-400">cash_accounts 행이 없는 회원은 0으로 표시됩니다.</p>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 / 이메일 / 연락처 / 업체명 검색"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white md:w-80" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-400 dark:bg-gray-900/50">
              <tr>
                <th className="px-5 py-3">회원</th>
                <th className="px-5 py-3">유형</th>
                <th className="px-5 py-3 text-right">캐시</th>
                <th className="px-5 py-3 text-right">쇼핑포인트</th>
                <th className="px-5 py-3">구분 안내</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">불러오는 중...</td></tr>
              ) : filteredBalances.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">검색 결과가 없습니다.</td></tr>
              ) : filteredBalances.map((row) => (
                <tr key={row.user_id} className="border-t border-slate-50 dark:border-gray-700/70">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800 dark:text-white">{row.member?.name || '회원정보 없음'}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{row.member?.email || row.user_id}</p>
                    {row.member?.contact && <p className="mt-0.5 text-xs text-slate-400">{row.member.contact}</p>}
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-300">{row.member?.member_type || '-'}</td>
                  <td className="px-5 py-4 text-right font-black text-slate-800 dark:text-white">{formatWon(row.cash_balance)}</td>
                  <td className="px-5 py-4 text-right font-black text-green-600">{row.point_balance.toLocaleString()} P</td>
                  <td className="px-5 py-4 text-xs leading-5 text-slate-400">캐시는 출금 가능 정산금, 쇼핑포인트는 온종일팜 결제용입니다.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-slate-100 p-5 dark:border-gray-700">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">출금 신청 관리</h2>
          <p className="mt-1 text-xs text-slate-400">신청 상태의 출금만 처리 버튼을 표시합니다. 처리는 cp_process_withdraw RPC를 통해 기록됩니다.</p>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-gray-700/70">
          {loading ? (
            <div className="p-12 text-center text-slate-400">불러오는 중...</div>
          ) : requestedWithdrawals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">대기 중인 출금 신청이 없습니다.</div>
          ) : requestedWithdrawals.map((w) => {
            const member = memberById.get(w.user_id)
            return (
              <div key={w.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_1.2fr_auto] lg:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-800 dark:text-white">{formatWon(w.amount)}</p>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">{WITHDRAW_STATUS_LABEL[w.status]}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{member?.name || '회원정보 없음'} · {member?.email || w.user_id}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(w.requested_at).toLocaleString('ko-KR')}</p>
                </div>
                <div className="text-xs leading-5 text-slate-500 dark:text-slate-300">
                  <p>은행: {w.bank_name || '-'}</p>
                  <p>계좌: {w.bank_account || '-'}</p>
                  <p>예금주: {w.bank_holder || '-'}</p>
                  <input value={memoById[w.id] || ''} onChange={(e) => setMemoById((prev) => ({ ...prev, [w.id]: e.target.value }))}
                    placeholder="관리자 메모"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button onClick={() => processWithdrawal(w.id, 'approved')} disabled={processingId === w.id}
                    className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-400 disabled:opacity-60">승인</button>
                  <button onClick={() => processWithdrawal(w.id, 'paid')} disabled={processingId === w.id}
                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-green-500 disabled:opacity-60">지급</button>
                  <button onClick={() => processWithdrawal(w.id, 'rejected')} disabled={processingId === w.id}
                    className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-400 disabled:opacity-60">반려</button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
