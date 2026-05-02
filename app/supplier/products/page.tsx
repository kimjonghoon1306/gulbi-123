'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import SupplierLayout from '../_layout/layout'

type Product = {
  id: string; name: string; description: string
  category_id: string; suggested_wholesale_price: number; suggested_retail_price: number
  wholesale_price: number; retail_price: number
  stock: number; unit: string; image_url: string
  approval_status: string; created_at: string
}

type Category = { id: string; name: string }

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  '대기중': { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', label: '⏳ 대기중' },
  '승인':   { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', label: '✅ 승인' },
  '거절':   { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', label: '❌ 거절' },
}

const EMPTY_FORM = {
  name: '', category_id: '', suggested_wholesale_price: '', suggested_retail_price: '',
  stock: '', unit: 'kg', image_url: '', description: ''
}

export default function SupplierProductsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [supplierId, setSupplierId] = useState('')
  const [supplierStatus, setSupplierStatus] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { init() }, [])

  const init = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/supplier/login'); return }
      const [{ data: sup }, { data: cats }, { data: prods }] = await Promise.all([
        supabase.from('suppliers').select('status').eq('id', user.id).single(),
        supabase.from('categories').select('id, name').order('sort_order'),
        supabase.from('products').select('*').eq('supplier_id', user.id).order('created_at', { ascending: false })
      ])
      setSupplierId(user.id)
      setSupplierStatus(sup?.status || '승인')
      setCategories(cats || [])
      setProducts(prods || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const fn = Date.now() + '.' + (f.name.split('.').pop() || 'jpg')
    const { error } = await supabase.storage.from('products').upload(fn, f, { upsert: true })
    if (!error) {
      const url = supabase.storage.from('products').getPublicUrl(fn).data.publicUrl
      setForm(p => ({ ...p, image_url: url }))
    }
  }

  const handleSave = async () => {
    if (!form.name || !form.suggested_wholesale_price || !form.suggested_retail_price) {
      return setError('상품명, 도매 제안가, 소매 제안가는 필수입니다.')
    }
    setSaving(true); setError('')
    const data = {
      name: form.name, description: form.description,
      category_id: form.category_id || null,
      suggested_wholesale_price: Number(form.suggested_wholesale_price),
      suggested_retail_price: Number(form.suggested_retail_price),
      wholesale_price: 0, retail_price: 0, member_price: 0,
      stock: Number(form.stock) || 0, unit: form.unit,
      image_url: form.image_url, supplier_id: supplierId,
      approval_status: '대기중', is_active: false,
    }
    if (editProduct) {
      await supabase.from('products').update({ ...data, approval_status: editProduct.approval_status === '승인' ? '대기중' : editProduct.approval_status }).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert(data)
    }
    setSaving(false); setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM)
    init()
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({ name: p.name, category_id: p.category_id || '', suggested_wholesale_price: String(p.suggested_wholesale_price), suggested_retail_price: String(p.suggested_retail_price), stock: String(p.stock), unit: p.unit || 'kg', image_url: p.image_url || '', description: p.description || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('products').delete().eq('id', id)
    init()
  }

  if (loading) return (
    <SupplierLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>불러오는 중...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    </SupplierLayout>
  )

  return (
    <SupplierLayout>
      <div style={{ minHeight: '100vh', padding: '20px 16px', background: '#0d1117' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: '0 0 4px' }}>상품 관리</h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>등록 후 관리자 승인 시 쇼핑몰 노출</p>
          </div>
          {supplierStatus === '승인' && (
            <button onClick={() => { setEditProduct(null); setForm(EMPTY_FORM); setShowForm(true) }}
              style={{ flexShrink: 0, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontSize: '13px', fontWeight: 700, padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.35)', whiteSpace: 'nowrap' }}>
              + 상품 등록
            </button>
          )}
        </div>

        {/* 승인 대기 배너 */}
        {supplierStatus !== '승인' && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⏳</span>
            <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 600, margin: 0 }}>관리자 승인 후 상품 등록이 가능합니다</p>
          </div>
        )}

        {/* 상품 목록 — 카드형 */}
        {products.length === 0 ? (
          <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>📦</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: 0 }}>등록된 상품이 없습니다</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {products.map(p => {
              const st = STATUS_STYLE[p.approval_status] || STATUS_STYLE['대기중']
              return (
                <div key={p.id} style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                  {/* 상단: 이미지 + 이름 + 상태 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px' }}>🐟</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{p.name}</p>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>재고 {p.stock} {p.unit}</p>
                    </div>
                  </div>

                  {/* 가격 정보 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {[
                      { label: '도매 제안가', value: `${p.suggested_wholesale_price?.toLocaleString()}원`, color: 'rgba(255,255,255,0.7)' },
                      { label: '소매 제안가', value: `${p.suggested_retail_price?.toLocaleString()}원`, color: 'rgba(255,255,255,0.7)' },
                      { label: '확정 도매가', value: p.wholesale_price > 0 ? `${p.wholesale_price.toLocaleString()}원` : '미확정', color: p.wholesale_price > 0 ? '#34d399' : 'rgba(255,255,255,0.25)' },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '12px 10px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: '0 0 4px', fontWeight: 600 }}>{item.label}</p>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* 액션 버튼 */}
                  <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {p.approval_status !== '승인' && (
                      <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: '#a78bfa', fontSize: '13px', fontWeight: 600, cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                        ✏️ 수정
                      </button>
                    )}
                    <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.7)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      🗑 삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 상품 등록/수정 모달 — 다크 테마 일관 */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }} className="modal-overlay">
          <div style={{ background: '#161b22', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }} className="modal-desktop">

            {/* 모달 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              {/* 드래그 인디케이터 (모바일) */}
              <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'white', margin: 0 }}>{editProduct ? '상품 수정' : '상품 등록'}</h2>
              <button onClick={() => { setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM); setError('') }}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* 모달 본문 */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {editProduct?.approval_status === '거절' && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ color: '#f87171', fontSize: '13px', fontWeight: 600, margin: 0 }}>거절된 상품입니다. 수정 후 재신청하세요.</p>
                </div>
              )}

              {/* 상품명 */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '0.5px' }}>상품명 *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="상품명 입력"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '0.5px' }}>대표 이미지</label>
                <input id="sup-img" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                <div onClick={() => document.getElementById('sup-img')?.click()}
                  style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'border-color 0.2s' }}>
                  {form.image_url
                    ? <img src={form.image_url} alt="" style={{ height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block', borderRadius: '8px' }} />
                    : <div>
                        <p style={{ fontSize: '24px', margin: '0 0 6px' }}>📸</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>탭해서 이미지 올리기</p>
                      </div>
                  }
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '0.5px' }}>카테고리</label>
                <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="" style={{ background: '#1e2530' }}>카테고리 선택</option>
                  {categories.map(c => <option key={c.id} value={c.id} style={{ background: '#1e2530' }}>{c.name}</option>)}
                </select>
              </div>

              {/* 가격 제안 */}
              <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '14px', padding: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', margin: '0 0 12px' }}>💡 가격 제안 (관리자가 최종 확정합니다)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: '🏭 도매 제안가 (원) *', key: 'suggested_wholesale_price' },
                    { label: '🛒 소매 제안가 (원) *', key: 'suggested_retail_price' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>{label}</label>
                      <input type="number" value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 12px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* 재고 + 단위 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '0.5px' }}>재고 수량</label>
                  <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '0.5px' }}>단위</label>
                  <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}>
                    {['kg', 'g', '박스', '마리', '개', '묶음'].map(u => <option key={u} style={{ background: '#1e2530' }}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* 상품 설명 */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '0.5px' }}>상품 설명</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  placeholder="상품에 대한 간단한 설명"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: 'white', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '13px 16px' }}>
                  <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div style={{ display: 'flex', gap: '10px', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <button onClick={() => { setShowForm(false); setEditProduct(null); setForm(EMPTY_FORM); setError('') }}
                style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                취소
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.35)', opacity: saving ? 0.6 : 1 }}>
                {saving ? '저장 중...' : editProduct ? '수정 후 재신청' : '등록 신청'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 640px) {
          .modal-overlay { align-items: center !important; padding: 20px !important; }
          .modal-desktop { border-radius: 20px !important; max-height: 85vh !important; }
        }
      `}</style>
    </SupplierLayout>
  )
}
