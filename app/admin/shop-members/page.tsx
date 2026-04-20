'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type ShopMember = {
  id: string; email: string; name: string; contact: string
  member_type: string; business_name: string; business_number: string
  status: string; created_at: string; note: string
}

const TYPE_COLOR: Record<string, string> = {
  '일반': 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
  '소매업': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  '도매업': 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
}

const STATUS_COLOR: Record<string, string> = {
  '대기중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  '승인': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  '거절': 'bg-red-100 dark:bg-red-900/30 text-red-500',
}

export default function ShopMembersPage() {
  const [members, setMembers] = useState<ShopMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('전체')
  const [filterType, setFilterType] = useState('전체')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ShopMember | null>(null)
  const [note, setNote] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('shop_members')
      .select('*')
      .order('created_at', { ascending: false })
    setMembers(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('shop_members').update({ status, note }).eq('id', id)
    setSelected(null)
    setNote('')
    fetchMembers()
  }

  const filtered = members.filter(m => {
    const matchStatus = filterStatus === '전체' || m.status === filterStatus
    const matchType = filterType === '전체' || m.member_type === filterType
    const matchSearch = m.name?.includes(search) || m.email?.includes(search) || m.contact?.includes(search)
    return matchStatus && matchType && matchSearch
  })

  const pending = members.filter(m => m.status === '대기중').length

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">쇼핑몰 회원 관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">회원가입 신청 승인 및 회원 관리</p>
        </div>
        {pending > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2">
            <p className="text-amber-600 dark:text-amber-400 text-sm font-semibold">⏳ 승인 대기 {pending}명</p>
          </div>
        )}
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex gap-2">
          {['전체', '대기중', '승인', '거절'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${filterStatus === s ? 'bg-sky-500 text-white' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700'}`}>
              {s} {s !== '전체' && <span className="ml-1 opacity-70">{members.filter(m => m.status === s).length}</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['전체', '일반', '소매업', '도매업'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${filterType === t ? 'bg-violet-500 text-white' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 이름 / 이메일 / 연락처"
          className="flex-1 min-w-40 border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
      </div>

      {/* 회원 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🛍️</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">회원이 없습니다</p>
          </div>
        ) : filtered.map(m => (
          <div key={m.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300">
                {m.name?.[0] || '?'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800 dark:text-white">{m.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[m.member_type]}`}>{m.member_type}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[m.status]}`}>{m.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <p className="text-xs text-slate-400 dark:text-slate-500">{m.email}</p>
                  {m.contact && <p className="text-xs text-slate-400 dark:text-slate-500">📞 {m.contact}</p>}
                  {m.business_name && <p className="text-xs text-slate-400 dark:text-slate-500">🏢 {m.business_name}</p>}
                  {m.business_number && <p className="text-xs text-slate-400 dark:text-slate-500">{m.business_number}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-400 dark:text-slate-500 hidden md:block">
                {new Date(m.created_at).toLocaleDateString('ko-KR')}
              </p>
              {m.status === '대기중' && (
                <button onClick={() => { setSelected(m); setNote('') }}
                  className="text-xs bg-sky-500 hover:bg-sky-400 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  심사하기
                </button>
              )}
              {m.status !== '대기중' && (
                <button onClick={() => { setSelected(m); setNote(m.note || '') }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-600 transition-colors">
                  수정
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 심사 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">회원 심사</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800 dark:text-white">{selected.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[selected.member_type]}`}>{selected.member_type}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selected.email}</p>
                {selected.contact && <p className="text-sm text-slate-500 dark:text-slate-400">📞 {selected.contact}</p>}
                {selected.business_name && <p className="text-sm text-slate-500 dark:text-slate-400">🏢 {selected.business_name} ({selected.business_number})</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">메모 (선택)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  placeholder="거절 사유 등 메모를 입력하세요"
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => updateStatus(selected.id, '거절')}
                  className="py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-95">
                  ❌ 거절
                </button>
                <button onClick={() => updateStatus(selected.id, '승인')}
                  className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors active:scale-95 shadow-md shadow-emerald-500/20">
                  ✅ 승인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
