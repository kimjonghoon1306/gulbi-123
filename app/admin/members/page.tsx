'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type ShopMember = {
  id: string; email: string; name: string; contact: string
  member_type: '일반' | '소매업' | '도매업'
  business_name: string; business_number: string
  status: string; created_at: string; note: string
}

const TYPE_COLOR: Record<string, string> = {
  '일반':  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  '소매업': 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  '도매업': 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
}

const STATUS_COLOR: Record<string, string> = {
  '대기중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  '승인':   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  '거절':   'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
}

const TYPE_ICON: Record<string, string> = { '일반': '🛒', '소매업': '🏪', '도매업': '🏭' }

export default function MembersPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<ShopMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('전체')
  const [filterType, setFilterType] = useState('전체')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ShopMember | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase.from('shop_members').select('*').order('created_at', { ascending: false })
    setMembers(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('shop_members').update({ status, note }).eq('id', id)
    setSelected(null); setNote(''); fetchAll()
  }

  const deleteMember = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('cart_items').delete().eq('user_id', id)
    await supabase.from('shop_members').delete().eq('id', id)
    await supabase.rpc('delete_auth_user', { user_id: id })
    setSelected(null); fetchAll()
  }

  const filtered = members.filter(m => {
    const matchStatus = filterStatus === '전체' || m.status === filterStatus
    const matchType   = filterType === '전체'   || m.member_type === filterType
    const matchSearch = !search || m.name?.includes(search) || m.email?.includes(search) || m.contact?.includes(search) || m.business_name?.includes(search)
    return matchStatus && matchType && matchSearch
  })

  const pending = members.filter(m => m.status === '대기중').length

  const counts = {
    전체:   members.length,
    일반:   members.filter(m => m.member_type === '일반').length,
    소매업: members.filter(m => m.member_type === '소매업').length,
    도매업: members.filter(m => m.member_type === '도매업').length,
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">회원관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            쇼핑몰 가입 회원 통합 관리
            {pending > 0 && (
              <span className="ml-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                승인 대기 {pending}명
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {/* 상태 필터 */}
        <div className="flex gap-2">
          {['전체', '대기중', '승인', '거절'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${filterStatus === s ? 'bg-sky-500 text-white' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700'}`}>
              {s} {s !== '전체' && <span className="ml-1 opacity-70">{members.filter(m => m.status === s).length}</span>}
            </button>
          ))}
        </div>
        {/* 타입 필터 */}
        <div className="flex gap-2">
          {(['전체', '일반', '소매업', '도매업'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1
                ${filterType === t ? 'bg-violet-500 text-white' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700'}`}>
              {t !== '전체' && TYPE_ICON[t]} {t}
              <span className={`text-xs px-1 py-0.5 rounded-full text-[10px] ${filterType === t ? 'bg-white/20' : 'bg-slate-100 dark:bg-gray-700'}`}>
                {counts[t]}
              </span>
            </button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 이름 / 이메일 / 연락처 / 업체명"
          className="flex-1 min-w-48 border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
      </div>

      {/* 회원 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">해당하는 회원이 없습니다</p>
          </div>
        ) : filtered.map(m => (
          <div key={m.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold
                ${m.member_type === '도매업' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' :
                  m.member_type === '소매업' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' :
                  'bg-slate-100 dark:bg-gray-700 text-slate-600'}`}>
                {TYPE_ICON[m.member_type]}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{m.name || '이름없음'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[m.member_type]}`}>{m.member_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.status] || STATUS_COLOR['대기중']}`}>{m.status || '대기중'}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <p className="text-xs text-slate-400 dark:text-slate-500">{m.email}</p>
                  {m.contact && <p className="text-xs text-slate-400 dark:text-slate-500">📞 {m.contact}</p>}
                  {m.business_name && <p className="text-xs text-slate-400 dark:text-slate-500">🏢 {m.business_name}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-300 dark:text-slate-600 hidden md:block">{new Date(m.created_at).toLocaleDateString('ko-KR')}</p>
              {(m.member_type === '소매업' || m.member_type === '도매업') && (
                <button onClick={() => { setSelected(m); setNote(m.note || '') }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${m.status === '대기중' ? 'bg-sky-500 hover:bg-sky-400 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-gray-600'}`}>
                  {m.status === '대기중' ? '심사하기' : '수정'}
                </button>
              )}
              <button onClick={() => deleteMember(m.id)}
                className="text-xs text-red-400 hover:text-red-500 font-medium px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                삭제
              </button>
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
              <button onClick={() => { setSelected(null); setNote('') }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800 dark:text-white">{selected.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[selected.member_type]}`}>{selected.member_type}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[selected.status] || STATUS_COLOR['대기중']}`}>{selected.status}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selected.email}</p>
                {selected.contact && <p className="text-sm text-slate-500 dark:text-slate-400">📞 {selected.contact}</p>}
                {selected.business_name && <p className="text-sm text-slate-500 dark:text-slate-400">🏢 {selected.business_name} {selected.business_number && `(${selected.business_number})`}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">메모 (선택)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  placeholder="거절 사유 등 메모를 입력하세요"
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => updateStatus(selected.id, '거절')}
                  className={`py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${selected.status === '거절' ? 'bg-red-500 text-white' : 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-100'}`}>
                  ❌ 거절
                </button>
                <button onClick={() => updateStatus(selected.id, '대기중')}
                  className={`py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${selected.status === '대기중' ? 'bg-amber-400 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'}`}>
                  ⏳ 대기
                </button>
                <button onClick={() => updateStatus(selected.id, '승인')}
                  className={`py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md ${selected.status === '승인' ? 'bg-emerald-500 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'}`}>
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
