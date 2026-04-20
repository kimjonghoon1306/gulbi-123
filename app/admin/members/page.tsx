'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type ShopMember = {
  id: string
  email: string
  name: string
  contact: string
  member_type: '일반' | '소매업' | '도매업'
  business_name: string
  business_number: string
  status: string
  created_at: string
}

const TYPE_COLOR: Record<string, string> = {
  '일반':  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  '소매업': 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  '도매업': 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
}

const STATUS_COLOR: Record<string, string> = {
  '승인':   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  '대기중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  '거절':   'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
}

const TYPE_ICON: Record<string, string> = {
  '일반': '🛒', '소매업': '🏪', '도매업': '🏭'
}

export default function MembersPage() {
  const [members, setMembers] = useState<ShopMember[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'전체' | '일반' | '소매업' | '도매업'>('전체')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ShopMember | null>(null)
  const [note, setNote] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('shop_members')
      .select('*')
      .order('created_at', { ascending: false })
    setMembers(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('shop_members').update({ status }).eq('id', id)
    setSelected(prev => prev ? { ...prev, status } : null)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status } : m))
  }

  const deleteMember = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('shop_members').delete().eq('id', id)
    setSelected(null)
    fetchAll()
  }

  const filtered = members.filter(m => {
    const matchTab = tab === '전체' || m.member_type === tab
    const matchSearch = !search ||
      m.name?.includes(search) ||
      m.email?.includes(search) ||
      m.contact?.includes(search) ||
      m.business_name?.includes(search)
    return matchTab && matchSearch
  })

  const counts = {
    전체: members.length,
    일반: members.filter(m => m.member_type === '일반').length,
    소매업: members.filter(m => m.member_type === '소매업').length,
    도매업: members.filter(m => m.member_type === '도매업').length,
  }

  const pendingCount = members.filter(m => m.status === '대기중').length

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">회원관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            쇼핑몰 가입 회원 통합 관리
            {pendingCount > 0 && (
              <span className="ml-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                승인 대기 {pendingCount}명
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 탭 + 검색 */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-2">
          {(['전체', '일반', '소매업', '도매업'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${tab === t
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700'}`}>
              {t !== '전체' && TYPE_ICON[t]} {t}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-white/20' : 'bg-slate-100 dark:bg-gray-700'}`}>
                {counts[t]}
              </span>
            </button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 이름 / 이메일 / 연락처 / 업체명 검색"
          className="flex-1 min-w-48 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      <div className="flex gap-4">
        {/* 회원 목록 */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">해당하는 회원이 없습니다</p>
            </div>
          ) : filtered.map(m => (
            <div key={m.id}
              onClick={() => { setSelected(m); setNote('') }}
              className={`flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer
                ${selected?.id === m.id ? 'bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-l-emerald-500' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                  ${m.member_type === '도매업' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' :
                    m.member_type === '소매업' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' :
                    'bg-slate-100 dark:bg-gray-700 text-slate-600'}`}>
                  {TYPE_ICON[m.member_type]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{m.name || '이름없음'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[m.member_type]}`}>
                      {m.member_type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.status] || STATUS_COLOR['대기중']}`}>
                      {m.status || '대기중'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-slate-400 dark:text-slate-500">{m.email}</p>
                    {m.contact && <p className="text-xs text-slate-400 dark:text-slate-500">📞 {m.contact}</p>}
                    {m.business_name && <p className="text-xs text-slate-400 dark:text-slate-500">🏢 {m.business_name}</p>}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-300 dark:text-slate-600">
                {new Date(m.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          ))}
        </div>

        {/* 상세 패널 */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white">회원 상세</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            {/* 프로필 */}
            <div className="text-center mb-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3
                ${selected.member_type === '도매업' ? 'bg-violet-100 dark:bg-violet-900/30' :
                  selected.member_type === '소매업' ? 'bg-teal-100 dark:bg-teal-900/30' :
                  'bg-slate-100 dark:bg-gray-700'}`}>
                {TYPE_ICON[selected.member_type]}
              </div>
              <p className="font-bold text-slate-800 dark:text-white">{selected.name}</p>
              <p className="text-xs text-slate-400 mt-1">{selected.email}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLOR[selected.member_type]}`}>
                  {selected.member_type}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[selected.status] || STATUS_COLOR['대기중']}`}>
                  {selected.status || '대기중'}
                </span>
              </div>
            </div>

            {/* 정보 */}
            <div className="space-y-2 mb-5 text-sm">
              {selected.contact && (
                <div className="flex justify-between">
                  <span className="text-slate-400">연락처</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{selected.contact}</span>
                </div>
              )}
              {selected.business_name && (
                <div className="flex justify-between">
                  <span className="text-slate-400">업체명</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{selected.business_name}</span>
                </div>
              )}
              {selected.business_number && (
                <div className="flex justify-between">
                  <span className="text-slate-400">사업자번호</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{selected.business_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">가입일</span>
                <span className="text-slate-700 dark:text-slate-300">{new Date(selected.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>

            {/* 승인/거절 버튼 (소매업/도매업만) */}
            {(selected.member_type === '소매업' || selected.member_type === '도매업') && (
              <div className="flex gap-2 mb-4">
                <button onClick={() => updateStatus(selected.id, '승인')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
                    ${selected.status === '승인'
                      ? 'bg-emerald-500 text-white'
                      : 'border border-emerald-300 dark:border-emerald-700 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
                  ✅ 승인
                </button>
                <button onClick={() => updateStatus(selected.id, '대기중')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
                    ${selected.status === '대기중'
                      ? 'bg-amber-400 text-white'
                      : 'border border-amber-300 dark:border-amber-700 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
                  ⏳ 대기
                </button>
                <button onClick={() => updateStatus(selected.id, '거절')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
                    ${selected.status === '거절'
                      ? 'bg-red-500 text-white'
                      : 'border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
                  ❌ 거절
                </button>
              </div>
            )}

            {/* 삭제 */}
            <button onClick={() => deleteMember(selected.id)}
              className="w-full py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900 transition-colors">
              회원 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
