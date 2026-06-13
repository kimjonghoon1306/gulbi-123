'use client'

import React from 'react'

// 마이페이지 찜 목록 탭 — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  D: any
  tc: any
  accent: string
  member: any
  dark: boolean
  wishlists: any[]
  removeWishlist: (id: string) => void
}

export function WishlistTab({ D, tc, accent, member, dark, wishlists, removeWishlist }: Props) {
  return (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
              <p style={{ fontSize:'15px', fontWeight:800, color:D.text, margin:0 }}>❤️ 찜한 상품 <span style={{ color:D.sub, fontSize:'13px', fontWeight:500 }}>{wishlists.length}개</span></p>
            </div>
            {wishlists.length === 0 ? (
              <div style={{ background:D.card, borderRadius:'20px', padding:'48px 20px', textAlign:'center', border:`1px solid ${D.border}` }}>
                <p style={{ fontSize:'40px', marginBottom:'12px' }}>🤍</p>
                <p style={{ fontSize:'14px', color:D.sub, margin:'0 0 16px' }}>찜한 상품이 없어요</p>
                <a href="/shop" style={{ display:'inline-block', padding:'10px 20px', borderRadius:'12px', background:tc.gradient, color:'white', fontSize:'13px', fontWeight:700, textDecoration:'none' }}>
                  쇼핑하러 가기
                </a>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'14px' }}>
                {wishlists.map((w: any) => {
                  const p = w.products
                  if (!p) return null
                  const wishPrice = member.member_type === '도매업' ? (p.wholesale_price||0)
                    : member.member_type === '소매업' ? (p.member_price||0)
                    : (p.retail_price||0)
                  return (
                    <a key={w.id} href={`/shop/product/${p.id}`} style={{ textDecoration:'none', display:'block', background:D.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${D.border}`, transition:'transform 0.15s' }}>
                      <div style={{ width:'100%', paddingTop:'100%', position:'relative', background:dark?'#15391f':'#f8fafc' }}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                          : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px' }}>🧺</div>
                        }
                        {p.stock === 0 && (
                          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ background:'rgba(0,0,0,0.7)', color:'white', fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'20px' }}>품절</span>
                          </div>
                        )}
                        {/* 찜 해제 */}
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeWishlist(w.id) }} aria-label="찜 해제"
                          style={{ position:'absolute', top:'8px', right:'8px', width:'30px', height:'30px', borderRadius:'50%', border:'none', cursor:'pointer', background:'rgba(255,255,255,0.92)', fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', backdropFilter:'blur(4px)' }}>❤️</button>
                      </div>
                      <div style={{ padding:'10px 12px' }}>
                        <p style={{ fontSize:'13px', fontWeight:700, color:D.text, margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                        <p style={{ fontSize:'14px', fontWeight:900, color:accent, margin:0 }}>{wishPrice.toLocaleString()}원</p>
                        <p style={{ fontSize:'10px', color:D.sub, margin:'2px 0 0' }}>/{p.unit}</p>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
  )
}
