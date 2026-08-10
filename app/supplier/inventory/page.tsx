'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import SupplierLayout from '../_layout/layout'
import { useSupplierTheme } from '../_layout/theme-context'

type Product = { id: string; name: string; stock: number; min_stock: number; unit: string }
type Log = { id: string; product_id: string; product_name: string; type: string; quantity: number; note: string; created_at: string }

function SupplierInventoryContent() {
  const t = useSupplierTheme()
  const router = useRouter()
  const supabase = createClient()
  const [supplierId, setSupplierId] = useState('')
  const [tab, setTab] = useState<'stock' | 'logs'>('stock')
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showMinForm, setShowMinForm] = useState<Product | null>(null)
  const [minStock, setMinStock] = useState('')
  const [form, setForm] = useState({ product_id: '', type: '입고', quantity: '', note: '' })

  useEffect(() => { init() }, [])

  const init = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/supplier/login')
      return
    }
    setSupplierId(user.id)
    const { data: ownedProducts } = await supabase.from('products')
      .select('id, name, stock, min_stock, unit').eq('supplier_id', user.id).order('name')
    const nextProducts = (ownedProducts || []) as Product[]
    setProducts(nextProducts)
    const productIds = nextProducts.map(product => product.id)
    if (productIds.length > 0) {
      const { data: inventoryLogs } = await supabase.from('inventory_logs').select('*')
        .in('product_id', productIds).order('created_at', { ascending: false }).limit(100)
      setLogs((inventoryLogs || []) as Log[])
    } else {
      setLogs([])
    }
    setLoading(false)
  }

  const saveLog = async () => {
    if (!form.product_id) return alert('상품을 선택해주세요.')
    if (!form.quantity || Number(form.quantity) <= 0) return alert('수량을 입력해주세요.')
    if (!products.some(product => product.id === form.product_id)) return alert('본인 상품만 변경할 수 있습니다.')
    setSaving(true)
    const { error } = await supabase.rpc('supplier_adjust_inventory', {
      p_product_id: form.product_id,
      p_type: form.type,
      p_quantity: Number(form.quantity),
      p_note: form.note.trim(),
    })
    setSaving(false)
    if (error) {
      alert(error.message.includes('재고') ? error.message : '재고 변경에 실패했습니다.')
      return
    }
    setForm({ product_id: '', type: '입고', quantity: '', note: '' })
    setShowForm(false)
    init()
  }

  const saveMinStock = async () => {
    if (!showMinForm || Number(minStock) < 0) return
    setSaving(true)
    const { error } = await supabase.from('products').update({ min_stock: Number(minStock) })
      .eq('id', showMinForm.id).eq('supplier_id', supplierId)
    setSaving(false)
    if (error) return alert('최소 재고 저장에 실패했습니다.')
    setShowMinForm(null)
    setMinStock('')
    init()
  }

  const lowStock = products.filter(product => product.min_stock > 0 && product.stock <= product.min_stock)
  const cardStyle = { background: t.card, border: `1px solid ${t.border}`, borderRadius: '18px' }
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '11px', border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <div>
          <h1 style={{ margin: 0, color: t.text, fontSize: '24px', fontWeight: 900 }}>재고 관리</h1>
          <p style={{ margin: '5px 0 0', color: t.textMuted, fontSize: '13px' }}>내 상품의 현재 재고와 입출고 이력을 관리합니다.</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: '11px 16px', border: 'none', borderRadius: '12px', background: '#f59e0b', color: '#111', fontWeight: 800, cursor: 'pointer' }}>+ 입출고 등록</button>
      </div>

      {lowStock.length > 0 && (
        <div style={{ ...cardStyle, padding: '15px', marginBottom: '18px', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <p style={{ margin: '0 0 9px', color: '#f87171', fontSize: '13px', fontWeight: 800 }}>⚠️ 재고 부족 상품 {lowStock.length}개</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {lowStock.map(product => <span key={product.id} style={{ padding: '5px 9px', borderRadius: '999px', background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '11px' }}>{product.name} ({product.stock}{product.unit})</span>)}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[{ key: 'stock', label: '📦 재고 현황' }, { key: 'logs', label: '📋 입출고 이력' }].map(item => (
          <button key={item.key} onClick={() => setTab(item.key as 'stock' | 'logs')}
            style={{ padding: '9px 14px', borderRadius: '11px', border: `1px solid ${tab === item.key ? '#f59e0b' : t.border}`, background: tab === item.key ? 'rgba(245,158,11,0.14)' : t.card, color: tab === item.key ? '#f59e0b' : t.textMuted, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <div style={{ ...cardStyle, overflowX: 'auto' }}>
          {loading ? <p style={{ padding: '48px', textAlign: 'center', color: t.textMuted }}>불러오는 중...</p> : products.length === 0 ? <p style={{ padding: '48px', textAlign: 'center', color: t.textMuted }}>등록된 상품이 없습니다.</p> : (
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
              <thead><tr>{['상품명', '현재 재고', '최소 재고', '단위', '상태', ''].map(label => <th key={label} style={{ padding: '14px 16px', textAlign: 'left', color: t.textMuted, fontSize: '11px', borderBottom: `1px solid ${t.border}` }}>{label}</th>)}</tr></thead>
              <tbody>{products.map(product => {
                const isLow = product.min_stock > 0 && product.stock <= product.min_stock
                return <tr key={product.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: '15px 16px', color: t.text, fontSize: '13px', fontWeight: 700 }}>{product.name}</td>
                  <td style={{ padding: '15px 16px', color: isLow ? '#f87171' : t.text, fontSize: '14px', fontWeight: 900 }}>{product.stock}</td>
                  <td style={{ padding: '15px 16px', color: t.textMuted, fontSize: '13px' }}>{product.min_stock || '-'}</td>
                  <td style={{ padding: '15px 16px', color: t.textMuted, fontSize: '13px' }}>{product.unit}</td>
                  <td style={{ padding: '15px 16px' }}><span style={{ color: isLow ? '#f87171' : '#34d399', fontSize: '11px', fontWeight: 800 }}>{isLow ? '⚠️ 부족' : '✅ 정상'}</span></td>
                  <td style={{ padding: '15px 16px' }}><button onClick={() => { setShowMinForm(product); setMinStock(String(product.min_stock || 0)) }} style={{ border: '1px solid rgba(245,158,11,0.35)', background: 'transparent', color: '#f59e0b', borderRadius: '9px', padding: '7px 10px', fontSize: '11px', cursor: 'pointer' }}>최소재고 설정</button></td>
                </tr>
              })}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {logs.length === 0 ? <p style={{ padding: '48px', textAlign: 'center', color: t.textMuted }}>입출고 이력이 없습니다.</p> : logs.map(log => (
            <div key={log.id} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ color: log.type === '입고' ? '#34d399' : '#f87171', fontSize: '11px', fontWeight: 800 }}>{log.type === '입고' ? '▲ 입고' : '▼ 출고'}</span>
              <div style={{ flex: 1 }}><p style={{ margin: 0, color: t.text, fontSize: '13px', fontWeight: 700 }}>{log.product_name}</p>{log.note && <p style={{ margin: '3px 0 0', color: t.textMuted, fontSize: '11px' }}>{log.note}</p>}</div>
              <div style={{ textAlign: 'right' }}><p style={{ margin: 0, color: log.type === '입고' ? '#34d399' : '#f87171', fontWeight: 900 }}>{log.type === '입고' ? '+' : '-'}{log.quantity}</p><p style={{ margin: '3px 0 0', color: t.textMuted, fontSize: '10px' }}>{new Date(log.created_at).toLocaleDateString('ko-KR')}</p></div>
            </div>
          ))}
        </div>
      )}

      {showForm && <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px' }}>
        <div style={{ ...cardStyle, width: '100%', maxWidth: '430px', padding: '22px' }}>
          <h2 style={{ margin: '0 0 18px', color: t.text, fontSize: '18px' }}>입출고 등록</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
            <select value={form.product_id} onChange={event => setForm({ ...form, product_id: event.target.value })} style={inputStyle}><option value="">상품 선택</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} (현재 {product.stock}{product.unit})</option>)}</select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}><select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })} style={inputStyle}><option>입고</option><option>출고</option></select><input type="number" min="1" value={form.quantity} onChange={event => setForm({ ...form, quantity: event.target.value })} placeholder="수량" style={inputStyle} /></div>
            <input value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} placeholder="메모 (예: 오늘 입고분)" style={inputStyle} />
            <div style={{ display: 'flex', gap: '9px' }}><button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted }}>취소</button><button onClick={saveLog} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#f59e0b', color: '#111', fontWeight: 800 }}>{saving ? '처리 중...' : '등록'}</button></div>
          </div>
        </div>
      </div>}

      {showMinForm && <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px' }}>
        <div style={{ ...cardStyle, width: '100%', maxWidth: '360px', padding: '22px' }}><h2 style={{ margin: '0 0 6px', color: t.text, fontSize: '18px' }}>최소 재고 설정</h2><p style={{ color: t.textMuted, fontSize: '12px' }}>{showMinForm.name}</p><input type="number" min="0" value={minStock} onChange={event => setMinStock(event.target.value)} style={inputStyle} /><div style={{ display: 'flex', gap: '9px', marginTop: '16px' }}><button onClick={() => setShowMinForm(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted }}>취소</button><button onClick={saveMinStock} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#f59e0b', color: '#111', fontWeight: 800 }}>저장</button></div></div>
      </div>}
    </div>
  )
}

export default function SupplierInventoryPage() {
  return <SupplierLayout><SupplierInventoryContent /></SupplierLayout>
}
