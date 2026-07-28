'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { openPostcode } from '@/lib/postcode'
import { AddressBookPicker } from './_AddressBookPicker'
import { SellerNotice } from './_SellerNotice'

// 장바구니 주문 모달 — page에서 분리. handleOrder(주문로직)는 page에 그대로, JSX만 이동.
type CartOrderForm = { address: string; recipient: string; phone: string; note: string; payment_method: string; evidence: string; evidenceContact: string }
type Props = {
  orderForm: CartOrderForm
  setOrderForm: React.Dispatch<React.SetStateAction<CartOrderForm>>
  orderDone: boolean
  handleOrder: () => void
  orderLoading: boolean
  items: any[]
  finalAmount: number
  discount: number
  appliedCoupon: any
  memberInfo: any
  addresses: any[]
  isBiz: boolean
  D: any
  dark: boolean
  redirectCount: number
  agreeRefund: boolean
  setAgreeRefund: (v: boolean) => void
  vatAmount: number
  exemptSum: number
  taxableSum: number
  getPrice: (p: any) => number
  setShowOrder: (v: boolean) => void
  gtext: string
  priceColor: string
  pointBalance: number
  pointUsed: number
  pointLimit: number
  payAmount: number
  setPointUsed: (v: number) => void
}

export function CartOrderModal({ orderForm, setOrderForm, orderDone, handleOrder, orderLoading, items, finalAmount, discount, appliedCoupon, memberInfo, addresses, isBiz, D, dark, redirectCount, agreeRefund, setAgreeRefund, vatAmount, exemptSum, taxableSum, getPrice, setShowOrder, gtext, priceColor, pointBalance, pointUsed, pointLimit, payAmount, setPointUsed }: Props) {
  const router = useRouter()
  const onPointChange = (value: string) => {
    setPointUsed(Number(value.replace(/[^\d]/g, '')) || 0)
  }
  return (
        <div onClick={() => !orderLoading && setShowOrder(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(10px)', zIndex:9999, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:D.card, width:'100%', maxHeight:'92vh', overflowY:'auto', borderRadius:'28px 28px 0 0', boxShadow:'0 -20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
              <div style={{ width:'40px', height:'4px', borderRadius:'4px', background:D.border }} />
            </div>

            {orderDone ? (
              <div style={{ padding:'48px 28px', textAlign:'center' }}>
                {/* 성공 아이콘 */}
                <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(135deg,#14532d,#15803d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px', margin:'0 auto 20px', boxShadow:'0 12px 32px rgba(22,163,74,0.35)' }}>🎉</div>
                <p style={{ fontSize:'22px', fontWeight:900, color:D.text, margin:'0 0 8px' }}>주문 완료!</p>
                <p style={{ fontSize:'14px', color:D.sub, margin:'0 0 24px' }}>주문이 정상 접수됐어요</p>

                {/* 카운트다운 링 */}
                <div style={{ position:'relative', width:'64px', height:'64px', margin:'0 auto 20px' }}>
                  <svg width="64" height="64" style={{ transform:'rotate(-90deg)' }}>
                    <circle cx="32" cy="32" r="28" fill="none" stroke={D.border} strokeWidth="4" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#14532d" strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - redirectCount / 3)}`}
                      style={{ transition:'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:900, color:gtext }}>{redirectCount}</div>
                </div>

                <p style={{ fontSize:'13px', color:D.sub, margin:'0 0 24px' }}>{redirectCount}초 후 주문내역으로 이동해요</p>

                <div style={{ display:'flex', gap:'10px' }}>
                  <button onClick={() => { setShowOrder(false); router.push('/shop') }}
                    style={{ flex:1, padding:'14px', borderRadius:'14px', border:`1.5px solid ${D.border}`, background:'transparent', color:D.sub, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                    쇼핑 계속
                  </button>
                  <button onClick={() => { setShowOrder(false); router.push('/shop/mypage?tab=orders') }}
                    style={{ flex:2, padding:'14px', borderRadius:'14px', background:'linear-gradient(135deg,#14532d,#15803d)', color:'white', fontSize:'14px', fontWeight:900, border:'none', cursor:'pointer', boxShadow:'0 8px 20px rgba(22,163,74,0.3)' }}>
                    📦 주문내역 바로가기 →
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding:'20px 24px 40px', display:'flex', flexDirection:'column', gap:'18px' }}>
                <p style={{ fontWeight:900, fontSize:'18px', color:D.text, margin:0 }}>📋 주문서</p>

                {/* 주문 상품 요약 */}
                <div style={{ background:D.input, borderRadius:'14px', padding:'14px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {items.map(item => (
                    <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <p style={{ fontSize:'13px', color:D.text, margin:0 }}>{item.products.name} × {item.quantity}{item.products.unit}</p>
                      <p style={{ fontSize:'13px', fontWeight:700, color:priceColor, margin:0 }}>{(getPrice(item.products) * item.quantity).toLocaleString()}원</p>
                    </div>
                  ))}
                  {discount > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>🎟️ 쿠폰 {appliedCoupon?.code}</p>
                      <p style={{ fontSize:'13px', fontWeight:700, color:'#ef4444', margin:0 }}>−{discount.toLocaleString()}원</p>
                    </div>
                  )}
                  {pointUsed > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>💰 포인트 사용</p>
                      <p style={{ fontSize:'13px', fontWeight:700, color:gtext, margin:0 }}>−{pointUsed.toLocaleString()}원</p>
                    </div>
                  )}
                  <div style={{ height:'1px', background:D.border }} />
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <p style={{ fontSize:'14px', fontWeight:800, color:D.text, margin:0 }}>최종 결제액</p>
                    <p style={{ fontSize:'16px', fontWeight:900, color:priceColor, margin:0 }}>{payAmount.toLocaleString()}원</p>
                  </div>
                </div>

                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:800, color:D.text, marginBottom:'10px' }}>💰 포인트 사용</label>
                  <div style={{ background:D.input, borderRadius:'14px', padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:D.sub, marginBottom:'8px' }}>
                      <span>보유 포인트</span><b style={{ color:D.text }}>{pointBalance.toLocaleString()} P</b>
                    </div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={pointUsed ? pointUsed.toLocaleString() : ''}
                        onChange={e => onPointChange(e.target.value)}
                        placeholder="0"
                        style={{ flex:1, minWidth:0, padding:'12px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.card, color:D.text, fontSize:'14px', fontWeight:800, outline:'none', boxSizing:'border-box' }}
                      />
                      <button type="button" onClick={() => setPointUsed(pointLimit)}
                        style={{ padding:'0 14px', borderRadius:'12px', border:`1px solid ${D.border}`, background:D.card, color:D.text, fontSize:'12px', fontWeight:800, cursor:'pointer', whiteSpace:'nowrap' }}>
                        모두 사용
                      </button>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', borderTop:`1px solid ${D.border}`, marginTop:'12px', paddingTop:'10px' }}>
                      <span style={{ fontSize:'13px', fontWeight:800, color:D.text }}>최종 결제액</span>
                      <b style={{ fontSize:'15px', color:priceColor }}>{payAmount.toLocaleString()}원</b>
                    </div>
                  </div>
                </div>

                {/* 배송지 */}
                <div>
                  <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:800, color:D.text, marginBottom:'10px' }}>
                    📍 배송지 <span style={{ fontSize:'10px', color:gtext, background:'rgba(22,163,74,0.1)', padding:'2px 7px', borderRadius:'20px', fontWeight:700 }}>필수</span>
                  </label>
                  <AddressBookPicker
                    addresses={addresses}
                    selectedAddress={orderForm.address}
                    onSelect={(address, selected) => setOrderForm(p => ({ ...p, address, recipient: selected.recipient || '', phone: selected.phone || '' }))}
                    D={D}
                    dark={dark}
                    accent={gtext}
                  />
                  <button type="button" onClick={async () => { const r = await openPostcode(); if (r) setOrderForm(p => ({...p, address: r.address + ' '})) }}
                    style={{ width:'100%', marginBottom:'8px', padding:'12px', borderRadius:'14px', border:`2px dashed ${D.border}`, background:D.input, color:D.text, fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
                    🔍 주소 검색
                  </button>
                  <input type="text" value={orderForm.address} onChange={e => setOrderForm(p => ({...p, address: e.target.value}))}
                    placeholder="주소 검색 후 상세주소(동·호수)를 입력해주세요"
                    style={{ width:'100%', padding:'14px 16px', borderRadius:'14px', border:`2px solid ${orderForm.address ? '#14532d' : D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
                </div>

                {/* 결제방법 */}
                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:800, color:D.text, marginBottom:'10px' }}>💳 결제방법</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    {[{label:'가상계좌',icon:'🏦'},{label:'카드',icon:'💳'}].map(pm => (
                      <button key={pm.label} onClick={() => setOrderForm(p => ({...p, payment_method: pm.label}))}
                        style={{ padding:'12px', borderRadius:'12px', border:`2px solid ${orderForm.payment_method===pm.label ? '#14532d' : D.border}`, background:orderForm.payment_method===pm.label ? 'rgba(22,163,74,0.08)' : D.input, color:orderForm.payment_method===pm.label ? '#14532d' : D.sub, fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                        {pm.icon} {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 증빙 (세금계산서 / 현금영수증) */}
                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:800, color:D.text, marginBottom:'10px' }}>🧾 증빙</label>
                  {orderForm.payment_method === '카드' ? (
                    <div style={{ background:D.input, borderRadius:'12px', padding:'13px 14px', fontSize:'12px', color:D.sub, lineHeight:1.5 }}>
                      카드결제는 <b style={{ color:D.text }}>카드매출전표</b>로 증빙이 갈음돼요. 별도 세금계산서·현금영수증은 발행되지 않습니다.
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize:'11.5px', color:D.sub, margin:'0 0 8px' }}>증빙이 필요 없으면 <b style={{ color:D.text }}>발행안함</b>을 선택하세요.</p>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                        {[{ label:'세금계산서', icon:'🧾' }, { label:'현금영수증', icon:'🧾' }, { label:'발행안함', icon:'🚫' }].map(ev => (
                          <button key={ev.label} onClick={() => setOrderForm(p => ({...p, evidence: ev.label}))}
                            style={{ padding:'12px', borderRadius:'12px', border:`2px solid ${orderForm.evidence===ev.label ? '#14532d' : D.border}`, background:orderForm.evidence===ev.label ? 'rgba(22,163,74,0.08)' : D.input, color:orderForm.evidence===ev.label ? '#14532d' : D.sub, fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                            {ev.icon} {ev.label}
                          </button>
                        ))}
                      </div>
                      {orderForm.evidence === '세금계산서' && (
                        <div style={{ marginTop:'10px' }}>
                          <div style={{ background:D.input, borderRadius:'12px', padding:'12px 14px', fontSize:'12px', color:D.sub, marginBottom:'8px' }}>
                            <p style={{ margin:'0 0 2px' }}>상호: <b style={{ color:D.text }}>{memberInfo?.business_name || '미등록'}</b></p>
                            <p style={{ margin:0 }}>사업자번호: <b style={{ color:D.text }}>{memberInfo?.business_number || '미등록'}</b></p>
                          </div>
                          <input type="email" value={orderForm.evidenceContact} onChange={e => setOrderForm(p => ({...p, evidenceContact: e.target.value}))}
                            placeholder="세금계산서 받을 이메일 (선택)"
                            style={{ width:'100%', padding:'13px 16px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
                          <p style={{ fontSize:'11.5px', color:D.sub, margin:'6px 2px 0', lineHeight:1.5 }}>📧 입금이 확인되면 <b style={{ color:D.text }}>여기 적은 이메일</b>(미입력 시 가입 이메일)로 세금계산서가 발송돼요. 홈택스에서도 조회할 수 있어요.</p>
                        </div>
                      )}
                      {orderForm.evidence === '현금영수증' && (
                        <div style={{ marginTop:'10px' }}>
                          <input type="tel" value={orderForm.evidenceContact} onChange={e => setOrderForm(p => ({...p, evidenceContact: e.target.value}))}
                            placeholder="소득공제용 휴대폰번호 (미입력 시 가입 연락처)"
                            style={{ width:'100%', padding:'13px 16px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
                          <p style={{ fontSize:'11.5px', color:D.sub, margin:'6px 2px 0', lineHeight:1.5 }}>📱 입금이 확인되면 <b style={{ color:D.text }}>이 번호로 국세청에 등록</b>돼요. 홈택스·손택스에서 조회되고 연말정산에 자동 반영돼요.</p>
                        </div>
                      )}
                      {orderForm.evidence !== '발행안함' && exemptSum > 0 && taxableSum > 0 && (
                        <p style={{ fontSize:'11px', color:D.sub, margin:'8px 2px 0' }}>과세 {taxableSum.toLocaleString()}원(부가세 {vatAmount.toLocaleString()}원 포함) · 면세 {exemptSum.toLocaleString()}원</p>
                      )}
                    </>
                  )}
                </div>

                {/* 요청사항 */}
                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:800, color:D.text, marginBottom:'10px' }}>💬 요청사항 <span style={{ fontSize:'11px', color:D.sub, fontWeight:400 }}>(선택)</span></label>
                  <textarea value={orderForm.note} onChange={e => setOrderForm(p => ({...p, note: e.target.value}))}
                    placeholder="배송 요청사항을 입력해주세요" rows={2}
                    style={{ width:'100%', padding:'14px 16px', borderRadius:'14px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'13px', outline:'none', resize:'none', boxSizing:'border-box' }} />
                </div>

                {/* 청약철회·반품 안내 (신선식품 반품제한 사전고지) */}
                <div style={{ background:D.input, borderRadius:'14px', padding:'14px 16px' }}>
                  <p style={{ fontSize:'12px', fontWeight:800, color:D.text, margin:'0 0 6px' }}>📦 교환·반품 / 청약철회 안내</p>
                  <ul style={{ margin:0, paddingLeft:'16px', fontSize:'11.5px', color:D.sub, lineHeight:1.6 }}>
                    <li>상품 수령일로부터 <b style={{ color:D.text }}>7일 이내</b> 청약철회(반품)가 가능합니다.</li>
                    <li><b style={{ color:D.text }}>농·축·수산물 등 신선·냉장·냉동 식품</b>은 부패·변질 우려로, 포장 개봉·사용 시 또는 시간 경과 시 <b style={{ color:'#ef4444' }}>반품·교환이 불가</b>합니다.</li>
                    <li>소비자의 사용·섭취 또는 책임 있는 훼손·멸실로 가치가 현저히 감소한 경우 청약철회가 제한됩니다. (단순 포장 확인을 위한 개봉은 제외)</li>
                    <li>단순 변심에 의한 반품의 왕복 배송비는 소비자가 부담합니다.</li>
                  </ul>
                  <label style={{ display:'flex', alignItems:'flex-start', gap:'8px', marginTop:'12px', cursor:'pointer' }}>
                    <input type="checkbox" checked={agreeRefund} onChange={e => setAgreeRefund(e.target.checked)}
                      style={{ width:'18px', height:'18px', marginTop:'1px', accentColor:'#14532d', flexShrink:0 }} />
                    <span style={{ fontSize:'12.5px', fontWeight:700, color:D.text }}>위 청약철회·반품 제한 사항을 확인했으며, 이에 동의합니다. <span style={{ color:gtext }}>(필수)</span></span>
                  </label>
                </div>

                {/* 판매자 책임 고지 (이니시스 심사 요구) */}
                <div style={{ marginBottom:'12px' }}>
                  <SellerNotice dark={dark} compact />
                </div>

                <button onClick={handleOrder} disabled={orderLoading || !agreeRefund}
                  style={{ width:'100%', padding:'18px', borderRadius:'16px', background:(orderLoading || !agreeRefund) ? D.input : 'linear-gradient(135deg,#14532d,#15803d)', color:(orderLoading || !agreeRefund) ? D.sub : 'white', fontSize:'17px', fontWeight:900, border:'none', cursor:(orderLoading || !agreeRefund) ? 'not-allowed' : 'pointer', boxShadow:(orderLoading || !agreeRefund) ? 'none' : '0 10px 28px rgba(22,163,74,0.35)' }}>
                  {orderLoading ? '⏳ 처리 중...' : <><span className="cart-emoji">🛒</span> {payAmount.toLocaleString()}원 주문하기</>}
                </button>
              </div>
            )}
          </div>
        </div>
  )
}
