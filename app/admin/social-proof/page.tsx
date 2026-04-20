'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Comment = {
  id: string
  author: string
  content: string
  rating: number
  avatar_color: string
  avatar_color2: string
  created_label: string
  is_active: boolean
  sort_order: number
}

const AVATAR_PRESETS = [
  ['#ec4899','#f43f5e'],['#3b82f6','#6366f1'],['#059669','#0f766e'],
  ['#f59e0b','#f97316'],['#8b5cf6','#7c3aed'],['#06b6d4','#0284c7'],
]

export default function SocialProofPage() {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [visitorOverride, setVisitorOverride] = useState('')
  const [visitorSaved, setVisitorSaved] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Comment|null>(null)
  const [form, setForm] = useState({
    author: '', content: '', rating: 5,
    avatar_color: '#ec4899', avatar_color2: '#f43f5e',
    created_label: '방금 전', is_active: true, sort_order: 0
  })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: comms }, { data: vc }] = await Promise.all([
      supabase.from('social_proof_comments').select('*').order('sort_order'),
      supabase.from('system_settings').select('value').eq('key','visitor_count_override').single()
    ])
    setComments(comms || [])
    if (vc?.value) setVisitorOverride(vc.value)
    setLoading(false)
  }

  const saveVisitorCount = async () => {
    await supabase.from('system_settings').delete().eq('key','visitor_count_override')
    await supabase.from('system_settings').insert({ key:'visitor_count_override', value: visitorOverride, updated_at: new Date().toISOString() })
    setVisitorSaved(true)
    setTimeout(() => setVisitorSaved(false), 2000)
  }

  const openNew = () => {
    setEditItem(null)
    setForm({ author:'', content:'', rating:5, avatar_color:'#ec4899', avatar_color2:'#f43f5e', created_label:'방금 전', is_active:true, sort_order: comments.length })
    setShowForm(true)
  }

  const openEdit = (c: Comment) => {
    setEditItem(c)
    setForm({ author:c.author, content:c.content, rating:c.rating, avatar_color:c.avatar_color, avatar_color2:c.avatar_color2, created_label:c.created_label, is_active:c.is_active, sort_order:c.sort_order })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.author.trim() || !form.content.trim()) return
    if (editItem) {
      await supabase.from('social_proof_comments').update(form).eq('id', editItem.id)
    } else {
      await supabase.from('social_proof_comments').insert(form)
    }
    setShowForm(false)
    fetchAll()
  }

  const toggleActive = async (c: Comment) => {
    await supabase.from('social_proof_comments').update({ is_active: !c.is_active }).eq('id', c.id)
    fetchAll()
  }

  const deleteComment = async (id: string) => {
    if (!confirm('삭제할까요?')) return
    await supabase.from('social_proof_comments').delete().eq('id', id)
    fetchAll()
  }

  const TIME_LABELS = ['방금 전','1시간 전','2시간 전','어제','2일 전','3일 전','1주일 전','2주일 전','1달 전']

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">소셜 프루프 관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">구매 후기 · 방문자 수 · 팝업 설정</p>
        </div>
        <button onClick={openNew} className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95">
          + 후기 추가
        </button>
      </div>

      {/* 방문자수 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)'}}>👁️</div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white">실시간 방문자 수</h2>
            <p className="text-xs text-slate-400 mt-0.5">쇼핑몰 헤더에 표시되는 숫자 · 0이면 실제값 사용</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            value={visitorOverride}
            onChange={e => setVisitorOverride(e.target.value)}
            placeholder="예) 147"
            className="flex-1 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button onClick={saveVisitorCount}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)'}}>
            {visitorSaved ? '✅ 저장됨' : '저장'}
          </button>
        </div>
      </div>

      {/* 팝업 안내 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">💬 구매 팝업은 쇼핑몰에서 20초마다 자동으로 랜덤 이름 + 행동으로 표시됩니다. 아래 후기는 상세페이지 하단에 표시돼요.</p>
      </div>

      {/* 후기 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">불러오는 중...</div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-sm text-slate-400">등록된 후기가 없습니다</p>
          </div>
        ) : (
          <div>
            {comments.map(c => (
              <div key={c.id} className="flex items-start gap-4 px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{background:`linear-gradient(135deg,${c.avatar_color},${c.avatar_color2})`}}>
                  {(c.author||'익')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{c.author}</span>
                    <span className="text-xs text-slate-400">{c.created_label}</span>
                    <span className="text-xs">{'⭐'.repeat(c.rating)}</span>
                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 dark:bg-gray-700'}`}>
                      {c.is_active ? '표시중' : '숨김'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{c.content}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(c)} className="text-xs font-medium text-sky-500 hover:text-sky-600">
                    {c.is_active ? '숨기기' : '표시'}
                  </button>
                  <button onClick={() => openEdit(c)} className="text-xs font-medium text-slate-400 hover:text-slate-600">수정</button>
                  <button onClick={() => deleteComment(c.id)} className="text-xs font-medium text-red-400 hover:text-red-500">삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 후기 작성/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editItem ? '후기 수정' : '후기 추가'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* 아바타 컬러 */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">아바타 색상</label>
                <div className="flex gap-2">
                  {AVATAR_PRESETS.map(([c1,c2]) => (
                    <button key={c1} onClick={() => setForm({...form,avatar_color:c1,avatar_color2:c2})}
                      style={{background:`linear-gradient(135deg,${c1},${c2})`}}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${form.avatar_color===c1 ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">작성자 이름</label>
                <input value={form.author} onChange={e => setForm({...form,author:e.target.value})} placeholder="예) 김민준"
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">후기 내용</label>
                <textarea value={form.content} onChange={e => setForm({...form,content:e.target.value})} rows={4} placeholder="후기 내용을 입력하세요"
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">별점</label>
                  <select value={form.rating} onChange={e => setForm({...form,rating:Number(e.target.value)})}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400">
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{'⭐'.repeat(r)} {r}점</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">작성 시간</label>
                  <select value={form.created_label} onChange={e => setForm({...form,created_label:e.target.value})}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400">
                    {TIME_LABELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-500">표시 여부</label>
                <button onClick={() => setForm({...form,is_active:!form.is_active})}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.is_active ? 'bg-sky-500' : 'bg-slate-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.is_active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 text-sm font-medium">취소</button>
              <button onClick={save} className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95" style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)'}}>
                {editItem ? '수정 완료' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

