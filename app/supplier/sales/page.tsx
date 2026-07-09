'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import SupplierLayout from '../_layout/layout'
import { useSupplierTheme } from '../_layout/theme-context'
import SalesView from './_SalesView'

type OrderItem = {
  id: string; order_id: string; product_id: string; product_name: string
  quantity: number; unit: string; unit_price: number; total_price: number
  delivery_status: string; return_reason: string | null; settled: boolean
  created_at: string; order_type: 'general' | 'retail' | 'wholesale'
  customer_name?: string; company_name?: string; order_number?: string
  courier_code?: string; tracking_number?: string
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
        .select(`*, ${tbl.orderTable}(order_number, ${tbl.customerCol}, created_at, courier_code, tracking_number)`)
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
            courier_code: orderData?.courier_code || '',
            tracking_number: orderData?.tracking_number || '',
          })
        })
      }
    }
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setOrders(all)
  }

  // 공급업체가 자기 주문의 송장 저장 → 관리자/고객과 같은 칸(order의 courier_code/tracking_number)에 저장돼 연동됨
  const ORDER_TABLE: Record<string, string> = { general: 'general_orders', retail: 'retail_orders', wholesale: 'wholesale_orders' }
  const saveSupplierTracking = async (orderType: string, orderId: string, courier: string, tracking: string) => {
    const patch = { courier_code: courier || null, tracking_number: tracking.trim() || null }
    const { error } = await supabase.from(ORDER_TABLE[orderType]).update(patch).eq('id', orderId)
    if (error) { alert('송장 저장 실패: ' + error.message); return false }
    setOrders(prev => prev.map(o => o.order_id === orderId
      ? { ...o, courier_code: patch.courier_code || '', tracking_number: patch.tracking_number || '' } : o))
    return true
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

  // 상품별 판매 분석 (선택한 기간/필터 기준, 반품·환불 제외)
  const productStats = (() => {
    const map: Record<string, { qty: number; sales: number }> = {}
    filteredOrders.forEach(o => {
      if (['반품', '환불취소'].includes(o.delivery_status)) return
      const key = o.product_name || '(이름없음)'
      if (!map[key]) map[key] = { qty: 0, sales: 0 }
      map[key].qty += o.quantity
      map[key].sales += o.total_price
    })
    return Object.entries(map)
      .map(([name, v]) => ({ name, qty: v.qty, sales: v.sales }))
      .sort((a, b) => b.sales - a.sales)
  })()

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

  return (
    <SalesView
      t={t}
      loading={loading}
      tab={tab}
      setTab={setTab}
      summary={summary}
      productStats={productStats}
      dateFrom={dateFrom}
      setDateFrom={setDateFrom}
      dateTo={dateTo}
      setDateTo={setDateTo}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      typeFilter={typeFilter}
      setTypeFilter={setTypeFilter}
      filteredOrders={filteredOrders}
      settlements={settlements}
      card={card}
      downloadOrdersExcel={downloadOrdersExcel}
      downloadSettlementsExcel={downloadSettlementsExcel}
      saveSupplierTracking={saveSupplierTracking}
    />
  )
}

export default function SupplierSalesPage() {
  return (
    <SupplierLayout>
      <SalesContent />
    </SupplierLayout>
  )
}
