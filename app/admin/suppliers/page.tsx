'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Supplier = {
  id: string; email: string; company_name: string; representative: string
  business_number: string; contact: string; address: string; category: string
  status: string; note: string; created_at: string
}

const STATUS_COLOR: Record<string, string> = {
  '대기중': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  '승인':   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  '거절':   'bg-red-100 dark:bg-red-900/30 text-red-500',
}

export default function AdminSuppliersPage() {
  const supabase = createClient()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Supplier | null>(null)
  const [note, setNote] = useState('')
  const [filterStatus, setFilterStatus] = useState('전체')
  const [pendingProducts, setPendingProducts] = useState(0)  // 상품 승인 대기 건수 (안내용)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: sups }, { count }] = await Promise.all([
      supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
      // 공급업체 상품 중 승인 대기 건수만 카운트 (실제 승인은 '상품 관리'에서)
      supabase.from('products').select('id', { count: 'exact', head: true })
        .not('supplier_id', 'is', null).eq('approval_status', '대기중'),
    ])
    setSuppliers(sups || [])
    setPendingProducts(count || 0)
    setLoading(false)
  }

  const updateSupplierStatus = async (id: string, status: string) => {
    await supabase.from('suppliers').update({ status, note }).eq('id', id)
    setSelected(null); setNote(''); fetchAll()
  }

  const pendingSuppliers = suppliers.filter(s => s.status === '대기중').length
  const filteredSuppliers = suppliers.filter(s => filterStatus === '전체' || s.status === filterStatus)

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">공급업체 관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            공급업체 가입 승인 및 심사
            {pendingSuppliers > 0 && (
              <span className="ml-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">업체 대기 {pendingSuppliers}</span>
            )}
          </p>
        </div>
        <a href="/supplier/dashboard" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#111', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
          🏭 공급업체 포털 보기 →
        </a>
      </div>

      {/* 상품 승인은 '상품 관리'로 일원화 — 대기 건이 있으면 안내 링크 */}
      {pendingProducts > 0 && (
        <a href="/admin/products"
          className="flex items-center justify-between gap-3 mb-5 px-5 py-4 rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-xl">📦</span>
            <div>
              <p className="text-sm font-bold text-violet-700 dark:text-violet-300">승인 대기 중인 공급업체 상품 {pendingProducts}건</p>
              <p className="text-xs text-violet-500 dark:text-violet-400">상품 가격 확정·승인은 [상품 관리 › 공급업체 승인]에서 진행합니다.</p>
            </div>
          </div>
          <span className="text-sm font-bold text-violet-600 dark:text-violet-300 whitespace-nowrap">검토하러 가기 →</span>
        </a>
      )}

      {/* 공급업체(업체) 목록 + 심사 */}
      <div className="flex gap-2 mb-4">
        {['전체', '대기중', '승인', '거절'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${filterStatus === s ? 'bg-violet-500 text-white' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700'}`}>
            {s} <span className="ml-1 opacity-70">{s === '전체' ? suppliers.length : suppliers.filter(sup => sup.status === s).length}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">불러오는 중...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🏭</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">공급업체가 없습니다</p>
          </div>
        ) : filteredSuppliers.map(s => (
          <div key={s.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-lg">🏭</div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{s.company_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status] || STATUS_COLOR['대기중']}`}>{s.status}</span>
                  {s.category && <span className="text-xs text-slate-400 dark:text-slate-500">{s.category}</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs text-slate-400 dark:text-slate-500">{s.email}</p>
                  {s.contact && <p className="text-xs text-slate-400 dark:text-slate-500">📞 {s.contact}</p>}
                  {s.business_number && <p className="text-xs text-slate-400 dark:text-slate-500">{s.business_number}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-300 dark:text-slate-600 hidden md:block">{new Date(s.created_at).toLocaleDateString('ko-KR')}</p>
              <button onClick={() => { setSelected(s); setNote(s.note || '') }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${s.status === '대기중' ? 'bg-violet-500 hover:bg-violet-400 text-white' : 'text-slate-400 border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700'}`}>
                {s.status === '대기중' ? '심사하기' : '수정'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 공급업체 심사 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">공급업체 심사</h2>
              <button onClick={() => { setSelected(null); setNote('') }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">업체명</span><span className="font-semibold text-slate-800 dark:text-white">{selected.company_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">대표자</span><span className="text-slate-700 dark:text-slate-300">{selected.representative || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">사업자번호</span><span className="text-slate-700 dark:text-slate-300">{selected.business_number || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">연락처</span><span className="text-slate-700 dark:text-slate-300">{selected.contact || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">취급 품목</span><span className="text-slate-700 dark:text-slate-300">{selected.category || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">주소</span><span className="text-slate-700 dark:text-slate-300 text-right max-w-48">{selected.address || '-'}</span></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">메모 (선택)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  placeholder="거절 사유 등 메모"
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => updateSupplierStatus(selected.id, '거절')}
                  className="py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800 text-sm font-bold hover:bg-red-100 transition-colors active:scale-95">
                  ❌ 거절
                </button>
                <button onClick={() => updateSupplierStatus(selected.id, '승인')}
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
