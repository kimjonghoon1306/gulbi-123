'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { CartOrderModal } from '../_CartOrderModal'
import { priceFor } from '../_shopConstants'
import { payWithInicis } from '@/lib/inicis'
import { addressToText } from '../_AddressBookPicker'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type CartItem = {
  id: string
  quantity: number
  product_id: string
  products: {
    id: string; name: string; image_url: string
    retail_price: number; wholesale_price: number; member_price: number
    stock: number; unit: string; is_taxable: boolean; supplier_id: string | null
  }
}

type MemberType = '일반' | '소매업' | '도매업'
type Address = {
  id: string
  label: string
  recipient?: string | null
  phone?: string | null
  postcode?: string | null
  address1: string
  address2?: string | null
  is_default?: boolean
}

export default function CartPage() {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<CartItem[]>([])
  const [memberType, setMemberType] = useState<MemberType>('일반')
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showOrder, setShowOrder] = useState(false)
  const [orderForm, setOrderForm] = useState({ address: '', recipient: '', phone: '', note: '', payment_method: '가상계좌', evidence: '현금영수증', evidenceContact: '' })
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderDone, setOrderDone] = useState(false)
  const [agreeRefund, setAgreeRefund] = useState(false)  // 청약철회·반품 안내 동의(신선식품 반품제한 고지)
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [userId, setUserId] = useState('')
  const [redirectCount, setRedirectCount] = useState(3)
  // 쿠폰 (쿠폰함에서 받은 쿠폰을 선택해서 사용)
  const [ownedCoupons, setOwnedCoupons] = useState<any[]>([])      // user_coupons(미사용) + coupons
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)    // 선택된 coupons 행
  const [appliedUcId, setAppliedUcId] = useState<string | null>(null) // 선택된 user_coupons.id (사용처리용)
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pointBalance, setPointBalance] = useState(0)
  const [pointUsed, setPointUsed] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)
    fetchAll()
  }, [])

  // 주문 완료 후 3초 카운트다운 → 마이페이지 주문내역 탭 자동 이동
  useEffect(() => {
    if (!orderDone) return
    setRedirectCount(3)
    const interval = setInterval(() => {
      setRedirectCount(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push('/shop/mypage?tab=orders')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [orderDone])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/shop/login'); return }
    setUserId(user.id)

    const { data: member } = await supabase.from('shop_members').select('*').eq('id', user.id).single()
    if (member) { setMemberType(member.member_type); setMemberInfo(member) }

    const { data: account } = await supabase.from('cash_accounts').select('point_balance').eq('user_id', user.id).maybeSingle()
    setPointBalance(Number(account?.point_balance || 0))

    const { data: addrData } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    setAddresses((addrData as Address[]) || [])

    const { data: cartData } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setItems((cartData as any) || [])

    // 쿠폰함: 받은 쿠폰 중 미사용만 로드
    const { data: ucs } = await supabase
      .from('user_coupons')
      .select('id, coupons(*)')
      .eq('user_id', user.id)
      .eq('used', false)
    setOwnedCoupons((ucs as any) || [])

    setLoading(false)
  }

  const getPrice = (product: CartItem['products']) => {
    return priceFor(product, memberType)
  }

  const updateQty = async (itemId: string, qty: number, stock: number) => {
    if (qty < 1 || qty > stock) return
    setUpdating(itemId)
    await supabase.from('cart_items').update({ quantity: qty }).eq('id', itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i))
    setUpdating(null)
  }

  const removeItem = async (itemId: string) => {
    await supabase.from('cart_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const clearCart = async () => {
    await supabase.from('cart_items').delete().eq('user_id', userId)
    setItems([])
  }

  const totalAmount = items.reduce((sum, item) => sum + getPrice(item.products) * item.quantity, 0)

  // 쿠폰 할인 계산
  const calcDiscount = (c: any, base: number) => {
    if (!c) return 0
    let d = c.discount_type === 'percent' ? Math.floor(base * c.discount_value / 100) : c.discount_value
    if (c.discount_type === 'percent' && c.max_discount) d = Math.min(d, c.max_discount)
    return Math.min(d, base) // 할인이 결제액 초과 못함
  }
  // 방식 A: 공급사 쿠폰은 그 공급사 상품 합계에만 적용 / 본사 쿠폰은 주문 전체
  const couponBase = (c: any) => {
    if (!c) return totalAmount
    if (c.created_by_role === 'supplier') {
      return items.filter(i => i.products.supplier_id === c.created_by).reduce((s, i) => s + getPrice(i.products) * i.quantity, 0)
    }
    return totalAmount
  }
  const discount = calcDiscount(appliedCoupon, couponBase(appliedCoupon))
  const finalAmount = Math.max(0, totalAmount - discount)
  const pointLimit = Math.max(0, Math.min(pointBalance, finalAmount))
  const payAmount = Math.max(0, finalAmount - pointUsed)

  useEffect(() => {
    setPointUsed(prev => Math.max(0, Math.min(prev, pointLimit)))
  }, [pointLimit])

  const updatePointUsed = (value: number) => {
    setPointUsed(Math.max(0, Math.min(Math.floor(value || 0), pointLimit)))
  }

  // 쿠폰함에서 받은 쿠폰을 선택해서 사용
  const selectCoupon = (uc: any) => {
    const c = uc.coupons
    if (!c) return
    if (!c.is_active) { setCouponMsg({ ok: false, text: '사용 중지된 쿠폰이에요.' }); return }
    if (c.starts_at && new Date(c.starts_at) > new Date()) { setCouponMsg({ ok: false, text: '아직 사용 기간이 아니에요.' }); return }
    if (c.expires_at && new Date(c.expires_at) < new Date()) { setCouponMsg({ ok: false, text: '만료된 쿠폰이에요.' }); return }
    const base = couponBase(c)
    if (c.created_by_role === 'supplier' && base === 0) { setCouponMsg({ ok: false, text: '이 공급사 상품이 장바구니에 없어 사용할 수 없어요.' }); return }
    if (base < (c.min_amount || 0)) {
      const scope = c.created_by_role === 'supplier' ? '해당 공급사 상품 ' : ''
      setCouponMsg({ ok: false, text: `${scope}${Number(c.min_amount).toLocaleString()}원 이상일 때 사용 가능해요.` }); return
    }
    setAppliedCoupon(c); setAppliedUcId(uc.id)
    const d = calcDiscount(c, base)
    setCouponMsg({ ok: true, text: `🎉 ${d.toLocaleString()}원 할인이 적용됐어요!` })
  }
  const removeCoupon = () => { setAppliedCoupon(null); setAppliedUcId(null); setCouponMsg(null) }

  const isBiz = memberType === '소매업' || memberType === '도매업'  // 사업자 회원
  // 과세(가공식품)분 / 면세(미가공 농수산물)분 분리 — 부가세는 과세분에만
  const taxableSum = items.filter(i => i.products.is_taxable).reduce((s, i) => s + getPrice(i.products) * i.quantity, 0)
  const exemptSum = totalAmount - taxableSum
  const vatAmount = taxableSum - Math.round(taxableSum / 1.1)  // 과세분(부가세포함가) 중 부가세

  const defaultCheckoutAddress = () => {
    const saved = addresses.find(a => a.is_default) || addresses[0]
    if (saved) return { address: addressToText(saved), recipient: saved.recipient || '', phone: saved.phone || '' }
    return {
      address: memberInfo?.address || (typeof window !== 'undefined' && localStorage.getItem('onjongil_addr')) || '',
      recipient: memberInfo?.name || '',
      phone: memberInfo?.contact || '',
    }
  }

  const handleOrder = async () => {
    if (!orderForm.address) return alert('배송지를 입력해주세요.')
    if (!agreeRefund) return alert('청약철회·반품 안내를 확인하고 동의해주세요.')
    try { localStorage.setItem('onjongil_addr', orderForm.address) } catch {}  // 주소 저장(다음 주문 자동입력)
    setOrderLoading(true)
    try {
      const table = memberType === '도매업' ? 'wholesale_orders' : memberType === '소매업' ? 'retail_orders' : 'general_orders'
      const itemTable = memberType === '도매업' ? 'wholesale_order_items' : memberType === '소매업' ? 'retail_order_items' : 'general_order_items'

      const isCard = orderForm.payment_method === '카드'        // 카드 = 이니시스 카드결제
      const isVbank = orderForm.payment_method === '가상계좌'    // 가상계좌 = 이니시스 가상계좌 발급
      const isPg = isCard || isVbank                            // 둘 다 이니시스 결제창 사용

      // 재고는 결제/입금 성공 후 차감 → 결제 시작 전 재고 여부만 확인(초과판매 방지)
      {
        const { data: prods } = await supabase.from('products').select('id, stock').in('id', items.map(i => i.products.id))
        const short = items.filter(it => {
          const ps = prods?.find((p: any) => p.id === it.products.id)
          return ps && ps.stock != null && ps.stock < it.quantity
        })
        if (short.length > 0) {
          setOrderLoading(false)
          alert(`재고가 부족한 상품이 있어요: ${short.map(s => s.products.name).join(', ')}\n수량을 줄이거나 다른 상품을 담아주세요.`)
          return
        }
      }

      const { data: newOrder } = await supabase.from(table).insert({
        customer_name: orderForm.recipient || memberInfo?.name || '',
        contact: orderForm.phone || memberInfo?.contact || '',
        user_id: userId,
        address: orderForm.address,
        payment_method: isCard ? '카드(이니시스)' : isVbank ? '가상계좌(이니시스)' : orderForm.payment_method,
        status: isCard ? '결제대기' : isVbank ? '입금대기' : '접수',
        total_amount: payAmount,
        point_used: pointUsed,
        coupon_code: appliedCoupon?.code || null,   // 서버 결제금액 검증용
        coupon_owner: appliedCoupon?.created_by_role === 'supplier' ? appliedCoupon.created_by : null, // 부담주체(공급사id/null=본사)
        coupon_discount: discount,
        note: orderForm.note + (appliedCoupon ? ` [쿠폰 ${appliedCoupon.code} -${discount.toLocaleString()}원]` : ''),
      }).select().single()

      if (newOrder) {
        await supabase.from(itemTable).insert(
          items.map(item => ({
            order_id: newOrder.id,
            product_id: item.products.id,
            product_name: item.products.name,
            quantity: item.quantity,
            unit: item.products.unit,
            unit_price: getPrice(item.products),
            total_price: getPrice(item.products) * item.quantity,
            supplier_id: item.products.supplier_id || null,  // 정산 귀속(공급사 상품)
          }))
        )
      }

      // 쿠폰 사용 횟수 증가 (한도 관리) + 받은 쿠폰 사용처리
      if (appliedCoupon) {
        try { await supabase.rpc('increment_coupon_usage', { coupon_code: appliedCoupon.code }) } catch {}
        if (appliedUcId && newOrder) {
          try { await supabase.from('user_coupons').update({ used: true, used_at: new Date().toISOString(), order_ref: `${table}#${newOrder.id}` }).eq('id', appliedUcId) } catch {}
        }
      }

      // 증빙 자동생성 — 가상계좌(현금성)만. 카드결제는 카드매출전표로 갈음되어 별도 발행 안 함(이중과세 방지)
      if (isVbank && newOrder && orderForm.evidence !== '발행안함') {
        if (orderForm.evidence === '세금계산서') {
          await supabase.from('tax_invoices').insert({
            company_name: memberInfo?.business_name || memberInfo?.name || '',
            business_number: memberInfo?.business_number || '',
            manager_name: memberInfo?.name || '',
            contact: memberInfo?.contact || '',                                  // 연락처(전화)
            invoicee_ceo_name: memberInfo?.business_ceo || memberInfo?.name || '', // 대표자명
            invoicee_addr: memberInfo?.business_address || '',                    // 사업장 주소
            invoicee_email: orderForm.evidenceContact || memberInfo?.email || '', // 세금계산서 수신 이메일
            amount: totalAmount - vatAmount,   // 공급가액(과세 공급가 + 면세금액)
            tax_amount: vatAmount,             // 면세 상품엔 0
            total_amount: totalAmount,
            note: `[자동] 주문 ${table} #${newOrder.id}` + (exemptSum > 0 ? ` · 면세 ${exemptSum.toLocaleString()}원 포함` : ''),
            status: '미발행',
          })
        } else if (orderForm.evidence === '현금영수증') {
          await supabase.from('cash_receipts').insert({
            customer_name: memberInfo?.name || '',
            contact: orderForm.evidenceContact || memberInfo?.contact || '',
            amount: totalAmount,
            receipt_type: isBiz ? '사업자용' : '소비자용',
            note: `[자동] 주문 ${table} #${newOrder.id}`,
            status: '미발행',
          })
        }
      }

      // 카드/가상계좌 → 이니시스 결제창 호출 (승인은 서버 /api/payments/inicis/return 에서 처리)
      if (newOrder && payAmount === 0) {
        const res = await fetch('/api/orders/point-pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: newOrder.id, table }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'point pay failed')
        await clearCart()
        localStorage.setItem('cart-updated', Date.now().toString())
        setOrderDone(true)
        return
      }

      if (isPg && newOrder) {
        const orderName = items.length > 1
          ? `${items[0].products.name} 외 ${items.length - 1}건`
          : (items[0]?.products?.name || '온종일팜 주문')
        await payWithInicis({
          table,
          orderId: String(newOrder.id),
          method: orderForm.payment_method,
          goodname: orderName,
          buyername: orderForm.recipient || memberInfo?.name || '고객',
          buyertel: orderForm.phone || memberInfo?.contact || '',
          buyeremail: memberInfo?.email || '',
        })
        return  // 이니시스 결제창이 열리므로 이후 코드 실행 안 함
      }

      await clearCart()
      // 🛒 헤더 카운트 0 갱신 신호
      localStorage.setItem('cart-updated', Date.now().toString())
      setOrderDone(true)
    } catch { alert('주문 중 오류가 발생했습니다.') }
    finally { setOrderLoading(false) }
  }

  const D = {
    bg:     dark ? 'linear-gradient(180deg,#0d2a1d 0%,#081710 60%,#0a1c13 100%)' : '#f8fafc',
    card:   dark ? '#102a1d' : '#ffffff',
    text:   dark ? '#eaf5ee' : '#0f172a',
    sub:    dark ? '#86a394' : '#64748b',
    border: dark ? 'rgba(52,211,153,0.14)' : 'rgba(0,0,0,0.07)',
    input:  dark ? '#15391f' : '#f1f5f9',
  }

  const priceColor = dark ? '#4ade80' : (memberType === '도매업' ? '#047857' : memberType === '소매업' ? '#14532d' : '#15803d')
  const gtext = dark ? '#4ade80' : '#14532d'

  if (loading) return (
    <div style={{ minHeight:'100vh', background:D.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'36px', height:'36px', border:'3px solid #14532d33', borderTop:'3px solid #14532d', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ background:D.bg, color:D.text, minHeight:'100vh', fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif" }}>

      {/* 헤더 */}
      <header style={{ background:dark?'rgba(10,28,19,0.95)':'rgba(255,255,255,0.97)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${D.border}`, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:'1080px', margin:'0 auto', padding:'0 20px', height:'60px', display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={() => router.back()} style={{ width:'36px', height:'36px', borderRadius:'10px', background:D.input, border:'none', cursor:'pointer', fontSize:'16px', color:D.text, display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
          <p style={{ fontWeight:800, fontSize:'16px', margin:0, flex:1 }}>장바구니 🛒</p>
          <span style={{ background:'linear-gradient(135deg,#14532d,#15803d)', color:'white', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px' }}>
            {memberType}
          </span>
          <button onClick={() => setDark(!dark)} style={{ width:'36px', height:'36px', borderRadius:'10px', background:D.input, border:'none', cursor:'pointer', fontSize:'16px' }}>
            {dark ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div style={{ maxWidth:'1080px', margin:'0 auto', padding:'24px 20px 120px' }}>

        {items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <p style={{ fontSize:'56px', marginBottom:'16px' }}>🛒</p>
            <p style={{ fontWeight:800, fontSize:'18px', color:D.text, marginBottom:'8px' }}>장바구니가 비어있어요</p>
            <p style={{ fontSize:'13px', color:D.sub, marginBottom:'28px' }}>마음에 드는 상품을 담아보세요</p>
            <Link href="/shop" style={{ background:'linear-gradient(135deg,#14532d,#15803d)', color:'white', fontWeight:700, fontSize:'14px', padding:'13px 28px', borderRadius:'14px', textDecoration:'none', boxShadow:'0 8px 20px rgba(22,163,74,0.3)' }}>
              쇼핑 계속하기 →
            </Link>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items">
            {/* 상품 목록 */}
            <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'20px' }}>
              {items.map(item => {
                const price = getPrice(item.products)
                return (
                  <div key={item.id} className="cart-item-card" style={{ background:D.card, borderRadius:'20px', padding:'16px', border:`1px solid ${D.border}`, display:'flex', gap:'14px', alignItems:'center' }}>
                    {/* 이미지 */}
                    <div style={{ width:'72px', height:'72px', borderRadius:'14px', overflow:'hidden', flexShrink:0, background:D.input }}>
                      {item.products.image_url
                        ? <img src={item.products.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px' }}>🧺</div>
                      }
                    </div>
                    {/* 정보 */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:700, fontSize:'14px', color:D.text, margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.products.name}</p>
                      <p style={{ fontSize:'16px', fontWeight:900, color:priceColor, margin:'0 0 8px' }}>{(price * item.quantity).toLocaleString()}원</p>
                      {/* 수량 조절 */}
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ display:'flex', alignItems:'center', background:D.input, borderRadius:'10px', overflow:'hidden' }}>
                          <button onClick={() => updateQty(item.id, item.quantity - 1, item.products.stock)}
                            style={{ width:'32px', height:'32px', background:'none', border:'none', fontSize:'16px', cursor:'pointer', color:D.text, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                          <span style={{ width:'32px', textAlign:'center', fontSize:'14px', fontWeight:700, color:D.text }}>
                            {updating === item.id ? '...' : item.quantity}
                          </span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1, item.products.stock)}
                            style={{ width:'32px', height:'32px', background:'none', border:'none', fontSize:'16px', cursor:'pointer', color:D.text, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                        </div>
                        <span style={{ fontSize:'11px', color:D.sub }}>{item.products.unit}단위</span>
                      </div>
                    </div>
                    {/* 삭제 */}
                    <button onClick={() => removeItem(item.id)}
                      style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', border:'none', color:'#ef4444', fontSize:'16px', cursor:'pointer', flexShrink:0 }}>×</button>
                  </div>
                )
              })}
            </div>

            {/* 전체 삭제 */}
            <button onClick={() => { if(confirm('장바구니를 비우시겠습니까?')) clearCart() }}
              style={{ background:'none', border:'none', color:D.sub, fontSize:'12px', cursor:'pointer', marginBottom:'20px', textDecoration:'underline' }}>
              전체 삭제
            </button>
            </div>

            <div className="cart-summary">
            {/* 쿠폰 사용하기 (쿠폰함에서 받은 쿠폰 선택) */}
            <div style={{ background:D.card, borderRadius:'20px', padding:'18px', border:`1px solid ${D.border}`, marginBottom:'16px', boxShadow:'0 6px 24px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 10px' }}>🎟️ 쿠폰 사용하기</p>
              {appliedCoupon ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:dark?'rgba(74,222,128,0.1)':'rgba(22,163,74,0.07)', border:`1px solid ${dark?'rgba(74,222,128,0.25)':'rgba(22,163,74,0.2)'}`, borderRadius:'12px', padding:'12px 14px' }}>
                  <div>
                    <p style={{ fontSize:'14px', fontWeight:900, color:gtext, margin:0 }}>{appliedCoupon.description || appliedCoupon.code}</p>
                    <p style={{ fontSize:'12px', color:D.sub, margin:'2px 0 0' }}>−{discount.toLocaleString()}원 적용중</p>
                  </div>
                  <button onClick={removeCoupon} style={{ fontSize:'12px', fontWeight:700, color:D.sub, background:'none', border:`1px solid ${D.border}`, borderRadius:'10px', padding:'7px 12px', cursor:'pointer' }}>해제</button>
                </div>
              ) : ownedCoupons.length === 0 ? (
                <div style={{ textAlign:'center', padding:'8px 0' }}>
                  <p style={{ fontSize:'13px', color:D.sub, margin:'0 0 8px' }}>사용할 수 있는 쿠폰이 없어요.</p>
                  <a href="/shop/mypage?tab=coupons" style={{ fontSize:'12px', fontWeight:800, color:gtext, textDecoration:'underline' }}>쿠폰함에서 받기 →</a>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {ownedCoupons.map((uc:any) => {
                    const c = uc.coupons; if (!c) return null
                    const dtext = c.discount_type === 'percent' ? `${c.discount_value}% 할인${c.max_discount?` (최대 ${Number(c.max_discount).toLocaleString()}원)`:''}` : `${Number(c.discount_value).toLocaleString()}원 할인`
                    const base = couponBase(c)
                    const usable = base >= (c.min_amount || 0) && !(c.created_by_role === 'supplier' && base === 0)
                    return (
                      <button key={uc.id} onClick={() => selectCoupon(uc)} disabled={!usable}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', textAlign:'left', gap:'10px', padding:'12px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, cursor:usable?'pointer':'not-allowed', opacity:usable?1:0.5 }}>
                        <span>
                          <span style={{ display:'block', fontSize:'14px', fontWeight:900, color:gtext }}>{dtext}</span>
                          <span style={{ display:'block', fontSize:'11px', color:D.sub, marginTop:'2px' }}>
                            {c.created_by_role==='supplier'?'공급사 발행':'본사 발행'}{c.min_amount?` · ${Number(c.min_amount).toLocaleString()}원 이상`:''}
                          </span>
                        </span>
                        <span style={{ fontSize:'12px', fontWeight:800, color:usable?gtext:D.sub, whiteSpace:'nowrap' }}>{usable?'사용':'금액부족'}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              {couponMsg && <p style={{ fontSize:'12px', fontWeight:700, color: couponMsg.ok ? gtext : '#ef4444', margin:'10px 0 0' }}>{couponMsg.text}</p>}
            </div>

            {/* 합계 카드 */}
            <div style={{ background:D.card, borderRadius:'20px', padding:'22px', border:`1px solid ${D.border}`, marginBottom:'16px', boxShadow:'0 6px 24px rgba(0,0,0,0.05)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>상품 {items.length}종</p>
                <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>{totalAmount.toLocaleString()}원</p>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>배송비</p>
                <p style={{ fontSize:'13px', color:gtext, fontWeight:700, margin:0 }}>무료</p>
              </div>
              {discount > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'4px' }}>
                  <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>🎟️ 쿠폰 할인</p>
                  <p style={{ fontSize:'13px', color:'#ef4444', fontWeight:700, margin:0 }}>−{discount.toLocaleString()}원</p>
                </div>
              )}
              {pointUsed > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'4px' }}>
                  <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>💰 포인트 사용</p>
                  <p style={{ fontSize:'13px', color:'#16a34a', fontWeight:700, margin:0 }}>−{pointUsed.toLocaleString()}원</p>
                </div>
              )}
              <div style={{ height:'1px', background:D.border, margin:'14px 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ fontSize:'15px', fontWeight:800, color:D.text, margin:0 }}>총 결제금액</p>
                <p style={{ fontSize:'22px', fontWeight:900, color:priceColor, margin:0 }}>{payAmount.toLocaleString()}원</p>
              </div>
            </div>

            {/* 주문하기 버튼 */}
            <button className="cart-order-btn" onClick={() => { const delivery = defaultCheckoutAddress(); setOrderDone(false); setAgreeRefund(false); setOrderForm({ address: delivery.address, recipient: delivery.recipient, phone: delivery.phone, note:'', payment_method:'가상계좌', evidence: isBiz ? '세금계산서' : '현금영수증', evidenceContact: '' }); setShowOrder(true) }}
              style={{ width:'100%', padding:'18px', borderRadius:'16px', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'white', fontSize:'17px', fontWeight:900, border:'none', cursor:'pointer', boxShadow:'0 10px 28px rgba(22,163,74,0.35)' }}>
              <span className="cart-emoji">🛒</span> {payAmount.toLocaleString()}원 주문하기
            </button>
            </div>
          </div>
        )}
      </div>

      {/* 주문 모달 */}
      {showOrder && <CartOrderModal orderForm={orderForm} setOrderForm={setOrderForm} orderDone={orderDone} handleOrder={handleOrder} orderLoading={orderLoading} items={items} finalAmount={finalAmount} discount={discount} appliedCoupon={appliedCoupon} memberInfo={memberInfo} addresses={addresses} isBiz={isBiz} D={D} dark={dark} redirectCount={redirectCount} agreeRefund={agreeRefund} setAgreeRefund={setAgreeRefund} vatAmount={vatAmount} exemptSum={exemptSum} taxableSum={taxableSum} getPrice={getPrice} setShowOrder={setShowOrder} gtext={gtext} priceColor={priceColor} pointBalance={pointBalance} pointUsed={pointUsed} pointLimit={pointLimit} payAmount={payAmount} setPointUsed={updatePointUsed} />}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes cartFadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
        .cart-item-card { animation: cartFadeUp 0.45s ease both; transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s, border-color 0.25s; }
        .cart-item-card:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(0,0,0,0.1); border-color: rgba(22,163,74,0.35); }
        .cart-order-btn { transition: transform 0.2s, filter 0.2s; }
        .cart-order-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
        .cart-order-btn:active { transform: scale(0.98); }
        .cart-emoji { display: inline-block; font-size: 1.2em; filter: brightness(1.2) saturate(1.25) drop-shadow(0 1px 3px rgba(0,0,0,0.35)); }
        button, a { -webkit-tap-highlight-color: transparent; }
        /* PC: 2단 (상품 목록 / 결제요약 sticky) */
        @media (min-width: 880px) {
          .cart-grid { display: grid; grid-template-columns: 1fr 360px; gap: 26px; align-items: start; }
          .cart-summary { position: sticky; top: 84px; }
        }
      `}</style>
    </div>
  )
}
