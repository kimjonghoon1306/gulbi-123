'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const KOREAN_NAMES = ['김민준','이서연','박지훈','최유나','정성호','강미래','윤도현','임하은','신준서','오채원','한동욱','배수아','조민서','문지우','권나연','장현우','류소희','노태양','심예린','구민혁','엄지은','변성민','남하린','황준혁','송아영']
const ACTIONS = ['구매했습니다','장바구니에 담았습니다','관심 상품으로 저장했습니다','구매 문의를 했습니다','리뷰를 작성했습니다']

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [memberType, setMemberType] = useState('일반')
  const [user, setUser] = useState<any>(null)
  const [dark, setDark] = useState(false)
  const [liked, setLiked] = useState(false)
  const [popup, setPopup] = useState<{name:string;action:string;show:boolean}>({name:'',action:'',show:false})
  const [visitorCount, setVisitorCount] = useState(0)
  const [socialComments, setSocialComments] = useState<any[]>([])
  const popupTimer = useRef<any>(null)

  useEffect(() => {
    fetchProduct()
    checkUser()
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)
    fetchSocialData()
    startPopupCycle()
    return () => { if (popupTimer.current) clearTimeout(popupTimer.current) }
  }, [id])

  const fetchProduct = async () => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    setProduct(data)
    setLoading(false)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data: member } = await supabase.from('shop_members').select('member_type').eq('id', user.id).single()
      if (member) setMemberType(member.member_type)
    }
  }

  const fetchSocialData = async () => {
    try {
      // 방문자수 설정값
      const { data: vc } = await supabase.from('system_settings').select('value').eq('key', 'visitor_count_override').single()
      if (vc?.value) setVisitorCount(Number(vc.value))
      else setVisitorCount(Math.floor(Math.random() * 80) + 20)
      // 소셜 댓글
      const { data: comments } = await supabase.from('social_proof_comments').select('*').eq('is_active', true).order('sort_order')
      if (comments) setSocialComments(comments)
    } catch {}
  }

  const startPopupCycle = () => {
    const show = () => {
      const name = KOREAN_NAMES[Math.floor(Math.random() * KOREAN_NAMES.length)]
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)]
      setPopup({ name, action, show: true })
      popupTimer.current = setTimeout(() => {
        setPopup(p => ({ ...p, show: false }))
        popupTimer.current = setTimeout(show, 20000)
      }, 4000)
    }
    popupTimer.current = setTimeout(show, 3000)
  }

  const getPrice = () => {
    if (!product) return 0
    if (memberType === '도매업') return product.wholesale_price
    if (memberType === '소매업') return product.retail_price  // 소매유통가 = retail_price
    return product.retail_price // 일반소매가
  }

  const getPriceLabel = () => {
    if (memberType === '도매업') return '도매 유통가'
    if (memberType === '소매업') return '소매 유통가'
    return '일반 소매가'
  }

  const getPriceColor = () => {
    if (memberType === '도매업') return '#ec4899'
    if (memberType === '소매업') return '#0f766e'
    return '#6366f1'
  }

  const D = {
    bg: dark ? '#0d1117' : '#f8fafc',
    headerBg: dark ? 'rgba(13,17,23,0.97)' : 'rgba(255,255,255,0.97)',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    card: dark ? '#161b22' : '#ffffff',
    text: dark ? '#f0f0ee' : '#0f172a',
    sub: dark ? '#6b7280' : '#64748b',
    input: dark ? '#1e2530' : '#f1f5f9',
    imgBg: dark ? '#1e2530' : '#f8fafc',
    accent: '#ec4899',
    accentDark: '#f43f5e',
    green: '#059669',
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:D.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'40px',height:'40px',borderRadius:'50%',border:'3px solid #ec4899',borderTopColor:'transparent',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}} />
        <p style={{color:D.sub,fontSize:'13px'}}>불러오는 중...</p>
      </div>
    </div>
  )

  if (!product) return (
    <div style={{minHeight:'100vh',background:D.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}}>
      <p style={{fontSize:'48px'}}>🐟</p>
      <p style={{color:D.sub,fontSize:'14px'}}>상품을 찾을 수 없어요</p>
      <Link href="/shop" style={{color:D.accent,fontSize:'13px',fontWeight:600,textDecoration:'none'}}>← 쇼핑몰로</Link>
    </div>
  )

  const totalPrice = getPrice() * quantity

  return (
    <div style={{background:D.bg,color:D.text,minHeight:'100vh',fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif"}}>

      {/* 소셜 팝업 */}
      {popup.show && (
        <div style={{position:'fixed',bottom:'24px',left:'16px',zIndex:9999,background:D.card,borderRadius:'16px',padding:'12px 16px',boxShadow:'0 8px 32px rgba(0,0,0,0.15)',border:`1px solid ${D.border}`,maxWidth:'260px',animation:'slideUp 0.4s ease'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,#ec4899,#f43f5e)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'14px',fontWeight:900,flexShrink:0}}>
              {popup.name[0]}
            </div>
            <div>
              <p style={{fontSize:'12px',fontWeight:700,color:D.text,margin:0}}>{popup.name}님이</p>
              <p style={{fontSize:'11px',color:D.sub,margin:0}}>{popup.action}</p>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header style={{background:D.headerBg,backdropFilter:'blur(20px)',borderBottom:`1px solid ${D.border}`,position:'sticky',top:0,zIndex:50}}>
        <div style={{maxWidth:'1100px',margin:'0 auto',padding:'0 20px',height:'60px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
            <button onClick={() => router.back()} style={{background:D.input,border:'none',borderRadius:'10px',width:'36px',height:'36px',cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center',color:D.text}}>←</button>
            <Link href="/landing" style={{display:'flex',alignItems:'center',gap:'8px',textDecoration:'none'}}>
              <span style={{fontSize:'20px'}}>🐟</span>
              <div>
                <p style={{fontSize:'14px',fontWeight:800,color:D.text,letterSpacing:'-0.5px',lineHeight:1}}>굴비가게</p>
                <p style={{fontSize:'9px',color:D.sub,letterSpacing:'2px',textTransform:'uppercase'}}>Fresh Market</p>
              </div>
            </Link>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            {visitorCount > 0 && (
              <div style={{background:dark?'#1e2530':'#fdf2f8',borderRadius:'100px',padding:'4px 10px',display:'flex',alignItems:'center',gap:'4px'}}>
                <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#ec4899',animation:'pulse 2s infinite'}} />
                <span style={{fontSize:'11px',fontWeight:700,color:'#ec4899'}}>{visitorCount}명 방문중</span>
              </div>
            )}
            <button onClick={() => setDark(!dark)} style={{width:'36px',height:'36px',borderRadius:'10px',background:D.input,border:'none',cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {dark ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>

      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'24px 20px 120px'}}>

        {/* 상품 히어로 */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'36px',marginBottom:'32px'}} className="product-grid">

          {/* 이미지 */}
          <div style={{position:'relative'}}>
            <div style={{borderRadius:'24px',overflow:'hidden',background:D.imgBg,position:'relative',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',minHeight:'260px',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} style={{width:'100%',height:'auto',maxHeight:'520px',objectFit:'contain',display:'block'}} />
              ) : (
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'80px'}}>🐟</div>
              )}
              {product.stock === 0 && (
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{background:'rgba(0,0,0,0.8)',color:'white',fontSize:'14px',fontWeight:700,padding:'10px 24px',borderRadius:'100px'}}>품절</span>
                </div>
              )}
              <div style={{position:'absolute',top:'12px',left:'12px',display:'flex',flexDirection:'column',gap:'5px'}}>
                {product.stock > 0 && product.stock < 20 && (
                  <span style={{background:'rgba(239,68,68,0.9)',color:'white',fontSize:'10px',fontWeight:700,padding:'3px 8px',borderRadius:'100px'}}>품절임박</span>
                )}
                <span style={{background:'rgba(5,150,105,0.9)',color:'white',fontSize:'10px',fontWeight:700,padding:'3px 8px',borderRadius:'100px'}}>무료배송</span>
              </div>
              <button onClick={() => setLiked(!liked)} style={{position:'absolute',top:'12px',right:'12px',width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.9)',border:'none',cursor:'pointer',fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}>
                {liked ? '❤️' : '🤍'}
              </button>
            </div>
          </div>

          {/* 상품 정보 */}
          <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
            <p style={{fontSize:'11px',color:D.sub,letterSpacing:'2px',fontWeight:700,marginBottom:'8px',textTransform:'uppercase'}}>
              {product.category_id ? '수산물' : '신선 식품'}
            </p>
            <h1 style={{fontSize:'26px',fontWeight:900,letterSpacing:'-0.8px',lineHeight:1.25,marginBottom:'14px',color:D.text}}>{product.name}</h1>

            {/* 회원 유형별 가격 탭 */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px',marginBottom:'14px'}}>
              {([
                {type:'일반',   label:'일반 소매가', emoji:'🛒', color:'#6366f1'},
                {type:'소매업', label:'소매 유통가',  emoji:'🏪', color:'#0f766e'},
                {type:'도매업', label:'도매 유통가',  emoji:'🏭', color:'#ec4899'},
              ] as const).map(t => (
                <button key={t.type} onClick={() => setMemberType(t.type)}
                  style={{padding:'10px 6px',borderRadius:'12px',
                    border:`2px solid ${memberType===t.type ? t.color : (dark?'rgba(255,255,255,0.1)':'#e2e8f0')}`,
                    background:memberType===t.type ? t.color+'15' : D.card,
                    cursor:'pointer',transition:'all 0.2s',textAlign:'center'}}>
                  <p style={{fontSize:'16px',margin:'0 0 3px'}}>{t.emoji}</p>
                  <p style={{fontSize:'10px',color:memberType===t.type ? t.color : D.sub,fontWeight:700,margin:0,lineHeight:1.3}}>{t.label}</p>
                </button>
              ))}
            </div>

            {/* 가격 */}
            <div style={{background:dark?'#1e2530':'#fdf2f8',borderRadius:'18px',padding:'18px 20px',marginBottom:'16px',border:`1px solid ${dark?'rgba(255,255,255,0.06)':'#fce7f3'}`}}>
              <p style={{fontSize:'11px',fontWeight:700,color:getPriceColor(),marginBottom:'4px',letterSpacing:'0.5px'}}>
                {getPriceLabel()}
              </p>
              <p style={{fontSize:'32px',fontWeight:900,color:D.text,letterSpacing:'-1.5px',lineHeight:1,marginBottom:'2px'}}>
                {getPrice().toLocaleString()}<span style={{fontSize:'16px',fontWeight:600,color:D.sub}}>원</span>
              </p>
              <p style={{fontSize:'12px',color:D.sub}}>/{product.unit}</p>
              {memberType === '일반' && (
                <div style={{marginTop:'10px',padding:'8px 12px',background:dark?'rgba(255,255,255,0.04)':'#f8fafc',borderRadius:'10px',display:'flex',flexDirection:'column',gap:'4px'}}>
                  <p style={{fontSize:'11px',color:'#0f766e',fontWeight:600,margin:0}}>🏪 소매 유통가 {product.retail_price.toLocaleString()}원 — 소매회원 전용</p>
                  <p style={{fontSize:'11px',color:'#ec4899',fontWeight:600,margin:0}}>🏭 도매 유통가 {product.wholesale_price.toLocaleString()}원 — 도매회원 전용</p>
                </div>
              )}
            </div>

            {/* 재고 */}
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
              <div style={{width:'8px',height:'8px',borderRadius:'50%',background:product.stock > 0 ? '#22c55e' : '#ef4444'}} />
              <p style={{fontSize:'13px',color:D.sub,fontWeight:500}}>
                {product.stock > 0 ? `재고 ${product.stock}${product.unit} 남음` : '현재 품절입니다'}
              </p>
            </div>

            {/* 수량 */}
            {product.stock > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'20px'}}>
                <p style={{fontSize:'13px',color:D.sub,fontWeight:600,flexShrink:0}}>수량</p>
                <div style={{display:'flex',alignItems:'center',background:D.input,borderRadius:'12px',overflow:'hidden'}}>
                  <button onClick={() => setQuantity(Math.max(1,quantity-1))} style={{width:'40px',height:'40px',background:'none',border:'none',fontSize:'18px',cursor:'pointer',color:D.text,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                  <span style={{width:'40px',textAlign:'center',fontSize:'15px',fontWeight:700,color:D.text}}>{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock,quantity+1))} style={{width:'40px',height:'40px',background:'none',border:'none',fontSize:'18px',cursor:'pointer',color:D.text,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                </div>
                <p style={{fontSize:'15px',fontWeight:900,color:'#ec4899',marginLeft:'auto'}}>
                  = {totalPrice.toLocaleString()}원
                </p>
              </div>
            )}

            {/* 버튼 */}
            {!user ? (
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                <Link href="/shop/login" style={{display:'block',textAlign:'center',padding:'16px',background:'linear-gradient(135deg,#ec4899,#f43f5e)',color:'white',fontWeight:900,fontSize:'15px',borderRadius:'14px',textDecoration:'none',boxShadow:'0 8px 20px rgba(236,72,153,0.35)'}}>
                  🛒 로그인 후 구매하기
                </Link>
                <Link href="/shop/register" style={{display:'block',textAlign:'center',padding:'13px',background:'transparent',color:D.sub,fontSize:'13px',fontWeight:600,borderRadius:'14px',textDecoration:'none',border:`1.5px solid ${D.border}`}}>
                  회원가입
                </Link>
              </div>
            ) : product.stock === 0 ? (
              <button disabled style={{width:'100%',padding:'16px',borderRadius:'14px',background:D.input,color:D.sub,fontSize:'15px',fontWeight:700,border:'none',cursor:'not-allowed'}}>품절</button>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                <button style={{width:'100%',padding:'16px',borderRadius:'14px',background:'linear-gradient(135deg,#ec4899,#f43f5e)',color:'white',fontSize:'15px',fontWeight:900,border:'none',cursor:'pointer',boxShadow:'0 8px 20px rgba(236,72,153,0.35)'}}>
                  🛒 구매 문의하기
                </button>
                <p style={{textAlign:'center',fontSize:'11px',color:D.sub}}>결제 시스템 준비 중 · 카카오톡으로 문의해 주세요</p>
              </div>
            )}
          </div>
        </div>

        {/* 상세 설명 */}
        {product.description && (
          <div style={{marginBottom:'16px',display:'flex',justifyContent:'center'}}>
            <div style={{width:'100%',maxWidth:'500px',background:D.card,borderRadius:'24px',overflow:'hidden',border:`1px solid ${D.border}`}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'20px 20px 0',marginBottom:'12px'}}>
                <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#ec4899,#f43f5e)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>✦</div>
                <h2 style={{fontSize:'16px',fontWeight:900,letterSpacing:'-0.3px'}}>상품 상세</h2>
              </div>
              <div dangerouslySetInnerHTML={{__html: product.description}} style={{lineHeight:1.8}} />
            </div>
          </div>
        )}

        {/* 소셜 프루프 댓글 */}
        {socialComments.length > 0 && (
          <div style={{background:D.card,borderRadius:'24px',padding:'28px',marginBottom:'16px',border:`1px solid ${D.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
              <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#f59e0b,#f97316)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>⭐</div>
              <h2 style={{fontSize:'16px',fontWeight:900,letterSpacing:'-0.3px'}}>구매 후기</h2>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {socialComments.map((c:any) => (
                <div key={c.id} style={{padding:'16px',background:dark?'#1e2530':'#f8fafc',borderRadius:'14px',border:`1px solid ${D.border}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:`linear-gradient(135deg,${c.avatar_color||'#ec4899'},${c.avatar_color2||'#f43f5e'})`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'12px',fontWeight:900,flexShrink:0}}>
                      {(c.author||'익')[0]}
                    </div>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:700,color:D.text,margin:0}}>{c.author}</p>
                      <p style={{fontSize:'11px',color:D.sub,margin:0}}>{c.created_label||'최근'}</p>
                    </div>
                    <div style={{marginLeft:'auto',display:'flex',gap:'2px'}}>
                      {'⭐'.repeat(c.rating||5).split('').map((s,i) => <span key={i} style={{fontSize:'12px'}}>{s}</span>)}
                    </div>
                  </div>
                  <p style={{fontSize:'13px',color:D.text,lineHeight:1.7,margin:0}}>{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @media(max-width:640px){.product-grid{grid-template-columns:1fr!important;gap:24px!important}}
      `}</style>
    </div>
  )
}
