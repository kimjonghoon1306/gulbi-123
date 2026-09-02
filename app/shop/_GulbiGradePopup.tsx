'use client'

// 온종일팜 굴비 원물등급 안내 팝업.
//  - 로그인 후 쇼핑몰 진입 시 자동 노출(세션당 1회)
//  - 굴비/참조기 상품 상세 진입 시 한 번 더 노출(세션당 1회)
//  - "일주일 동안 보지 않기" 체크 시 7일간 완전 차단(localStorage)
// 이미지의 등급표를 모바일에서도 잘 보이게 카드로 재구성(고연령 접근성: 큰 글씨).

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const HIDE_KEY = 'onjongil_gulbi_grade_hide_until'

// 일주일 보지않기가 걸려 있으면 true (아무데서도 뜨지 않음)
export function gulbiPopupSuppressed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const v = localStorage.getItem(HIDE_KEY)
    return !!v && Number(v) > Date.now()
  } catch { return false }
}

// 상품명/카테고리명으로 굴비(참조기) 상품인지 판별
export function isGulbiProduct(name?: string | null, categoryName?: string | null): boolean {
  const s = `${name || ''} ${categoryName || ''}`
  return /굴비|참조기|법성포|영광굴비/.test(s)
}

type Theme = { main: string; badge: string; period: string; chip: string; check: string }
const GRADES: {
  no: string; hanja: string; ko: string; period: string; when: string
  desc: string[]; attrs: string[]; checks: string[]; img: string; theme: Theme
}[] = [
  {
    no: '1', hanja: '冬春 特選', ko: '동춘특선', period: '수매시기', when: '겨울 / 2월~4월',
    desc: ['추운 겨울과 봄철에 수매한 참조기', '먹이활동이 적은 시기의 원물'],
    attrs: ['선도 우수', '육질 탄력', '복부 단단', '색택 우수'],
    checks: ['멸치 섭취 영향이 상대적으로 적은 시기', '살이 단단하고 탄력이 우수', '굴비 특유의 고소한 맛과 향이 뛰어남'],
    img: '/gulbi-grade/fish1.webp',
    theme: { main: '#14532d', badge: '#1f3d24', period: '#2f5233', chip: '#12331d', check: '#1f7a3a' },
  },
  {
    no: '2', hanja: '秋選', ko: '가을특선', period: '수매시기', when: '10월',
    desc: ['가을철에 수매한 참조기', '선도와 육질이 우수한 상급 원물'],
    attrs: ['선도 양호', '육질 양호', '복부 양호', '색택 양호'],
    checks: ['가을철 적정 먹이활동 후 어획', '맛과 육질의 밸런스가 좋은 원물', '선도 관리 시 우수한 품질 유지'],
    img: '/gulbi-grade/fish2.webp',
    theme: { main: '#6b4423', badge: '#5c3a1e', period: '#7a5230', chip: '#4a2f18', check: '#a9722f' },
  },
  {
    no: '3', hanja: '夏秋選', ko: '하추선', period: '수매시기', when: '8월~9월',
    desc: ['여름~초가을에 수매한 참조기', '먹이활동이 활발한 시기의 원물'],
    attrs: ['선도 보통', '육질 보통', '복부 보통', '색택 보통'],
    checks: ['수온이 높은 시기 어획 원물', '합리적인 가격의 실속형 원물', '가공·보관 관리로 품질 유지 가능'],
    img: '/gulbi-grade/fish3.webp',
    theme: { main: '#1e3a5f', badge: '#1c3350', period: '#2a4a72', chip: '#152a45', check: '#3b6ea5' },
  },
]

export function GulbiGradePopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [dontShow, setDontShow] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  function handleClose() {
    if (dontShow) {
      try {
        const until = Date.now() + 7 * 24 * 60 * 60 * 1000
        localStorage.setItem(HIDE_KEY, String(until))
      } catch {}
    }
    onClose()
  }

  if (!mounted || !open) return null

  return createPortal(
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483647,
        background: 'rgba(8,15,10,0.72)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '860px', margin: 'auto',
          background: '#faf7f0', borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0,0,0,0.5)', border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* 헤더 */}
        <div style={{ position: 'relative', background: 'linear-gradient(135deg,#0b2818,#123a22)', padding: '22px 20px 20px', textAlign: 'center' }}>
          <button
            onClick={handleClose}
            aria-label="닫기"
            style={{
              position: 'absolute', top: '12px', right: '12px', width: '38px', height: '38px',
              borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '20px', lineHeight: '38px',
            }}
          >✕</button>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', color: '#e9c96a', marginBottom: '6px' }}>ONJONGIL FARM · 원물등급 안내</div>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px,6vw,32px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            온종일팜 굴비 <span style={{ color: '#f0d27a' }}>원물등급 1·2·3</span>
          </h2>
          <p style={{ margin: '10px 0 0', fontSize: 'clamp(13px,3.4vw,16px)', color: '#d8e8dd', fontWeight: 600, lineHeight: 1.5 }}>
            크기를 보기 전에, <b style={{ color: '#f0d27a' }}>계절</b>을 봅니다.<br />같은 참조기라고, 같은 굴비가 아닙니다.
          </p>
        </div>

        {/* 신선 메시지 배너 */}
        <div style={{ background: '#eaf4ec', borderBottom: '1px solid #d6e6da', padding: '12px 18px', textAlign: 'center' }}>
          <span style={{ fontSize: 'clamp(14px,3.6vw,16px)', fontWeight: 800, color: '#14532d' }}>
            🐟 온종일팜은 <u>아주 신선하게</u> 제품을 취급합니다
          </span>
        </div>

        {/* 등급 카드 3개 */}
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '14px' }}>
          {GRADES.map((g) => (
            <div key={g.no} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${g.theme.main}22`, boxShadow: '0 4px 14px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
              {/* 등급 배지 */}
              <div style={{ textAlign: 'center', padding: '14px 12px 8px' }}>
                <span style={{ display: 'inline-block', background: g.theme.badge, color: '#fff', fontWeight: 900, fontSize: '17px', padding: '7px 22px', borderRadius: '999px' }}>{g.no}등급</span>
              </div>
              {/* 한자 + 한글 */}
              <div style={{ textAlign: 'center', padding: '0 12px 4px' }}>
                <div style={{ fontSize: 'clamp(22px,5vw,26px)', fontWeight: 900, color: g.theme.main, letterSpacing: '2px' }}>{g.hanja}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: g.theme.main, opacity: 0.75, marginTop: '2px' }}>{g.ko}</div>
              </div>
              {/* 수매시기 */}
              <div style={{ margin: '8px 14px', background: g.theme.period, color: '#fff', borderRadius: '10px', padding: '8px 10px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>
                {g.period} <span style={{ opacity: 0.6 }}>|</span> {g.when}
              </div>
              {/* 설명 */}
              <div style={{ textAlign: 'center', padding: '2px 14px 10px', fontSize: '14px', color: '#333', lineHeight: 1.55, fontWeight: 600 }}>
                {g.desc.map((d, i) => <div key={i}>{d}</div>)}
              </div>
              {/* 사진 */}
              <div style={{ padding: '0 14px' }}>
                <img src={g.img} alt={`${g.no}등급 굴비`} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '10px' }} />
              </div>
              {/* 4속성 */}
              <div style={{ margin: '12px 14px 0', background: g.theme.chip, borderRadius: '12px', padding: '10px 6px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px' }}>
                {g.attrs.map((a) => {
                  const [k, v] = a.split(' ')
                  return (
                    <div key={a} style={{ textAlign: 'center', color: '#f0d27a', fontSize: '12px', fontWeight: 700, lineHeight: 1.35 }}>
                      <div style={{ color: '#fff', opacity: 0.85 }}>{k}</div>
                      <div>{v}</div>
                    </div>
                  )
                })}
              </div>
              {/* 체크리스트 */}
              <div style={{ padding: '12px 16px 16px', flex: 1 }}>
                {g.checks.map((c) => (
                  <div key={c} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13.5px', color: '#2b2b2b', fontWeight: 600, lineHeight: 1.5, marginTop: '7px' }}>
                    <span style={{ color: g.theme.check, fontWeight: 900, flexShrink: 0 }}>✓</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div style={{ padding: '4px 20px 16px', textAlign: 'center', fontSize: '12.5px', color: '#7a7267', fontWeight: 600, lineHeight: 1.5 }}>
          ※ 원물등급은 수매시기와 원물 상태를 종합 평가하여 판정하며, 크기등급과는 별도로 적용됩니다.
        </div>

        {/* 컨트롤: 일주일 보지않기 + 닫기 */}
        <div style={{ borderTop: '1px solid #e6ddcf', background: '#f4efe4', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#4a4a4a', userSelect: 'none' }}>
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#14532d' }} />
            일주일 동안 보지 않기
          </label>
          <button
            onClick={handleClose}
            style={{
              flex: '1 1 auto', minWidth: '120px', maxWidth: '220px', marginLeft: 'auto',
              background: 'linear-gradient(135deg,#14532d,#1f7a3a)', color: '#fff', border: 'none',
              borderRadius: '12px', padding: '14px 20px', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(20,83,45,0.35)',
            }}
          >닫기</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
