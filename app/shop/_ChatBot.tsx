'use client'

import { useState, useRef, useEffect, type TouchEvent } from 'react'
import Image from 'next/image'
import {
  BadgeCheck, BellRing, Coins, CreditCard, KeyRound, Landmark, Leaf,
  Megaphone, MessageCircle, PackageCheck, PackageOpen, ReceiptText,
  RotateCcw, ShieldCheck, ShoppingCart, Sprout, Star, Store, TicketPercent,
  Truck, Users, type LucideIcon,
} from 'lucide-react'

// 손님용 자가응답 챗봇 (정해진 FAQ 답만 — AI 미사용, 비용 0).
// 자주 묻는 질문 버튼을 누르면 정해진 답을 보여줘서, 관리자한테 안 물어봐도 스스로 해결.

type QA = { q: string; a: string; icon: LucideIcon }

const FAQ: QA[] = [
  {
    q: '창업 시작', icon: Sprout,
    a: '온종일팜에서 시작하려면 먼저 회원가입에서 유형을 선택하세요.\n• 일반: 직접 구매\n• 소매업/도매업: 사업자 정보 입력 후 관리자 승인\n승인되면 공급업체 대시보드에서 상품 등록, 매출 현황, 쿠폰, 설정을 한 번에 관리할 수 있어요.\n처음이라면 “사업자 회원 승인”과 “도매업체 입점·판매 방법” 항목부터 확인하시면 됩니다.',
  },
  {
    q: '회원가입·로그인', icon: KeyRound,
    a: '상품 주문, 장바구니, 쿠폰, 찜, 주문조회는 로그인 후 이용할 수 있어요.\n회원가입할 때 일반 구매자·소매업·도매업 중 유형을 선택합니다.\n사업자 회원은 관리자 승인 후 전용 가격, 주문 기능, 공급업체 메뉴를 사용할 수 있어요.',
  },
  {
    q: '주문하는 방법', icon: PackageCheck,
    a: '① 원하는 상품을 골라 [바로 구매] 또는 [장바구니 담기]\n② 장바구니에서 여러 상품을 한 번에 주문할 수도 있어요\n③ 배송지·결제수단을 입력하고 주문하면 끝!\n로그인(회원가입) 후 이용하실 수 있어요.',
  },
  {
    q: '장바구니·수량 변경', icon: ShoppingCart,
    a: '여러 상품을 한 번에 주문하려면 [장바구니 담기]를 이용하세요.\n장바구니에서 + / - 버튼으로 수량을 바꿀 수 있고, 재고보다 많은 수량은 주문할 수 없어요.\n상품별 회원 등급 가격과 쿠폰 할인은 주문 전 결제 요약에서 확인할 수 있어요.',
  },
  {
    q: '결제 방법', icon: CreditCard,
    a: '가상계좌와 카드결제를 지원해요.\n• 가상계좌: 주문하면 전용 입금계좌가 발급돼요. 그 계좌로 입금하면 주문이 처리됩니다\n• 카드결제: 바로 결제가 완료돼요\n결제 금액과 할인은 주문서에서 미리 확인할 수 있어요.',
  },
  {
    q: '입금확인·주문상태', icon: Landmark,
    a: '가상계좌 주문은 처음에 [입금대기]로 표시돼요.\n입금이 확인되면 [입금완료]로 바뀌고, 이후 [접수] → [준비중] → [출고] → [완료] 순서로 진행됩니다.\n가상계좌 입금 자동확인이 연결된 경우 입금 후 자동으로 반영되고, 자동확인이 꺼져 있으면 관리자가 직접 입금 확인을 눌러 처리합니다.',
  },
  {
    q: '현금영수증·세금계산서', icon: ReceiptText,
    a: '주문할 때 가상계좌를 고르면 증빙을 선택할 수 있어요. (세금계산서 / 현금영수증 / 발행안함)\n\n• 현금영수증: 주문서에 적은 휴대폰 번호로 국세청에 등록돼요. → 홈택스·손택스 앱에서 조회되고 연말정산에 자동 반영됩니다.\n• 세금계산서: 사업자 회원만 발행돼요. 주문서에 적은 이메일(없으면 가입 이메일)로 발송되고, 홈택스에서도 조회할 수 있어요.\n\n※ 입금이 확인된 뒤 발행돼요. 카드결제는 카드매출전표로 갈음돼 별도 발행되지 않아요.',
  },
  {
    q: '쿠폰 받기·사용법', icon: TicketPercent,
    a: '① 마이페이지 > 🎟️쿠폰함 에서 받을 수 있는 쿠폰을 [받기]\n② 결제할 때 ‘쿠폰 사용하기’에서 받은 쿠폰을 선택하면 할인돼요\n③ 어떤 쿠폰으로 얼마 할인됐는지 결제 화면에 표시돼요.',
  },
  {
    q: '캐시·쇼핑포인트', icon: Coins,
    a: '온파트너의 제품 판매 캐시는 쇼핑포인트로 전환 후 온종일팜에 사용이 가능합니다.\n\n• 캐시: 온파트너에서 상품 판매로 쌓이는 정산금이에요. 출금하거나 쇼핑포인트로 전환할 수 있어요.\n• 쇼핑포인트: 온종일팜에서 상품 구매에 사용할 수 있어요.\n• 온종일팜 자체 적립 포인트와 온파트너에서 전환한 포인트는 결제 시 합산되어 사용됩니다.\n\n내 쇼핑포인트 잔액은 마이페이지 > 포인트에서 확인하세요.',
  },
  {
    q: '온파트너 알아보기', icon: Megaphone,
    a: '온파트너는 온종일팜 상품의 나만의 추천 링크를 만들고, 그 링크를 통해 상품이 판매되면 수익을 적립받는 무료 제휴 프로그램이에요.\n\n• 틱톡·유튜브·인스타그램·블로그·카카오톡·개인 홈페이지 등 채널 제약 없이 홍보\n• 링크 클릭·구매·예상 수익을 대시보드에서 확인\n• 적립 캐시는 출금하거나 온종일팜 쇼핑포인트로 전환\n\n지금 무료로 시작하기\nhttps://partner.yuanfnb.com/pages/signup.html',
  },
  {
    q: '온종일 체험단 알아보기', icon: Star,
    a: '온종일 체험단은 좋아하는 상품과 매장을 직접 체험하고 솔직한 리뷰 콘텐츠를 만드는 리뷰어 프로그램이에요.\n\n• 맛집·카페·뷰티·숙소·배송형 상품 중 원하는 캠페인 선택\n• 선정 시 상품이나 서비스 체험 혜택 제공\n• 리뷰 활동으로 리워드와 콘텐츠 성장 기회\n\n현재 더 좋은 캠페인을 준비하고 있어요. 신청 기능은 곧 선보입니다 🎁',
  },
  {
    q: '배송 조회', icon: Truck,
    a: '마이페이지 > 주문/배송 탭에서 주문을 확인하고,\n[🚚 실시간 배송조회] 버튼을 누르면 택배 위치를 단계별로 볼 수 있어요.\n(판매자가 송장을 입력한 후부터 조회돼요.)',
  },
  {
    q: '배송비·출고 안내', icon: PackageOpen,
    a: '현재 쇼핑몰 주문 화면에서는 배송비가 무료로 표시돼요.\n신선식품 특성상 상품 준비 상태, 산지 출고 일정, 택배사 사정에 따라 출고 시간이 달라질 수 있어요.\n송장번호가 등록되면 마이페이지 주문/배송 탭에서 배송조회가 가능합니다.',
  },
  {
    q: '회원 등급 (일반/소매/도매)', icon: Users,
    a: '회원 유형에 따라 가격이 달라요.\n• 일반 구매자 · 소매 유통 · 도매 유통\n가입할 때 유형을 선택하며, 사업자(소매/도매)는 승인 후 전용 가격으로 구매할 수 있어요.\n내 등급은 마이페이지 > 등급/혜택에서 확인하세요.',
  },
  {
    q: '사업자 회원 승인', icon: BadgeCheck,
    a: '소매업·도매업 회원은 가입 후 관리자 심사를 거쳐 승인됩니다.\n승인 전에는 일부 전용 가격과 공급업체 기능 이용이 제한될 수 있어요.\n승인에는 보통 영업일 기준 1~2일 정도 걸리며, 입력한 사업자명·사업자번호·대표자명·사업장 주소가 정확해야 빠르게 확인됩니다.',
  },
  {
    q: '취소·환불·반품', icon: RotateCcw,
    a: '• 주문 취소: 마이페이지 주문에서 ‘접수’ 상태일 때 취소할 수 있어요\n• 환불: 결제수단으로 환불해 드려요\n• ⚠️ 신선식품은 단순 변심에 의한 반품이 제한될 수 있어요(전자상거래법). 상품 하자·오배송은 당연히 교환·환불됩니다.',
  },
  {
    q: '품절·재입고 알림', icon: BellRing,
    a: '품절 상품은 상품 상세페이지에서 재입고 알림을 신청할 수 있어요.\n알림 신청 후 상품 재고가 준비되면 관리자가 확인해 안내할 수 있습니다.\n인기 상품은 재입고 후에도 빠르게 품절될 수 있어요.',
  },
  {
    q: '리뷰·찜', icon: Star,
    a: '• 리뷰: 상품 구매 후 상품 상세페이지에서 별점·후기를 남길 수 있어요(사진 첨부 가능)\n• 찜: 상품의 ❤️를 누르면 마이페이지 찜 목록에 저장돼요.',
  },
  {
    q: '신선도·품질', icon: Leaf,
    a: '산지에서 직접 받은 신선한 농축수산물만 취급해요.\n아이스팩·냉장 포장으로 신선하게 배송되며, 출고 전 품질을 검수합니다.\n받으신 상품에 문제가 있으면 바로 문의해 주세요.',
  },
  {
    q: '도매업체 입점·판매 방법', icon: Store,
    a: '온종일팜에 상품을 공급·판매하고 싶은 사업자(공급업체)는 입점 신청을 할 수 있어요.\n① ‘공급업체 가입’ 페이지에서 사업자등록번호, 대표자명, 사업장 주소를 입력해 신청\n② 관리자 승인 후 로그인하면 상품을 직접 등록·판매할 수 있어요\n③ 공급업체 대시보드에서 상품 등록, 매출 현황, 쿠폰, 설정을 확인하고 관리할 수 있어요\n④ 정산은 공급사별 매출과 쿠폰 부담을 기준으로 확인하게 됩니다\n자세한 입점 조건은 고객센터로 문의 주세요.',
  },
  {
    q: '광고 문의 (상단 배너)', icon: Megaphone,
    a: '쇼핑몰 상단 광고 배너에 광고를 싣고 싶으시면 이메일로 문의해 주세요.\n📧 tarry9653@daum.net\n\n[문의 시 적어주세요]\n• 업체명 / 담당자 / 연락처\n• 광고할 상품 또는 링크\n• 희망 노출 기간 (시작~종료)\n• 광고 이미지 (가로형, 있으면 첨부)\n확인 후 비용·게재 방법을 안내드릴게요.',
  },
  {
    q: '문의하기', icon: MessageCircle,
    a: '온봇 팜이로 해결되지 않는 문의는 고객센터로 연락 주세요.\n전화: 010-7432-3888\n이메일: tarry9653@daum.net\n영업시간·사업자 정보는 화면 맨 아래에서 확인할 수 있어요.',
  },
  {
    q: '개인정보·안전거래', icon: ShieldCheck,
    a: '회원정보, 배송지, 주문내역은 주문 처리와 고객 응대에 필요한 범위에서만 사용됩니다.\n결제는 KG이니시스 결제창을 통해 진행되며, 카드 정보는 온종일팜 서버에 직접 저장되지 않아요.\n자세한 내용은 쇼핑몰 하단의 개인정보처리방침을 확인해 주세요.',
  },
]

const ICON_PALETTE = [
  { color: '#15803d', background: '#dcfce7', border: '#bbf7d0' },
  { color: '#ea580c', background: '#ffedd5', border: '#fed7aa' },
  { color: '#ca8a04', background: '#fef9c3', border: '#fef08a' },
  { color: '#0f766e', background: '#ccfbf1', border: '#99f6e4' },
]

type Msg = { from: 'bot' | 'user'; text: string }

// 답변 속 이메일을 탭하면 메일 쓰기가 열리게 (mailto 링크)
const EMAIL_SPLIT = /((?:https?:\/\/[^\s]+)|(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))/g
const isEmail = (s: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s)
const isUrl = (s: string) => /^https?:\/\//.test(s)
function renderText(text: string) {
  return text.split(EMAIL_SPLIT).map((p, i) =>
    isEmail(p)
      ? <a key={i} href={`mailto:${p}`} style={{ color: '#15803d', fontWeight: 800, textDecoration: 'underline' }}>{p}</a>
      : isUrl(p)
        ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" style={{ color: '#15803d', fontWeight: 800, textDecoration: 'underline', overflowWrap: 'anywhere' }}>온파트너 무료 신청하기 →</a>
      : <span key={i}>{p}</span>
  )
}

const HERO_IMAGE = '/onbot/pami.png'

const readTheme = () => {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem('shop-theme') === 'dark' ? 'dark' : 'light'
}

export function ChatBot() {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchMovedRef = useRef(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [msgs, open])

  useEffect(() => {
    const syncTheme = () => setDark(readTheme() === 'dark')
    syncTheme()
    window.addEventListener('shop-theme-change', syncTheme)
    window.addEventListener('storage', syncTheme)
    return () => {
      window.removeEventListener('shop-theme-change', syncTheme)
      window.removeEventListener('storage', syncTheme)
    }
  }, [])

  const ask = (item: QA) => {
    setMsgs(prev => [...prev, { from: 'user', text: item.q }, { from: 'bot', text: item.a }])
  }

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  const handleFabTouchStart = (event: TouchEvent<HTMLButtonElement>) => {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    touchMovedRef.current = false
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      if (!touchMovedRef.current) setOpen(true)
    }, 450)
  }

  const handleFabTouchMove = (event: TouchEvent<HTMLButtonElement>) => {
    const start = touchStartRef.current
    const touch = event.touches[0]
    if (!start || !touch) return
    if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 8) {
      touchMovedRef.current = true
      clearLongPressTimer()
    }
  }

  const handleFabTouchEnd = () => {
    touchStartRef.current = null
    clearLongPressTimer()
  }

  const handleFabClick = () => {
    if (touchMovedRef.current) {
      touchMovedRef.current = false
      return
    }
    setOpen(true)
  }

  const T = dark
    ? {
        pageBg: '#081710',
        panelBg: '#102a1d',
        headerBg: 'linear-gradient(135deg,#0d2a1d 0%,#123823 58%,#1f4d2e 140%)',
        heroBg: 'linear-gradient(180deg,rgba(244,114,182,0.07),rgba(255,255,255,0.02))',
        heroBorder: 'rgba(244,114,182,0.16)',
        text: '#eaf5ee',
        sub: '#86a394',
        border: 'rgba(244,114,182,0.14)',
        botBubble: '#0d2a1d',
        botBorder: 'rgba(74,222,128,0.12)',
        botText: '#eaf5ee',
        userBubble: 'linear-gradient(135deg,#16a34a,#15803d)',
        userText: '#fff',
        chipBg: 'rgba(74,222,128,0.08)',
        chipBorder: 'rgba(74,222,128,0.2)',
        chipText: '#86efac',
        fabBg: '#fff',
        fabText: '#86efac',
        fabSub: '#f472b6',
        accent: 'rgba(244,114,182,0.24)',
      }
    : {
        pageBg: '#f8fafc',
        panelBg: '#fff',
        headerBg: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 58%,#bbf7d0 140%)',
        heroBg: 'linear-gradient(180deg,#ffffff 0%,#f7fcf9 100%)',
        heroBorder: 'rgba(21,128,61,0.12)',
        text: '#1f2937',
        sub: '#6b7280',
        border: 'rgba(21,128,61,0.13)',
        botBubble: '#fff',
        botBorder: 'rgba(21,128,61,0.09)',
        botText: '#1f2937',
        userBubble: 'linear-gradient(135deg,#16a34a,#15803d)',
        userText: '#fff',
        chipBg: 'rgba(22,163,74,0.07)',
        chipBorder: 'rgba(22,163,74,0.2)',
        chipText: '#15803d',
        fabBg: '#fff',
        fabText: '#14532d',
        fabSub: '#16a34a',
        accent: 'rgba(21,128,61,0.16)',
      }

  return (
    <>
      {/* 플로팅 온봇 버튼 */}
      {!open && (
        <button
          onClick={handleFabClick}
          onTouchStart={handleFabTouchStart}
          onTouchMove={handleFabTouchMove}
          onTouchEnd={handleFabTouchEnd}
          onTouchCancel={handleFabTouchEnd}
          onContextMenu={event => event.preventDefault()}
          aria-label="온봇 팜이 열기"
          className="chatbot-fab onbot-hero-wrap"
          style={{
            position: 'fixed', right: '14px', bottom: 'calc(140px + env(safe-area-inset-bottom))',
            zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
            background: 'transparent', border: 'none', boxShadow: 'none', cursor: 'pointer', padding: 0,
            touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent',
          }}>
          {/* 캐릭터 위 안내 문구 */}
          <span className="onbot-blink" style={{
            fontSize: '10px', fontWeight: 800, color: T.fabSub, whiteSpace: 'nowrap',
            background: T.panelBg, padding: '3px 8px', borderRadius: '11px',
            boxShadow: '0 3px 10px rgba(20,83,45,0.18)', marginBottom: '3px',
          }}>궁금하신 거 클릭하세요</span>
          {/* 캐릭터 — 틀 없이 이미지만 (적당한 크기) */}
          <Image src={HERO_IMAGE} alt="온종일팜 온봇 팜이" width={84} height={84} draggable={false} style={{
            width: '84px', height: '84px', objectFit: 'contain',
            pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          } as any} />
          {/* 캐릭터 밑 — 팜이 (다크모드에서도 또렷하게) */}
          <span style={{
            fontSize: '15px', fontWeight: 900, color: T.fabText, marginTop: '-3px',
            textShadow: dark ? '0 1px 4px rgba(0,0,0,0.6)' : '0 1px 2px rgba(255,255,255,0.8)',
          }}>팜이</span>
        </button>
      )}

      {/* 온봇 패널 */}
      {open && (
        <div className="chatbot-panel" style={{
          position: 'fixed', right: '18px', bottom: 'calc(90px + env(safe-area-inset-bottom))',
          width: 'min(384px, calc(100vw - 24px))', height: 'min(560px, 72vh)',
          zIndex: 9999, background: T.panelBg, borderRadius: '20px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.42)' : '0 24px 60px rgba(20,83,45,0.28)', border: `1px solid ${T.border}`,
        }}>
          {/* 닫기 버튼 (틀 없이 떠있게) */}
          <button onClick={() => setOpen(false)} aria-label="닫기"
            style={{
              position: 'absolute', top: '12px', right: '12px', zIndex: 3,
              background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(20,83,45,0.07)', border: 'none',
              color: T.sub, width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '15px',
            }}>✕</button>

          {/* 캐릭터 + 메시지 (스크롤 영역) */}
          <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 16px', background: T.pageBg, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
            {/* 캐릭터 히어로 — 박스 없이 캐릭터만 크게 */}
            <div className="onbot-hero-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flexShrink: 0 }}>
              <p className="onbot-blink" style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 800, color: T.sub }}>궁금하신 거 클릭하세요 👇</p>
              <Image className="onbot-hero" src={HERO_IMAGE} alt="온종일팜 온봇 팜이" width={124} height={124} style={{ width: '124px', height: '124px', objectFit: 'contain' }} />
              <p style={{ margin: '-6px 0 4px', fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px', color: dark ? '#86efac' : '#15803d' }}>팜이 <span style={{ fontSize: '13px', fontWeight: 800, color: T.sub }}>온봇</span></p>
            </div>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', whiteSpace: 'pre-line', lineHeight: 1.55,
                  fontSize: '13px', padding: '11px 14px', borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.from === 'user' ? T.userBubble : T.botBubble,
                  color: m.from === 'user' ? T.userText : T.botText,
                  border: m.from === 'user' ? 'none' : `1px solid ${T.botBorder}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}>{m.from === 'bot' ? renderText(m.text) : m.text}</div>
              </div>
            ))}
          </div>

          {/* 질문 버튼 */}
          <div style={{ borderTop: `1px solid ${T.border}`, background: T.panelBg, padding: '10px 12px', maxHeight: '168px', overflowY: 'auto' }}>
            <p style={{ margin: '0 0 8px 2px', fontSize: '11px', fontWeight: 800, color: T.sub }}>궁금한 항목을 선택하세요</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {FAQ.map((item, i) => {
                const Icon = item.icon
                const iconTone = ICON_PALETTE[i % ICON_PALETTE.length]
                return (
                  <button key={item.q} onClick={() => ask(item)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      fontSize: '12px', fontWeight: 700, color: T.chipText,
                      background: T.chipBg, border: `1px solid ${T.chipBorder}`,
                      borderRadius: '100px', padding: '5px 10px 5px 6px', cursor: 'pointer',
                    }}>
                    <span aria-hidden="true" style={{
                      width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      color: iconTone.color, background: iconTone.background,
                      border: `1px solid ${iconTone.border}`,
                    }}>
                      <Icon size={14} strokeWidth={2.4} />
                    </span>
                    <span>{item.q}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .chatbot-fab { transition: transform 0.2s, box-shadow 0.2s; }
        @media (hover: hover) and (pointer: fine) {
          .chatbot-fab:hover { transform: translateY(-2px); box-shadow: 0 18px 38px rgba(20,83,45,0.26) !important; }
        }
        .chatbot-fab:active { box-shadow: none !important; }
        /*
         * Safari는 fixed 요소 안의 drop-shadow SVG와 opacity 애니메이션을
         * 함께 합성할 때 긴 상품 상세 레이어 전체를 반복 repaint할 수 있다.
         * 안내 문구는 그대로 노출하되 영구 opacity 애니메이션은 사용하지 않는다.
         */
        .onbot-blink { opacity: 1; }
        @media (min-width: 640px) {
          .chatbot-fab { bottom: calc(140px + env(safe-area-inset-bottom)) !important; }
          .chatbot-panel { bottom: 24px !important; }
        }
      `}</style>
    </>
  )
}
