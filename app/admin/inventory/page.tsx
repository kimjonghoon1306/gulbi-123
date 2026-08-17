'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Pager } from '@/app/components/Pager'

const PER = 10

type Product = { id: string; name: string; stock: number; min_stock: number; unit: string; category_id: string }
type Log = { id: string; product_name: string; type: string; quantity: number; note: string; created_at: string }

export default function InventoryPage() {
  const [tab, setTab] = useState<'stock' | 'logs'>('stock')
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showMinForm, setShowMinForm] = useState<Product | null>(null)
  const [minStock, setMinStock] = useState('')
  const [form, setForm] = useState({ product_id: '', type: '입고', quantity: '', note: '' })
  const [stockPage, setStockPage] = useState(1)
  const [logPage, setLogPage] = useState(1)
  const supabase = createClient()
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const stockTotalPages = Math.max(1, Math.ceil(products.length / PER))
  const stockPg = Math.min(stockPage, stockTotalPages)
  const pagedProducts = products.slice((stockPg - 1) * PER, stockPg * PER)
  const logTotalPages = Math.max(1, Math.ceil(logs.length / PER))
  const logPg = Math.min(logPage, logTotalPages)
  const pagedLogs = logs.slice((logPg - 1) * PER, logPg * PER)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: p }, { data: l }] = await Promise.all([
      supabase.from('products').select('id, name, stock, min_stock, unit, category_id').order('name'),
      supabase.from('inventory_logs').select('*').order('created_at', { ascending: false }).limit(100)
    ])
    setProducts(p || [])
    setLogs(l || [])
    setLoading(false)
  }

  const saveLog = async () => {
    if (!form.product_id) return alert('상품을 선택해주세요.')
    if (!form.quantity || Number(form.quantity) <= 0) return alert('수량을 입력해주세요.')
    const product = products.find(p => p.id === form.product_id)
    if (!product) return
    const qty = Number(form.quantity)
    const newStock = form.type === '입고' ? product.stock + qty : product.stock - qty
    if (newStock < 0) return alert('재고가 부족합니다.')
    await supabase.from('inventory_logs').insert({
      product_id: form.product_id, product_name: product.name,
      type: form.type, quantity: qty, note: form.note
    })
    await supabase.from('products').update({ stock: newStock }).eq('id', form.product_id)
    setForm({ product_id: '', type: '입고', quantity: '', note: '' })
    setShowForm(false)
    fetchAll()
  }

  const saveMinStock = async () => {
    if (!showMinForm) return
    await supabase.from('products').update({ min_stock: Number(minStock) }).eq('id', showMinForm.id)
    setShowMinForm(null); setMinStock(''); fetchAll()
  }

  const lowStock = products.filter(p => p.stock <= p.min_stock && p.min_stock > 0)

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">재고관리</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">상품별 재고 현황 및 입출고 관리</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-amber-500/20">
          + 입출고 등록
        </button>
      </div>

      {/* 재고 부족 알림 */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 animate-fadeIn">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">⚠️ 재고 부족 상품 {lowStock.length}개</p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1 rounded-full font-medium">
                {p.name} ({p.stock}{p.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {[{ key: 'stock', label: '📦 재고 현황' }, { key: 'logs', label: '📋 입출고 이력' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${tab === t.key ? 'bg-amber-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 재고 현황 */}
      {tab === 'stock' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">불러오는 중...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">등록된 상품이 없습니다</p>
            </div>
          ) : (
            <>
            {/* PC: 테이블 */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-gray-700">
                  {['상품명', '현재 재고', '최소 재고', '단위', '상태', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map(p => {
                  const isLow = p.min_stock > 0 && p.stock <= p.min_stock
                  return (
                    <tr key={p.id} className="border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-slate-800 dark:text-white">{p.name}</td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-bold ${isLow ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{p.stock}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{p.min_stock || '-'}</td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{p.unit}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-block whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-full ${isLow ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                          {isLow ? '⚠️ 부족' : '✅ 정상'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => { setShowMinForm(p); setMinStock(String(p.min_stock || 0)) }}
                          className="text-xs text-amber-500 hover:text-amber-600 font-medium px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors whitespace-nowrap">
                          최소재고 설정
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
            {/* 모바일: 카드형 */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-gray-700">
              {pagedProducts.map(p => {
                const isLow = p.min_stock > 0 && p.stock <= p.min_stock
                return (
                  <div key={p.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-white flex-1 min-w-0">{p.name}</p>
                      <span className={`inline-block whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${isLow ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                        {isLow ? '⚠️ 부족' : '✅ 정상'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        현재 <b className={isLow ? 'text-red-500' : 'text-slate-800 dark:text-white'}>{p.stock}</b>{p.unit} · 최소 {p.min_stock || '-'}
                      </p>
                      <button onClick={() => { setShowMinForm(p); setMinStock(String(p.min_stock || 0)) }}
                        className="text-xs text-amber-500 font-bold px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 whitespace-nowrap flex-shrink-0">
                        최소재고 설정
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-4 pb-4"><Pager page={stockPg} totalPages={stockTotalPages} onChange={setStockPage} dark={isDark} /></div>
            </>
          )}
        </div>
      )}

      {/* 입출고 이력 */}
      {tab === 'logs' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">입출고 이력이 없습니다</p>
            </div>
          ) : (
            <>
              {pagedLogs.map(l => (
                <div key={l.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${l.type === '입고' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-500'}`}>
                      {l.type === '입고' ? '▲ 입고' : '▼ 출고'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{l.product_name}</p>
                      {l.note && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{l.note}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${l.type === '입고' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {l.type === '입고' ? '+' : '-'}{l.quantity}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(l.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>
              ))}
              <div className="px-4 py-4"><Pager page={logPg} totalPages={logTotalPages} onChange={setLogPage} dark={isDark} /></div>
            </>
          )}
        </div>
      )}

      {/* 입출고 등록 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">입출고 등록</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">상품 선택</label>
                <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">선택</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (현재: {p.stock}{p.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">구분</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option>입고</option>
                    <option>출고</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">수량</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0"
                    className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">메모</label>
                <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="예) 오늘 입고분"
                  className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">취소</button>
              <button onClick={saveLog} className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-colors active:scale-95">등록</button>
            </div>
          </div>
        </div>
      )}

      {/* 최소 재고 설정 모달 */}
      {showMinForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">최소 재고 설정</h2>
              <button onClick={() => setShowMinForm(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{showMinForm.name}</p>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">최소 재고 수량</label>
              <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} placeholder="0"
                className="w-full border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">이 수량 이하가 되면 부족 알림이 표시됩니다</p>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-gray-700">
              <button onClick={() => setShowMinForm(null)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">취소</button>
              <button onClick={saveMinStock} className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-colors active:scale-95">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
