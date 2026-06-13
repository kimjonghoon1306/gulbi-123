'use client'

import React from 'react'

// 마이페이지 쿠폰함 탭 — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  myCoupons: any[]
  availCoupons: any[]
  couponBusy: string
  claimCoupon: (c: any) => void
  D: any
  tc: any
  accent: string
}

export function CouponsTab({ myCoupons, availCoupons, couponBusy, claimCoupon, D, tc, accent }: Props) {
          const discountText = (c: any) => c.discount_type === 'percent'
            ? `${c.discount_value}% 할인${c.max_discount ? ` (최대 ${Number(c.max_discount).toLocaleString()}원)` : ''}`
            : `${Number(c.discount_value).toLocaleString()}원 할인`
          const issuer = (c: any) => c?.created_by_role === 'supplier' ? '공급사 발행' : '본사 발행'
          const unused = myCoupons.filter((m: any) => !m.used && m.coupons)
          const used = myCoupons.filter((m: any) => m.used && m.coupons)
          const CouponCard = ({ c, children, faded }: any) => (
            <div style={{ display:'flex', alignItems:'stretch', background:D.card, borderRadius:'16px', border:`1px solid ${D.border}`, overflow:'hidden', opacity: faded ? 0.55 : 1 }}>
              <div style={{ width:'8px', background: tc.gradient }} />
              <div style={{ flex:1, padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px' }}>
                  <span style={{ fontSize:'18px', fontWeight:900, color:accent }}>{discountText(c)}</span>
                  <span style={{ fontSize:'10px', fontWeight:800, padding:'3px 8px', borderRadius:'100px', background: c.created_by_role === 'supplier' ? 'rgba(13,148,136,0.12)' : 'rgba(22,163,74,0.12)', color: c.created_by_role === 'supplier' ? '#0d9488' : '#15803d' }}>{issuer(c)}</span>
                </div>
                <p style={{ fontSize:'13px', fontWeight:700, color:D.text, margin:'0 0 3px' }}>{c.description || c.code}</p>
                <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>
                  {c.min_amount ? `${Number(c.min_amount).toLocaleString()}원 이상 · ` : ''}
                  {c.expires_at ? `${new Date(c.expires_at).toLocaleDateString('ko-KR')}까지` : '기간 제한 없음'}
                </p>
              </div>
              <div style={{ display:'flex', alignItems:'center', paddingRight:'14px' }}>{children}</div>
            </div>
          )
          return (
            <div style={{ display:'flex', flexDirection:'column', gap:'22px' }}>
              {/* 받을 수 있는 쿠폰 */}
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <p style={{ fontSize:'15px', fontWeight:800, color:D.text, margin:0 }}>🎁 받을 수 있는 쿠폰 <span style={{ color:D.sub, fontSize:'13px', fontWeight:500 }}>{availCoupons.length}개</span></p>
                {availCoupons.length === 0 ? (
                  <div style={{ background:D.card, borderRadius:'16px', padding:'32px 20px', textAlign:'center', border:`1px solid ${D.border}` }}>
                    <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>지금 받을 수 있는 쿠폰이 없어요</p>
                  </div>
                ) : availCoupons.map((c: any) => (
                  <CouponCard key={c.id} c={c}>
                    <button onClick={() => claimCoupon(c)} disabled={couponBusy === c.id}
                      style={{ padding:'10px 18px', borderRadius:'12px', border:'none', cursor:'pointer', background:tc.gradient, color:'white', fontSize:'13px', fontWeight:800, whiteSpace:'nowrap' }}>
                      {couponBusy === c.id ? '...' : '받기'}
                    </button>
                  </CouponCard>
                ))}
              </div>

              {/* 내 쿠폰 (사용 가능) */}
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <p style={{ fontSize:'15px', fontWeight:800, color:D.text, margin:0 }}>🎟️ 내 쿠폰함 <span style={{ color:D.sub, fontSize:'13px', fontWeight:500 }}>{unused.length}개 사용 가능</span></p>
                <p style={{ fontSize:'12px', color:D.sub, margin:'-4px 0 0' }}>받은 쿠폰은 결제할 때 &lsquo;쿠폰 사용하기&rsquo;에서 골라 쓸 수 있어요.</p>
                {unused.length === 0 ? (
                  <div style={{ background:D.card, borderRadius:'16px', padding:'32px 20px', textAlign:'center', border:`1px solid ${D.border}` }}>
                    <p style={{ fontSize:'40px', margin:'0 0 8px' }}>🎟️</p>
                    <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>아직 받은 쿠폰이 없어요. 위에서 받아보세요!</p>
                  </div>
                ) : unused.map((m: any) => <CouponCard key={m.id} c={m.coupons}><span style={{ fontSize:'11px', fontWeight:800, color:accent }}>사용 가능 ✅</span></CouponCard>)}
              </div>

              {/* 사용한 쿠폰 */}
              {used.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <p style={{ fontSize:'15px', fontWeight:800, color:D.text, margin:0 }}>사용 완료 <span style={{ color:D.sub, fontSize:'13px', fontWeight:500 }}>{used.length}개</span></p>
                  {used.map((m: any) => <CouponCard key={m.id} c={m.coupons} faded><span style={{ fontSize:'11px', fontWeight:800, color:D.sub }}>사용함</span></CouponCard>)}
                </div>
              )}
            </div>
          )
}
