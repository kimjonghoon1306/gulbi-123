'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { loadToss } from '@/lib/toss'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type CartItem = {
  id: string
  quantity: number
  product_id: string
  products: {
    id: string; name: string; image_url: string
    retail_price: number; wholesale_price: number; member_price: number
    stock: number; unit: string; is_taxable: boolean
  }
}

type MemberType = '일반' | '소매업' | '도매업'

export default function CartPage() {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<CartItem[]>([])
  const [memberType, setMemberType] = useState<MemberType>('일반')
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showOrder, setShowOrder] = useState(false)
  const [orderForm, setOrderForm] = useState({ address: '', note: '', payment_method: '계좌이체', evidence: '현금영수증', evidenceContact: '' })
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderDone, setOrderDone] = useState(false)
  const [agreeRefund, setAgreeRefund] = useState(false)  // 청약철회·반품 안내 동의(신선식품 반품제한 고지)
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [userId, setUserId] = useState('')
  const [redirectCount, setRedirectCount] = useState(3)

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

    const { data: cartData } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setItems((cartData as any) || [])
    setLoading(false)
  }

  const getPrice = (product: CartItem['products']) => {
    if (memberType === '도매업') return product.wholesale_price
    if (memberType === '소매업') return product.member_price
    return product.retail_price
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
  const isBiz = memberType === '소매업' || memberType === '도매업'  // 사업자 회원
  // 과세(가공식품)분 / 면세(미가공 농수산물)분 분리 — 부가세는 과세분에만
  const taxableSum = items.filter(i => i.products.is_taxable).reduce((s, i) => s + getPrice(i.products) * i.quantity, 0)
  const exemptSum = totalAmount - taxableSum
  const vatAmount = taxableSum - Math.round(taxableSum / 1.1)  // 과세분(부가세포함가) 중 부가세

  const handleOrder = async () => {
    if (!orderForm.address) return alert('배송지를 입력해주세요.')
    if (!agreeRefund) return alert('청약철회·반품 안내를 확인하고 동의해주세요.')
    try { localStorage.setItem('onjongil_addr', orderForm.address) } catch {}  // 주소 저장(다음 주문 자동입력)
    setOrderLoading(true)
    try {
      const table = memberType === '도매업' ? 'wholesale_orders' : memberType === '소매업' ? 'retail_orders' : 'general_orders'
      const itemTable = memberType === '도매업' ? 'wholesale_order_items' : memberType === '소매업' ? 'retail_order_items' : 'general_order_items'

      const isToss = orderForm.payment_method === '카드'  // 카드 = 토스페이먼츠 결제

      const { data: newOrder } = await supabase.from(table).insert({
        customer_name: memberInfo?.name || '',
        contact: memberInfo?.contact || '',
        user_id: userId,
        address: orderForm.address,
        note: orderForm.note,
        payment_method: isToss ? '카드(토스)' : orderForm.payment_method,
        status: isToss ? '결제대기' : '접수',
        total_amount: totalAmount,
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
          }))
        )
      }

      // 증빙 자동생성 — 계좌이체(현금성)만. 카드결제는 카드매출전표로 갈음되어 별도 발행 안 함(이중과세 방지)
      if (!isToss && newOrder && orderForm.evidence !== '발행안함') {
        if (orderForm.evidence === '세금계산서') {
          await supabase.from('tax_invoices').insert({
            company_name: memberInfo?.business_name || memberInfo?.name || '',
            business_number: memberInfo?.business_number || '',
            manager_name: memberInfo?.name || '',
            contact: orderForm.evidenceContact || memberInfo?.contact || '',
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

      // 카드 결제 → 토스 결제창 호출 (성공 시 /shop/payment/success 에서 승인 + 장바구니 비움)
      if (isToss && newOrder) {
        const toss = await loadToss()
        const orderName = items.length > 1
          ? `${items[0].products.name} 외 ${items.length - 1}건`
          : (items[0]?.products?.name || '온종일팜 주문')
        await toss.requestPayment('카드', {
          amount: totalAmount,
          orderId: String(newOrder.id),
          orderName,
          customerName: memberInfo?.name || '고객',
          successUrl: `${window.location.origin}/shop/payment/success?table=${table}`,
          failUrl: `${window.location.origin}/shop/payment/fail`,
        })
        return  // 토스 결제창으로 리다이렉트되므로 이후 코드 실행 안 함
      }

      await clearCart()
      // 🛒 헤더 카운트 0 갱신 신호
      localStorage.setItem('cart-updated', Date.now().toString())
      setOrderDone(true)
    } catch { alert('주문 중 오류가 발생했습니다.') }
    finally { setOrderLoading(false) }
  }

  const D = {
    bg:     dark ? '#0d1117' : '#f8fafc',
    card:   dark ? '#161b22' : '#ffffff',
    text:   dark ? '#f0f0ee' : '#0f172a',
    sub:    dark ? '#6b7280' : '#64748b',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    input:  dark ? '#1e2530' : '#f1f5f9',
  }

  const priceColor = memberType === '도매업' ? '#ec4899' : memberType === '소매업' ? '#14532d' : '#6366f1'

  if (loading) return (
    <div style={{ minHeight:'100vh', background:D.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'36px', height:'36px', border:'3px solid #14532d33', borderTop:'3px solid #14532d', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ background:D.bg, color:D.text, minHeight:'100vh', fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif" }}>

      {/* 헤더 */}
      <header style={{ background:dark?'rgba(13,17,23,0.97)':'rgba(255,255,255,0.97)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${D.border}`, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:'720px', margin:'0 auto', padding:'0 20px', height:'60px', display:'flex', alignItems:'center', gap:'12px' }}>
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

      <div style={{ maxWidth:'720px', margin:'0 auto', padding:'20px 20px 120px' }}>

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
          <>
            {/* 상품 목록 */}
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px' }}>
              {items.map(item => {
                const price = getPrice(item.products)
                return (
                  <div key={item.id} style={{ background:D.card, borderRadius:'20px', padding:'16px', border:`1px solid ${D.border}`, display:'flex', gap:'14px', alignItems:'center' }}>
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

            {/* 합계 카드 */}
            <div style={{ background:D.card, borderRadius:'20px', padding:'20px', border:`1px solid ${D.border}`, marginBottom:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>상품 {items.length}종</p>
                <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>{totalAmount.toLocaleString()}원</p>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>배송비</p>
                <p style={{ fontSize:'13px', color:'#14532d', fontWeight:700, margin:0 }}>무료</p>
              </div>
              <div style={{ height:'1px', background:D.border, margin:'14px 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ fontSize:'15px', fontWeight:800, color:D.text, margin:0 }}>총 결제금액</p>
                <p style={{ fontSize:'22px', fontWeight:900, color:priceColor, margin:0 }}>{totalAmount.toLocaleString()}원</p>
              </div>
            </div>

            {/* 주문하기 버튼 */}
            <button onClick={() => { setOrderDone(false); setAgreeRefund(false); setOrderForm({ address: (typeof window !== 'undefined' && localStorage.getItem('onjongil_addr')) || '', note:'', payment_method:'계좌이체', evidence: isBiz ? '세금계산서' : '현금영수증', evidenceContact: '' }); setShowOrder(true) }}
              style={{ width:'100%', padding:'18px', borderRadius:'16px', background:'linear-gradient(135deg,#14532d,#15803d)', color:'white', fontSize:'17px', fontWeight:900, border:'none', cursor:'pointer', boxShadow:'0 10px 28px rgba(22,163,74,0.35)' }}>
              🛒 {totalAmount.toLocaleString()}원 주문하기
            </button>
          </>
        )}
      </div>

      {/* 주문 모달 */}
      {showOrder && (
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
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:900, color:'#14532d' }}>{redirectCount}</div>
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
                  <div style={{ height:'1px', background:D.border }} />
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <p style={{ fontSize:'14px', fontWeight:800, color:D.text, margin:0 }}>합계</p>
                    <p style={{ fontSize:'16px', fontWeight:900, color:priceColor, margin:0 }}>{totalAmount.toLocaleString()}원</p>
                  </div>
                </div>

                {/* 배송지 */}
                <div>
                  <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:800, color:D.text, marginBottom:'10px' }}>
                    📍 배송지 <span style={{ fontSize:'10px', color:'#14532d', background:'rgba(22,163,74,0.1)', padding:'2px 7px', borderRadius:'20px', fontWeight:700 }}>필수</span>
                  </label>
                  <input type="text" value={orderForm.address} onChange={e => setOrderForm(p => ({...p, address: e.target.value}))}
                    placeholder="배송 받으실 주소를 입력해주세요"
                    style={{ width:'100%', padding:'14px 16px', borderRadius:'14px', border:`2px solid ${orderForm.address ? '#14532d' : D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
                </div>

                {/* 결제방법 */}
                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:800, color:D.text, marginBottom:'10px' }}>💳 결제방법</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    {[{label:'계좌이체',icon:'🏦'},{label:'카드',icon:'💳'}].map(pm => (
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
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                        {[{ label: isBiz ? '세금계산서' : '현금영수증', icon:'🧾' }, { label:'발행안함', icon:'🚫' }].map(ev => (
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
                        </div>
                      )}
                      {orderForm.evidence === '현금영수증' && (
                        <input type="tel" value={orderForm.evidenceContact} onChange={e => setOrderForm(p => ({...p, evidenceContact: e.target.value}))}
                          placeholder="소득공제용 휴대폰번호 (미입력 시 가입 연락처)"
                          style={{ width:'100%', marginTop:'10px', padding:'13px 16px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
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
                    <span style={{ fontSize:'12.5px', fontWeight:700, color:D.text }}>위 청약철회·반품 제한 사항을 확인했으며, 이에 동의합니다. <span style={{ color:'#14532d' }}>(필수)</span></span>
                  </label>
                </div>

                <button onClick={handleOrder} disabled={orderLoading || !agreeRefund}
                  style={{ width:'100%', padding:'18px', borderRadius:'16px', background:(orderLoading || !agreeRefund) ? D.input : 'linear-gradient(135deg,#14532d,#15803d)', color:(orderLoading || !agreeRefund) ? D.sub : 'white', fontSize:'17px', fontWeight:900, border:'none', cursor:(orderLoading || !agreeRefund) ? 'not-allowed' : 'pointer', boxShadow:(orderLoading || !agreeRefund) ? 'none' : '0 10px 28px rgba(22,163,74,0.35)' }}>
                  {orderLoading ? '⏳ 처리 중...' : `🛒 ${totalAmount.toLocaleString()}원 주문하기`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

