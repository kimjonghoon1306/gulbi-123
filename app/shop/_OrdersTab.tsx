'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { courierName } from '@/lib/tracking'
import { OrderBadge } from './_OrderBadge'

const STATUS_STEP: Record<string, number> = { '입금대기': -1, '입금완료': 0, '접수': 0, '준비중': 1, '출고': 2, '완료': 3 }
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
  orderReturns: any[]
  setOrderReturns: (v: any[] | ((prev: any[]) => any[])) => void
  itemsLoading: string | null
  openTracking: (o: any) => void
  setOrders: (v: any[] | ((prev: any[]) => any[])) => void
}

const RETURN_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  '접수': { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', label: '접수' },
  '처리중': { bg: 'rgba(245,158,11,0.14)', color: '#d97706', label: '처리중' },
  '완료': { bg: 'rgba(22,163,74,0.12)', color: '#15803d', label: '완료' },
  '반려': { bg: 'rgba(239,68,68,0.12)', color: '#dc2626', label: '반려' },
}

const orderTypeOf = (order: any, member: any): 'general' | 'retail' | 'wholesale' =>
  order._type || (member?.member_type === '도매업' ? 'wholesale' : member?.member_type === '소매업' ? 'retail' : 'general')

export function OrdersTab({ D, tc, accent, member, orders, orderItems, orderReturns, setOrderReturns, itemsLoading, openTracking, setOrders }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [returnModalOrder, setReturnModalOrder] = useState<any>(null)
  const [returnType, setReturnType] = useState<'반품' | '교환'>('반품')
  const [returnReason, setReturnReason] = useState('')
  const [returnContact, setReturnContact] = useState(member?.contact || '')
  const [returnImages, setReturnImages] = useState<string[]>([])
  const [returnUploading, setReturnUploading] = useState(false)
  const [returnSubmitting, setReturnSubmitting] = useState(false)

  const returnForOrder = (order: any) => {
    const type = orderTypeOf(order, member)
    return orderReturns.find(r => r.order_id === order.id && r.order_type === type)
  }

  const openReturnModal = (order: any) => {
    setReturnModalOrder(order)
    setReturnType('반품')
    setReturnReason('')
    setReturnContact(member?.contact || order.contact || '')
    setReturnImages([])
  }

  const uploadReturnImages = async (files: FileList | null) => {
    if (!files || files.length === 0 || !member) return
    setReturnUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files).slice(0, 4 - returnImages.length)) {
      if (!file.type.startsWith('image/')) continue
      const path = `${member.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('return-images').upload(path, file, { upsert: false })
      if (!error) {
        const { data } = supabase.storage.from('return-images').getPublicUrl(path)
        if (data?.publicUrl) urls.push(data.publicUrl)
      }
    }
    setReturnImages(prev => [...prev, ...urls].slice(0, 4))
    setReturnUploading(false)
  }

  const submitReturn = async () => {
    if (!returnModalOrder || !member) return
    if (!returnReason.trim()) return alert('사유를 입력해주세요.')
    setReturnSubmitting(true)
    const orderType = orderTypeOf(returnModalOrder, member)
    const { data, error } = await supabase.from('order_returns').insert({
      order_id: returnModalOrder.id,
      order_type: orderType,
      user_id: member.id,
      type: returnType,
      reason: `${returnReason.trim()}${returnContact.trim() ? `\n\n연락처: ${returnContact.trim()}` : ''}`,
      image_urls: returnImages,
      status: '접수',
    }).select().single()
    setReturnSubmitting(false)
    if (error) { alert('신청 중 오류가 발생했어요: ' + error.message); return }
    setOrderReturns(prev => [data, ...prev])
    setReturnModalOrder(null)
  }

  return (
    <>
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
            ) : orders.map(order => {
              const returnRequest = returnForOrder(order)
              const canRequestReturn = ['출고', '완료'].includes(order.status)
              const returnMeta = returnRequest ? RETURN_STATUS[returnRequest.status] || RETURN_STATUS['접수'] : null
              return (
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
                    {returnRequest ? (
                      <div style={{ marginTop:'14px', padding:'14px', borderRadius:'14px', background:returnMeta?.bg, border:`1.5px solid ${returnMeta?.color}30` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                          <span style={{ fontSize:'13px', fontWeight:900, color:returnMeta?.color }}>{returnRequest.type} 신청 {returnMeta?.label}</span>
                          <span style={{ fontSize:'11px', color:D.sub }}>{new Date(returnRequest.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        {returnRequest.admin_memo && <p style={{ fontSize:'12px', color:D.text, margin:'8px 0 0', lineHeight:1.6 }}>관리자 메모: {returnRequest.admin_memo}</p>}
                      </div>
                    ) : canRequestReturn && (
                      <button
                        onClick={() => openReturnModal(order)}
                        style={{ marginTop:'14px', width:'100%', padding:'15px', borderRadius:'14px', border:'1.5px solid rgba(245,158,11,0.45)', background:'rgba(245,158,11,0.08)', color:'#d97706', fontSize:'15px', fontWeight:900, cursor:'pointer' }}>
                        ↩️ 반품/교환 신청
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
            )})}
          </div>
      {returnModalOrder && (
        <div onClick={() => !returnSubmitting && setReturnModalOrder(null)}
          style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:'100%', maxHeight:'92vh', overflowY:'auto', background:D.card, borderRadius:'28px 28px 0 0', padding:'22px 22px 34px', boxShadow:'0 -20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width:'42px', height:'4px', borderRadius:'999px', background:D.border, margin:'0 auto 18px' }} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', marginBottom:'16px' }}>
              <div>
                <p style={{ fontSize:'20px', fontWeight:900, color:D.text, margin:'0 0 4px' }}>반품/교환 신청</p>
                <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>{returnModalOrder.order_number || `#${returnModalOrder.id.slice(0,8).toUpperCase()}`}</p>
              </div>
              <button onClick={() => setReturnModalOrder(null)}
                style={{ width:'40px', height:'40px', borderRadius:'12px', border:'none', background:D.input, color:D.text, fontSize:'18px', cursor:'pointer' }}>×</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
              {(['반품', '교환'] as const).map(t => (
                <button key={t} onClick={() => setReturnType(t)}
                  style={{ padding:'16px', borderRadius:'14px', border:`3px solid ${returnType === t ? accent : D.border}`, background:returnType === t ? 'rgba(22,163,74,0.1)' : D.input, color:returnType === t ? accent : D.text, fontSize:'16px', fontWeight:900, cursor:'pointer' }}>
                  {t === '반품' ? '↩️' : '🔁'} {t}
                </button>
              ))}
            </div>

            <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)}
              placeholder="사유를 자세히 적어주세요. 예: 배송 중 파손, 오배송, 상품이 상함, 수량 누락 등"
              rows={5}
              style={{ width:'100%', padding:'15px', borderRadius:'14px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'15px', lineHeight:1.6, outline:'none', resize:'none', boxSizing:'border-box', fontFamily:'inherit', marginBottom:'10px' }} />
            <input value={returnContact} onChange={e => setReturnContact(e.target.value)}
              placeholder="연락받을 전화번호"
              style={{ width:'100%', padding:'15px', borderRadius:'14px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'15px', outline:'none', boxSizing:'border-box', marginBottom:'12px' }} />

            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', marginBottom:'16px' }}>
              {returnImages.map((url, i) => (
                <div key={url} style={{ position:'relative', width:'78px', height:'78px', borderRadius:'12px', overflow:'hidden', border:`1px solid ${D.border}` }}>
                  <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <button onClick={() => setReturnImages(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ position:'absolute', top:'4px', right:'4px', width:'22px', height:'22px', borderRadius:'50%', border:'none', background:'rgba(0,0,0,0.65)', color:'white', cursor:'pointer' }}>×</button>
                </div>
              ))}
              {returnImages.length < 4 && (
                <label style={{ width:'78px', height:'78px', borderRadius:'12px', border:`2px dashed ${D.border}`, background:D.input, color:D.sub, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px', cursor:'pointer', fontSize:'12px', fontWeight:800 }}>
                  <span style={{ fontSize:'22px' }}>{returnUploading ? '⏳' : '📷'}</span>
                  {returnUploading ? '올리는중' : '사진'}
                  <input type="file" accept="image/*" multiple disabled={returnUploading} onChange={e => uploadReturnImages(e.target.files)} style={{ display:'none' }} />
                </label>
              )}
            </div>

            <div style={{ background:D.input, borderRadius:'14px', padding:'13px 15px', marginBottom:'14px' }}>
              <p style={{ fontSize:'12px', color:D.sub, lineHeight:1.6, margin:0 }}>사진은 파손·오배송·상함 확인에 도움이 됩니다. 실제 환불/결제취소는 관리자가 확인 후 별도로 처리합니다.</p>
            </div>

            <button onClick={submitReturn} disabled={returnSubmitting || !returnReason.trim()}
              style={{ width:'100%', padding:'17px', borderRadius:'16px', border:'none', background:(returnSubmitting || !returnReason.trim()) ? D.input : tc.gradient, color:(returnSubmitting || !returnReason.trim()) ? D.sub : 'white', fontSize:'17px', fontWeight:900, cursor:(returnSubmitting || !returnReason.trim()) ? 'not-allowed' : 'pointer', boxShadow:(returnSubmitting || !returnReason.trim()) ? 'none' : `0 10px 28px ${tc.color}40` }}>
              {returnSubmitting ? '신청 중...' : '반품/교환 접수'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
