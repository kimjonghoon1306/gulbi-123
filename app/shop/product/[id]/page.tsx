'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { loadToss } from '@/lib/toss'
import { ProductMini } from '../../_ProductMini'
import { ReviewSection } from '../../_ReviewSection'
import { OrderModal } from '../../_OrderModal'
import { priceFor } from '../../_shopConstants'
import { addressToText } from '../../_AddressBookPicker'
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
  const [addresses, setAddresses] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderForm, setOrderForm] = useState({ address: '', recipient: '', phone: '', note: '', payment_method: '가상계좌', evidence: '현금영수증', evidenceContact: '' })
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderDone, setOrderDone] = useState(false)
  // 쿠폰 (쿠폰함에서 받은 쿠폰 선택 사용)
  const [ownedCoupons, setOwnedCoupons] = useState<any[]>([])
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [appliedUcId, setAppliedUcId] = useState<string | null>(null)
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [cartAdded, setCartAdded] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const popupTimer = useRef<any>(null)

  // ── 리뷰/별점 ──
  const [reviews, setReviews] = useState<any[]>([])
  const [myReview, setMyReview] = useState<any>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewImages, setReviewImages] = useState<string[]>([])
  const [reviewUploading, setReviewUploading] = useState(false)

  const uploadReviewImages = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return
    setReviewUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files).slice(0, 3 - reviewImages.length)) {
      if (!file.type.startsWith('image/')) continue
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('review-images').upload(path, file, { upsert: false })
      if (!error) {
        const { data } = supabase.storage.from('review-images').getPublicUrl(path)
        if (data?.publicUrl) urls.push(data.publicUrl)
      }
    }
    setReviewImages(prev => [...prev, ...urls].slice(0, 3))
    setReviewUploading(false)
  }

  const fetchReviews = async (uid?: string) => {
    const { data } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false })
    const list = data || []
    setReviews(list)
    const mine = uid ? list.find((r: any) => r.user_id === uid) : null
    setMyReview(mine || null)
    if (mine) { setReviewRating(mine.rating); setReviewContent(mine.content || ''); setReviewImages(mine.image_urls || []) }
  }

  const submitReview = async () => {
    if (!user) { router.push('/shop/login'); return }
    setReviewSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: id,
          author_name: memberInfo?.name || '익명',
          rating: reviewRating, content: reviewContent.trim(),
          image_urls: reviewImages,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '리뷰 저장 중 오류가 발생했어요.')
      await fetchReviews(user.id)
    } catch (e: any) { alert(e?.message || '리뷰 저장 중 오류가 발생했어요.') }
    finally { setReviewSubmitting(false) }
  }

  const deleteReview = async () => {
    if (!user || !myReview) return
    if (!confirm('리뷰를 삭제할까요?')) return
    await supabase.from('reviews').delete().eq('id', myReview.id)
    setMyReview(null); setReviewRating(5); setReviewContent(''); setReviewImages([])
    await fetchReviews(user.id)
  }

  const reviewAvg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0

  const fetchProduct = async () => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    setProduct(data)
    setLoading(false)
    if (data) {
      // 같은 카테고리 추천 상품 (자기 자신 제외, 최대 8)
      const { data: rec } = await supabase.from('products').select('*')
        .eq('is_active', true).eq('category_id', data.category_id).neq('id', data.id).limit(8)
      setRelated(rec || [])
      // 최근 본 상품 기록 (localStorage, id 목록)
      try {
        const raw = localStorage.getItem('recent-products')
        const ids: string[] = raw ? JSON.parse(raw) : []
        const next = [String(data.id), ...ids.filter(x => x !== String(data.id))].slice(0, 12)
        localStorage.setItem('recent-products', JSON.stringify(next))
      } catch {}
    }
  }

  const [related, setRelated] = useState<any[]>([])
  const [recentProducts, setRecentProducts] = useState<any[]>([])

  // 재입고 알림
  const [restockDone, setRestockDone] = useState(false)
  const [restockContact, setRestockContact] = useState('')
  const [restockLoading, setRestockLoading] = useState(false)
  const requestRestock = async () => {
    const contact = (restockContact || memberInfo?.contact || '').trim()
    if (!contact) { alert('연락받으실 전화번호 또는 이메일을 입력해주세요.'); return }
    setRestockLoading(true)
    const { error } = await supabase.from('restock_alerts').upsert({
      product_id: id, user_id: user?.id || null,
      name: memberInfo?.name || '', contact,
    }, { onConflict: 'product_id,user_id' })
    setRestockLoading(false)
    if (error && !error.message.includes('duplicate')) { alert('신청 중 오류가 발생했어요.'); return }
    setRestockDone(true)
  }

  // 최근 본 상품 로드 (자기 자신 제외)
  const fetchRecentProducts = async () => {
    try {
      const raw = localStorage.getItem('recent-products')
      const ids: string[] = raw ? JSON.parse(raw) : []
      const others = ids.filter(x => x !== String(id)).slice(0, 8)
      if (others.length === 0) { setRecentProducts([]); return }
      const { data } = await supabase.from('products').select('*').in('id', others)
      // localStorage 순서 유지
      const ordered = others.map(x => (data || []).find((p: any) => String(p.id) === x)).filter(Boolean)
      setRecentProducts(ordered)
    } catch {}
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
      // 쿠폰함: 받은 쿠폰 중 미사용만
      const { data: ucs } = await supabase.from('user_coupons').select('id, coupons(*)').eq('user_id', user.id).eq('used', false)
      setOwnedCoupons((ucs as any) || [])
      const { data: addrData } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false })
      setAddresses((addrData as any) || [])
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
    fetchRecentProducts()
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
    return priceFor(product, memberType)
  }

  const getPriceLabel = () => {
    if (memberType === '도매업') return '도매 공급가'
    if (memberType === '소매업') return '소매 공급가'
    return '일반 구매가'
  }

  const getPriceColor = () => {
    if (dark) return '#4ade80'
    if (memberType === '도매업') return '#047857'
    if (memberType === '소매업') return '#14532d'
    return '#15803d'
  }

  const D = {
    bg: dark ? 'linear-gradient(180deg,#0d2a1d 0%,#081710 60%,#0a1c13 100%)' : '#f8fafc',
    headerBg: dark ? 'rgba(10,28,19,0.95)' : 'rgba(255,255,255,0.97)',
    border: dark ? 'rgba(52,211,153,0.14)' : 'rgba(0,0,0,0.07)',
    card: dark ? '#102a1d' : '#ffffff',
    text: dark ? '#eaf5ee' : '#0f172a',
    sub: dark ? '#86a394' : '#64748b',
    input: dark ? '#15391f' : '#f1f5f9',
    imgBg: dark ? '#15391f' : '#f8fafc',
    accent: dark ? '#4ade80' : '#15803d',
    accentDark: '#16a34a',
    green: '#059669',
    gtext: dark ? '#4ade80' : '#15803d',
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

  const defaultCheckoutAddress = () => {
    const saved = addresses.find((a: any) => a.is_default) || addresses[0]
    if (saved) return { address: addressToText(saved), recipient: saved.recipient || '', phone: saved.phone || '' }
    return {
      address: memberInfo?.address || (typeof window !== 'undefined' && localStorage.getItem('onjongil_addr')) || '',
      recipient: memberInfo?.name || '',
      phone: memberInfo?.contact || '',
    }
  }

  // 쿠폰 할인 (cart와 동일 공식)
  const calcDiscount = (c: any, base: number) => {
    if (!c) return 0
    let d = c.discount_type === 'percent' ? Math.floor(base * c.discount_value / 100) : c.discount_value
    if (c.discount_type === 'percent' && c.max_discount) d = Math.min(d, c.max_discount)
    return Math.min(d, base)
  }
  // 방식 A: 공급사 쿠폰은 그 공급사 상품에만 적용. 상품상세는 단일상품이라 해당 공급사 상품이면 전액, 아니면 0
  const couponBase = (c: any) => {
    if (!c) return totalPrice
    if (c.created_by_role === 'supplier') return product?.supplier_id === c.created_by ? totalPrice : 0
    return totalPrice
  }
  const couponDiscount = calcDiscount(appliedCoupon, couponBase(appliedCoupon))
  const finalPrice = Math.max(0, totalPrice - couponDiscount)
  const selectCoupon = (uc: any) => {
    const c = uc.coupons; if (!c) return
    if (!c.is_active) { setCouponMsg({ ok: false, text: '사용 중지된 쿠폰이에요.' }); return }
    if (c.starts_at && new Date(c.starts_at) > new Date()) { setCouponMsg({ ok: false, text: '아직 사용 기간이 아니에요.' }); return }
    if (c.expires_at && new Date(c.expires_at) < new Date()) { setCouponMsg({ ok: false, text: '만료된 쿠폰이에요.' }); return }
    const base = couponBase(c)
    if (c.created_by_role === 'supplier' && base === 0) { setCouponMsg({ ok: false, text: '이 공급사 상품에만 쓸 수 있는 쿠폰이에요.' }); return }
    if (base < (c.min_amount || 0)) { setCouponMsg({ ok: false, text: `${Number(c.min_amount).toLocaleString()}원 이상 주문 시 사용 가능해요.` }); return }
    setAppliedCoupon(c); setAppliedUcId(uc.id)
    setCouponMsg({ ok: true, text: `🎉 ${calcDiscount(c, base).toLocaleString()}원 할인 적용!` })
  }
  const removeCoupon = () => { setAppliedCoupon(null); setAppliedUcId(null); setCouponMsg(null) }

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
              <div style={{background:dark?'#15391f':'#fdf2f8',borderRadius:'100px',padding:'4px 10px',display:'flex',alignItems:'center',gap:'4px'}}>
                <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#15803d',animation:'pulse 2s infinite'}} />
                <span style={{fontSize:'11px',fontWeight:700,color:D.gtext}}>{visitorCount}명 방문중</span>
              </div>
            )}
            <button onClick={() => { const n = !dark; setDark(n); localStorage.setItem('shop-theme', n ? 'dark' : 'light'); window.dispatchEvent(new Event('shop-theme-change')) }}
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
                {type:'일반',   label:'일반 구매가', emoji:'🛒', color:D.gtext},
                {type:'소매업', label:'소매 공급가',  emoji:'🏪', color:D.gtext},
                {type:'도매업', label:'도매 공급가',  emoji:'🏭', color:D.gtext},
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
            <div style={{background:dark?'#15391f':'#fdf2f8',borderRadius:'18px',padding:'18px 20px',marginBottom:'16px',border:`1px solid ${dark?'rgba(255,255,255,0.06)':'#fce7f3'}`}}>
              <p style={{fontSize:'11px',fontWeight:700,color:getPriceColor(),marginBottom:'4px',letterSpacing:'0.5px'}}>
                {getPriceLabel()}
              </p>
              <p style={{fontSize:'32px',fontWeight:900,color:D.text,letterSpacing:'-1.5px',lineHeight:1,marginBottom:'2px'}}>
                {getPrice().toLocaleString()}<span style={{fontSize:'16px',fontWeight:600,color:D.sub}}>원</span>
              </p>
              <p style={{fontSize:'12px',color:D.sub}}>/{product.unit}</p>
              {memberType === '일반' && (
                <div style={{marginTop:'10px',padding:'8px 12px',background:dark?'rgba(255,255,255,0.04)':'#f8fafc',borderRadius:'10px',display:'flex',flexDirection:'column',gap:'4px'}}>
                  <p style={{fontSize:'11px',color:D.gtext,fontWeight:600,margin:0}}>🏪 소매 공급가 {product.member_price.toLocaleString()}원 — 소매회원 전용</p>
                  <p style={{fontSize:'11px',color:D.gtext,fontWeight:600,margin:0}}>🏭 도매 공급가 {product.wholesale_price.toLocaleString()}원 — 도매회원 전용</p>
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
                <p style={{fontSize:'15px',fontWeight:900,color:D.gtext,marginLeft:'auto'}}>
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
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                <button disabled style={{width:'100%',padding:'16px',borderRadius:'14px',background:D.input,color:D.sub,fontSize:'15px',fontWeight:700,border:'none',cursor:'not-allowed'}}>😢 품절되었어요</button>
                {restockDone ? (
                  <div style={{padding:'16px',borderRadius:'14px',background:dark?'rgba(74,222,128,0.1)':'rgba(22,163,74,0.07)',border:`1px solid ${dark?'rgba(74,222,128,0.25)':'rgba(22,163,74,0.2)'}`,textAlign:'center'}}>
                    <p style={{fontSize:'14px',fontWeight:800,color:D.gtext,margin:'0 0 2px'}}>🔔 재입고 알림 신청 완료!</p>
                    <p style={{fontSize:'12px',color:D.sub,margin:0}}>다시 입고되면 연락드릴게요.</p>
                  </div>
                ) : (
                  <div style={{padding:'14px',borderRadius:'14px',background:D.input}}>
                    <p style={{fontSize:'13px',fontWeight:800,color:D.text,margin:'0 0 8px'}}>🔔 재입고되면 알림 받기</p>
                    <div style={{display:'flex',gap:'8px'}}>
                      <input value={restockContact} onChange={e=>setRestockContact(e.target.value)}
                        placeholder={memberInfo?.contact ? `${memberInfo.contact} (기본)` : '전화번호 또는 이메일'}
                        style={{flex:1,padding:'12px 14px',borderRadius:'12px',border:`2px solid ${D.border}`,background:D.card,color:D.text,fontSize:'13px',outline:'none',boxSizing:'border-box'}} />
                      <button onClick={requestRestock} disabled={restockLoading}
                        style={{padding:'0 18px',borderRadius:'12px',border:'none',cursor:'pointer',background:'linear-gradient(135deg,#16a34a,#15803d)',color:'white',fontSize:'14px',fontWeight:800,whiteSpace:'nowrap'}}>
                        {restockLoading?'...':'신청'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'10px'}}>
                  <button onClick={addToCart} disabled={cartLoading || !user}
                    style={{padding:'16px',borderRadius:'14px',background:cartAdded?'rgba(34,197,94,0.15)':D.input,color:cartAdded?'#22c55e':D.text,fontSize:'14px',fontWeight:700,border:`2px solid ${cartAdded?'#22c55e':D.border}`,cursor:user?'pointer':'not-allowed',transition:'all 0.3s'}}>
                    {cartAdded ? '✓ 담김' : cartLoading ? '...' : '🛒 담기'}
                  </button>
                  <button onClick={() => { const delivery = defaultCheckoutAddress(); setOrderDone(false); setOrderForm({ address: delivery.address, recipient: delivery.recipient, phone: delivery.phone, note: '', payment_method: '가상계좌', evidence: '현금영수증', evidenceContact: '' }); setShowOrderForm(true) }}
                    style={{padding:'16px',borderRadius:'14px',background:'linear-gradient(135deg,#15803d,#16a34a)',color:'white',fontSize:'15px',fontWeight:900,border:'none',cursor:'pointer',boxShadow:'0 8px 20px rgba(22,163,74,0.35)'}}>
                    바로 구매
                  </button>
                </div>
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
              <div dangerouslySetInnerHTML={{__html: sanitizeHtml(product.description)}} style={{lineHeight:1.8, pointerEvents:'none', userSelect:'none'}} />
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
                <div key={c.id} style={{padding:'16px',background:dark?'#15391f':'#f8fafc',borderRadius:'14px',border:`1px solid ${D.border}`}}>
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
        <ReviewSection reviews={reviews} myReview={myReview} reviewRating={reviewRating} setReviewRating={setReviewRating} reviewContent={reviewContent} setReviewContent={setReviewContent} reviewSubmitting={reviewSubmitting} submitReview={submitReview} deleteReview={deleteReview} reviewImages={reviewImages} setReviewImages={setReviewImages} reviewUploading={reviewUploading} uploadReviewImages={uploadReviewImages} reviewAvg={reviewAvg} D={D} dark={dark} user={user} />

        {/* ── 추천 상품 (같은 카테고리) ── */}
        {related.length > 0 && (
          <div style={{marginBottom:'16px'}}>
            <h2 style={{fontSize:'17px',fontWeight:900,letterSpacing:'-0.3px',margin:'0 0 14px',color:D.text}}>🧺 이런 상품은 어때요?</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'12px'}}>
              {related.map(p => <ProductMini key={p.id} p={p} D={D} dark={dark} getC={getPriceColor} mt={memberType} />)}
            </div>
          </div>
        )}

        {/* ── 최근 본 상품 ── */}
        {recentProducts.length > 0 && (
          <div style={{marginBottom:'16px'}}>
            <h2 style={{fontSize:'17px',fontWeight:900,letterSpacing:'-0.3px',margin:'0 0 14px',color:D.text}}>🕘 최근 본 상품</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'12px'}}>
              {recentProducts.map(p => <ProductMini key={p.id} p={p} D={D} dark={dark} getC={getPriceColor} mt={memberType} />)}
            </div>
          </div>
        )}
      </div>

        {/* 주문 폼 모달 */}
      {showOrderForm && product && <OrderModal product={product} quantity={quantity} orderDone={orderDone} memberType={memberType} memberInfo={memberInfo} user={user} addresses={addresses} orderForm={orderForm} setOrderForm={setOrderForm} orderLoading={orderLoading} setOrderLoading={setOrderLoading} setOrderDone={setOrderDone} setShowOrderForm={setShowOrderForm} getPrice={getPrice} totalPrice={totalPrice} finalPrice={finalPrice} couponDiscount={couponDiscount} couponBase={couponBase} appliedCoupon={appliedCoupon} appliedUcId={appliedUcId} ownedCoupons={ownedCoupons} selectCoupon={selectCoupon} removeCoupon={removeCoupon} couponMsg={couponMsg} D={D} dark={dark} />}

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
            <button onClick={() => { const delivery = defaultCheckoutAddress(); setOrderDone(false); setOrderForm({ address: delivery.address, recipient: delivery.recipient, phone: delivery.phone, note: '', payment_method: '가상계좌', evidence: '현금영수증', evidenceContact: '' }); setShowOrderForm(true) }}
              style={{flex:1,padding:'15px',borderRadius:'14px',background:'linear-gradient(135deg,#15803d,#16a34a)',color:'white',fontWeight:900,fontSize:'15px',border:'none',cursor:'pointer',boxShadow:'0 6px 18px rgba(22,163,74,0.35)'}}>
              🛒 바로 구매
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pdFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .pd-mini{transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s,border-color 0.25s}
        .pd-mini:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(0,0,0,0.12);border-color:rgba(22,163,74,0.35)}
        .pd-mini img{transition:transform 0.4s ease}
        .pd-mini:hover img{transform:scale(1.06)}
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

// 추천/최근본 상품 미니 카드
