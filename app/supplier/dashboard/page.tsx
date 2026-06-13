'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SupplierLayout from '../_layout/layout'
import { useSupplierTheme } from '../_layout/theme-context'

type Product = {
  id: string; name: string; image_url: string
  approval_status: string
  suggested_wholesale_price: number
  wholesale_price: number
  stock: number; unit: string; created_at: string
}

type Supplier = {
  company_name: string; representative: string
  business_number: string; contact: string
  address: string; category: string
  status: string; email: string; created_at: string
}

function DashboardContent() {
  const t = useSupplierTheme()
  const router = useRouter()
  const supabase = createClient()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    fetchData()
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/supplier/login'); return }
      const { data: sup } = await supabase.from('suppliers').select('*').eq('id', user.id).single()
      if (!sup) {
        setSupplier({ company_name: '관리자 (미리보기)', representative: '-', business_number: '-', contact: '-', address: '-', category: '-', status: '승인', email: user.email || '', created_at: new Date().toISOString() })
        setProducts([]); return
      }
      const { data: prods } = await supabase.from('products').select('*').eq('supplier_id', user.id).order('created_at', { ascending: false }).limit(5)
      setSupplier(sup)
      setProducts(prods || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: t.textMuted, fontSize: '14px' }}>불러오는 중...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!supplier) { router.push('/supplier/login'); return null }

  const total    = products.length
  const pending  = products.filter(p => p.approval_status === '대기중').length
  const approved = products.filter(p => p.approval_status === '승인').length
  const rejected = products.filter(p => p.approval_status === '거절').length
  const revision = products.filter(p => p.approval_status === '수정요청').length

  const statusColor: Record<string, string> = { '대기중': '#fbbf24', '승인': '#34d399', '거절': '#f87171', '수정요청': '#818cf8' }
  const statusBg: Record<string, string>    = { '대기중': 'rgba(245,158,11,0.1)', '승인': 'rgba(16,185,129,0.1)', '거절': 'rgba(239,68,68,0.1)', '수정요청': 'rgba(99,102,241,0.1)' }

  const h = time.getHours()
  const greeting = h < 6 ? '🌙 새벽에도 열심히시네요' : h < 12 ? '☀️ 좋은 아침이에요' : h < 18 ? '🌤 좋은 오후예요' : '🌙 좋은 저녁이에요'

  const stats = [
    { label: '전체 상품', value: total,    color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', icon: '📦' },
    { label: '승인 대기', value: pending,   color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  icon: '⏳' },
    { label: '노출 중',   value: approved,  color: '#34d399', bg: 'rgba(16,185,129,0.08)',  icon: '✅' },
    { label: '수정요청',  value: revision,  color: '#818cf8', bg: 'rgba(99,102,241,0.08)',  icon: '✏️' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: t.bg, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="dash-wrap">

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: t.textMuted, fontSize: '12px', marginBottom: '4px' }}>{greeting}</p>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: t.text, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="dash-title">{supplier.company_name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: statusBg[supplier.status] || t.input, color: statusColor[supplier.status] || t.text, border: `1px solid ${statusColor[supplier.status] || 'transparent'}30` }}>
              {supplier.status === '승인' ? '✅ 승인된 공급업체' : supplier.status === '대기중' ? '⏳ 승인 심사중' : '❌ 거절됨'}
            </span>
            <span style={{ color: t.textFaint, fontSize: '11px' }}>{new Date(supplier.created_at).toLocaleDateString('ko-KR')} 가입</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }} className="dash-clock">
          <p style={{ fontSize: '28px', fontWeight: 800, color: t.text, margin: 0, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>
            {time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p style={{ color: t.textMuted, fontSize: '11px', marginTop: '4px' }}>
            {time.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
      </div>

      {supplier.status === '대기중' && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', flexShrink: 0 }}>⏳</div>
          <div>
            <p style={{ fontWeight: 700, color: '#fbbf24', margin: '0 0 3px', fontSize: '14px' }}>관리자 승인을 기다리고 있습니다</p>
            <p style={{ color: t.textMuted, fontSize: '12px', margin: 0 }}>승인 후 상품 등록이 가능합니다. 영업일 기준 1~2일 소요됩니다.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: '16px', padding: '18px 16px' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>{s.icon}</div>
            <p style={{ fontSize: '11px', color: t.textMuted, margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '26px', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Link href="/supplier/products" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '20px 12px', borderRadius: '16px', textDecoration: 'none',
          background: supplier.status === '승인' ? 'rgba(245,158,11,0.12)' : t.input,
          border: `1px solid ${supplier.status === '승인' ? 'rgba(245,158,11,0.25)' : t.border}`,
          color: supplier.status === '승인' ? '#f59e0b' : t.textMuted,
        }}>
          <span style={{ fontSize: '26px' }}>➕</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>상품 등록</p>
            <p style={{ fontSize: '10px', color: t.textMuted, margin: '3px 0 0' }}>{supplier.status === '승인' ? '새 상품 등록' : '승인 후 이용'}</p>
          </div>
        </Link>
        <Link href="/supplier/products" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '20px 12px', borderRadius: '16px', textDecoration: 'none',
          background: t.input, border: `1px solid ${t.border}`, color: t.textMuted,
        }}>
          <span style={{ fontSize: '26px' }}>📋</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: t.text }}>상품 목록</p>
            <p style={{ fontSize: '10px', color: t.textMuted, margin: '3px 0 0' }}>등록 상품 관리</p>
          </div>
        </Link>
      </div>

      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: t.text, margin: 0 }}>최근 등록 상품</h2>
          <Link href="/supplier/products" style={{ fontSize: '12px', color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>전체 보기 →</Link>
        </div>
        {products.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '10px' }}>📦</p>
            <p style={{ color: t.textMuted, fontSize: '13px', margin: 0 }}>등록된 상품이 없습니다</p>
            {supplier.status === '승인' && (
              <Link href="/supplier/products" style={{ display: 'inline-block', marginTop: '14px', padding: '10px 20px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(245,158,11,0.25)' }}>
                + 첫 상품 등록하기
              </Link>
            )}
          </div>
        ) : products.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden', background: t.input, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '18px' }}>🧺</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
              <p style={{ fontSize: '11px', color: t.textMuted, margin: 0 }}>
                도매 공급가 {p.suggested_wholesale_price?.toLocaleString()}원
                {p.wholesale_price > 0 && <span style={{ color: '#34d399', marginLeft: '6px' }}>→ 도매 공급가 {p.wholesale_price.toLocaleString()}원</span>}
              </p>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', flexShrink: 0, background: statusBg[p.approval_status] || t.input, color: statusColor[p.approval_status] || t.textMuted }}>
              {p.approval_status || '대기중'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '20px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted, margin: '0 0 14px', letterSpacing: '1px', textTransform: 'uppercase' }}>업체 정보</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: '대표자', value: supplier.representative || '-' },
            { label: '사업자번호', value: supplier.business_number || '-' },
            { label: '연락처', value: supplier.contact || '-' },
            { label: '취급 품목', value: supplier.category || '-' },
            { label: '이메일', value: supplier.email },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: t.textMuted }}>{item.label}</span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: t.text, textAlign: 'right', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '16px', padding: '18px 20px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', margin: '0 0 12px' }}>📌 상품 등록 프로세스</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['상품 등록 + 가격 제안', '관리자 가격 검토 및 확정', '쇼핑몰 자동 노출'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{i + 1}</div>
              <p style={{ fontSize: '12px', color: t.textMuted, margin: 0 }}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .dash-clock { display: none !important; }
          .dash-wrap { padding: 16px !important; }
          .dash-title { font-size: 18px !important; }
        }
      `}</style>
    </div>
  )
}

export default function SupplierDashboardPage() {
  return (
    <SupplierLayout>
      <DashboardContent />
    </SupplierLayout>
  )
}
