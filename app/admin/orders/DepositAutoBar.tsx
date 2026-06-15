'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

// 가상계좌 입금 자동확인 — 도매/소매/일반 주문 페이지 상단 공용 바.
// 자동 ON: 손님 입금 → 토스 신호 → 주문 '입금대기'→'입금완료' 자동 전환
// 자동 OFF: 입금돼도 그대로, 관리자가 '입금완료' 버튼 수동 클릭
export default function DepositAutoBar() {
  const supabase = createClient()
  const [auto, setAuto] = useState(true)
  const [last, setLast] = useState<{ at: string; note: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = async () => {
    const [{ data: dep }, { data: wh }] = await Promise.all([
      supabase.from('system_settings').select('value').eq('key', 'auto_deposit').maybeSingle(),
      supabase.from('system_settings').select('value').eq('key', 'webhook_last').maybeSingle(),
    ])
    setAuto(dep?.value !== 'off')
    if (wh?.value) {
      const [at, ...rest] = String(wh.value).split('|')
      setLast({ at, note: rest.join('|') })
    } else setLast(null)
    setLoaded(true)
  }
  useEffect(() => { load() }, [])

  const toggle = async () => {
    const next = auto ? 'off' : 'on'
    setAuto(!auto)
    await supabase.from('system_settings').delete().eq('key', 'auto_deposit')
    await supabase.from('system_settings').insert({ key: 'auto_deposit', value: next, updated_at: new Date().toISOString() })
  }

  const lastDate = last ? new Date(last.at) : null
  const fmt = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-4 mb-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            {lastDate && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${lastDate ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">
              🏦 가상계좌 입금 자동확인 <span className={auto ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>{auto ? '(자동)' : '(수동)'}</span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {auto
                ? '손님이 입금하면 주문이 ‘입금대기 → 입금완료’로 자동으로 바뀌어요.'
                : '입금돼도 그대로 있어요. 입금 확인 후 아래 주문에서 ‘입금완료’ 버튼을 직접 누르세요.'}
            </p>
          </div>
        </div>
        <button onClick={toggle}
          className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${auto ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'}`}>
          <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${auto ? 'translate-x-6' : ''}`} />
        </button>
      </div>
      {loaded && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pl-6">
          {lastDate
            ? `🟢 토스 연결됨 · 마지막 입금 신호: ${fmt(lastDate)}`
            : '⚪ 아직 토스에서 입금 신호를 받은 적이 없어요. (토스 웹훅 등록 후 첫 입금이 오면 켜져요)'}
        </p>
      )}
    </div>
  )
}
