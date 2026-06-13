'use client'

import Link from 'next/link'
import { priceFor } from './_shopConstants'

// 추천/최근 본 상품 미니 카드 — 상품상세 page에서 분리
export function ProductMini({ p, D, dark, getC, mt }: { p: any; D: any; dark: boolean; getC: () => string; mt: string }) {
  const price = priceFor(p, mt)
  return (
    <Link href={`/shop/product/${p.id}`} className="pd-mini" style={{ textDecoration:'none', display:'block', background:D.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${D.border}` }}>
      <div style={{ width:'100%', paddingTop:'100%', position:'relative', background:D.imgBg }}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px' }}>🧺</div>}
        {p.stock === 0 && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ background:'rgba(0,0,0,0.7)', color:'white', fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'20px' }}>품절</span>
          </div>
        )}
      </div>
      <div style={{ padding:'10px 12px' }}>
        <p style={{ fontSize:'13px', fontWeight:700, color:D.text, margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
        <p style={{ fontSize:'14px', fontWeight:900, color:getC(), margin:0 }}>{(price||0).toLocaleString()}원</p>
        <p style={{ fontSize:'10px', color:D.sub, margin:'2px 0 0' }}>/{p.unit}</p>
      </div>
    </Link>
  )
}
