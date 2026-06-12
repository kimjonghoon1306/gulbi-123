'use client'

import { useState } from 'react'

type Step = { n: string; text: string }
type Section = {
  icon: string; title: string; color: string; desc: string
  steps: Step[]; tip?: string
}

const SECTIONS: Section[] = [
  {
    icon: '🏠', title: '대시보드', color: 'linear-gradient(135deg,#34d399,#10b981)',
    desc: '내 판매 현황을 한눈에 보는 첫 화면이에요.',
    steps: [
      { n: '1', text: '왼쪽(또는 아래) 메뉴에서 "대시보드"를 누르세요.' },
      { n: '2', text: '오늘 판매·매출·정산 예정액이 큰 숫자로 보여요.' },
      { n: '3', text: '아래로 내리면 최근 주문과 안내가 나와요.' },
    ],
    tip: '매일 아침 여기부터 열어보면 오늘 할 일이 한눈에 보여요.',
  },
  {
    icon: '🧺', title: '상품 관리', color: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
    desc: '내가 파는 상품을 등록하고 사진·설명을 꾸미는 곳이에요.',
    steps: [
      { n: '1', text: '메뉴에서 "상품 관리"를 누르세요.' },
      { n: '2', text: '"상품 추가" 버튼으로 상품명·가격·재고를 입력해요.' },
      { n: '3', text: '사진을 올리면 AI가 예쁜 상세페이지를 자동으로 만들어줘요.' },
      { n: '4', text: '저장하면 관리자 승인 후 손님에게 보여요.' },
    ],
    tip: '사진은 밝고 깨끗하게 찍을수록 AI가 더 잘 만들어줘요.',
  },
  {
    icon: '📊', title: '매출 현황 · 송장 입력', color: 'linear-gradient(135deg,#60a5fa,#6366f1)',
    desc: '주문을 확인하고, 택배 보낼 때 송장번호를 입력하는 가장 중요한 곳이에요.',
    steps: [
      { n: '1', text: '메뉴에서 "매출 현황"을 누르세요.' },
      { n: '2', text: '"📋 주문 현황" 탭에서 내 상품 주문이 보여요.' },
      { n: '3', text: '주문이 안 보이면 위쪽 날짜 범위를 넓혀주세요. (끝 날짜를 오늘로!)' },
      { n: '4', text: '각 주문 줄 아래 초록색 "🚚 송장 입력"칸에서 택배사 고르고 송장번호 입력 → "저장".' },
      { n: '5', text: '저장하면 관리자와 손님에게도 자동으로 배송정보가 보여요.' },
    ],
    tip: '주문이 하나도 없으면 송장 입력칸도 안 생겨요. 주문이 들어와야 보입니다.',
  },
  {
    icon: '💰', title: '정산 내역', color: 'linear-gradient(135deg,#a78bfa,#8b5cf6)',
    desc: '내가 받을 정산 금액과 내역을 확인하는 곳이에요.',
    steps: [
      { n: '1', text: '"매출 현황" 화면에서 "🏦 정산 내역" 탭을 누르세요.' },
      { n: '2', text: '기간별 정산 예정액·완료액이 표로 보여요.' },
      { n: '3', text: '"📥 엑셀 다운로드"로 내역을 저장할 수 있어요.' },
    ],
  },
  {
    icon: '⚙️', title: '설정', color: 'linear-gradient(135deg,#94a3b8,#64748b)',
    desc: 'AI 상세페이지 생성에 쓰는 키를 등록하는 곳이에요.',
    steps: [
      { n: '1', text: '메뉴에서 "설정"을 누르세요.' },
      { n: '2', text: '안내에 따라 무료 AI 키를 발급받아 붙여넣고 저장해요.' },
      { n: '3', text: '"✅ 키 등록됨"이 보이면 끝. 키는 사라지지 않고 계속 유지돼요.' },
    ],
  },
]

export default function SupplierGuide({ t, isMobile }: { t: any; isMobile: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* 고정 버튼 */}
      <button onClick={() => setOpen(true)} aria-label="사용 방법"
        style={{
          position: 'fixed', right: '20px', bottom: isMobile ? '84px' : '24px', zIndex: 60,
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '14px 20px', borderRadius: '100px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#34d399,#10b981)', color: 'white',
          fontSize: '15px', fontWeight: 800,
          boxShadow: '0 10px 28px rgba(16,185,129,0.45)',
        }}>
        <span style={{ fontSize: '20px' }}>📖</span> 사용 방법
      </button>

      {/* 모달 */}
      {open && (
        <div onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start',
            justifyContent: 'center', padding: '20px', overflowY: 'auto',
          }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              background: t.bg, color: t.text, width: '100%', maxWidth: '720px',
              borderRadius: '28px', border: `1px solid ${t.border}`, overflow: 'hidden',
              margin: 'auto',
            }}>

            {/* 헤더 */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 1,
              background: 'linear-gradient(135deg,#34d399,#10b981)', padding: '24px 26px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '22px', fontWeight: 900, color: 'white', margin: '0 0 4px' }}>📖 공급업체 사용 방법</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: 0 }}>처음이세요? 천천히 따라 하시면 돼요 😊</p>
              </div>
              <button onClick={() => setOpen(false)}
                style={{ width: '40px', height: '40px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '20px', flexShrink: 0 }}>✕</button>
            </div>

            {/* 본문 */}
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {SECTIONS.map((s, i) => (
                <div key={i} style={{
                  background: t.card || (t.isDark ? '#161b22' : '#ffffff'),
                  border: `1px solid ${t.border}`, borderRadius: '22px', padding: '20px', overflow: 'hidden',
                }}>
                  {/* 제목 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{
                      width: '54px', height: '54px', borderRadius: '18px', flexShrink: 0,
                      background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '28px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    }}>{s.icon}</div>
                    <div>
                      <p style={{ fontSize: '18px', fontWeight: 900, color: t.text, margin: '0 0 3px' }}>{s.title}</p>
                      <p style={{ fontSize: '13px', color: t.textMuted, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>

                  {/* 단계 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {s.steps.map((st, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                          background: s.color, color: 'white', fontSize: '13px', fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
                        }}>{st.n}</div>
                        <p style={{ fontSize: '15px', color: t.text, margin: 0, lineHeight: 1.6 }}>{st.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* 팁 */}
                  {s.tip && (
                    <div style={{
                      marginTop: '14px', padding: '12px 14px', borderRadius: '14px',
                      background: t.isDark ? 'rgba(52,211,153,0.1)' : 'rgba(16,185,129,0.08)',
                      border: `1px solid ${t.isDark ? 'rgba(52,211,153,0.25)' : 'rgba(16,185,129,0.2)'}`,
                      display: 'flex', gap: '8px', alignItems: 'flex-start',
                    }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
                      <p style={{ fontSize: '13px', color: t.text, margin: 0, lineHeight: 1.6, fontWeight: 600 }}>{s.tip}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* 닫기 */}
              <button onClick={() => setOpen(false)}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#34d399,#10b981)', color: 'white',
                  fontSize: '16px', fontWeight: 800, marginTop: '4px',
                }}>
                알겠어요, 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
