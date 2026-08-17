'use client'

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

export default function LandingFactFields({ dark, shipCutoff, setShipCutoff, hasHaccp, setHasHaccp, haccpNo, setHaccpNo }: Props) {
  const border = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'
  const bg = dark ? 'rgba(255,255,255,0.07)' : 'white'
  const text = dark ? '#fff' : '#111'
  const sub = dark ? 'rgba(255,255,255,0.5)' : '#666'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 당일배송 기준시간 */}
      <div>
        <label style={{ display: 'block', color: sub, fontSize: '11px', fontWeight: 800, marginBottom: '5px' }}>🚚 당일배송 기준시간 <span style={{ fontWeight: 600 }}>(선택)</span></label>
        <input value={shipCutoff} onChange={e => setShipCutoff(e.target.value)} maxLength={20}
          placeholder="예: 오후 2시 · 오전 11시 (비우면 '주문 확인 후 순차 출고')"
          style={{ width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: '12px', border: `2px solid ${border}`, background: bg, color: text, fontSize: '14px', outline: 'none' }}
          onFocus={e => { e.target.style.borderColor = '#22c55e' }} onBlur={e => { e.target.style.borderColor = border }} />
        <p style={{ color: sub, fontSize: '11px', margin: '4px 2px 0' }}>입력한 시간이 그대로 상세페이지에 들어가요. 비워두면 시간을 지어내지 않아요.</p>
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
