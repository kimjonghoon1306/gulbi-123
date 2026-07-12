'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Question = {
  id: string
  product_id: string
  user_id: string
  author_name: string | null
  question: string
  answer: string | null
  answered_at: string | null
  is_secret: boolean
  created_at: string
  products?: { name: string; image_url: string | null } | null
}

export default function AdminQuestionsPage() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'answered' | 'all'>('pending')
  const [answerText, setAnswerText] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('product_questions')
      .select('*, products(name, image_url)')
      .order('created_at', { ascending: false })
    const list = (data as any) || []
    setQuestions(list)
    setAnswerText(Object.fromEntries(list.map((q: Question) => [q.id, q.answer || ''])))
    setLoading(false)
  }

  const saveAnswer = async (q: Question) => {
    const answer = (answerText[q.id] || '').trim()
    if (!answer) return alert('답변 내용을 입력해주세요.')
    setSaving(q.id)
    const { error } = await supabase
      .from('product_questions')
      .update({ answer, answered_at: new Date().toISOString() })
      .eq('id', q.id)
    setSaving('')
    if (error) { alert('답변 저장 실패: ' + error.message); return }
    await fetchAll()
  }

  const clearAnswer = async (q: Question) => {
    if (!confirm('답변을 대기 상태로 되돌릴까요?')) return
    setSaving(q.id)
    const { error } = await supabase
      .from('product_questions')
      .update({ answer: null, answered_at: null })
      .eq('id', q.id)
    setSaving('')
    if (error) { alert('수정 실패: ' + error.message); return }
    await fetchAll()
  }

  const filtered = questions.filter(q => {
    if (tab === 'pending') return !q.answer
    if (tab === 'answered') return !!q.answer
    return true
  })

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">💬 상품 Q&A</h1>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">손님 문의에 답변하고 상품 상세 Q&A에 노출합니다.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['pending', `답변대기 ${questions.filter(q => !q.answer).length}`],
          ['answered', `답변완료 ${questions.filter(q => !!q.answer).length}`],
          ['all', `전체 ${questions.length}`],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${tab === k ? 'text-white shadow-md' : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600'}`}
            style={tab === k ? { background:'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">표시할 문의가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(q => {
            const answered = !!q.answer
            return (
              <div key={q.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-700 flex-shrink-0">
                    {q.products?.image_url
                      ? <img src={q.products.image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🧺</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-base font-black text-slate-800 dark:text-white truncate">{q.products?.name || '(삭제된 상품)'}</p>
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${answered ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                        {answered ? '답변완료' : '답변대기'}
                      </span>
                      {q.is_secret && <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-500">비밀글</span>}
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{q.author_name || '익명'} · {new Date(q.created_at).toLocaleString('ko-KR')}</p>
                    <div className="rounded-xl bg-slate-50 dark:bg-gray-700/50 p-4 mb-3">
                      <p className="text-xs font-black text-emerald-600 mb-2">질문</p>
                      <p className="text-sm text-slate-700 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">{q.question}</p>
                    </div>
                    <textarea
                      value={answerText[q.id] || ''}
                      onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="관리자 답변을 입력하세요"
                      rows={4}
                      className="w-full rounded-xl border-2 border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-800 dark:text-white text-sm p-4 outline-none focus:border-emerald-500 resize-none leading-relaxed"
                    />
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => saveAnswer(q)} disabled={saving === q.id}
                        className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-60"
                        style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
                        {saving === q.id ? '저장 중...' : answered ? '답변 수정' : '답변 등록'}
                      </button>
                      {answered && (
                        <button onClick={() => clearAnswer(q)} disabled={saving === q.id}
                          className="px-4 py-3 rounded-xl text-sm font-bold border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all active:scale-95">
                          대기로
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
