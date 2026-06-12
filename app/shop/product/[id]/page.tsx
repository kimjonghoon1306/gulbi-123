'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { loadToss } from '@/lib/toss'
import { openPostcode } from '@/lib/postcode'
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
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderForm, setOrderForm] = useState({ address: '', note: '', payment_method: '계좌이체' })
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderDone, setOrderDone] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const popupTimer = useRef<any>(null)

  // ── 리뷰/별점 ──
  const [reviews, setReviews] = useState<any[]>([])
  const [myReview, setMyReview] = useState<any>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const fetchReviews = async (uid?: string) => {
    const { data } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false })
    const list = data || []
    setReviews(list)
    const mine = uid ? list.find((r: any) => r.user_id === uid) : null
    setMyReview(mine || null)
    if (mine) { setReviewRating(mine.rating); setReviewContent(mine.content || '') }
  }

  const submitReview = async () => {
    if (!user) { router.push('/shop/login'); return }
    setReviewSubmitting(true)
    try {
      await supabase.from('reviews').upsert({
        product_id: id, user_id: user.id,
        author_name: memberInfo?.name || '익명',
        rating: reviewRating, content: reviewContent.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'product_id,user_id' })
      await fetchReviews(user.id)
    } catch { alert('리뷰 저장 중 오류가 발생했어요.') }
    finally { setReviewSubmitting(false) }
  }

  const deleteReview = async () => {
    if (!user || !myReview) return
    if (!confirm('리뷰를 삭제할까요?')) return
    await supabase.from('reviews').delete().eq('id', myReview.id)
    setMyReview(null); setReviewRating(5); setReviewContent('')
    await fetchReviews(user.id)
  }

  const reviewAvg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0

  const fetchProduct = async () => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    setProduct(data)
    setLoading(false)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const isAdminRole = user.app_metadata?.role === 'admin'
      const { data: member } = await supabase.from('shop_members').select('*').eq('id', user.id).single()
      if (member && !isAdminRole) {
        setMemberType(member.member_type)
        setMemberInfo(member)
      } else {
        setIsAdmin(true)
      }
      const { data: wish } = await supabase.from('wishlists').select('id').eq('user_id', user.id).eq('product_id', id).single()
      setLiked(!!wish)
      fetchReviews(user.id)
    }
  }

  const toggleLike = async () => {
    if (!user) { router.push('/shop/login'); return }
    if (liked) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', id)
      setLiked(false)
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: id })
      setLiked(true)
    }
  }

  const addToCart = async () => {
    if (!user) { return }
    setCartLoading(true)
    const { data: existing } = await supabase.from('cart_items').select('id,quantity').eq('user_id', user.id).eq('product_id', id).single()
    if (existing) {
      await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id)
    } else {
      await supabase.from('cart_items').insert({ user_id: user.id, product_id: id, quantity })
    }
    // 🛒 헤더 카운트 갱신 신호
    localStorage.setItem('cart-updated', Date.now().toString())
    setCartAdded(true)
    setCartLoading(false)
    setTimeout(() => setCartAdded(false), 2000)
  }

  const fetchSocialData = async () => {
    try {
      const { data: vc } = await supabase.from('system_settings').select('value').eq('key', 'visitor_count_override').single()
      if (vc?.value) setVisitorCount(Number(vc.value))
      else setVisitorCount(Math.floor(Math.random() * 80) + 20)
      // 해당 상품 댓글 + 공통 댓글(product_id가 null인 것) 같이 불러오기
      const { data: comments } = await supabase
        .from('social_proof_comments')
        .select('*')
        .eq('is_active', true)
        .or(`product_id.eq.${id},product_id.is.null`)
        .order('sort_order')
      if (comments) setSocialComments(comments)
    } catch {}
  }

  const startPopupCycle = () => {
    if (popupTimer.current) clearTimeout(popupTimer.current)
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

  useEffect(() => {
    fetchProduct()
    checkUser()
    fetchReviews()
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)
    fetchSocialData()
    startPopupCycle()
    return () => { if (popupTimer.current) clearTimeout(popupTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const getPrice = () => {
    if (!product) return 0
    if (memberType === '도매업') return product.wholesale_price
    if (memberType === '소매업') return product.member_price  // 소매유통가 = member_price
    return product.retail_price // 일반소매가
  }

  const getPriceLabel = () => {
    if (memberType === '도매업') return '도매 유통가'
    if (memberType === '소매업') return '소매 유통가'
    return '일반 소매가'
  }

  const getPriceColor = () => {
    if (memberType === '도매업') return '#047857'
    if (memberType === '소매업') return '#14532d'
    return '#15803d'
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
    accent: '#15803d',
    accentDark: '#16a34a',
    green: '#059669',
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:D.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'40px',height:'40px',borderRadius:'50%',border:'3px solid #15803d',borderTopColor:'transparent',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}} />
        <p style={{color:D.sub,fontSize:'13px'}}>불러오는 중...</p>
      </div>
    </div>
  )

  if (!product) return (
    <div style={{minHeight:'100vh',background:D.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}}>
      <p style={{fontSize:'48px'}}>🧺</p>
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
            <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,#15803d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'14px',fontWeight:900,flexShrink:0}}>
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
              <span style={{fontSize:'20px'}}>🧺</span>
              <div>
                <p style={{fontSize:'14px',fontWeight:800,color:D.text,letterSpacing:'-0.5px',lineHeight:1}}>온종일팜</p>
                <p style={{fontSize:'9px',color:D.sub,letterSpacing:'2px',textTransform:'uppercase'}}>Fresh Market</p>
              </div>
            </Link>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            {visitorCount > 0 && (
              <div style={{background:dark?'#1e2530':'#fdf2f8',borderRadius:'100px',padding:'4px 10px',display:'flex',alignItems:'center',gap:'4px'}}>
                <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#15803d',animation:'pulse 2s infinite'}} />
                <span style={{fontSize:'11px',fontWeight:700,color:'#15803d'}}>{visitorCount}명 방문중</span>
              </div>
            )}
            <button onClick={() => { const n = !dark; setDark(n); localStorage.setItem('shop-theme', n ? 'dark' : 'light') }}
              style={{width:'44px',height:'44px',borderRadius:'12px',border:'none',cursor:'pointer',
                background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
                fontSize:'22px',display:'flex',alignItems:'center',justifyContent:'center',
                transition:'all 0.2s',flexShrink:0}}>
              {dark ? '☀️' : '🌙'}
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
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'80px'}}>🧺</div>
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
              <button onClick={toggleLike} style={{position:'absolute',top:'12px',right:'12px',width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.9)',border:'none',cursor:'pointer',fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',transition:'transform 0.15s',boxShadow:'0 2px 8px rgba(0,0,0,0.12)'}}>
                {liked ? '❤️' : '🤍'}
              </button>
            </div>
          </div>

          {/* 상품 정보 */}
          <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
            <p style={{fontSize:'11px',color:D.sub,letterSpacing:'2px',fontWeight:700,marginBottom:'8px',textTransform:'uppercase'}}>
              {product.category_id ? '수산물' : '신선 식품'}
            </p>
            <h1 style={{fontSize:'26px',fontWeight:900,letterSpacing:'-0.8px',lineHeight:1.25,marginBottom:'10px',color:D.text}}>{product.name}</h1>

            {/* 평균 별점 요약 */}
            {reviews.length > 0 && (
              <a href="#reviews" style={{display:'inline-flex',alignItems:'center',gap:'8px',marginBottom:'14px',textDecoration:'none'}}>
                <span style={{display:'flex',gap:'1px'}}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{fontSize:'15px',filter:n<=Math.round(reviewAvg)?'none':'grayscale(1) opacity(0.35)'}}>⭐</span>
                  ))}
                </span>
                <span style={{fontSize:'14px',fontWeight:900,color:D.text}}>{reviewAvg.toFixed(1)}</span>
                <span style={{fontSize:'12px',color:D.sub,fontWeight:600}}>리뷰 {reviews.length}개</span>
              </a>
            )}

            {/* 회원 유형별 가격 탭 - 표시 전용 */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px',marginBottom:'14px'}}>
              {([
                {type:'일반',   label:'일반 소매가', emoji:'🛒', color:'#15803d'},
                {type:'소매업', label:'소매 유통가',  emoji:'🏪', color:'#14532d'},
                {type:'도매업', label:'도매 유통가',  emoji:'🏭', color:'#15803d'},
              ] as const).map(t => (
                isAdmin ? (
                  <button key={t.type} onClick={() => setMemberType(t.type)}
                    style={{padding:'10px 6px',borderRadius:'12px',
                      border:`2px solid ${memberType===t.type ? t.color : (dark?'rgba(255,255,255,0.1)':'#e2e8f0')}`,
                      background:memberType===t.type ? t.color+'15' : D.card,
                      cursor:'pointer',transition:'all 0.2s',textAlign:'center'}}>
                    <p style={{fontSize:'16px',margin:'0 0 3px'}}>{t.emoji}</p>
                    <p style={{fontSize:'10px',color:memberType===t.type ? t.color : D.sub,fontWeight:700,margin:0,lineHeight:1.3}}>{t.label}</p>
                  </button>
                ) : (
                  <div key={t.type}
                    style={{padding:'10px 6px',borderRadius:'12px',
                      border:`2px solid ${memberType===t.type ? t.color : (dark?'rgba(255,255,255,0.1)':'#e2e8f0')}`,
                      background:memberType===t.type ? t.color+'15' : D.card,
                      textAlign:'center',
                      opacity: memberType===t.type ? 1 : 0.45}}>
                    <p style={{fontSize:'16px',margin:'0 0 3px'}}>{t.emoji}</p>
                    <p style={{fontSize:'10px',color:memberType===t.type ? t.color : D.sub,fontWeight:700,margin:0,lineHeight:1.3}}>{t.label}</p>
                  </div>
                )
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
                  <p style={{fontSize:'11px',color:'#14532d',fontWeight:600,margin:0}}>🏪 소매 유통가 {product.member_price.toLocaleString()}원 — 소매회원 전용</p>
                  <p style={{fontSize:'11px',color:'#15803d',fontWeight:600,margin:0}}>🏭 도매 유통가 {product.wholesale_price.toLocaleString()}원 — 도매회원 전용</p>
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
                <p style={{fontSize:'15px',fontWeight:900,color:'#15803d',marginLeft:'auto'}}>
                  = {totalPrice.toLocaleString()}원
                </p>
              </div>
            )}

            {/* 버튼 */}
            {!user ? (
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                <Link href="/shop/login" style={{display:'block',textAlign:'center',padding:'16px',background:'linear-gradient(135deg,#15803d,#16a34a)',color:'white',fontWeight:900,fontSize:'15px',borderRadius:'14px',textDecoration:'none',boxShadow:'0 8px 20px rgba(22,163,74,0.35)'}}>
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
                <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'10px'}}>
                  <button onClick={addToCart} disabled={cartLoading || !user}
                    style={{padding:'16px',borderRadius:'14px',background:cartAdded?'rgba(34,197,94,0.15)':D.input,color:cartAdded?'#22c55e':D.text,fontSize:'14px',fontWeight:700,border:`2px solid ${cartAdded?'#22c55e':D.border}`,cursor:user?'pointer':'not-allowed',transition:'all 0.3s'}}>
                    {cartAdded ? '✓ 담김' : cartLoading ? '...' : '🛒 담기'}
                  </button>
                  <button onClick={() => { setOrderDone(false); setOrderForm({ address: memberInfo?.address || (typeof window !== 'undefined' && localStorage.getItem('onjongil_addr')) || '', note: '', payment_method: '계좌이체' }); setShowOrderForm(true) }}
                    style={{padding:'16px',borderRadius:'14px',background:'linear-gradient(135deg,#15803d,#16a34a)',color:'white',fontSize:'15px',fontWeight:900,border:'none',cursor:'pointer',boxShadow:'0 8px 20px rgba(22,163,74,0.35)'}}>
                    바로 구매
                  </button>
                </div>
                <p style={{textAlign:'center',fontSize:'11px',color:D.sub}}>주문 접수 후 연락드려요</p>
              </div>
            )}
          </div>
        </div>

        {/* 상세 설명 */}
        {product.description && (
          <div style={{marginBottom:'16px',display:'flex',justifyContent:'center'}}>
            <div style={{width:'100%',maxWidth:'760px',background:D.card,borderRadius:'24px',overflow:'hidden',border:`1px solid ${D.border}`}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'20px 20px 0',marginBottom:'12px'}}>
                <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#15803d,#16a34a)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>✦</div>
                <h2 style={{fontSize:'16px',fontWeight:900,letterSpacing:'-0.3px'}}>상품 상세</h2>
              </div>
              <div dangerouslySetInnerHTML={{__html: product.description}} style={{lineHeight:1.8, pointerEvents:'none', userSelect:'none'}} />
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
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:`linear-gradient(135deg,${c.avatar_color||'#15803d'},${c.avatar_color2||'#16a34a'})`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'12px',fontWeight:900,flexShrink:0}}>
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

        {/* ── 상품 리뷰 (실제 구매자) ── */}
        <div id="reviews" style={{background:D.card,borderRadius:'24px',padding:'28px',marginBottom:'16px',border:`1px solid ${D.border}`,scrollMarginTop:'80px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
            <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#15803d,#16a34a)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>📝</div>
            <h2 style={{fontSize:'16px',fontWeight:900,letterSpacing:'-0.3px'}}>상품 리뷰</h2>
            {reviews.length > 0 && (
              <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'6px'}}>
                <span style={{fontSize:'15px'}}>⭐</span>
                <span style={{fontSize:'15px',fontWeight:900,color:D.text}}>{reviewAvg.toFixed(1)}</span>
                <span style={{fontSize:'12px',color:D.sub}}>({reviews.length})</span>
              </div>
            )}
          </div>

          {/* 작성/수정 폼 */}
          {user ? (
            <div style={{background:dark?'#1e2530':'#fdf2f8',borderRadius:'16px',padding:'18px',marginBottom:'20px',border:`1px solid ${dark?'rgba(255,255,255,0.06)':'#fce7f3'}`}}>
              <p style={{fontSize:'13px',fontWeight:800,color:D.text,margin:'0 0 10px'}}>{myReview ? '내 리뷰 수정' : '리뷰 작성하기'}</p>
              {/* 별점 선택 */}
              <div style={{display:'flex',gap:'4px',marginBottom:'12px'}}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)} aria-label={`별점 ${n}점`}
                    style={{background:'none',border:'none',cursor:'pointer',padding:0,fontSize:'26px',lineHeight:1,filter:n<=reviewRating?'none':'grayscale(1) opacity(0.3)',transition:'filter 0.15s'}}>⭐</button>
                ))}
                <span style={{alignSelf:'center',marginLeft:'6px',fontSize:'13px',fontWeight:800,color:'#15803d'}}>{reviewRating}.0</span>
              </div>
              <textarea value={reviewContent} onChange={e => setReviewContent(e.target.value)}
                placeholder="상품은 어떠셨나요? 신선도, 맛, 포장 등 솔직한 후기를 남겨주세요 😊"
                rows={3} maxLength={500}
                style={{width:'100%',padding:'12px 14px',borderRadius:'12px',border:`2px solid ${D.border}`,background:D.card,color:D.text,fontSize:'13px',outline:'none',resize:'none',boxSizing:'border-box',lineHeight:1.6,fontFamily:'inherit'}} />
              <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
                <button onClick={submitReview} disabled={reviewSubmitting || !reviewContent.trim()}
                  style={{flex:1,padding:'12px',borderRadius:'12px',background:(reviewSubmitting||!reviewContent.trim())?D.input:'linear-gradient(135deg,#15803d,#16a34a)',color:(reviewSubmitting||!reviewContent.trim())?D.sub:'white',fontSize:'14px',fontWeight:900,border:'none',cursor:(reviewSubmitting||!reviewContent.trim())?'not-allowed':'pointer'}}>
                  {reviewSubmitting ? '저장 중...' : myReview ? '수정 완료' : '리뷰 등록'}
                </button>
                {myReview && (
                  <button onClick={deleteReview}
                    style={{padding:'12px 18px',borderRadius:'12px',background:'transparent',color:D.sub,fontSize:'13px',fontWeight:700,border:`1.5px solid ${D.border}`,cursor:'pointer'}}>삭제</button>
                )}
              </div>
            </div>
          ) : (
            <Link href="/shop/login" style={{display:'block',textAlign:'center',padding:'14px',background:D.input,color:D.sub,fontSize:'13px',fontWeight:600,borderRadius:'14px',textDecoration:'none',marginBottom:'20px'}}>
              로그인하고 리뷰 남기기 →
            </Link>
          )}

          {/* 리뷰 목록 */}
          {reviews.length === 0 ? (
            <div style={{textAlign:'center',padding:'24px 0',color:D.sub}}>
              <p style={{fontSize:'32px',margin:'0 0 8px'}}>🌱</p>
              <p style={{fontSize:'13px',fontWeight:600,margin:0}}>아직 리뷰가 없어요. 첫 리뷰를 남겨주세요!</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {reviews.map((r:any) => (
                <div key={r.id} style={{padding:'16px',background:dark?'#1e2530':'#f8fafc',borderRadius:'14px',border:`1px solid ${r.user_id===user?.id?'#15803d':D.border}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#15803d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'12px',fontWeight:900,flexShrink:0}}>
                      {(r.author_name||'익')[0]}
                    </div>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <p style={{fontSize:'13px',fontWeight:700,color:D.text,margin:0}}>{r.author_name||'익명'}</p>
                        {r.user_id===user?.id && <span style={{fontSize:'10px',fontWeight:700,color:'#15803d',background:'rgba(22,163,74,0.1)',padding:'1px 7px',borderRadius:'20px'}}>내 리뷰</span>}
                      </div>
                      <p style={{fontSize:'11px',color:D.sub,margin:0}}>{r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''}</p>
                    </div>
                    <div style={{marginLeft:'auto',fontSize:'12px',letterSpacing:'1px'}}>
                      {[1,2,3,4,5].map(n => <span key={n} style={{filter:n<=r.rating?'none':'grayscale(1) opacity(0.3)'}}>⭐</span>)}
                    </div>
                  </div>
                  {r.content && <p style={{fontSize:'13px',color:D.text,lineHeight:1.7,margin:0,whiteSpace:'pre-wrap'}}>{r.content}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 주문 폼 모달 */}
      {showOrderForm && product && (
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
                        <p style={{fontSize:'11px',color:'rgba(255,255,255,0.75)',margin:0}}>{quantity}{product.unit} × {getPrice().toLocaleString()}원</p>
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
                      <span style={{fontSize:'10px',fontWeight:700,color:'#15803d',background:'rgba(22,163,74,0.1)',padding:'2px 7px',borderRadius:'20px'}}>필수</span>
                    </label>
                    <button type="button" onClick={async () => { const r = await openPostcode(); if (r) setOrderForm(p => ({...p, address: r.address + ' '})) }}
                      style={{width:'100%',marginBottom:'8px',padding:'12px',borderRadius:'14px',border:`2px dashed ${D.border}`,background:D.input,color:D.text,fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
                      🔍 주소 검색
                    </button>
                    <input type="text" value={orderForm.address} onChange={e => setOrderForm(p => ({...p, address: e.target.value}))}
                      placeholder="주소 검색 후 상세주소(동·호수)를 입력해주세요"
                      style={{width:'100%',padding:'14px 16px',borderRadius:'14px',border:`2px solid ${orderForm.address ? '#15803d' : D.border}`,background:D.input,color:D.text,fontSize:'14px',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
                  </div>

                  {/* 결제방법 */}
                  <div>
                    <label style={{display:'block',fontSize:'13px',fontWeight:800,color:D.text,marginBottom:'10px'}}>💳 결제방법</label>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      {[
                        {label:'계좌이체', icon:'🏦'},
                        {label:'카드',    icon:'💳'},
                      ].map(pm => (
                        <button key={pm.label} onClick={() => setOrderForm(p => ({...p, payment_method: pm.label}))}
                          style={{padding:'12px 10px',borderRadius:'12px',border:`2px solid ${orderForm.payment_method===pm.label ? '#15803d' : D.border}`,background:orderForm.payment_method===pm.label ? 'rgba(22,163,74,0.08)' : D.input,color:orderForm.payment_method===pm.label ? '#15803d' : D.sub,fontSize:'13px',fontWeight:orderForm.payment_method===pm.label ? 800 : 500,cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                          <span>{pm.icon}</span> {pm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 요청사항 */}
                  <div>
                    <label style={{display:'block',fontSize:'13px',fontWeight:800,color:D.text,marginBottom:'10px'}}>💬 요청사항 <span style={{fontSize:'11px',fontWeight:400,color:D.sub}}>(선택)</span></label>
                    <textarea value={orderForm.note} onChange={e => setOrderForm(p => ({...p, note: e.target.value}))}
                      placeholder="배송 요청사항이나 특이사항을 입력해주세요"
                      rows={2}
                      style={{width:'100%',padding:'14px 16px',borderRadius:'14px',border:`2px solid ${D.border}`,background:D.input,color:D.text,fontSize:'13px',outline:'none',resize:'none',boxSizing:'border-box'}} />
                  </div>

                  {/* 주문하기 버튼 */}
                  <button
                    onClick={async () => {
                      if (!orderForm.address) return alert('배송지를 입력해주세요.')
                      try { localStorage.setItem('onjongil_addr', orderForm.address) } catch {}  // 주소 저장(다음 주문 자동입력)
                      setOrderLoading(true)
                      try {
                        const table = memberType === '도매업' ? 'wholesale_orders' : memberType === '소매업' ? 'retail_orders' : 'general_orders'
                        const itemTable = memberType === '도매업' ? 'wholesale_order_items' : memberType === '소매업' ? 'retail_order_items' : 'general_order_items'
                        const isToss = orderForm.payment_method === '카드'  // 카드 = 토스페이먼츠
                        const orderData = {
                          customer_name: memberInfo?.name || '',
                          contact: memberInfo?.contact || '',
                          user_id: user?.id || '',
                          address: orderForm.address,
                          note: orderForm.note,
                          payment_method: isToss ? '카드(토스)' : orderForm.payment_method,
                          status: isToss ? '결제대기' : '접수',
                          total_amount: totalPrice,
                        }
                        const { data: newOrder } = await supabase.from(table).insert(orderData).select().single()
                        if (newOrder) {
                          await supabase.from(itemTable).insert({
                            order_id: newOrder.id,
                            product_id: product.id,
                            product_name: product.name,
                            quantity,
                            unit: product.unit,
                            unit_price: getPrice(),
                            total_price: totalPrice,
                          })
                        }
                        // 카드 결제 → 토스 결제창 호출
                        if (isToss && newOrder) {
                          const toss = await loadToss()
                          await toss.requestPayment('카드', {
                            amount: totalPrice,
                            orderId: String(newOrder.id),
                            orderName: product.name,
                            customerName: memberInfo?.name || '고객',
                            successUrl: `${window.location.origin}/shop/payment/success?table=${table}`,
                            failUrl: `${window.location.origin}/shop/payment/fail`,
                          })
                          return  // 토스 결제창으로 리다이렉트
                        }
                        setOrderDone(true)
                      } catch { alert('주문 중 오류가 발생했어요. 다시 시도해주세요.') }
                      finally { setOrderLoading(false) }
                    }}
                    disabled={orderLoading}
                    style={{width:'100%',padding:'18px',borderRadius:'16px',background:orderLoading ? D.input : 'linear-gradient(135deg,#15803d,#16a34a)',color:orderLoading ? D.sub : 'white',fontSize:'17px',fontWeight:900,border:'none',cursor:orderLoading ? 'not-allowed' : 'pointer',boxShadow:orderLoading ? 'none' : '0 10px 28px rgba(22,163,74,0.4)',transition:'all 0.2s',letterSpacing:'-0.3px'}}>
                    {orderLoading ? '⏳ 주문 처리 중...' : `🛒 ${totalPrice.toLocaleString()}원 주문하기`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 모바일 전용 하단 고정 구매바 ── */}
      {!showOrderForm && (
        <div className="mobile-buybar" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:60,background:D.headerBg,backdropFilter:'blur(20px)',borderTop:`1px solid ${D.border}`,padding:'10px 16px calc(10px + env(safe-area-inset-bottom))',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 -6px 24px rgba(0,0,0,0.1)'}}>
          <button onClick={toggleLike} aria-label="찜하기" style={{width:'48px',height:'48px',flexShrink:0,borderRadius:'14px',border:`1.5px solid ${D.border}`,background:'transparent',cursor:'pointer',fontSize:'22px',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {liked ? '❤️' : '🤍'}
          </button>
          <div style={{flex:'0 0 auto',minWidth:0}}>
            <p style={{fontSize:'10px',color:D.sub,margin:0,fontWeight:600}}>{getPriceLabel()}</p>
            <p style={{fontSize:'18px',fontWeight:900,color:D.text,margin:0,letterSpacing:'-0.5px',whiteSpace:'nowrap'}}>{getPrice().toLocaleString()}<span style={{fontSize:'12px',fontWeight:600,color:D.sub}}>원</span></p>
          </div>
          {!user ? (
            <Link href="/shop/login" style={{flex:1,textAlign:'center',padding:'15px',borderRadius:'14px',background:'linear-gradient(135deg,#15803d,#16a34a)',color:'white',fontWeight:900,fontSize:'15px',textDecoration:'none'}}>로그인 후 구매</Link>
          ) : product.stock === 0 ? (
            <button disabled style={{flex:1,padding:'15px',borderRadius:'14px',background:D.input,color:D.sub,fontSize:'15px',fontWeight:700,border:'none'}}>품절</button>
          ) : (
            <button onClick={() => { setOrderDone(false); setOrderForm({ address: memberInfo?.address || (typeof window !== 'undefined' && localStorage.getItem('onjongil_addr')) || '', note: '', payment_method: '계좌이체' }); setShowOrderForm(true) }}
              style={{flex:1,padding:'15px',borderRadius:'14px',background:'linear-gradient(135deg,#15803d,#16a34a)',color:'white',fontWeight:900,fontSize:'15px',border:'none',cursor:'pointer',boxShadow:'0 6px 18px rgba(22,163,74,0.35)'}}>
              🛒 바로 구매
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pdFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        /* 진입 애니메이션 */
        .product-grid > div { animation: pdFadeUp 0.5s ease both; }
        .product-grid > div:nth-child(2){ animation-delay: 0.08s; }
        /* 모든 버튼/링크 터치·hover 반응 */
        button, a { -webkit-tap-highlight-color: transparent; }
        button { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s, box-shadow 0.2s; }
        button:not(:disabled):hover { transform: translateY(-2px); filter: brightness(1.06); }
        button:not(:disabled):active { transform: scale(0.97); }
        /* 상품 이미지 살짝 줌 */
        .product-grid img { transition: transform 0.4s ease; }
        .product-grid img:hover { transform: scale(1.04); }
        /* 모바일 구매바: 모바일에서만 노출 */
        .mobile-buybar{display:none}
        @media(max-width:639px){ .mobile-buybar{display:flex!important} }
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUpSheet{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @media(max-width:640px){.product-grid{grid-template-columns:1fr!important;gap:24px!important}}

        /* 모바일: 바텀시트 */
        @media(max-width:639px){
          .order-overlay { align-items: flex-end !important; }
          .order-sheet {
            border-radius: 28px 28px 0 0 !important;
            animation: slideUpSheet 0.35s cubic-bezier(0.34,1.56,0.64,1);
          }
          .sheet-handle { display: flex !important; }
        }

        /* PC: 중앙 모달 */
        @media(min-width:640px){
          .order-overlay { align-items: center !important; justify-content: center; padding: 20px; }
          .order-sheet {
            border-radius: 28px !important;
            max-width: 460px !important;
            animation: slideUp 0.25s ease;
          }
          .sheet-handle { display: none !important; }
        }
      `}</style>
    </div>
  )
}
