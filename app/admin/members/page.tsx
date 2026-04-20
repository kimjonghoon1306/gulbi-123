'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type WholesaleMember = {
  id: string; company_name: string; business_number: string; manager_name: string
  contact: string; address: string; email: string; note: string; is_active: boolean; created_at: string
}
type RetailMember = {
  id: string; name: string; contact: string; address: string
  email: string; note: string; is_active: boolean; created_at: string
}

export default function MembersPage() {
  const [tab, setTab] = useState<'wholesale' | 'retail'>('wholesale')
  const [wholesaleMembers, setWholesaleMembers] = useState<WholesaleMember[]>([])
  const [retailMembers, setRetailMembers] = useState<RetailMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editW, setEditW] = useState<WholesaleMember | null>(null)
  const [editR, setEditR] = useState<RetailMember | null>(null)
  const [search, setSearch] = useState('')
  const [wForm, setWForm] = useState({ company_name: '', business_number: '', manager_name: '', contact: '', address: '', email: '', note: '', is_active: true })
  const [rForm, setRForm] = useState({ name: '', contact: '', address: '', email: '', note: '', is_active: true })
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: w }, { data: r }] = await Promise.all([
      supabase.from('wholesale_members').select('*').order('created_at', { ascending: false }),
      supabase.from('retail_members').select('*').order('created_at', { ascending: false })
    ])
    setWholesaleMembers(w || [])
    setRetailMembers(r || [])
    setLoading(false)
  }

  const resetForm = () => {
    setWForm({ company_name: '', business_number: '', manager_name: '', contact: '', address: '', email: '', note: '', is_active: true })
    setRForm({ name: '', contact: '', address: '', email: '', note: '', is_active: true })
    setEditW(null); setEditR(null); setShowForm(false)
  }

  const openEditW = (m: WholesaleMember) => {
    setEditW(m)
    setWForm({ company_name: m.company_name, business_number: m.business_number || '', manager_name: m.manager_name || '', contact: m.contact || '', address: m.address || '', email: m.email || '', note: m.note || '', is_active: m.is_active })
    setShowForm(true)
  }

  const openEditR = (m: RetailMember) => {
    setEditR(m)
    setRForm({ name: m.name, contact: m.contact || '', address: m.address || '', email: m.email || '', note: m.note || '', is_active: m.is_active })
    setShowForm(true)
  }

  const saveW = async () => {
    if (!wForm.company_name) return alert('업체명을 입력해주세요.')
    if (editW) {
      await supabase.from('wholesale_members').update(wForm).eq('id', editW.id)
    } else {
      await supabase.from('wholesale_members').insert(wForm)
    }
    resetForm(); fetchAll()
  }

  const saveR = async () => {
    if (!rForm.name) return alert('이름을 입력해주세요.')
    if (editR) {
      await supabase.from('retail_members').update(rForm).eq('id', editR.id)
    } else {
      await supabase.from('retail_members').insert(rForm)
    }
    resetForm(); fetchAll()
  }

  const deleteW = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('wholesale_members').delete().eq('id', id)
    fetchAll()
  }

  const deleteR = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('retail_members').delete().eq('id', id)
    fetchAll()
  }

  const filteredW = wholesaleMembers.filter(m => m.company_name.includes(search) || m.contact?.includes(search) || m.manager_name?.includes(search))
  const filteredR = retailMembers.filter(m => m.name.includes(search) || m.contact?.includes(search))

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">회원관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">도매·소매 회원 등록 및 관리</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-emerald-500/20">
          + 회원 등록
        </button>
      </div>

      {/* 탭 + 검색 */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-2">
          {[{ key: 'wholesale', label: '🏢 도매회원', count: wholesaleMembers.length },
            { key: 'retail', label: '👤 소매회원', count: retailMembers.length }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${tab === t.key ? 'bg-emerald-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700'}`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-slate-100 dark:bg-gray-700'}`}>{t.count}</span>
            </button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 이름 / 연락처 검색"
          className="flex-1 min-w-48 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {/* 도매 회원 목록 */}
      {tab === 'wholesale' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">불러오는 중...</div>
          ) : filteredW.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">🏢</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">등록된 도매 회원이 없습니다</p>
            </div>
          ) : filteredW.map(m => (
            <div key={m.id} className="flex items-center justify-between px-6 py-5 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  {m.company_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-white">{m.company_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-gray-700 text-slate-400'}`}>
                      {m.is_active ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {m.manager_name && <p className="text-xs text-slate-400 dark:text-slate-500">👤 {m.manager_name}</p>}
                    {m.contact && <p className="text-xs text-slate-400 dark:text-slate-500">📞 {m.contact}</p>}
                    {m.business_number && <p className="text-xs text-slate-400 dark:text-slate-500">🏢 {m.business_number}</p>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditW(m)} className="text-xs text-emerald-500 hover:text-emerald-600 font-medium px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">수정</button>
                <button onClick={() => deleteW(m.id)} className="text-xs text-red-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 소매 회원 목록 */}
      {tab === 'retail' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">불러오는 중...</div>
          ) : filteredR.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">👤</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">등록된 소매 회원이 없습니다</p>
            </div>
          ) : filteredR.map(m => (
            <div key={m.id} className="flex items-center justify-between px-6 py-5 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-sm">
                  {m.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-white">{m.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-gray-700 text-slate-400'}`}>
                      {m.is_active ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {m.contact && <p className="text-xs text-slate-400 dark:text-slate-500">📞 {m.contact}</p>}
                    {m.address && <p className="text-xs text-slate-400 dark:text-slate-500">📍 {m.address}</p>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditR(m)} className="text-xs text-emerald-500 hover:text-emerald-600 font-medium px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">수정</button>
                <button onClick={() => deleteR(m.id)} className="text-xs text-red-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {tab === 'wholesale' ? (editW ? '도매회원 수정' : '도매회원 등록') : (editR ? '소매회원 수정' : '소매회원 등록')}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {tab === 'wholesale' ? (
                <>
                  {[
                    { label: '업체명 *', key: 'company_name', placeholder: '예) 목포 수산' },
                    { label: '사업자번호', key: 'business_number', placeholder: '000-00-00000' },
                    { label: '담당자', key: 'manager_name', placeholder: '담당자 이름' },
                    { label: '연락처', key: 'contact', placeholder: '010-0000-0000' },
                    { label: '이메일', key: 'email', placeholder: 'example@email.com' },
                    { label: '주소', key: 'address', placeholder: '업체 주소' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={(wForm as any)[f.key]}
                        onChange={e => setWForm({ ...wForm, [f.key]: e.target.value })}
                        className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">메모</label>
                    <textarea value={wForm.note} onChange={e => setWForm({ ...wForm, note: e.target.value })} rows={2} placeholder="특이사항"
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">활성 상태</label>
                    <button onClick={() => setWForm({ ...wForm, is_active: !wForm.is_active })}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${wForm.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${wForm.is_active ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{wForm.is_active ? '활성' : '비활성'}</span>
                  </div>
                </>
              ) : (
                <>
                  {[
                    { label: '이름 *', key: 'name', placeholder: '예) 홍길동' },
                    { label: '연락처', key: 'contact', placeholder: '010-0000-0000' },
                    { label: '이메일', key: 'email', placeholder: 'example@email.com' },
                    { label: '주소', key: 'address', placeholder: '배송 주소' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={(rForm as any)[f.key]}
                        onChange={e => setRForm({ ...rForm, [f.key]: e.target.value })}
                        className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">메모</label>
                    <textarea value={rForm.note} onChange={e => setRForm({ ...rForm, note: e.target.value })} rows={2} placeholder="특이사항"
                      className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">활성 상태</label>
                    <button onClick={() => setRForm({ ...rForm, is_active: !rForm.is_active })}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${rForm.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${rForm.is_active ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{rForm.is_active ? '활성' : '비활성'}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">취소</button>
              <button onClick={tab === 'wholesale' ? saveW : saveR} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors active:scale-95">
                {(tab === 'wholesale' ? editW : editR) ? '수정 완료' : '등록 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
