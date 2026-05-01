'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type CartItem = {
  id: string
  quantity: number
  product_id: string
  products: {
    id: string; name: string; image_url: string
    retail_price: number; wholesale_price: number; member_price: number
    stock: number; unit: string
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
  const [orderForm, setOrderForm] = useState({ address: '', note: '', payment_method: '계좌이체' })
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderDone, setOrderDone] = useState(false)
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)
    fetchAll()
  }, [])

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

  const handleOrder = async () => {
    if (!orderForm.address) return alert('배송지를 입력해주세요.')
    setOrderLoading(true)
    try {
      const table = memberType === '도매업' ? 'wholesale_orders' : memberType === '소매업' ? 'retail_orders' : 'general_orders'
      const itemTable = memberType === '도매업' ? 'wholesale_order_items' : memberType === '소매업' ? 'retail_order_items' : 'general_order_items'

      const { data: newOrder } = await supabase.from(table).insert({
        customer_name: memberInfo?.name || '',
        contact: memberInfo?.contact || '',
        user_id: userId,
        address: orderForm.address,
        note: orderForm.note,
        payment_method: orderForm.payment_method,
        status: '접수',
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

  const priceColor = memberType === '도매업' ? '#ec4899' : memberType === '소매업' ? '#0f766e' : '#6366f1'

  if (loading) return (
    <div style={{ minHeight:'100vh', background:D.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'36px', height:'36px', border:'3px solid #0f766e33', borderTop:'3px solid #0f766e', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
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
          <span style={{ background:'linear-gradient(135deg,#0f766e,#0891b2)', color:'white', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px' }}>
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
            <Link href="/shop" style={{ background:'linear-gradient(135deg,#0f766e,#0891b2)', color:'white', fontWeight:700, fontSize:'14px', padding:'13px 28px', borderRadius:'14px', textDecoration:'none', boxShadow:'0 8px 20px rgba(15,118,110,0.3)' }}>
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
                        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px' }}>🐟</div>
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
                <p style={{ fontSize:'13px', color:'#0f766e', fontWeight:700, margin:0 }}>무료</p>
              </div>
              <div style={{ height:'1px', background:D.border, margin:'14px 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ fontSize:'15px', fontWeight:800, color:D.text, margin:0 }}>총 결제금액</p>
                <p style={{ fontSize:'22px', fontWeight:900, color:priceColor, margin:0 }}>{totalAmount.toLocaleString()}원</p>
              </div>
            </div>

            {/* 주문하기 버튼 */}
            <button onClick={() => { setOrderDone(false); setOrderForm({ address:'', note:'', payment_method:'계좌이체' }); setShowOrder(true) }}
              style={{ width:'100%', padding:'18px', borderRadius:'16px', background:'linear-gradient(135deg,#0f766e,#0891b2)', color:'white', fontSize:'17px', fontWeight:900, border:'none', cursor:'pointer', boxShadow:'0 10px 28px rgba(15,118,110,0.35)' }}>
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
                <div style={{ fontSize:'56px', marginBottom:'16px' }}>🎉</div>
                <p style={{ fontSize:'22px', fontWeight:900, color:D.text, margin:'0 0 8px' }}>주문 완료!</p>
                <p style={{ fontSize:'14px', color:D.sub, margin:'0 0 32px' }}>마이페이지에서 주문 현황을 확인하세요</p>
                <div style={{ display:'flex', gap:'10px' }}>
                  <button onClick={() => setShowOrder(false)} style={{ flex:1, padding:'14px', borderRadius:'14px', border:`1.5px solid ${D.border}`, background:'transparent', color:D.sub, fontSize:'14px', fontWeight:600, cursor:'pointer' }}>닫기</button>
                  <button onClick={() => { setShowOrder(false); router.push('/shop/mypage') }}
                    style={{ flex:2, padding:'14px', borderRadius:'14px', background:'linear-gradient(135deg,#0f766e,#0891b2)', color:'white', fontSize:'14px', fontWeight:900, border:'none', cursor:'pointer' }}>
                    📦 주문 확인하기 →
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
                    📍 배송지 <span style={{ fontSize:'10px', color:'#0f766e', background:'rgba(15,118,110,0.1)', padding:'2px 7px', borderRadius:'20px', fontWeight:700 }}>필수</span>
                  </label>
                  <input type="text" value={orderForm.address} onChange={e => setOrderForm(p => ({...p, address: e.target.value}))}
                    placeholder="배송 받으실 주소를 입력해주세요"
                    style={{ width:'100%', padding:'14px 16px', borderRadius:'14px', border:`2px solid ${orderForm.address ? '#0f766e' : D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
                </div>

                {/* 결제방법 */}
                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:800, color:D.text, marginBottom:'10px' }}>💳 결제방법</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    {[{label:'계좌이체',icon:'🏦'},{label:'카드',icon:'💳'}].map(pm => (
                      <button key={pm.label} onClick={() => setOrderForm(p => ({...p, payment_method: pm.label}))}
                        style={{ padding:'12px', borderRadius:'12px', border:`2px solid ${orderForm.payment_method===pm.label ? '#0f766e' : D.border}`, background:orderForm.payment_method===pm.label ? 'rgba(15,118,110,0.08)' : D.input, color:orderForm.payment_method===pm.label ? '#0f766e' : D.sub, fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                        {pm.icon} {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 요청사항 */}
                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:800, color:D.text, marginBottom:'10px' }}>💬 요청사항 <span style={{ fontSize:'11px', color:D.sub, fontWeight:400 }}>(선택)</span></label>
                  <textarea value={orderForm.note} onChange={e => setOrderForm(p => ({...p, note: e.target.value}))}
                    placeholder="배송 요청사항을 입력해주세요" rows={2}
                    style={{ width:'100%', padding:'14px 16px', borderRadius:'14px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'13px', outline:'none', resize:'none', boxSizing:'border-box' }} />
                </div>

                <button onClick={handleOrder} disabled={orderLoading}
                  style={{ width:'100%', padding:'18px', borderRadius:'16px', background:orderLoading ? D.input : 'linear-gradient(135deg,#0f766e,#0891b2)', color:orderLoading ? D.sub : 'white', fontSize:'17px', fontWeight:900, border:'none', cursor:orderLoading ? 'not-allowed' : 'pointer', boxShadow:orderLoading ? 'none' : '0 10px 28px rgba(15,118,110,0.35)' }}>
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

