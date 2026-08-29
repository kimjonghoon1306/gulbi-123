'use client'

import React from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { payWithInicis } from '@/lib/inicis'
import { logClientError } from '@/lib/log-error'
import { openPostcode } from '@/lib/postcode'
import { calculateProductShipping } from '@/lib/shipping'
import { AddressBookPicker } from './_AddressBookPicker'
import { SellerNotice } from './_SellerNotice'

// 상품상세 주문 폼 모달 — page에서 분리. 주문/결제 로직은 그대로(verbatim).
type OrderForm = { address: string; recipient: string; phone: string; note: string; payment_method: string; evidence: string; evidenceContact: string }
type Props = {
  product: any
  selectedOption?: any | null
  quantity: number
  memberType: string
  memberInfo: any
  user: any
  addresses: any[]
  orderForm: OrderForm
  setOrderForm: React.Dispatch<React.SetStateAction<OrderForm>>
  orderLoading: boolean
  orderDone: boolean
  setOrderLoading: (v:boolean)=>void
  setOrderDone: (v:boolean)=>void
  setShowOrderForm: (v:boolean)=>void
  getPrice: ()=>number
  totalPrice: number
  finalPrice: number
  couponDiscount: number
  couponBase: (c:any)=>number
  appliedCoupon: any
  appliedUcId: string|null
  ownedCoupons: any[]
  selectCoupon: (uc:any)=>void
  removeCoupon: ()=>void
  couponMsg: any
  D: any
  dark: boolean
}

export function OrderModal({ product, selectedOption, quantity, orderDone, memberType, memberInfo, user, addresses, orderForm, setOrderForm, orderLoading, setOrderLoading, setOrderDone, setShowOrderForm, getPrice, totalPrice, finalPrice, couponDiscount, couponBase, appliedCoupon, appliedUcId, ownedCoupons, selectCoupon, removeCoupon, couponMsg, D, dark }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const id = product.id
  const [pointBalance, setPointBalance] = React.useState(0)
  const [pointUsed, setPointUsed] = React.useState(0)
  const shipping = calculateProductShipping(product, getPrice(), quantity)
  const orderAmount = finalPrice + shipping.appliedFee
  const pointLimit = Math.max(0, Math.min(pointBalance, orderAmount))
  const payAmount = Math.max(0, orderAmount - pointUsed)

  React.useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      const { data } = await supabase.from('cash_accounts').select('point_balance').eq('user_id', user.id).maybeSingle()
      setPointBalance(Number(data?.point_balance || 0))
    })()
  }, [user?.id])

  React.useEffect(() => {
    setPointUsed(prev => Math.max(0, Math.min(prev, pointLimit)))
  }, [pointLimit])

  const onPointChange = (value: string) => {
    const next = Math.floor(Number(value.replace(/[^\d]/g, '')) || 0)
    setPointUsed(Math.max(0, Math.min(next, pointLimit)))
  }

  return (
        <div
          onClick={() => !orderLoading && setShowOrderForm(false)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(10px)',zIndex:9999,display:'flex',
            alignItems:'flex-end', // 모바일: 하단
          }}
          className="order-overlay">
          <div
            onClick={e => e.stopPropagation()}
            style={{background:D.card,width:'100%',maxHeight:'92vh',overflowY:'auto',
              boxShadow:'0 -20px 60px rgba(0,0,0,0.3)',
            }}
            className="order-sheet">

            {orderDone ? (
              /* ── 완료 화면 ── */
              <div style={{padding:'48px 28px',textAlign:'center'}}>
                <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'linear-gradient(135deg,#15803d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'36px',margin:'0 auto 20px',boxShadow:'0 12px 32px rgba(22,163,74,0.4)'}}>🎉</div>
                <p style={{fontSize:'22px',fontWeight:900,color:D.text,margin:'0 0 8px'}}>주문 접수 완료!</p>
                <p style={{fontSize:'14px',color:D.sub,margin:'0 0 4px'}}>빠르게 연락드릴게요 😊</p>
                <p style={{fontSize:'12px',color:D.sub,margin:'0 0 32px'}}>마이페이지에서 주문 현황을 확인하세요</p>
                {/* 주문 유형 뱃지 */}
                <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:memberType==='도매업'?'rgba(4,120,87,0.12)':memberType==='소매업'?'rgba(22,163,74,0.1)':'rgba(22,163,74,0.1)',borderRadius:'20px',padding:'6px 16px',marginBottom:'28px'}}>
                  <span style={{fontSize:'14px'}}>{memberType==='도매업'?'🏭':memberType==='소매업'?'🏪':'🛒'}</span>
                  <span style={{fontSize:'12px',fontWeight:700,color:memberType==='도매업'?'#047857':memberType==='소매업'?'#14532d':'#15803d'}}>{memberType} 주문 접수됨</span>
                </div>
                <div style={{display:'flex',gap:'10px'}}>
                  <button onClick={() => setShowOrderForm(false)}
                    style={{flex:1,padding:'14px',borderRadius:'14px',border:`1.5px solid ${D.border}`,background:'transparent',color:D.sub,fontSize:'14px',fontWeight:600,cursor:'pointer'}}>
                    닫기
                  </button>
                  <button onClick={() => { setShowOrderForm(false); router.push('/shop/mypage') }}
                    style={{flex:2,padding:'14px',borderRadius:'14px',background:'linear-gradient(135deg,#15803d,#16a34a)',color:'white',fontSize:'14px',fontWeight:900,border:'none',cursor:'pointer',boxShadow:'0 6px 20px rgba(22,163,74,0.35)'}}>
                    📦 주문 확인하기 →
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ── 핸들바 (모바일) ── */}
                <div style={{display:'flex',justifyContent:'center',padding:'12px 0 0'}} className="sheet-handle">
                  <div style={{width:'40px',height:'4px',borderRadius:'4px',background:D.border}} />
                </div>

                {/* ── 컬러풀 헤더 ── */}
                <div style={{padding:'16px 24px 20px',background:'linear-gradient(135deg,#15803d,#16a34a)',margin:'12px 16px 0',borderRadius:'20px',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:'-20px',right:'-20px',width:'80px',height:'80px',borderRadius:'50%',background:'rgba(255,255,255,0.1)'}} />
                  <div style={{position:'absolute',bottom:'-30px',left:'20%',width:'100px',height:'100px',borderRadius:'50%',background:'rgba(255,255,255,0.06)'}} />
                  <div style={{position:'relative',zIndex:1}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{fontSize:'20px'}}>🛒</span>
                        <p style={{fontSize:'16px',fontWeight:900,color:'white',margin:0}}>주문서</p>
                      </div>
                      <button onClick={() => setShowOrderForm(false)}
                        style={{width:'32px',height:'32px',borderRadius:'10px',background:'rgba(255,255,255,0.2)',border:'none',cursor:'pointer',fontSize:'16px',color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                    </div>
                    {/* 상품 요약 */}
                    <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'10px 12px'}}>
                      {product.image_url && <img src={product.image_url} alt="" style={{width:'40px',height:'40px',borderRadius:'8px',objectFit:'cover',flexShrink:0}} />}
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:'13px',fontWeight:800,color:'white',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{product.name}</p>
                        <p style={{fontSize:'11px',color:'rgba(255,255,255,0.75)',margin:0}}>{selectedOption?.label ? `${selectedOption.label} · ` : ''}{quantity}{selectedOption?.unit || product.unit} × {getPrice().toLocaleString()}원</p>
                      </div>
                      <p style={{fontSize:'18px',fontWeight:900,color:'white',flexShrink:0}}>{totalPrice.toLocaleString()}원</p>
                    </div>
                  </div>
                </div>

                <div style={{padding:'20px 24px 32px',display:'flex',flexDirection:'column',gap:'18px'}}>

                  {/* 회원 정보 뱃지 */}
                  {memberInfo && (
                    <div style={{display:'flex',alignItems:'center',gap:'12px',background:D.input,borderRadius:'14px',padding:'12px 16px'}}>
                      <div style={{width:'40px',height:'40px',borderRadius:'12px',background:memberType==='도매업'?'linear-gradient(135deg,#059669,#047857)':memberType==='소매업'?'linear-gradient(135deg,#14532d,#15803d)':'linear-gradient(135deg,#16a34a,#15803d)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>
                        {memberType==='도매업'?'🏭':memberType==='소매업'?'🏪':'🛒'}
                      </div>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <p style={{fontSize:'14px',fontWeight:800,color:D.text,margin:0}}>{memberInfo.name}</p>
                          <span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'20px',background:memberType==='도매업'?'rgba(4,120,87,0.12)':memberType==='소매업'?'rgba(22,163,74,0.12)':'rgba(22,163,74,0.12)',color:memberType==='도매업'?'#047857':memberType==='소매업'?'#14532d':'#15803d'}}>{memberType}</span>
                        </div>
                        <p style={{fontSize:'11px',color:D.sub,margin:'2px 0 0'}}>{memberInfo.contact || memberInfo.email}</p>
                      </div>
                    </div>
                  )}

                  {/* 배송지 */}
                  <div>
                    <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',fontWeight:800,color:D.text,marginBottom:'10px'}}>
                      📍 배송지
                      <span style={{fontSize:'10px',fontWeight:700,color:D.gtext,background:'rgba(22,163,74,0.1)',padding:'2px 7px',borderRadius:'20px'}}>필수</span>
                    </label>
                    <AddressBookPicker
                      addresses={addresses}
                      selectedAddress={orderForm.address}
                      onSelect={(address, selected) => setOrderForm(p => ({ ...p, address, recipient: selected.recipient || '', phone: selected.phone || '' }))}
                      D={D}
                      dark={dark}
                      accent={D.gtext}
                    />
                    <button type="button" onClick={async () => { const r = await openPostcode(); if (r) setOrderForm(p => ({...p, address: r.address + ' '})) }}
                      style={{width:'100%',marginBottom:'8px',padding:'12px',borderRadius:'14px',border:`2px dashed ${D.border}`,background:D.input,color:D.text,fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
                      🔍 주소 검색
                    </button>
                    <input type="text" value={orderForm.address} onChange={e => setOrderForm(p => ({...p, address: e.target.value}))}
                      placeholder="주소 검색 후 상세주소(동·호수)를 입력해주세요"
                      style={{width:'100%',padding:'14px 16px',borderRadius:'14px',border:`2px solid ${orderForm.address ? '#15803d' : D.border}`,background:D.input,color:D.text,fontSize:'14px',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
                    {/* 받는 분 이름·연락처 — 주소록 선택 시 자동 채움, 직접 수정 가능 */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginTop:'8px'}}>
                      <input type="text" value={orderForm.recipient} onChange={e => setOrderForm(p => ({...p, recipient: e.target.value}))}
                        placeholder="받는 분 이름"
                        style={{width:'100%',padding:'14px 16px',borderRadius:'14px',border:`2px solid ${orderForm.recipient ? '#15803d' : D.border}`,background:D.input,color:D.text,fontSize:'14px',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
                      <input type="tel" inputMode="numeric" value={orderForm.phone} onChange={e => setOrderForm(p => ({...p, phone: e.target.value}))}
                        placeholder="받는 분 연락처"
                        style={{width:'100%',padding:'14px 16px',borderRadius:'14px',border:`2px solid ${orderForm.phone ? '#15803d' : D.border}`,background:D.input,color:D.text,fontSize:'14px',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
                    </div>
                  </div>

                  {/* 결제방법 */}
                  <div>
                    <label style={{display:'block',fontSize:'13px',fontWeight:800,color:D.text,marginBottom:'10px'}}>💳 결제방법</label>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      {[
                        {label:'가상계좌', icon:'🏦'},
                        {label:'카드',    icon:'💳'},
                      ].map(pm => (
                        <button key={pm.label} onClick={() => setOrderForm(p => ({...p, payment_method: pm.label}))}
                          style={{padding:'12px 10px',borderRadius:'12px',border:`2px solid ${orderForm.payment_method===pm.label ? '#15803d' : D.border}`,background:orderForm.payment_method===pm.label ? 'rgba(22,163,74,0.08)' : D.input,color:orderForm.payment_method===pm.label ? '#15803d' : D.sub,fontSize:'13px',fontWeight:orderForm.payment_method===pm.label ? 800 : 500,cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                          <span>{pm.icon}</span> {pm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 증빙 (가상계좌만 — 카드는 카드매출전표 갈음) */}
                  <div>
                    <label style={{display:'block',fontSize:'13px',fontWeight:800,color:D.text,marginBottom:'10px'}}>🧾 증빙</label>
                    {orderForm.payment_method === '카드' ? (
                      <div style={{background:D.input,borderRadius:'12px',padding:'13px 14px',fontSize:'12px',color:D.sub,lineHeight:1.5}}>
                        카드결제는 <b style={{color:D.text}}>카드매출전표</b>로 증빙이 갈음돼요.
                      </div>
                    ) : (
                      <>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                          {[{label:'세금계산서',icon:'🧾'},{label:'현금영수증',icon:'🧾'},{label:'발행안함',icon:'🚫'}].map(ev => (
                            <button key={ev.label} onClick={() => setOrderForm(p => ({...p, evidence: ev.label}))}
                              style={{padding:'12px 6px',borderRadius:'12px',border:`2px solid ${orderForm.evidence===ev.label ? '#15803d' : D.border}`,background:orderForm.evidence===ev.label ? 'rgba(22,163,74,0.08)' : D.input,color:orderForm.evidence===ev.label ? '#15803d' : D.sub,fontSize:'12px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                              {ev.icon} {ev.label}
                            </button>
                          ))}
                        </div>
                        {orderForm.evidence === '세금계산서' && (
                          <>
                            <input type="email" value={orderForm.evidenceContact} onChange={e => setOrderForm(p => ({...p, evidenceContact: e.target.value}))}
                              placeholder="세금계산서 받을 이메일 (선택)"
                              style={{width:'100%',marginTop:'10px',padding:'13px 16px',borderRadius:'12px',border:`2px solid ${D.border}`,background:D.input,color:D.text,fontSize:'13px',outline:'none',boxSizing:'border-box'}} />
                            <p style={{fontSize:'11.5px',color:D.sub,margin:'6px 2px 0',lineHeight:1.5}}>📧 입금이 확인되면 <b style={{color:D.text}}>여기 적은 이메일</b>(미입력 시 가입 이메일)로 세금계산서가 발송돼요. 홈택스에서도 조회할 수 있어요.</p>
                          </>
                        )}
                        {orderForm.evidence === '현금영수증' && (
                          <>
                            <input type="tel" value={orderForm.evidenceContact} onChange={e => setOrderForm(p => ({...p, evidenceContact: e.target.value}))}
                              placeholder="소득공제용 휴대폰번호 (미입력 시 가입 연락처)"
                              style={{width:'100%',marginTop:'10px',padding:'13px 16px',borderRadius:'12px',border:`2px solid ${D.border}`,background:D.input,color:D.text,fontSize:'13px',outline:'none',boxSizing:'border-box'}} />
                            <p style={{fontSize:'11.5px',color:D.sub,margin:'6px 2px 0',lineHeight:1.5}}>📱 입금이 확인되면 <b style={{color:D.text}}>이 번호로 국세청에 등록</b>돼요. 홈택스·손택스에서 조회되고 연말정산에 자동 반영돼요.</p>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* 요청사항 */}
                  <div>
                    <label style={{display:'block',fontSize:'13px',fontWeight:800,color:D.text,marginBottom:'10px'}}>💬 요청사항 <span style={{fontSize:'11px',fontWeight:400,color:D.sub}}>(선택)</span></label>
                    <textarea value={orderForm.note} onChange={e => setOrderForm(p => ({...p, note: e.target.value}))}
                      placeholder="배송 요청사항이나 특이사항을 입력해주세요"
                      rows={2}
                      style={{width:'100%',padding:'14px 16px',borderRadius:'14px',border:`2px solid ${D.border}`,background:D.input,color:D.text,fontSize:'13px',outline:'none',resize:'none',boxSizing:'border-box'}} />
                  </div>

                  {/* 쿠폰 사용하기 (쿠폰함에서 선택) */}
                  <div>
                    <label style={{display:'block',fontSize:'13px',fontWeight:800,color:D.text,marginBottom:'10px'}}>🎟️ 쿠폰 사용하기</label>
                    {appliedCoupon ? (
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:dark?'rgba(74,222,128,0.1)':'rgba(22,163,74,0.07)',border:`1px solid ${D.border}`,borderRadius:'12px',padding:'12px 14px'}}>
                        <div>
                          <p style={{fontSize:'14px',fontWeight:900,color:D.text,margin:0}}>{appliedCoupon.description || appliedCoupon.code}</p>
                          <p style={{fontSize:'12px',color:D.sub,margin:'2px 0 0'}}>−{couponDiscount.toLocaleString()}원 적용중</p>
                        </div>
                        <button onClick={removeCoupon} style={{fontSize:'12px',fontWeight:700,color:D.sub,background:'none',border:`1px solid ${D.border}`,borderRadius:'10px',padding:'7px 12px',cursor:'pointer'}}>해제</button>
                      </div>
                    ) : ownedCoupons.length === 0 ? (
                      <p style={{fontSize:'12px',color:D.sub,margin:0}}>사용할 수 있는 쿠폰이 없어요. <a href="/shop/mypage?tab=coupons" style={{color:D.text,fontWeight:700,textDecoration:'underline'}}>쿠폰함에서 받기 →</a></p>
                    ) : (
                      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                        {ownedCoupons.map((uc:any) => {
                          const c = uc.coupons; if (!c) return null
                          const dtext = c.discount_type === 'percent' ? `${c.discount_value}% 할인${c.max_discount?` (최대 ${Number(c.max_discount).toLocaleString()}원)`:''}` : `${Number(c.discount_value).toLocaleString()}원 할인`
                          const base = couponBase(c)
                          const usable = base >= (c.min_amount || 0) && !(c.created_by_role === 'supplier' && base === 0)
                          return (
                            <button key={uc.id} onClick={() => selectCoupon(uc)} disabled={!usable}
                              style={{display:'flex',alignItems:'center',justifyContent:'space-between',textAlign:'left',gap:'10px',padding:'12px 14px',borderRadius:'12px',border:`2px solid ${D.border}`,background:D.input,cursor:usable?'pointer':'not-allowed',opacity:usable?1:0.5}}>
                              <span>
                                <span style={{display:'block',fontSize:'14px',fontWeight:900,color:D.text}}>{dtext}</span>
                                <span style={{display:'block',fontSize:'11px',color:D.sub,marginTop:'2px'}}>{c.created_by_role==='supplier'?'공급사 발행':'본사 발행'}{c.min_amount?` · ${Number(c.min_amount).toLocaleString()}원 이상`:''}</span>
                              </span>
                              <span style={{fontSize:'12px',fontWeight:800,color:D.sub,whiteSpace:'nowrap'}}>{usable?'사용':'금액부족'}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {couponMsg && <p style={{fontSize:'12px',fontWeight:700,color:couponMsg.ok?'#16a34a':'#ef4444',margin:'10px 0 0'}}>{couponMsg.text}</p>}
                  </div>

                  <div>
                    <label style={{display:'block',fontSize:'13px',fontWeight:800,color:D.text,marginBottom:'10px'}}>💰 포인트 사용</label>
                    <div style={{background:D.input,borderRadius:'14px',padding:'12px 14px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:D.sub,marginBottom:'8px'}}>
                        <span>보유 포인트</span><b style={{color:D.text}}>{pointBalance.toLocaleString()} P</b>
                      </div>
                      <div style={{display:'flex',gap:'8px'}}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pointUsed ? pointUsed.toLocaleString() : ''}
                          onChange={e => onPointChange(e.target.value)}
                          placeholder="0"
                          style={{flex:1,minWidth:0,padding:'12px 14px',borderRadius:'12px',border:`2px solid ${D.border}`,background:D.card,color:D.text,fontSize:'14px',fontWeight:800,outline:'none',boxSizing:'border-box'}}
                        />
                        <button type="button" onClick={() => setPointUsed(pointLimit)}
                          style={{padding:'0 14px',borderRadius:'12px',border:`1px solid ${D.border}`,background:D.card,color:D.text,fontSize:'12px',fontWeight:800,cursor:'pointer',whiteSpace:'nowrap'}}>
                          모두 사용
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{background:D.input,borderRadius:'14px',padding:'14px 16px',display:'flex',flexDirection:'column',gap:'6px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:D.sub}}><span>상품 금액</span><span>{totalPrice.toLocaleString()}원</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:D.sub}}><span>배송비</span><span style={{fontWeight:700,color:shipping.appliedFee?D.text:'#16a34a'}}>{shipping.appliedFee ? `${shipping.appliedFee.toLocaleString()}원` : '무료'}</span></div>
                    {shipping.reason === 'threshold_met' && <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'#16a34a'}}><span>상품별 무료배송 조건 달성</span><span>−{shipping.discount.toLocaleString()}원</span></div>}
                    <p style={{fontSize:'11px',color:D.sub,margin:'0 0 3px',lineHeight:1.45}}>{shipping.reason === 'product_free' ? '이 상품은 기본 무료배송 상품입니다.' : shipping.reason === 'threshold_met' ? `이 상품 합계 ${shipping.productAmount.toLocaleString()}원이 ${shipping.freeThreshold?.toLocaleString()}원 이상이어서 기본 배송비 ${shipping.configuredFee.toLocaleString()}원이 할인됐습니다.` : `기본 배송비 ${shipping.configuredFee.toLocaleString()}원이 적용됩니다.${shipping.freeThreshold ? ` 이 상품 합계 ${shipping.freeThreshold.toLocaleString()}원 이상이면 무료입니다.` : ''}`}</p>
                    {couponDiscount > 0 && <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#16a34a',fontWeight:700}}><span>쿠폰 할인</span><span>−{couponDiscount.toLocaleString()}원</span></div>}
                    {pointUsed > 0 && <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#16a34a',fontWeight:700}}><span>포인트 사용</span><span>−{pointUsed.toLocaleString()}원</span></div>}
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'15px',color:D.text,fontWeight:900,borderTop:`1px solid ${D.border}`,paddingTop:'6px',marginTop:'2px'}}><span>최종 결제액</span><span>{payAmount.toLocaleString()}원</span></div>
                  </div>

                  {/* 판매자 책임 고지 (이니시스 심사 요구) */}
                  <div style={{marginBottom:'12px'}}>
                    <SellerNotice dark={dark} compact />
                  </div>

                  {/* 주문하기 버튼 */}
                  <button
                    onClick={async () => {
                      if (!orderForm.address) return alert('배송지를 입력해주세요.')
                      if (!orderForm.recipient.trim()) return alert('받는 분 이름을 입력해주세요.')
                      if (!orderForm.phone.trim()) return alert('연락처를 입력해주세요.')
                      try { localStorage.setItem('onjongil_addr', orderForm.address) } catch {}  // 주소 저장(다음 주문 자동입력)
                      setOrderLoading(true)
                      try {
                        const { data: { user: currentUser } } = await supabase.auth.getUser()
                        if (!currentUser || currentUser.id !== user?.id) {
                          alert('로그인이 만료되었습니다. 다시 로그인해주세요.')
                          setShowOrderForm(false)
                          router.push('/shop/login')
                          return
                        }
                        const { data: currentMember } = await supabase.from('shop_members').select('id').eq('id', currentUser.id).maybeSingle()
                        if (!currentMember) {
                          alert('회원 정보를 확인할 수 없습니다. 다시 로그인해주세요.')
                          setShowOrderForm(false)
                          router.push('/shop/login')
                          return
                        }
                        const table = memberType === '도매업' ? 'wholesale_orders' : memberType === '소매업' ? 'retail_orders' : 'general_orders'
                        const itemTable = memberType === '도매업' ? 'wholesale_order_items' : memberType === '소매업' ? 'retail_order_items' : 'general_order_items'
                        const isBiz = memberType !== '일반'
                        const isCard = orderForm.payment_method === '카드'      // 카드 = 이니시스 카드결제
                        const isVbank = orderForm.payment_method === '가상계좌' // 가상계좌 = 이니시스 가상계좌
                        const isPg = isCard || isVbank                         // 둘 다 이니시스 결제창 사용
                        // 재고는 결제/입금 성공 후 차감 → 시작 전 재고 여부만 확인(초과판매 방지)
                        {
                          const stockQuery = selectedOption
                            ? supabase.from('product_options').select('stock').eq('id', selectedOption.id).single()
                            : supabase.from('products').select('stock').eq('id', product.id).single()
                          const { data: prod } = await stockQuery
                          if (prod && prod.stock != null && prod.stock < quantity) {
                            setOrderLoading(false)
                            alert('죄송해요, 재고가 부족합니다. 수량을 줄여주세요.')
                            return
                          }
                        }
                        const orderData = {
                          customer_name: orderForm.recipient || memberInfo?.name || '',
                          contact: orderForm.phone || memberInfo?.contact || '',
                          user_id: currentUser.id,
                          address: orderForm.address,
                          note: orderForm.note,
                          payment_method: isCard ? '카드(이니시스)' : isVbank ? '가상계좌(이니시스)' : orderForm.payment_method,
                          status: isCard ? '결제대기' : isVbank ? '입금대기' : '접수',
                          total_amount: payAmount,
                          point_used: pointUsed,
                          coupon_code: appliedCoupon?.code || null,
                          coupon_owner: appliedCoupon?.created_by_role === 'supplier' ? appliedCoupon.created_by : null,
                          coupon_discount: couponDiscount,
                        }
                        const { data: newOrder, error: orderError } = await supabase.from(table).insert(orderData).select().single()
                        if (orderError || !newOrder) throw orderError || new Error('order insert failed')
                        if (newOrder) {
                          await supabase.from(itemTable).insert({
                            order_id: newOrder.id,
                            product_id: product.id,
                            product_name: product.name,
                            option_id: selectedOption?.id || null,
                            option_label: selectedOption?.label || null,
                            quantity,
                            unit: selectedOption?.unit || product.unit,
                            unit_price: getPrice(),
                            total_price: totalPrice,
                            supplier_id: product.supplier_id || null,
                            shipping_type: product.shipping_type || 'free',
                            shipping_fee: shipping.configuredFee,
                            free_shipping_threshold: shipping.freeThreshold,
                            shipping_discount: shipping.discount,
                            applied_shipping_fee: shipping.appliedFee,
                          })
                          // 쿠폰 사용처리
                          if (appliedCoupon) {
                            try { await supabase.rpc('increment_coupon_usage', { coupon_code: appliedCoupon.code }) } catch {}
                            if (appliedUcId) { try { await supabase.from('user_coupons').update({ used: true, used_at: new Date().toISOString(), order_ref: `${table}#${newOrder.id}` }).eq('id', appliedUcId) } catch {} }
                          }
                          // 증빙 자동생성 — 가상계좌(현금성)만. 카드는 카드매출전표 갈음(이중과세 방지)
                          if (isVbank && orderForm.evidence !== '발행안함') {
                            const vat = product.is_taxable ? payAmount - Math.round(payAmount / 1.1) : 0
                            if (orderForm.evidence === '세금계산서') {
                              await supabase.from('tax_invoices').insert({
                                company_name: memberInfo?.business_name || memberInfo?.name || '',
                                business_number: memberInfo?.business_number || '',
                                manager_name: memberInfo?.name || '',
                                contact: memberInfo?.contact || '',
                                invoicee_ceo_name: memberInfo?.business_ceo || memberInfo?.name || '',
                                invoicee_addr: memberInfo?.business_address || '',
                                invoicee_email: orderForm.evidenceContact || memberInfo?.email || '',
                                amount: payAmount - vat,
                                tax_amount: vat,
                                total_amount: payAmount,
                                note: `[자동] 주문 ${table} #${newOrder.id}`,
                                status: '미발행',
                              })
                            } else if (orderForm.evidence === '현금영수증') {
                              await supabase.from('cash_receipts').insert({
                                customer_name: memberInfo?.name || '',
                                contact: orderForm.evidenceContact || memberInfo?.contact || '',
                                amount: payAmount,
                                receipt_type: isBiz ? '사업자용' : '소비자용',
                                note: `[자동] 주문 ${table} #${newOrder.id}`,
                                status: '미발행',
                              })
                            }
                          }
                        }
                        if (newOrder && payAmount === 0) {
                          const res = await fetch('/api/orders/point-pay', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: newOrder.id, table }),
                          })
                          const data = await res.json().catch(() => ({}))
                          if (!res.ok) throw new Error(data.message || 'point pay failed')
                          setOrderDone(true)
                          return
                        }

                        // 카드/가상계좌 → 이니시스 결제창 호출 (승인은 서버 /api/payments/inicis/return)
                        if (isPg && newOrder) {
                          await payWithInicis({
                            table,
                            orderId: String(newOrder.id),
                            method: orderForm.payment_method,
                            goodname: product.name,
                            buyername: orderForm.recipient || memberInfo?.name || '고객',
                            buyertel: orderForm.phone || memberInfo?.contact || '',
                            buyeremail: memberInfo?.email || '',
                          })
                          return  // 이니시스 결제창이 열리므로 이후 코드 실행 안 함
                        }
                        setOrderDone(true)
                      } catch (e: any) {
                        // Supabase 에러 객체는 Error 인스턴스가 아니라 message/code/hint/details를 직접 들고 있음
                        const msg = e?.message || e?.error_description || (typeof e === 'string' ? e : JSON.stringify(e))
                        const detail = [e?.message, e?.code && `code=${e.code}`, e?.details, e?.hint].filter(Boolean).join(' | ')
                        logClientError({ area: 'shop-order', message: '상품상세 주문 실패', detail: detail || msg })
                        alert('주문 중 오류가 발생했어요. 다시 시도해주세요.\n\n(원인: ' + msg + ')')
                      }
                      finally { setOrderLoading(false) }
                    }}
                    disabled={orderLoading}
                    style={{width:'100%',padding:'18px',borderRadius:'16px',background:orderLoading ? D.input : 'linear-gradient(135deg,#15803d,#16a34a)',color:orderLoading ? D.sub : 'white',fontSize:'17px',fontWeight:900,border:'none',cursor:orderLoading ? 'not-allowed' : 'pointer',boxShadow:orderLoading ? 'none' : '0 10px 28px rgba(22,163,74,0.4)',transition:'all 0.2s',letterSpacing:'-0.3px'}}>
                    {orderLoading ? '⏳ 주문 처리 중...' : `🛒 ${payAmount.toLocaleString()}원 주문하기`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
  )
}
