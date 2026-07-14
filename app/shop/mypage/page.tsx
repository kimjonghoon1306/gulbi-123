'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BenefitsTab } from '../_BenefitsTab'
import { OrdersTab } from '../_OrdersTab'
import { CouponsTab } from '../_CouponsTab'
import { WishlistTab } from '../_WishlistTab'
import { SettingsTab } from '../_SettingsTab'
import { HomeTab } from './_HomeTab'
import { courierName } from '@/lib/tracking'

type Member = {
  id: string; email: string; name: string; contact: string
  member_type: '일반' | '소매업' | '도매업'
  business_name: string; business_number: string
  status: string; created_at: string
  address?: string
}

type Order = {
  id: string; order_number: string; customer_name: string; contact: string
  address: string; note: string; payment_method: string; status: string
  total_amount: number; created_at: string
  courier_code?: string; tracking_number?: string
  _type?: 'general' | 'retail' | 'wholesale'   // 주문이 속한 테이블 (등급 변경 대비)
}

type OrderItem = {
  id: string; product_name: string; quantity: number; unit: string
  unit_price: number; total_price: number
}

type OrderReturn = {
  id: string
  order_id: string
  order_type: 'general' | 'retail' | 'wholesale'
  user_id: string
  type: '반품' | '교환'
  reason: string
  image_urls: string[]
  status: string
  admin_memo?: string | null
  created_at: string
  updated_at: string
}

type CashAccount = {
  user_id: string
  cash_balance: number | null
  point_balance: number | null
}

type CashLedger = {
  id: string
  kind: string
  cash_delta: number | null
  point_delta: number | null
  cash_after: number | null
  point_after: number | null
  source: string | null
  ref_type: string | null
  ref_id: string | null
  memo: string | null
  created_at: string
}

type Address = {
  id: string
  label: string
  recipient?: string | null
  phone?: string | null
  postcode?: string | null
  address1: string
  address2?: string | null
  is_default?: boolean
  created_at?: string
}

type AddressForm = {
  label: string
  recipient: string
  phone: string
  postcode: string
  address1: string
  address2: string
  is_default: boolean
}

const STATUS_STEP: Record<string, number> = { '입금대기': -1, '입금완료': 0, '접수': 0, '준비중': 1, '출고': 2, '완료': 3 }
const STATUS_LABEL = ['접수', '준비중', '출고', '완료']
const STATUS_ICON = ['📋', '📦', '🚚', '✅']

const TYPE_CONFIG = {
  '일반':  { color: '#15803d', gradient: 'linear-gradient(135deg,#16a34a,#15803d)', label: '일반 구매자', icon: '🛒', badge: '일반회원' },
  '소매업': { color: '#14532d', gradient: 'linear-gradient(135deg,#15803d,#14532d)', label: '소매 유통',   icon: '🏪', badge: '소매회원' },
  '도매업': { color: '#047857', gradient: 'linear-gradient(135deg,#059669,#047857)', label: '도매 유통',   icon: '🏭', badge: '도매회원' },
}

const GRADE_INFO = [
  { name: '일반', icon: '🛒', min: 0,       max: 500000,   color: '#6b7280' },
  { name: '실버', icon: '🥈', min: 500000,  max: 2000000,  color: '#94a3b8' },
  { name: '골드', icon: '🥇', min: 2000000, max: 5000000,  color: '#f59e0b' },
  { name: 'VIP',  icon: '💎', min: 5000000, max: Infinity, color: '#ec4899' },
]

const EMPTY_ADDRESS_FORM: AddressForm = {
  label: '',
  recipient: '',
  phone: '',
  postcode: '',
  address1: '',
  address2: '',
  is_default: false,
}

const addressToText = (a: Address) => [a.address1, a.address2].filter(Boolean).join(' ').trim()

const LEDGER_KIND_LABEL: Record<string, string> = {
  partner_settlement: '온파트너 정산',
  cash_withdraw_request: '출금 신청',
  cash_withdraw_approved: '출금 승인',
  cash_withdraw_paid: '출금 지급',
  cash_withdraw_rejected: '출금 반려',
  cash_to_point: '캐시→쇼핑포인트 전환',
  point_earn: '온종일팜 포인트 적립',
  point_use: '쇼핑포인트 사용',
  point_refund: '쇼핑포인트 환불',
  admin_adjust: '관리자 조정',
}

function ledgerKindLabel(kind: string) {
  return LEDGER_KIND_LABEL[kind] || kind
}

function formatSignedPoint(value: number | null | undefined) {
  const n = Number(value || 0)
  if (n === 0) return '0 P'
  return `${n > 0 ? '+' : ''}${n.toLocaleString()} P`
}

function formatSignedCash(value: number | null | undefined) {
  const n = Number(value || 0)
  if (n === 0) return '0원'
  return `${n > 0 ? '+' : ''}${n.toLocaleString()}원`
}

function PointDetailTab({ D, accent, account, ledgers }: { D: any; accent: string; account: CashAccount | null; ledgers: CashLedger[] }) {
  const pointBalance = Number(account?.point_balance || 0)
  const cashBalance = Number(account?.cash_balance || 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      <div style={{ background:D.card, border:`1px solid ${D.border}`, borderRadius:'22px', padding:'24px' }}>
        <p style={{ fontSize:'13px', color:D.sub, fontWeight:800, margin:'0 0 8px' }}>쇼핑포인트 잔액</p>
        <p style={{ fontSize:'36px', lineHeight:1.1, color:accent, fontWeight:900, margin:'0 0 10px' }}>{pointBalance.toLocaleString()} P</p>
        <p style={{ fontSize:'12px', color:D.sub, lineHeight:1.7, margin:0 }}>
          참고 캐시 잔액: {cashBalance.toLocaleString()}원 · 캐시 관리와 쇼핑포인트 전환은 온파트너 대시보드에서 할 수 있어요.
        </p>
      </div>

      <div style={{ background:D.card, border:`1px solid ${D.border}`, borderRadius:'22px', padding:'20px' }}>
        <p style={{ fontSize:'15px', color:D.text, fontWeight:900, margin:'0 0 12px' }}>쇼핑포인트 안내</p>
        {[
          '쇼핑포인트는 온종일팜에서 상품 구매에 사용할 수 있어요.',
          '포인트는 온종일팜 자체 적립분과 온파트너에서 전환한 분이 있으며, 결제 시 양쪽이 합산되어 사용됩니다.',
          '온파트너에서 상품을 판매해 쌓인 캐시를 쇼핑포인트로 전환하면 여기서 사용할 수 있어요.',
        ].map((text) => (
          <p key={text} style={{ fontSize:'13px', color:D.sub, lineHeight:1.75, margin:'8px 0 0', fontWeight: text.includes('결제 시') ? 800 : 600 }}>
            {text}
          </p>
        ))}
      </div>

      <div style={{ background:D.card, border:`1px solid ${D.border}`, borderRadius:'22px', overflow:'hidden' }}>
        <div style={{ padding:'18px 20px', borderBottom:`1px solid ${D.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
          <p style={{ fontSize:'15px', color:D.text, fontWeight:900, margin:0 }}>거래 내역</p>
          <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>{ledgers.length.toLocaleString()}건</p>
        </div>
        {ledgers.length === 0 ? (
          <div style={{ padding:'34px 20px', textAlign:'center' }}>
            <p style={{ fontSize:'13px', color:D.sub, margin:0 }}>아직 포인트 거래 내역이 없어요.</p>
          </div>
        ) : ledgers.map((row) => (
          <div key={row.id} style={{ padding:'16px 20px', borderBottom:`1px solid ${D.border}`, display:'grid', gridTemplateColumns:'1fr auto', gap:'12px', alignItems:'center' }}>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:'13px', color:D.text, fontWeight:800, margin:'0 0 4px' }}>{ledgerKindLabel(row.kind)}</p>
              <p style={{ fontSize:'11px', color:D.sub, margin:0, lineHeight:1.5 }}>
                {new Date(row.created_at).toLocaleString('ko-KR')}
                {row.memo ? ` · ${row.memo}` : ''}
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:'14px', color:Number(row.point_delta || 0) >= 0 ? accent : '#ef4444', fontWeight:900, margin:'0 0 4px' }}>
                {formatSignedPoint(row.point_delta)}
              </p>
              {Number(row.cash_delta || 0) !== 0 && (
                <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>캐시 {formatSignedCash(row.cash_delta)}</p>
              )}
              <p style={{ fontSize:'11px', color:D.sub, margin:0 }}>잔액 {Number(row.point_after || 0).toLocaleString()} P</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:'44px', height:'44px', borderRadius:'50%', border:'3px solid #14532d', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
      <MyPageInner />
    </Suspense>
  )
}

function MyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [member, setMember]           = useState<Member | null>(null)
  const [orders, setOrders]           = useState<Order[]>([])
  const [orderItems, setOrderItems]   = useState<Record<string, OrderItem[]>>({})
  const [orderReturns, setOrderReturns] = useState<OrderReturn[]>([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<'home' | 'orders' | 'coupons' | 'benefits' | 'wishlist' | 'settings' | 'points'>('home')
  const [wishlists, setWishlists]     = useState<any[]>([])
  const [myCoupons, setMyCoupons]     = useState<any[]>([])   // 받은 쿠폰(user_coupons + coupons)
  const [availCoupons, setAvailCoupons] = useState<any[]>([]) // 받을 수 있는 쿠폰
  const [couponBusy, setCouponBusy]   = useState('')
  const [dark, setDark]               = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [itemsLoading, setItemsLoading]   = useState<string | null>(null)
  const [cashAccount, setCashAccount] = useState<CashAccount | null>(null)
  const [cashLedgers, setCashLedgers] = useState<CashLedger[]>([])

  // ── 설정(주소/비번) ──
  const [addrInput, setAddrInput]     = useState('')
  const [addrSaving, setAddrSaving]   = useState(false)
  const [addrMsg, setAddrMsg]         = useState('')
  const [addresses, setAddresses]     = useState<Address[]>([])
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS_FORM)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [pw1, setPw1]                 = useState('')
  const [pw2, setPw2]                 = useState('')
  const [pwSaving, setPwSaving]       = useState(false)
  const [pwMsg, setPwMsg]             = useState('')

  const loadAddresses = async (uid: string) => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', uid)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error) setAddresses((data as Address[]) || [])
  }

  const loadOrderReturns = async (uid: string) => {
    const { data, error } = await supabase
      .from('order_returns')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (!error) setOrderReturns((data as OrderReturn[]) || [])
  }

  const loadCashPointData = async (uid: string) => {
    const [{ data: account }, { data: ledger }] = await Promise.all([
      supabase.from('cash_accounts').select('user_id,cash_balance,point_balance').eq('user_id', uid).maybeSingle(),
      supabase
        .from('cash_ledger')
        .select('id,kind,cash_delta,point_delta,cash_after,point_after,source,ref_type,ref_id,memo,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(80),
    ])
    setCashAccount((account as CashAccount | null) || { user_id: uid, cash_balance: 0, point_balance: 0 })
    setCashLedgers((ledger as CashLedger[]) || [])
  }

  const syncDefaultAddress = async (address: string) => {
    if (!member) return
    try { localStorage.setItem('onjongil_addr', address) } catch {}
    await supabase.from('shop_members').update({ address }).eq('id', member.id)
    setMember({ ...member, address })
    setAddrInput(address)
  }

  const resetAddressForm = () => {
    setAddressForm(EMPTY_ADDRESS_FORM)
    setEditingAddressId(null)
  }

  const saveAddress = async () => {
    if (!member) return
    setAddrSaving(true); setAddrMsg('')
    const form = {
      ...addressForm,
      label: addressForm.label.trim() || '배송지',
      recipient: addressForm.recipient.trim() || member.name || '',
      phone: addressForm.phone.trim() || member.contact || '',
      postcode: addressForm.postcode.trim(),
      address1: addressForm.address1.trim(),
      address2: addressForm.address2.trim(),
      is_default: addressForm.is_default || addresses.length === 0,
    }
    if (!form.address1) {
      setAddrMsg('주소 검색 후 배송지를 입력해주세요.')
      setAddrSaving(false)
      return
    }
    if (form.is_default) await supabase.from('addresses').update({ is_default: false }).eq('user_id', member.id)
    const payload = { user_id: member.id, ...form }
    const { error } = editingAddressId
      ? await supabase.from('addresses').update(payload).eq('id', editingAddressId)
      : await supabase.from('addresses').insert(payload)
    if (error) {
      console.error('[address save] failed', error)
      setAddrMsg('배송지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
    else {
      if (form.is_default) await syncDefaultAddress([form.address1, form.address2].filter(Boolean).join(' '))
      await loadAddresses(member.id)
      resetAddressForm()
      setAddrMsg('✅ 배송지가 저장됐어요')
    }
    setAddrSaving(false)
  }

  const editAddress = (a: Address) => {
    setEditingAddressId(a.id)
    setAddressForm({
      label: a.label || '',
      recipient: a.recipient || '',
      phone: a.phone || '',
      postcode: a.postcode || '',
      address1: a.address1 || '',
      address2: a.address2 || '',
      is_default: !!a.is_default,
    })
    setAddrMsg('')
  }

  const cancelAddressEdit = () => {
    resetAddressForm()
    setAddrMsg('')
  }

  const setDefaultAddress = async (id: string) => {
    if (!member) return
    const target = addresses.find(a => a.id === id)
    if (!target) return
    setAddrSaving(true); setAddrMsg('')
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', member.id)
    const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    if (error) {
      console.error('[address default] failed', error)
      setAddrMsg('기본 배송지 지정에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
    else {
      await syncDefaultAddress(addressToText(target))
      await loadAddresses(member.id)
      setAddrMsg('✅ 기본 배송지로 지정했어요')
    }
    setAddrSaving(false)
  }

  const deleteAddress = async (id: string) => {
    if (!member) return
    if (!confirm('이 배송지를 삭제할까요?')) return
    const { error } = await supabase.from('addresses').delete().eq('id', id)
    if (error) {
      console.error('[address delete] failed', error)
      setAddrMsg('배송지 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    const remaining = addresses.filter(a => a.id !== id)
    if (remaining.length > 0 && !remaining.some(a => a.is_default)) {
      await supabase.from('addresses').update({ is_default: true }).eq('id', remaining[0].id)
      await syncDefaultAddress(addressToText(remaining[0]))
    }
    await loadAddresses(member.id)
    if (editingAddressId === id) resetAddressForm()
    setAddrMsg('✅ 배송지를 삭제했어요')
  }

  const importLegacyAddress = async () => {
    if (!member || !addrInput.trim()) return
    setAddrSaving(true); setAddrMsg('')
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', member.id)
    const payload = {
      user_id: member.id,
      label: '기본 배송지',
      recipient: member.name || '',
      phone: member.contact || '',
      postcode: '',
      address1: addrInput.trim(),
      address2: '',
      is_default: true,
    }
    const { error } = await supabase.from('addresses').insert(payload)
    if (error) {
      console.error('[legacy address import] failed', error)
      setAddrMsg('기존 배송지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
    else {
      await loadAddresses(member.id)
      setAddrMsg('✅ 기존 배송지를 주소록에 저장했어요')
    }
    setAddrSaving(false)
  }

  // ── 배송 조회 ──
  const [trackModal, setTrackModal] = useState(false)
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackData, setTrackData] = useState<any>(null)

  const openTracking = async (order: Order) => {
    if (!order.courier_code || !order.tracking_number) return
    setTrackModal(true); setTrackLoading(true); setTrackData(null)
    try {
      const res = await fetch('/api/tracking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courier: order.courier_code, invoice: order.tracking_number }),
      })
      const data = await res.json()
      setTrackData(data)
    } catch {
      setTrackData({ ok: false, error: '배송조회 중 오류가 발생했어요.' })
    } finally { setTrackLoading(false) }
  }

  const changePassword = async () => {
    setPwMsg('')
    if (pw1.length < 6) { setPwMsg('비밀번호는 6자 이상이어야 해요.'); return }
    if (pw1 !== pw2) { setPwMsg('두 비밀번호가 일치하지 않아요.'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw1 })
    if (error) {
      console.error('[password change] failed', error)
      setPwMsg('비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
    else { setPw1(''); setPw2(''); setPwMsg('✅ 비밀번호가 변경됐어요') }
    setPwSaving(false)
  }

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/shop/login'); return }
      const { data: m } = await supabase.from('shop_members').select('*').eq('id', user.id).single()
      if (!m) {
        // shop_members 레코드가 없는 경우 (온파트너로 가입 등 shop_members 미생성)
        // → auth 메타데이터의 실제 이름을 우선 사용 (이메일 앞부분 아님)
        const meta = (user.user_metadata || {}) as any
        const realName = meta.name || meta.full_name || meta.nickname
        const fallbackMember = {
          id: user.id,
          email: user.email || '',
          name: realName || user.email?.split('@')[0] || '회원',
          contact: meta.contact || meta.phone || '',
          member_type: '일반' as const,
          business_name: meta.business_name || '',
          business_number: meta.business_number || '',
          status: '승인',
          created_at: new Date().toISOString()
        }
        setMember(fallbackMember)
        // ❌ 기존: setOrders([]) → return  (주문 조회 없이 종료 — 버그)
        // ✅ 수정: general_orders에서 user_id로 주문 조회
        const { data: o } = await supabase
          .from('general_orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        setOrders(o || [])
        await loadCashPointData(user.id)
        await loadOrderReturns(user.id)
        await loadAddresses(user.id)
        setLoading(false)
        return
      }
      setMember(m)
      setAddrInput(m.address || (typeof window !== 'undefined' ? localStorage.getItem('onjongil_addr') || '' : ''))
      await loadAddresses(user.id)
      await loadCashPointData(user.id)
      // 등급이 바뀌어도 과거 주문이 사라지지 않도록 3개 주문 테이블을 모두 조회해 합침 (주문 id는 UUID라 충돌 없음)
      const ORDER_TABLES: { t: string; type: 'general' | 'retail' | 'wholesale' }[] = [
        { t: 'general_orders', type: 'general' },
        { t: 'retail_orders', type: 'retail' },
        { t: 'wholesale_orders', type: 'wholesale' },
      ]
      const orderResults = await Promise.all(ORDER_TABLES.map(async ({ t, type }) => {
        let { data } = await supabase.from(t).select('*').eq('user_id', user.id)
        if (!data || data.length === 0) {
          const { data: byContact } = await supabase.from(t).select('*').eq('contact', m.contact)
          data = byContact || []
        }
        return (data || []).map((o: any) => ({ ...o, _type: type }))
      }))
      const merged = orderResults.flat().sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      setOrders(merged)
      loadAllOrderItems(merged)
      await loadOrderReturns(user.id)
      // 찜 목록 조회
      const { data: wishes } = await supabase
        .from('wishlists')
        .select('id, created_at, products(id, name, image_url, retail_price, wholesale_price, member_price, unit, stock)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setWishlists(wishes || [])
      await loadCoupons(user.id)
      setLoading(false)
    } catch (e) {
      console.error('fetchData error:', e)
      setLoading(false)
    }
  }

  // 쿠폰함: 받은 쿠폰 + 받을 수 있는 쿠폰 로드
  const loadCoupons = async (uid: string) => {
    try {
      const now = new Date().toISOString()
      const [{ data: mine }, { data: all }] = await Promise.all([
        supabase.from('user_coupons').select('*, coupons(*)').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('coupons').select('*').eq('is_active', true),
      ])
      setMyCoupons(mine || [])
      const ownedIds = new Set((mine || []).map((m: any) => m.coupon_id))
      // 활성 + 기간 내 + 사용한도 안 찼고 + 아직 안 받은 것
      const avail = (all || []).filter((c: any) => {
        if (ownedIds.has(c.id)) return false
        if (c.starts_at && c.starts_at > now) return false
        if (c.expires_at && c.expires_at < now) return false
        if (c.usage_limit && (c.used_count || 0) >= c.usage_limit) return false
        return true
      })
      setAvailCoupons(avail)
    } catch (e) { console.error('loadCoupons error:', e) }
  }

  // 쿠폰 받기 → 쿠폰함에 저장
  const claimCoupon = async (c: any) => {
    if (!member) return
    setCouponBusy(c.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCouponBusy(''); return }
    const { error } = await supabase.from('user_coupons').insert({ user_id: user.id, coupon_id: c.id })
    if (!error) await loadCoupons(user.id)
    setCouponBusy('')
  }

  // 찜 해제
  const removeWishlist = async (wishId: string) => {
    setWishlists(prev => prev.filter(w => w.id !== wishId))
    await supabase.from('wishlists').delete().eq('id', wishId)
  }

  useEffect(() => {
    const saved = localStorage.getItem('shop-theme')
    if (saved === 'dark') setDark(true)

    // 장바구니 결제 완료 후 ?tab=orders 로 진입 시 주문내역 탭 바로 열기
    const tabParam = searchParams.get('tab')
    if (tabParam === 'orders' || tabParam === 'benefits' || tabParam === 'wishlist' || tabParam === 'coupons' || tabParam === 'points') {
      setTab(tabParam as any)
    }

    fetchData()

    // 📦 주문 완료 후 마이페이지 이동 시 자동 갱신
    const refreshOrders = () => {
      if (document.visibilityState === 'visible') fetchData()
    }
    document.addEventListener('visibilitychange', refreshOrders)

    return () => {
      document.removeEventListener('visibilitychange', refreshOrders)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 모든 주문의 상품을 한 번에 로드 (상세보기 없이 항상 펼쳐 보여주기 위함)
  const loadAllOrderItems = async (orderList: Order[]) => {
    if (!orderList || orderList.length === 0) return
    const ids = orderList.map(o => o.id)
    // 주문 id가 UUID라 3개 item 테이블에 같은 id 목록으로 조회해도 각자 자기 것만 반환 → 합치면 됨
    const ITEM_TABLES = ['general_order_items', 'retail_order_items', 'wholesale_order_items']
    const grouped: Record<string, OrderItem[]> = {}
    await Promise.all(ITEM_TABLES.map(async (table) => {
      const { data } = await supabase.from(table).select('*').in('order_id', ids)
      ;(data || []).forEach((it: any) => {
        if (!grouped[it.order_id]) grouped[it.order_id] = []
        grouped[it.order_id].push(it)
      })
    }))
    setOrderItems(grouped)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/shop')
  }

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('shop-theme', next ? 'dark' : 'light')
    window.dispatchEvent(new Event('shop-theme-change'))
  }

  // Derived values
  const tc           = member ? TYPE_CONFIG[member.member_type] : TYPE_CONFIG['일반']
  const accent       = dark ? '#4ade80' : tc.color  // 다크 배경에서도 보이는 강조 텍스트색
  const totalAmount  = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
  const curGrade     = [...GRADE_INFO].reverse().find(g => totalAmount >= g.min) || GRADE_INFO[0]
  const nextGrade    = GRADE_INFO[GRADE_INFO.indexOf(curGrade) + 1] || null
  const gradeProgress= nextGrade ? Math.min((totalAmount / nextGrade.min) * 100, 100) : 100

  // Design tokens
  const D = {
    bg:     dark ? 'linear-gradient(180deg,#0d2a1d 0%,#081710 60%,#0a1c13 100%)' : '#f1f5f9',
    card:   dark ? '#102a1d' : '#ffffff',
    card2:  dark ? '#15391f' : '#f8fafc',
    text:   dark ? '#eaf5ee' : '#0f172a',
    sub:    dark ? '#86a394' : '#64748b',
    border: dark ? 'rgba(52,211,153,0.14)' : 'rgba(0,0,0,0.07)',
    input:  dark ? '#15391f' : '#f1f5f9',
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:D.bg, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:'44px', height:'44px', borderRadius:'50%', border:`3px solid ${tc.color}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:D.sub, fontSize:'13px', margin:0 }}>불러오는 중...</p>
    </div>
  )

  if (!member) return null

  return (
    <div style={{ background:D.bg, color:D.text, minHeight:'100vh', fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif" }}>

      {/* ── 헤더 ── */}
      <header style={{ background:dark?'rgba(10,28,19,0.95)':'rgba(255,255,255,0.97)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${D.border}`, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 20px', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <Link href="/shop" style={{ width:'36px', height:'36px', borderRadius:'10px', background:D.input, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', textDecoration:'none', color:D.text, flexShrink:0 }}>←</Link>
            <p style={{ fontWeight:800, fontSize:'16px', margin:0 }}>마이페이지</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ background:tc.gradient, color:'white', fontSize:'14px', fontWeight:800, padding:'7px 16px', borderRadius:'20px', boxShadow:`0 4px 12px ${tc.color}50` }}>{tc.badge}</div>
            <button onClick={toggleDark} style={{ width:'44px', height:'44px', borderRadius:'12px',
              background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
              border:'none', cursor:'pointer', fontSize:'22px', display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s', flexShrink:0 }}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:'1340px', margin:'0 auto', padding:'24px 24px 100px' }}>

        <div className="mp-layout">
        <div className="mp-side">

        {/* ── 프로필 히어로 ── */}
        <div className="hero-card" style={{ background:tc.gradient, borderRadius:'32px', padding:'40px 36px', marginBottom:'22px', position:'relative', overflow:'hidden', boxShadow:`0 24px 60px ${tc.color}40` }}>
          {/* 움직이는 빛 블롭 */}
          <div className="hero-blob" style={{ position:'absolute', top:'-60px', right:'-40px', width:'220px', height:'220px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', filter:'blur(8px)' }} />
          <div className="hero-blob2" style={{ position:'absolute', bottom:'-70px', left:'18%', width:'240px', height:'240px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', filter:'blur(6px)' }} />

          {/* SVG 물결 (하단) */}
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'60px', opacity:0.18 }}>
            <path className="hero-wave" d="M0,60 C240,110 480,10 720,60 C960,110 1200,10 1440,60 L1440,120 L0,120 Z" fill="white" />
          </svg>

          {/* 떠다니는 아이콘들 */}
          {['🛒','🧺','🐟','🌾','✨','📦'].map((em, i) => (
            <div key={i} className="hero-float" style={{
              position:'absolute', fontSize:`${20 + (i%3)*8}px`, opacity:0.22,
              left:`${10 + i*15}%`, top:`${12 + (i%3)*26}%`,
              animationDelay:`${i*0.5}s`, animationDuration:`${4 + i*0.4}s`, pointerEvents:'none', userSelect:'none',
            }}>{em}</div>
          ))}

          <div style={{ position:'relative', zIndex:2 }}>

            {/* 프로필 */}
            <div className="hero-profile" style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'28px' }}>
              <div className="hero-avatar" style={{ width:'84px', height:'84px', borderRadius:'50%', background:'rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', flexShrink:0, border:'3px solid rgba(255,255,255,0.45)', boxShadow:'0 8px 24px rgba(0,0,0,0.18)' }}>
                {tc.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', color:'white', fontSize:'15px', fontWeight:800, margin:'0 0 10px', background:'rgba(255,255,255,0.25)', padding:'7px 16px', borderRadius:'100px', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)' }}>{tc.icon} {tc.label}</span>
                <p style={{ color:'white', fontSize:'30px', fontWeight:900, margin:'0 0 4px', letterSpacing:'-1px' }}>{member.name}님</p>
                <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'13px', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member.email}</p>
              </div>
            </div>

            {/* 통계 3칸 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }} className="stat-grid">
              {[
                { label:'총 주문',   value: `${orders.length}건`, icon:'📦' },
                { label:'누적 금액', value: totalAmount > 0 ? `${Math.floor(totalAmount/10000)}만원` : '0원', icon:'💰' },
                { label: member.member_type === '일반' ? '등급' : '상태', icon: member.member_type === '일반' ? '🏆' : '✅',
                  value: member.member_type === '일반'
                    ? `${curGrade.icon} ${curGrade.name}`
                    : member.status === '승인' ? '✅ 승인' : member.status === '대기중' ? '⏳ 대기' : '❌ 거절' },
              ].map((s, i) => (
                <div key={i} className="stat-card" style={{ background:'rgba(255,255,255,0.16)', borderRadius:'18px', padding:'18px 10px', textAlign:'center', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.2)' }}>
                  <p style={{ fontSize:'20px', margin:'0 0 6px' }}>{s.icon}</p>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'11px', margin:'0 0 5px', letterSpacing:'0.04em' }}>{s.label}</p>
                  <p style={{ color:'white', fontSize:'17px', fontWeight:900, margin:0 }} className="stat-value">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 탭 네비게이션 ── */}
        <div className="mp-tabs" style={{ display:'flex', gap:'8px', marginBottom:'22px', background:D.card, borderRadius:'20px', padding:'8px', border:`1px solid ${D.border}`, boxShadow:'0 4px 20px rgba(0,0,0,0.04)' }}>
          {[
            { key:'home',     icon:'🏠', label:'홈' },
            { key:'orders',   icon:'📦', label:'주문/배송' },
            { key:'coupons',  icon:'🎟️', label:'쿠폰함' },
            { key:'points',   icon:'💰', label:'포인트' },
            { key:'wishlist', icon:'❤️', label:'찜 목록' },
            { key:'benefits', icon: member.member_type === '일반' ? '⭐' : '💼', label: member.member_type === '일반' ? '등급/혜택' : '유통 혜택' },
            { key:'settings', icon:'⚙️', label:'설정' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} className="mp-tab"
              style={{ flex:1, padding:'12px 6px', borderRadius:'15px', border:'none', cursor:'pointer', fontWeight:800, transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:'5px',
                background: tab === t.key ? tc.gradient : 'transparent',
                color: tab === t.key ? 'white' : D.sub,
                boxShadow: tab === t.key ? `0 8px 20px ${tc.color}45` : 'none',
                transform: tab === t.key ? 'translateY(-1px)' : 'none' }}>
              <span style={{ fontSize:'22px', lineHeight:1 }}>{t.icon}</span>
              <span className="mp-tab-label" style={{ fontSize:'12px', whiteSpace:'nowrap' }}>{t.label}</span>
            </button>
          ))}
        </div>

        </div>{/* /mp-side */}
        <div className="mp-main">

        {/* ════════════════ TAB: HOME ════════════════ */}
        {tab === 'home' && <HomeTab D={D} accent={accent} member={member} orders={orders} pointBalance={Number(cashAccount?.point_balance || 0)} totalAmount={totalAmount} curGrade={curGrade} dark={dark} setTab={setTab} onShopClick={() => router.push('/shop')} handleLogout={handleLogout} />}

        {/* ════════════════ TAB: ORDERS ════════════════ */}
        {tab === 'orders' && <OrdersTab D={D} tc={tc} accent={accent} member={member} orders={orders} orderItems={orderItems} orderReturns={orderReturns} setOrderReturns={setOrderReturns} itemsLoading={itemsLoading} openTracking={openTracking} setOrders={setOrders} />}

        {/* ════════════════ TAB: WISHLIST ════════════════ */}
        {tab === 'wishlist' && <WishlistTab D={D} tc={tc} accent={accent} member={member} dark={dark} wishlists={wishlists} removeWishlist={removeWishlist} />}

        {/* ════════════════ TAB: COUPONS (쿠폰함) ════════════════ */}
        {tab === 'coupons' && <CouponsTab myCoupons={myCoupons} availCoupons={availCoupons} couponBusy={couponBusy} claimCoupon={claimCoupon} D={D} tc={tc} accent={accent} />}

        {/* ════════════════ TAB: POINTS ════════════════ */}
        {tab === 'points' && <PointDetailTab D={D} accent={accent} account={cashAccount} ledgers={cashLedgers} />}

        {/* ════════════════ TAB: BENEFITS ════════════════ */}
        {tab === 'benefits' && <BenefitsTab D={D} tc={tc} accent={accent} member={member} orders={orders} curGrade={curGrade} nextGrade={nextGrade} gradeProgress={gradeProgress} totalAmount={totalAmount} />}

        {/* ════════════════ TAB: SETTINGS ════════════════ */}
        {tab === 'settings' && <SettingsTab D={D} tc={tc} addresses={addresses} addressForm={addressForm} setAddressForm={setAddressForm} editingAddressId={editingAddressId} editAddress={editAddress} cancelAddressEdit={cancelAddressEdit} saveAddress={saveAddress} deleteAddress={deleteAddress} setDefaultAddress={setDefaultAddress} addrSaving={addrSaving} addrMsg={addrMsg} setAddrMsg={setAddrMsg} legacyAddress={addrInput} importLegacyAddress={importLegacyAddress} pw1={pw1} pw2={pw2} setPw1={setPw1} setPw2={setPw2} pwSaving={pwSaving} pwMsg={pwMsg} setPwMsg={setPwMsg} changePassword={changePassword} />}

      </div>

      {/* ── 배송조회 모달 ── */}
      {trackModal && (
        <div onClick={() => setTrackModal(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:D.card, width:'100%', maxWidth:'560px', maxHeight:'88vh', overflowY:'auto', borderRadius:'28px', border:`1px solid ${D.border}` }}>
            <div style={{ position:'sticky', top:0, background:tc.gradient, padding:'24px 26px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <p style={{ fontSize:'22px', fontWeight:900, color:'white', margin:0 }}>🚚 배송 조회</p>
              <button onClick={() => setTrackModal(false)} style={{ width:'42px', height:'42px', borderRadius:'14px', background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', color:'white', fontSize:'20px' }}>✕</button>
            </div>
            <div style={{ padding:'26px' }}>
              {trackLoading ? (
                <div style={{ textAlign:'center', padding:'50px 0' }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'50%', border:'4px solid '+tc.color, borderTopColor:'transparent', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
                  <p style={{ fontSize:'17px', color:D.sub, margin:0, fontWeight:600 }}>배송 정보를 불러오는 중...</p>
                </div>
              ) : !trackData?.ok ? (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <p style={{ fontSize:'56px', margin:'0 0 14px' }}>📦</p>
                  <p style={{ fontSize:'17px', color:D.text, margin:0, lineHeight:1.7, fontWeight:700 }}>{trackData?.error || '배송 정보를 찾을 수 없어요.'}</p>
                </div>
              ) : (
                <>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', flexWrap:'wrap', gap:'8px' }}>
                    <p style={{ fontSize:'20px', fontWeight:900, color:D.text, margin:0 }}>{trackData.courierName}</p>
                    <span style={{ fontSize:'15px', fontWeight:800, padding:'6px 16px', borderRadius:'100px', background: trackData.completed ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)', color: trackData.completed ? '#16a34a' : '#d97706' }}>
                      {trackData.completed ? '✅ 배송완료' : '🚚 배송중'}
                    </span>
                  </div>
                  <p style={{ fontSize:'15px', color:D.sub, margin:'0 0 24px', fontWeight:600 }}>송장번호 {trackData.invoiceNo}</p>

                  {(!trackData.steps || trackData.steps.length === 0) ? (
                    <p style={{ fontSize:'16px', color:D.sub, textAlign:'center', padding:'28px 0', fontWeight:600 }}>아직 배송 이력이 없어요.<br/>집화 후 표시됩니다.</p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      {[...trackData.steps].reverse().map((s: any, i: number) => (
                        <div key={i} style={{ display:'flex', gap:'16px' }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <div style={{ width:'18px', height:'18px', borderRadius:'50%', background: i===0 ? tc.color : D.border, flexShrink:0, marginTop:'4px', boxShadow: i===0 ? `0 0 0 5px ${tc.color}25` : 'none' }} />
                            {i < trackData.steps.length - 1 && <div style={{ width:'3px', flex:1, background:D.border, minHeight:'30px' }} />}
                          </div>
                          <div style={{ paddingBottom:'22px' }}>
                            <p style={{ fontSize:'17px', fontWeight: i===0 ? 900 : 700, color: i===0 ? D.text : D.sub, margin:'0 0 4px' }}>{s.kind || '이동중'}</p>
                            <p style={{ fontSize:'15px', color:D.sub, margin:0, lineHeight:1.5 }}>{s.where} {s.time && `· ${s.time}`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

        </div>{/* /mp-main */}
        </div>{/* /mp-layout */}

      {/* ── 하단 고정 탭바 ── */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:dark?'rgba(10,28,19,0.95)':'rgba(255,255,255,0.97)', backdropFilter:'blur(20px)', borderTop:`1px solid ${D.border}`, padding:'10px 0 16px', display:'flex', justifyContent:'space-around', zIndex:50 }}>
        {[
          { icon:'🏠', label:'홈',  href:'/shop',        active:false },
          { icon:'🔍', label:'상품', href:'/shop',        active:false },
          { icon:'👤', label:'마이', href:'/shop/mypage', active:true  },
        ].map((item, i) => (
          <Link key={i} href={item.href}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', textDecoration:'none', opacity: item.active ? 1 : 0.9 }}>
            <span style={{ fontSize:'24px', filter: dark ? 'brightness(1.25) drop-shadow(0 1px 2px rgba(0,0,0,0.4))' : 'none' }}>{item.icon}</span>
            <span style={{ fontSize:'11px', fontWeight:700, color: item.active ? accent : (dark ? '#cbd5e1' : D.sub) }}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes mpFadeUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
        @keyframes mpFloat { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-14px) rotate(4deg); } }
        @keyframes mpBlob { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(14px,-10px) scale(1.12); } }
        @keyframes mpWave { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-40px); } }

        .hero-card { animation: mpFadeUp 0.6s ease both; }
        .hero-float { animation-name: mpFloat; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .hero-blob { animation: mpBlob 7s ease-in-out infinite; }
        .hero-blob2 { animation: mpBlob 9s ease-in-out infinite reverse; }
        .hero-wave { animation: mpWave 8s ease-in-out infinite; }
        .hero-avatar { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .hero-card:hover .hero-avatar { transform: scale(1.08) rotate(-6deg); }

        /* 통계칸 hover */
        .stat-card { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.25s; }
        .stat-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.26) !important; }

        /* 탭 hover */
        .mp-tab:hover { transform: translateY(-2px); filter: brightness(1.06); }
        .mp-tab:active { transform: scale(0.96); }

        /* 카드 등장 + hover 부양 */
        .my-orders > div { animation: mpFadeUp 0.5s ease both; transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s; }
        .my-orders > div:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(0,0,0,0.1); }

        /* 버튼/카드 hover 공통 */
        .mp-track-btn { transition: transform 0.2s, filter 0.2s; }
        .mp-track-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
        .mp-track-btn:active { transform: scale(0.97); }
        .quick-card { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s; }
        .quick-card:hover { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(0,0,0,0.1); }
        button, a { -webkit-tap-highlight-color: transparent; }

        /* PC: 좌우 2단 대시보드 (왼쪽 프로필+메뉴 고정 / 오른쪽 콘텐츠 꽉) */
        @media (min-width: 900px) {
          .mp-layout { display: grid; grid-template-columns: 340px 1fr; gap: 26px; align-items: start; }
          .mp-side { position: sticky; top: 84px; }
          .mp-tabs { flex-direction: column !important; }
          .mp-tab { flex-direction: row !important; justify-content: flex-start !important; gap: 12px !important; padding: 16px 18px !important; }
          .mp-tab-label { font-size: 16px !important; }
          .my-orders { display: grid !important; grid-template-columns: 1fr 1fr; gap: 18px !important; align-items: start; }
        }
        /* 모바일/태블릿: 위아래 스택 */
        @media (max-width: 899px) {
          .mp-layout { display: block; }
        }

        @media (max-width: 640px) {
          .hero-card { padding: 28px 22px !important; }
          .hero-avatar { width: 64px !important; height: 64px !important; font-size: 30px !important; }
          /* 주문 배송 단계 - 작은 화면에서 원 크기 축소 */
          .status-circle {
            width: 24px !important;
            height: 24px !important;
            font-size: 10px !important;
          }
          .status-label {
            font-size: 8px !important;
          }
          /* 3열 통계 - 아주 작은 화면 대응 */
          .stat-grid {
            gap: 6px !important;
          }
          .stat-card {
            padding: 10px 4px !important;
          }
          .stat-value {
            font-size: 12px !important;
          }
          /* 퀵메뉴 카드 패딩 축소 */
          .quick-card {
          /* 주문 배송 단계 - 작은 화면에서 원 크기 축소 */
          .status-circle {
            width: 24px !important;
            height: 24px !important;
            font-size: 10px !important;
          }
          .status-label {
            font-size: 8px !important;
          }
          /* 3열 통계 - 아주 작은 화면 대응 */
          .stat-grid {
            gap: 6px !important;
          }
          .stat-card {
            padding: 10px 4px !important;
          }
          .stat-value {
            font-size: 12px !important;
          }
          /* 퀵메뉴 카드 패딩 축소 */
          .quick-card {
            padding: 14px 12px !important;
          }
        }

        @media (max-width: 360px) {
          /* 아주 작은 기기 - 통계 2열로 변경 */
          .stat-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

// ── 배지 컴포넌트 ──
