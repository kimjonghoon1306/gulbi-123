'use client'

import type { CSSProperties } from 'react'

// 상세페이지 '사실' 입력 — 배송 기준시간·해썹 인증. 관리자/공급업체 에디터 공용.
// 여기 입력값은 AI가 지어내지 못하게 서버에서 강제 반영된다.
type Props = {
  dark: boolean
  shipCutoff: string
  setShipCutoff: (v: string) => void
  hasHaccp: boolean
  setHasHaccp: (v: boolean) => void
  haccpNo: string
  setHaccpNo: (v: string) => void
}

// "14:00" → "오후 2시" (분이 있으면 "오후 2시 30분")
export function cutoffLabel(hhmm: string): string {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h < 12 ? '오전' : '오후'
  let hh = h % 12; if (hh === 0) hh = 12
  return `${ap} ${hh}시${m ? ` ${m}분` : ''}`
}
// 상세페이지에 실제로 들어갈 배송 안내 문구(고정)
export function shipNoticeText(hhmm: string): string {
  const l = cutoffLabel(hhmm)
  return l
    ? `${l}까지 주문한 상품은 당일배송됩니다. 택배 사정으로 순차적으로 주문 상품이 배송됩니다.`
    : '주문 확인 후 순차적으로 배송됩니다.'
}

export default function LandingFactFields({ dark, shipCutoff, setShipCutoff, hasHaccp, setHasHaccp, haccpNo, setHaccpNo }: Props) {
  const border = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'
  const bg = dark ? 'rgba(255,255,255,0.07)' : 'white'
  const text = dark ? '#fff' : '#111'
  const sub = dark ? 'rgba(255,255,255,0.5)' : '#666'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 당일배송 기준시간 — 오전/오후 + 시 버튼식 (직관적) */}
      <div>
        <label style={{ display: 'block', color: sub, fontSize: '11px', fontWeight: 800, marginBottom: '7px' }}>🚚 당일배송 기준시간 <span style={{ fontWeight: 600 }}>(선택 · 아래에서 오전/오후와 시간을 누르세요)</span></label>
        {(() => {
          const hour24 = shipCutoff && /^\d{1,2}:\d{2}$/.test(shipCutoff) ? Number(shipCutoff.split(':')[0]) : null
          const curAmpm: 'am' | 'pm' = hour24 !== null && hour24 >= 12 ? 'pm' : 'am'
          const cur12 = hour24 === null ? null : (hour24 % 12 === 0 ? 12 : hour24 % 12)
          const setTime = (ampm: 'am' | 'pm', h12: number) => {
            let h = h12 % 12
            if (ampm === 'pm') h += 12
            setShipCutoff(`${String(h).padStart(2, '0')}:00`)
          }
          const ampm = hour24 === null ? 'am' : curAmpm
          const btn = (active: boolean): CSSProperties => ({
            padding: '11px 0', borderRadius: '10px', border: `2px solid ${active ? '#22c55e' : border}`,
            background: active ? (dark ? 'rgba(34,197,94,0.18)' : '#f0fdf4') : bg,
            color: active ? (dark ? '#4ade80' : '#15803d') : text, fontSize: '15px', fontWeight: 800, cursor: 'pointer', textAlign: 'center',
          })
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 오전/오후 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="button" onClick={() => setTime('am', cur12 || 9)} style={btn(ampm === 'am' && cur12 !== null)}>🌅 오전</button>
                <button type="button" onClick={() => setTime('pm', cur12 || 2)} style={btn(ampm === 'pm')}>🌇 오후</button>
              </div>
              {/* 시(1~12) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '6px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                  <button key={h} type="button" onClick={() => setTime(ampm, h)} style={{ ...btn(cur12 === h), padding: '10px 0', fontSize: '14px' }}>{h}시</button>
                ))}
              </div>
              {shipCutoff && <button type="button" onClick={() => setShipCutoff('')} style={{ alignSelf: 'flex-start', padding: '7px 12px', borderRadius: '8px', border: `1px solid ${border}`, background: 'transparent', color: sub, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>✕ 시간 지우기</button>}
            </div>
          )
        })()}
        {/* 실제 들어갈 문구 미리보기 */}
        <div style={{ marginTop: '8px', padding: '11px 13px', borderRadius: '10px', background: dark ? 'rgba(59,130,246,0.12)' : '#eff6ff', border: `1px solid ${dark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'}` }}>
          <p style={{ color: dark ? '#93c5fd' : '#1d4ed8', fontSize: '10px', fontWeight: 800, margin: '0 0 3px', letterSpacing: '0.5px' }}>📄 상세페이지에 이렇게 들어가요</p>
          <p style={{ color: text, fontSize: '12.5px', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>“{shipNoticeText(shipCutoff)}”</p>
        </div>
      </div>

      {/* 해썹 인증 */}
      <div style={{ padding: '12px 14px', borderRadius: '12px', border: `2px solid ${hasHaccp ? '#22c55e' : border}`, background: hasHaccp ? (dark ? 'rgba(34,197,94,0.1)' : '#f0fdf4') : bg }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer' }}>
          <input type="checkbox" checked={hasHaccp} onChange={e => setHasHaccp(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#22c55e', cursor: 'pointer' }} />
          <span style={{ color: text, fontSize: '14px', fontWeight: 800 }}>🛡️ HACCP(해썹) 인증을 받은 상품이에요</span>
        </label>
        <p style={{ color: sub, fontSize: '11px', margin: '6px 0 0 27px' }}>체크할 때만 상세페이지에 해썹·위생 인증 내용이 들어가요. (인증 없으면 체크하지 마세요)</p>
        {hasHaccp && (
          <input value={haccpNo} onChange={e => setHaccpNo(e.target.value)} maxLength={40}
            placeholder="HACCP 인증번호 (있으면 입력 · 선택)"
            style={{ width: '100%', boxSizing: 'border-box', marginTop: '9px', padding: '11px 13px', borderRadius: '10px', border: `1px solid ${border}`, background: bg, color: text, fontSize: '13px', outline: 'none' }} />
        )}
      </div>
    </div>
  )
}
