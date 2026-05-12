'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import SupplierLayout from '../_layout/layout'
import { useSupplierTheme } from '../_layout/theme-context'

type OrderItem = {
  id: string; order_id: string; product_id: string; product_name: string
  quantity: number; unit: string; unit_price: number; total_price: number
  delivery_status: string; return_reason: string | null; settled: boolean
  created_at: string; order_type: 'general' | 'retail' | 'wholesale'
  customer_name?: string; company_name?: string; order_number?: string
}

type Settlement = {
  id: string; period_start: string; period_end: string
  total_sales: number; commission_rate: number; commission: number
  settlement_amount: number; status: string; note: string | null; settled_at: string | null
  created_at: string
}

const DELIVERY_STATUS = ['전체', '접수', '배송중', '배송완료', '반품', '환불취소']
const DELIVERY_COLOR: Record<string, { bg: string; color: string }> = {
  '접수':    { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8' },
  '배송중':  { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
  '배송완료':{ bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
  '반품':    { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  '환불취소':{ bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
}
const ORDER_TYPE_LABEL: Record<string, string> = {
  general: '일반', retail: '소매', wholesale: '도매',
}

function SalesContent() {
  const t = useSupplierTheme()
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'orders' | 'settlements'>('orders')
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('전체')
  const [typeFilter, setTypeFilter] = useState('전체')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [supplierId, setSupplierId] = useState('')

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/supplier/login'); return }
    setSupplierId(user.id)
    await Promise.all([fetchOrders(user.id), fetchSettlements(user.id)])
    setLoading(false)
  }

  const fetchOrders = async (uid: string) => {
    const tables = [
      { name: 'general_order_items', orderTable: 'general_orders', type: 'general', customerCol: 'customer_name' },
      { name: 'retail_order_items',  orderTable: 'retail_orders',  type: 'retail',  customerCol: 'customer_name' },
      { name: 'wholesale_order_items',orderTable: 'wholesale_orders', type: 'wholesale', customerCol: 'company_name' },
    ]
    const all: OrderItem[] = []
    for (const tbl of tables) {
      const { data } = await supabase
        .from(tbl.name)
        .select(`*, ${tbl.orderTable}(order_number, ${tbl.customerCol}, created_at)`)
        .eq('supplier_id', uid)
        .order('created_at', { ascending: false })
      if (data) {
        data.forEach((item: any) => {
          const orderData = item[tbl.orderTable]
          all.push({
            ...item,
            order_type: tbl.type as any,
            order_number: orderData?.order_number,
            customer_name: orderData?.[tbl.customerCol],
            created_at: orderData?.created_at || item.created_at,
          })
        })
      }
    }
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setOrders(all)
  }

  const fetchSettlements = async (uid: string) => {
    const { data } = await supabase
      .from('settlements')
      .select('*')
      .eq('supplier_id', uid)
      .order('period_start', { ascending: false })
    setSettlements(data || [])
  }

  // 필터 적용
  const filteredOrders = orders.filter(o => {
    const d = o.created_at?.split('T')[0] || ''
    if (d < dateFrom || d > dateTo) return false
    if (statusFilter !== '전체' && o.delivery_status !== statusFilter) return false
    if (typeFilter !== '전체' && ORDER_TYPE_LABEL[o.order_type] !== typeFilter) return false
    return true
  })

  // 요약 통계
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthOrders = orders.filter(o => o.created_at?.startsWith(thisMonth))
  const summary = {
    totalQty:    monthOrders.reduce((s, o) => s + o.quantity, 0),
    totalSales:  monthOrders.filter(o => !['반품','환불취소'].includes(o.delivery_status)).reduce((s, o) => s + o.total_price, 0),
    returnCount: monthOrders.filter(o => ['반품','환불취소'].includes(o.delivery_status)).length,
    pendingSettlement: settlements.filter(s => s.status === '정산예정').reduce((s, i) => s + i.settlement_amount, 0),
  }

  // 엑셀 다운로드 (주문)
  const downloadOrdersExcel = () => {
    const headers = ['주문번호','고객명','주문유형','상품명','수량','단위','단가','금액','배송상태','반품사유','주문일']
    const rows = filteredOrders.map(o => [
      o.order_number || '-',
      o.customer_name || '-',
      ORDER_TYPE_LABEL[o.order_type] || '-',
      o.product_name,
      o.quantity,
      o.unit,
      o.unit_price,
      o.total_price,
      o.delivery_status,
      o.return_reason || '-',
      o.created_at?.split('T')[0] || '-',
    ])
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="주문현황"><Table>
<Row>${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
${rows.map(r => `<Row>${r.map(c => `<Cell><Data ss:Type="String">${c}</Data></Cell>`).join('')}</Row>`).join('\n')}
</Table></Worksheet></Workbook>`
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `주문현황_${dateFrom}_${dateTo}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 엑셀 다운로드 (정산)
  const downloadSettlementsExcel = () => {
    const headers = ['정산기간','총판매금액','수수료율(%)','수수료','정산금액','상태','정산일','메모']
    const rows = settlements.map(s => [
      `${s.period_start} ~ ${s.period_end}`,
      s.total_sales,
      s.commission_rate,
      s.commission,
      s.settlement_amount,
      s.status,
      s.settled_at?.split('T')[0] || '-',
      s.note || '-',
    ])
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="정산내역"><Table>
<Row>${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
${rows.map(r => `<Row>${r.map(c => `<Cell><Data ss:Type="String">${c}</Data></Cell>`).join('')}</Row>`).join('\n')}
</Table></Worksheet></Workbook>`
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `정산내역_${new Date().toLocaleDateString('ko-KR').replace(/\./g,'').replace(/ /g,'')}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  const card = {
    background: t.card, border: `1px solid ${t.border}`, borderRadius: '20px', overflow: 'hidden',
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: t.textMuted, fontSize: '14px' }}>불러오는 중...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: t.bg }}>

      {/* 헤더 */}
      <div style={{
        background: t.isDark ? 'linear-gradient(135deg, #1a1f2e, #161b22)' : 'linear-gradient(135deg, #fff8f0, #fef3e2)',
        borderBottom: `1px solid ${t.border}`, padding: '28px 40px 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #34d399, #10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', boxShadow: '0 4px 16px rgba(52,211,153,0.35)',
              }}>📊</div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: t.text, margin: 0 }}>매출 현황</h1>
                <p style={{ fontSize: '13px', color: t.textMuted, margin: '3px 0 0' }}>내 상품 판매 현황 및 정산 내역</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 요약 카드 4개 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }} className="summary-grid">
          {[
            { label: '이번달 판매수량', value: `${summary.totalQty.toLocaleString()}개`, icon: '📦', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
            { label: '이번달 매출액',   value: `${summary.totalSales.toLocaleString()}원`, icon: '💰', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
            { label: '정산 예정액',     value: `${summary.pendingSettlement.toLocaleString()}원`, icon: '🏦', color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' },
            { label: '반품/환불',       value: `${summary.returnCount}건`, icon: '↩️', color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: '18px', padding: '20px 18px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>{s.icon}</div>
              <p style={{ fontSize: '11px', color: t.textMuted, margin: '0 0 6px', fontWeight: 600 }}>{s.label}</p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 탭 + 필터 */}
        <div style={card}>
          {/* 탭 */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}`, padding: '0 24px' }}>
            {([
              { key: 'orders',      label: '📋 주문 현황' },
              { key: 'settlements', label: '🏦 정산 내역' },
            ] as const).map(item => (
              <button key={item.key} onClick={() => setTab(item.key)} style={{
                padding: '16px 20px', border: 'none', cursor: 'pointer',
                background: 'transparent', fontSize: '14px', fontWeight: 700,
                color: tab === item.key ? '#f59e0b' : t.textMuted,
                borderBottom: tab === item.key ? '2px solid #f59e0b' : '2px solid transparent',
                transition: 'all 0.2s', marginBottom: '-1px',
              }}>{item.label}</button>
            ))}
          </div>

          {/* 필터 영역 */}
          {tab === 'orders' && (
            <div style={{
              padding: '16px 24px', borderBottom: `1px solid ${t.border}`,
              display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
            }}>
              {/* 기간 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  style={{ background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: t.text, outline: 'none' }} />
                <span style={{ color: t.textMuted, fontSize: '13px' }}>~</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  style={{ background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: t.text, outline: 'none' }} />
              </div>

              {/* 배송상태 필터 */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {DELIVERY_STATUS.map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    padding: '7px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    background: statusFilter === s ? 'rgba(245,158,11,0.15)' : t.input,
                    color: statusFilter === s ? '#f59e0b' : t.textMuted,
                  }}>{s}</button>
                ))}
              </div>

              {/* 유형 필터 */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {['전체','일반','소매','도매'].map(s => (
                  <button key={s} onClick={() => setTypeFilter(s)} style={{
                    padding: '7px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    background: typeFilter === s ? 'rgba(99,102,241,0.15)' : t.input,
                    color: typeFilter === s ? '#818cf8' : t.textMuted,
                  }}>{s}</button>
                ))}
              </div>

              <div style={{ marginLeft: 'auto' }}>
                <button onClick={downloadOrdersExcel} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.3)',
                  background: 'rgba(52,211,153,0.08)', color: '#34d399',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                }}>
                  📥 엑셀 다운로드
                </button>
              </div>
            </div>
          )}

          {tab === 'settlements' && (
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={downloadSettlementsExcel} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.3)',
                background: 'rgba(52,211,153,0.08)', color: '#34d399',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}>📥 엑셀 다운로드</button>
            </div>
          )}

          {/* ── 주문 현황 테이블 ── */}
          {tab === 'orders' && (
            filteredOrders.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>📋</p>
                <p style={{ color: t.textMuted, fontSize: '14px', margin: 0 }}>해당 기간 주문 내역이 없습니다</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                  <thead>
                    <tr style={{ background: t.input }}>
                      {['주문번호','고객명','유형','상품명','수량','금액','상태','주문일'].map(h => (
                        <th key={h} style={{
                          padding: '12px 16px', textAlign: 'left', fontSize: '11px',
                          fontWeight: 700, color: t.textMuted, letterSpacing: '0.5px',
                          borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o, i) => {
                      const ds = DELIVERY_COLOR[o.delivery_status] || { bg: t.input, color: t.textMuted }
                      return (
                        <tr key={o.id} style={{
                          borderBottom: `1px solid ${t.border}`,
                          background: i % 2 === 0 ? 'transparent' : (t.isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'),
                        }}>
                          <td style={{ padding: '13px 16px', fontSize: '12px', color: t.textMuted, whiteSpace: 'nowrap' }}>
                            {o.order_number || '-'}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', color: t.text, fontWeight: 600 }}>
                            {o.customer_name || '-'}
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                              background: o.order_type === 'wholesale' ? 'rgba(245,158,11,0.12)' : o.order_type === 'retail' ? 'rgba(99,102,241,0.12)' : 'rgba(52,211,153,0.12)',
                              color: o.order_type === 'wholesale' ? '#fbbf24' : o.order_type === 'retail' ? '#818cf8' : '#34d399',
                            }}>{ORDER_TYPE_LABEL[o.order_type]}</span>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', color: t.text, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {o.product_name}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', color: t.text }}>
                            {o.quantity}{o.unit}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: t.text, whiteSpace: 'nowrap' }}>
                            {o.total_price.toLocaleString()}원
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{
                              fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px',
                              background: ds.bg, color: ds.color, whiteSpace: 'nowrap',
                            }}>{o.delivery_status}</span>
                            {o.return_reason && (
                              <p style={{ fontSize: '10px', color: '#f87171', margin: '2px 0 0' }}>{o.return_reason}</p>
                            )}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '12px', color: t.textMuted, whiteSpace: 'nowrap' }}>
                            {o.created_at?.split('T')[0] || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* 합계 행 */}
                <div style={{
                  padding: '14px 24px', borderTop: `1px solid ${t.border}`,
                  display: 'flex', gap: '24px', flexWrap: 'wrap',
                  background: t.isDark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.03)',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: t.textMuted }}>
                    총 {filteredOrders.length}건
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                    합계: {filteredOrders.filter(o => !['반품','환불취소'].includes(o.delivery_status)).reduce((s, o) => s + o.total_price, 0).toLocaleString()}원
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f87171' }}>
                    반품/환불: {filteredOrders.filter(o => ['반품','환불취소'].includes(o.delivery_status)).length}건
                  </span>
                </div>
              </div>
            )
          )}

          {/* ── 정산 내역 테이블 ── */}
          {tab === 'settlements' && (
            settlements.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>🏦</p>
                <p style={{ color: t.textMuted, fontSize: '14px', margin: '0 0 6px' }}>정산 내역이 없습니다</p>
                <p style={{ color: t.textFaint, fontSize: '12px', margin: 0 }}>관리자가 정산을 등록하면 여기에 표시됩니다</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: t.input }}>
                      {['정산 기간','총 판매금액','수수료율','수수료','정산금액','상태','정산일','메모'].map(h => (
                        <th key={h} style={{
                          padding: '12px 16px', textAlign: 'left', fontSize: '11px',
                          fontWeight: 700, color: t.textMuted, letterSpacing: '0.5px',
                          borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((s, i) => (
                      <tr key={s.id} style={{
                        borderBottom: `1px solid ${t.border}`,
                        background: i % 2 === 0 ? 'transparent' : (t.isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'),
                      }}>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: t.text, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {s.period_start} ~ {s.period_end}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: t.text, whiteSpace: 'nowrap' }}>
                          {s.total_sales.toLocaleString()}원
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: t.textMuted }}>
                          {s.commission_rate}%
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#f87171', whiteSpace: 'nowrap' }}>
                          -{s.commission.toLocaleString()}원
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 800, color: '#34d399', whiteSpace: 'nowrap' }}>
                          {s.settlement_amount.toLocaleString()}원
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                            background: s.status === '정산완료' ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)',
                            color: s.status === '정산완료' ? '#34d399' : '#fbbf24',
                          }}>{s.status}</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: t.textMuted, whiteSpace: 'nowrap' }}>
                          {s.settled_at?.split('T')[0] || '-'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: t.textMuted, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 정산 합계 */}
                <div style={{
                  padding: '14px 24px', borderTop: `1px solid ${t.border}`,
                  display: 'flex', gap: '24px', flexWrap: 'wrap',
                  background: t.isDark ? 'rgba(52,211,153,0.04)' : 'rgba(52,211,153,0.03)',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: t.textMuted }}>
                    총 {settlements.length}건
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                    정산완료: {settlements.filter(s => s.status === '정산완료').reduce((a, s) => a + s.settlement_amount, 0).toLocaleString()}원
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>
                    정산예정: {settlements.filter(s => s.status === '정산예정').reduce((a, s) => a + s.settlement_amount, 0).toLocaleString()}원
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .summary-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .summary-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function SupplierSalesPage() {
  return (
    <SupplierLayout>
      <SalesContent />
    </SupplierLayout>
  )
}
