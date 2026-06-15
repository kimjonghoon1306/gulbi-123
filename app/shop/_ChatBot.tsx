'use client'

import { useState, useRef, useEffect } from 'react'

// 손님용 자가응답 챗봇 (정해진 FAQ 답만 — AI 미사용, 비용 0).
// 자주 묻는 질문 버튼을 누르면 정해진 답을 보여줘서, 관리자한테 안 물어봐도 스스로 해결.

type QA = { q: string; a: string }

const FAQ: QA[] = [
  {
    q: '📦 주문하는 방법',
    a: '① 원하는 상품을 골라 [바로 구매] 또는 [장바구니 담기]\n② 장바구니에서 여러 상품을 한 번에 주문할 수도 있어요\n③ 배송지·결제수단을 입력하고 주문하면 끝!\n로그인(회원가입) 후 이용하실 수 있어요.',
  },
  {
    q: '💳 결제 방법',
    a: '가상계좌와 카드결제를 지원해요.\n• 가상계좌: 주문하면 전용 입금계좌가 발급돼요. 그 계좌로 입금하면 주문이 처리됩니다\n• 카드결제: 바로 결제가 완료돼요\n결제 금액과 할인은 주문서에서 미리 확인할 수 있어요.',
  },
  {
    q: '🧾 현금영수증·세금계산서',
    a: '주문할 때 가상계좌를 고르면 증빙을 선택할 수 있어요. (세금계산서 / 현금영수증 / 발행안함)\n\n• 현금영수증: 주문서에 적은 휴대폰 번호로 국세청에 등록돼요. → 홈택스·손택스 앱에서 조회되고 연말정산에 자동 반영됩니다.\n• 세금계산서: 사업자 회원만 발행돼요. 주문서에 적은 이메일(없으면 가입 이메일)로 발송되고, 홈택스에서도 조회할 수 있어요.\n\n※ 입금이 확인된 뒤 발행돼요. 카드결제는 카드매출전표로 갈음돼 별도 발행되지 않아요.',
  },
  {
    q: '🎟️ 쿠폰 받기·사용법',
    a: '① 마이페이지 > 🎟️쿠폰함 에서 받을 수 있는 쿠폰을 [받기]\n② 결제할 때 ‘쿠폰 사용하기’에서 받은 쿠폰을 선택하면 할인돼요\n③ 어떤 쿠폰으로 얼마 할인됐는지 결제 화면에 표시돼요.',
  },
  {
    q: '🚚 배송 조회',
    a: '마이페이지 > 주문/배송 탭에서 주문을 확인하고,\n[🚚 실시간 배송조회] 버튼을 누르면 택배 위치를 단계별로 볼 수 있어요.\n(판매자가 송장을 입력한 후부터 조회돼요.)',
  },
  {
    q: '👤 회원 등급 (일반/소매/도매)',
    a: '회원 유형에 따라 가격이 달라요.\n• 일반 구매자 · 소매 유통 · 도매 유통\n가입할 때 유형을 선택하며, 사업자(소매/도매)는 승인 후 전용 가격으로 구매할 수 있어요.\n내 등급은 마이페이지 > 등급/혜택에서 확인하세요.',
  },
  {
    q: '↩️ 취소·환불·반품',
    a: '• 주문 취소: 마이페이지 주문에서 ‘접수’ 상태일 때 취소할 수 있어요\n• 환불: 결제수단으로 환불해 드려요\n• ⚠️ 신선식품은 단순 변심에 의한 반품이 제한될 수 있어요(전자상거래법). 상품 하자·오배송은 당연히 교환·환불됩니다.',
  },
  {
    q: '⭐ 리뷰·찜',
    a: '• 리뷰: 상품 구매 후 상품 상세페이지에서 별점·후기를 남길 수 있어요(사진 첨부 가능)\n• 찜: 상품의 ❤️를 누르면 마이페이지 찜 목록에 저장돼요.',
  },
  {
    q: '🥬 신선도·품질',
    a: '산지에서 직접 받은 신선한 농축수산물만 취급해요.\n아이스팩·냉장 포장으로 신선하게 배송되며, 출고 전 품질을 검수합니다.\n받으신 상품에 문제가 있으면 바로 문의해 주세요.',
  },
  {
    q: '🏭 도매업체 입점·판매 방법',
    a: '온종일팜에 상품을 공급·판매하고 싶은 사업자(공급업체)는 입점 신청을 할 수 있어요.\n① ‘공급업체 가입’ 페이지에서 사업자등록번호 등 정보를 입력해 신청\n② 관리자 승인 후(영업일 1~2일) 로그인하면 상품을 직접 등록·판매할 수 있어요\n③ 매출·정산·송장 입력도 공급업체 페이지에서 관리해요\n자세한 입점 조건은 고객센터로 문의 주세요.',
  },
  {
    q: '📢 광고 문의 (상단 배너)',
    a: '쇼핑몰 상단 광고 배너에 광고를 싣고 싶으시면 이메일로 문의해 주세요.\n📧 tarry9653@daum.net\n\n[문의 시 적어주세요]\n• 업체명 / 담당자 / 연락처\n• 광고할 상품 또는 링크\n• 희망 노출 기간 (시작~종료)\n• 광고 이미지 (가로형, 있으면 첨부)\n확인 후 비용·게재 방법을 안내드릴게요.',
  },
  {
    q: '📞 문의하기',
    a: '챗봇으로 해결되지 않는 문의는 고객센터로 연락 주세요.\n영업시간·연락처는 화면 맨 아래 사업자 정보에서 확인하실 수 있어요.\n빠르게 도와드리겠습니다!',
  },
]

type Msg = { from: 'bot' | 'user'; text: string }

// 답변 속 이메일을 탭하면 메일 쓰기가 열리게 (mailto 링크)
const EMAIL_SPLIT = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
const isEmail = (s: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s)
function renderText(text: string) {
  return text.split(EMAIL_SPLIT).map((p, i) =>
    isEmail(p)
      ? <a key={i} href={`mailto:${p}`} style={{ color: '#15803d', fontWeight: 800, textDecoration: 'underline' }}>{p}</a>
      : <span key={i}>{p}</span>
  )
}

export function ChatBot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: '안녕하세요! 온종일팜 챗봇이에요 🤖\n궁금한 걸 아래에서 골라주세요.' },
  ])
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [msgs, open])

  const ask = (item: QA) => {
    setMsgs(prev => [...prev, { from: 'user', text: item.q }, { from: 'bot', text: item.a }])
  }

  return (
    <>
      {/* 플로팅 로봇 버튼 */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="챗봇 열기" className="chatbot-fab"
          style={{
            position: 'fixed', right: '18px', bottom: 'calc(90px + env(safe-area-inset-bottom))',
            zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>
          <span style={{
            width: '58px', height: '58px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#16a34a,#15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', boxShadow: '0 8px 24px rgba(22,163,74,0.45)',
          }}>🤖</span>
          <span style={{
            fontSize: '11px', fontWeight: 800, color: '#15803d',
            background: '#fff', padding: '2px 9px', borderRadius: '100px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>챗봇</span>
        </button>
      )}

      {/* 챗봇 패널 */}
      {open && (
        <div className="chatbot-panel" style={{
          position: 'fixed', right: '18px', bottom: 'calc(90px + env(safe-area-inset-bottom))',
          width: 'min(360px, calc(100vw - 36px))', height: 'min(560px, 70vh)',
          zIndex: 9999, background: '#fff', borderRadius: '22px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28)', border: '1px solid rgba(0,0,0,0.06)',
        }}>
          {/* 헤더 */}
          <div style={{
            background: 'linear-gradient(135deg,#14532d,#15803d)', color: '#fff',
            padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '26px' }}>🤖</span>
              <div>
                <p style={{ margin: 0, fontWeight: 900, fontSize: '15px' }}>온종일팜 챗봇</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', opacity: 0.85 }}>자주 묻는 질문을 빠르게 안내해요</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="닫기"
              style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>

          {/* 메시지 */}
          <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f6faf8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', whiteSpace: 'pre-line', lineHeight: 1.55,
                  fontSize: '13px', padding: '11px 14px', borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.from === 'user' ? 'linear-gradient(135deg,#16a34a,#15803d)' : '#fff',
                  color: m.from === 'user' ? '#fff' : '#1f2937',
                  border: m.from === 'user' ? 'none' : '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}>{m.from === 'bot' ? renderText(m.text) : m.text}</div>
              </div>
            ))}
          </div>

          {/* 질문 버튼 */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: '#fff', padding: '10px 12px', maxHeight: '168px', overflowY: 'auto' }}>
            <p style={{ margin: '0 0 8px 2px', fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>질문을 눌러보세요 👇</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {FAQ.map((item, i) => (
                <button key={i} onClick={() => ask(item)}
                  style={{
                    fontSize: '12px', fontWeight: 700, color: '#15803d',
                    background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
                    borderRadius: '100px', padding: '7px 12px', cursor: 'pointer',
                  }}>{item.q}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .chatbot-fab:hover span:first-child { transform: translateY(-2px) scale(1.05); transition: transform 0.2s; }
        @media (min-width: 640px) {
          .chatbot-fab { bottom: 24px !important; }
          .chatbot-panel { bottom: 24px !important; }
        }
      `}</style>
    </>
  )
}
