'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import SocialProofFormModal from './_SocialProofFormModal'

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
  product_id: string | null
}

type Product = { id: string; name: string; image_url: string }

const AVATAR_PRESETS = [
  ['#ec4899','#f43f5e'],['#3b82f6','#6366f1'],['#059669','#14532d'],
  ['#f59e0b','#f97316'],['#8b5cf6','#7c3aed'],['#06b6d4','#0284c7'],
]

export default function SocialProofPage() {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [visitorOverride, setVisitorOverride] = useState('')
  const [visitorSaved, setVisitorSaved] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Comment|null>(null)
  const [productFilter, setProductFilter] = useState<'all' | string>('all')
  const [form, setForm] = useState({
    author: '', content: '', rating: 5,
    avatar_color: '#ec4899', avatar_color2: '#f43f5e',
    created_label: '방금 전', is_active: true, sort_order: 0,
    product_id: null as string | null,
  })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: comms }, { data: vc }, { data: prods }] = await Promise.all([
      supabase.from('social_proof_comments').select('*').order('sort_order'),
      supabase.from('system_settings').select('value').eq('key','visitor_count_override').single(),
      supabase.from('products').select('id, name, image_url').eq('is_active', true).order('created_at', { ascending: false }),
    ])
    setComments(comms || [])
    setProducts(prods || [])
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
    setForm({ author:'', content:'', rating:5, avatar_color:'#ec4899', avatar_color2:'#f43f5e', created_label:'방금 전', is_active:true, sort_order: comments.length, product_id: null })
    setShowForm(true)
  }

  const openEdit = (c: Comment) => {
    setEditItem(c)
    setForm({ author:c.author, content:c.content, rating:c.rating, avatar_color:c.avatar_color, avatar_color2:c.avatar_color2, created_label:c.created_label, is_active:c.is_active, sort_order:c.sort_order, product_id: c.product_id })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.author.trim() || !form.content.trim()) return
    const data = { ...form, product_id: form.product_id || null }
    if (editItem) {
      await supabase.from('social_proof_comments').update(data).eq('id', editItem.id)
    } else {
      await supabase.from('social_proof_comments').insert(data)
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

  // 필터된 댓글
  const filteredComments = productFilter === 'all'
    ? comments
    : productFilter === 'global'
    ? comments.filter(c => !c.product_id)
    : comments.filter(c => c.product_id === productFilter)

  const getProductName = (id: string | null) => {
    if (!id) return null
    return products.find(p => p.id === id)?.name || '삭제된 상품'
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">소셜 프루프 관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">구매 후기 · 방문자 수 · 팝업 설정</p>
        </div>
        <button onClick={openNew} className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95">
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
          <input type="number" value={visitorOverride} onChange={e => setVisitorOverride(e.target.value)} placeholder="예) 147"
            className="flex-1 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <button onClick={saveVisitorCount} className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95" style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)'}}>
            {visitorSaved ? '✅ 저장됨' : '저장'}
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          💬 후기를 특정 상품에 연결하면 그 상품 상세페이지에만 표시됩니다. 상품을 선택하지 않으면 모든 상품에 공통으로 표시됩니다.
        </p>
      </div>

      {/* 상품별 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setProductFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${productFilter === 'all' ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-slate-400 border border-slate-200 dark:border-gray-700'}`}>
          전체 ({comments.length})
        </button>
        <button onClick={() => setProductFilter('global')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${productFilter === 'global' ? 'bg-slate-700 text-white' : 'bg-white dark:bg-gray-800 text-slate-400 border border-slate-200 dark:border-gray-700'}`}>
          🌐 공통 ({comments.filter(c => !c.product_id).length})
        </button>
        {products.filter(p => comments.some(c => c.product_id === p.id)).map(p => (
          <button key={p.id} onClick={() => setProductFilter(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${productFilter === p.id ? 'bg-pink-500 text-white' : 'bg-white dark:bg-gray-800 text-slate-400 border border-slate-200 dark:border-gray-700'}`}>
            {p.image_url && <img src={p.image_url} alt="" className="w-4 h-4 rounded object-cover" />}
            {p.name} ({comments.filter(c => c.product_id === p.id).length})
          </button>
        ))}
      </div>

      {/* 후기 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">불러오는 중...</div>
        ) : filteredComments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-sm text-slate-400">등록된 후기가 없습니다</p>
          </div>
        ) : (
          <div>
            {filteredComments.map(c => (
              <div key={c.id} className="flex items-start gap-4 px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{background:`linear-gradient(135deg,${c.avatar_color},${c.avatar_color2})`}}>
                  {(c.author||'익')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{c.author}</span>
                    <span className="text-xs text-slate-400">{c.created_label}</span>
                    <span className="text-xs">{'⭐'.repeat(c.rating)}</span>
                    {/* 상품 태그 */}
                    {c.product_id ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-500 border border-pink-100 dark:border-pink-800">
                        🧺 {getProductName(c.product_id)}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-gray-700 text-slate-400">
                        🌐 공통
                      </span>
                    )}
                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 dark:bg-gray-700'}`}>
                      {c.is_active ? '표시중' : '숨김'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{c.content}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(c)} className="text-xs font-medium text-green-600 hover:text-green-700">
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
      <SocialProofFormModal
        showForm={showForm}
        setShowForm={setShowForm}
        editItem={editItem}
        form={form}
        setForm={setForm}
        products={products}
        timeLabels={TIME_LABELS}
        avatarPresets={AVATAR_PRESETS}
        save={save}
      />
    </div>
  )
}
