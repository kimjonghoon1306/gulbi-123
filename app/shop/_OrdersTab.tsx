'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { courierName } from '@/lib/tracking'
import { OrderBadge } from './_OrderBadge'

const STATUS_STEP: Record<string, number> = { '접수': 0, '준비중': 1, '출고': 2, '완료': 3 }
const STATUS_LABEL = ['접수', '준비중', '출고', '완료']
const STATUS_ICON = ['📋', '📦', '🚚', '✅']

// 마이페이지 주문/배송 탭 — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  D: any
  tc: any
  accent: string
  member: any
  orders: any[]
  orderItems: Record<string, any[]>
  itemsLoading: string | null
  openTracking: (o: any) => void
  setOrders: (v: any[] | ((prev: any[]) => any[])) => void
}

export function OrdersTab({ D, tc, accent, member, orders, orderItems, itemsLoading, openTracking, setOrders }: Props) {
  const supabase = createClient()
  const router = useRouter()
  return (
          <div className="my-orders" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {orders.length === 0 ? (
              <div style={{ gridColumn:'1 / -1', background:D.card, borderRadius:'24px', padding:'56px 20px', textAlign:'center', border:`1px solid ${D.border}` }}>
                <p style={{ fontSize:'52px', margin:'0 0 16px' }}>📭</p>
                <p style={{ fontWeight:800, fontSize:'16px', color:D.text, margin:'0 0 6px' }}>아직 주문 내역이 없어요</p>
                <p style={{ fontSize:'13px', color:D.sub, margin:'0 0 24px' }}>마음에 드는 상품을 찾아보세요</p>
                <button onClick={() => router.push('/shop')}
                  style={{ background:tc.gradient, color:'white', border:'none', borderRadius:'14px', padding:'13px 28px', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>
                  쇼핑하러 가기 →
                </button>
              </div>
            ) : orders.map(order => (
              <div key={order.id} style={{ background:D.card, borderRadius:'20px', border:`1px solid ${D.border}`, overflow:'hidden' }}>

                {/* 주문 헤더 */}
                <div style={{ padding:'18px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 3px' }}>{order.order_number || `#${order.id.slice(0,8).toUpperCase()}`}</p>
                      <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>{new Date(order.created_at).toLocaleString('ko-KR', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                    </div>
                    <OrderBadge status={order.status} />
                  </div>

                  {/* 배송 진행 단계 */}
                  <div style={{ marginBottom:'14px' }}>
                    <div style={{ display:'flex', alignItems:'center', marginBottom:'8px' }}>
                      {STATUS_LABEL.map((s, i) => {
                        const done    = i <= (STATUS_STEP[order.status] || 0)
                        const current = i === (STATUS_STEP[order.status] || 0)
                        return (
                          <div key={i} style={{ display:'flex', alignItems:'center', flex: i < 3 ? 1 : 'none' }}>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                              <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0, transition:'all 0.3s',
                                background: done ? tc.gradient : D.input,
                                color: done ? 'white' : D.sub,
                                boxShadow: current ? `0 0 0 3px ${tc.color}33` : 'none' }}
                                className="status-circle">
                                {done ? (current ? STATUS_ICON[i] : '✓') : i+1}
                              </div>
                              <p style={{ fontSize:'9px', fontWeight: current ? 700 : 400, color: done ? accent : D.sub, margin:0, whiteSpace:'nowrap' }} className="status-label">{s}</p>
                            </div>
                            {i < 3 && (
                              <div style={{ flex:1, height:'2px', background: i < (STATUS_STEP[order.status]||0) ? tc.color : D.border, margin:'0 4px 16px', borderRadius:'2px', transition:'background 0.3s' }} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <p style={{ fontSize:'18px', fontWeight:900, color:accent, margin:0 }}>{order.total_amount.toLocaleString()}원</p>
                  </div>
                </div>

                {/* 주문 상세 (항상 표시) */}
                <div style={{ borderTop:`1px solid ${D.border}`, padding:'16px 20px', background:D.card2 }}>
                    <p style={{ fontSize:'11px', fontWeight:700, color:D.sub, margin:'0 0 10px', letterSpacing:'0.06em' }}>주문 상품</p>
                    {itemsLoading === order.id ? (
                      <div style={{ textAlign:'center', padding:'16px', color:D.sub, fontSize:'12px' }}>불러오는 중...</div>
                    ) : (orderItems[order.id] || []).length === 0 ? (
                      <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>상품 정보가 없어요</p>
                    ) : (orderItems[order.id] || []).map((item, i, arr) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < arr.length-1 ? `1px solid ${D.border}` : 'none' }}>
                        <div>
                          <p style={{ fontSize:'13px', fontWeight:600, color:D.text, margin:'0 0 2px' }}>{item.product_name}</p>
                          <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>{item.quantity}{item.unit} × {item.unit_price.toLocaleString()}원</p>
                        </div>
                        <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:0 }}>{item.total_price.toLocaleString()}원</p>
                      </div>
                    ))}
                    <div style={{ marginTop:'12px', display:'flex', flexDirection:'column', gap:'4px' }}>
                      {order.address      && <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>📍 {order.address}</p>}
                      {order.payment_method && <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>💳 {order.payment_method}</p>}
                      {order.note         && <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>📝 {order.note}</p>}
                      {order.tracking_number && <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>🚚 {courierName(order.courier_code || '')} {order.tracking_number}</p>}
                    </div>
                    {order.tracking_number && (
                      <button onClick={() => openTracking(order)} className="mp-track-btn"
                        style={{ marginTop:'14px', width:'100%', padding:'16px', borderRadius:'14px', border:'none', background:tc.gradient, color:'white', fontSize:'16px', fontWeight:800, cursor:'pointer', boxShadow:`0 8px 20px ${tc.color}40` }}>
                        🚚 실시간 배송조회
                      </button>
                    )}
                    {order.status === '접수' && (
                      <button
                        onClick={async () => {
                          if (!confirm('주문을 취소하시겠습니까?')) return
                          // 주문이 실제로 속한 테이블(_type)을 사용 — 등급이 바뀌어도 정확
                          const table = order._type === 'wholesale' ? 'wholesale_orders' : order._type === 'retail' ? 'retail_orders'
                            : (member?.member_type === '도매업' ? 'wholesale_orders' : member?.member_type === '소매업' ? 'retail_orders' : 'general_orders')
                          await supabase.from(table).update({ status: '취소', updated_at: new Date().toISOString() }).eq('id', order.id)
                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: '취소' } : o))
                        }}
                        style={{ marginTop:'14px', width:'100%', padding:'12px', borderRadius:'12px', border:'1.5px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.06)', color:'#ef4444', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                        🚫 주문 취소
                      </button>
                    )}
                  </div>
              </div>
            ))}
          </div>
  )
}
