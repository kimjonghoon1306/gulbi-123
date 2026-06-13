'use client'

import { openPostcode } from '@/lib/postcode'

// 마이페이지 설정(주소/비번) 탭 — page.tsx에서 분리, 동작/디자인 동일
type Props = {
  D: any
  tc: any
  addrInput: string
  setAddrInput: (v: string) => void
  addrSaving: boolean
  saveAddress: () => void
  addrMsg: string
  setAddrMsg: (v: string) => void
  pw1: string
  pw2: string
  setPw1: (v: string) => void
  setPw2: (v: string) => void
  pwSaving: boolean
  pwMsg: string
  setPwMsg: (v: string) => void
  changePassword: () => void
}

export function SettingsTab({ D, tc, addrInput, setAddrInput, addrSaving, saveAddress, addrMsg, setAddrMsg, pw1, pw2, setPw1, setPw2, pwSaving, pwMsg, setPwMsg, changePassword }: Props) {
  return (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

            {/* 기본 배송지 */}
            <div style={{ background:D.card, borderRadius:'20px', padding:'22px', border:`1px solid ${D.border}` }}>
              <p style={{ fontSize:'14px', fontWeight:800, color:D.text, margin:'0 0 4px' }}>📍 기본 배송지</p>
              <p style={{ fontSize:'12px', color:D.sub, margin:'0 0 14px' }}>주소 검색으로 도로명/지번을 찾고, 상세주소(동·호수)는 직접 적어주세요. 저장해두면 주문할 때 자동 입력돼요.</p>
              <button onClick={async () => { const r = await openPostcode(); if (r) { setAddrInput(r.address + ' '); setAddrMsg('') } }}
                style={{ width:'100%', marginBottom:'10px', padding:'12px', borderRadius:'12px', border:`2px dashed ${D.border}`, background:D.input, color:D.text, fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
                🔍 주소 검색
              </button>
              <textarea value={addrInput} onChange={e => { setAddrInput(e.target.value); setAddrMsg('') }}
                placeholder="주소 검색 후 상세주소(동·호수)를 입력해주세요"
                rows={2}
                style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', resize:'none', boxSizing:'border-box', lineHeight:1.6, fontFamily:'inherit' }} />
              {addrMsg && <p style={{ fontSize:'12px', fontWeight:700, color: addrMsg.startsWith('✅') ? '#16a34a' : '#ef4444', margin:'10px 0 0' }}>{addrMsg}</p>}
              <button onClick={saveAddress} disabled={addrSaving}
                style={{ width:'100%', marginTop:'12px', padding:'13px', borderRadius:'12px', border:'none', cursor: addrSaving ? 'not-allowed' : 'pointer', background: addrSaving ? D.input : tc.gradient, color: addrSaving ? D.sub : 'white', fontSize:'14px', fontWeight:800 }}>
                {addrSaving ? '저장 중...' : '배송지 저장'}
              </button>
            </div>

            {/* 비밀번호 변경 */}
            <div style={{ background:D.card, borderRadius:'20px', padding:'22px', border:`1px solid ${D.border}` }}>
              <p style={{ fontSize:'14px', fontWeight:800, color:D.text, margin:'0 0 4px' }}>🔑 비밀번호 변경</p>
              <p style={{ fontSize:'12px', color:D.sub, margin:'0 0 14px' }}>새 비밀번호를 두 번 입력하면 바로 변경돼요. (6자 이상)</p>
              <input type="password" value={pw1} onChange={e => { setPw1(e.target.value); setPwMsg('') }}
                placeholder="새 비밀번호"
                style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'10px' }} />
              <input type="password" value={pw2} onChange={e => { setPw2(e.target.value); setPwMsg('') }}
                placeholder="새 비밀번호 확인"
                style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
              {pwMsg && <p style={{ fontSize:'12px', fontWeight:700, color: pwMsg.startsWith('✅') ? '#16a34a' : '#ef4444', margin:'10px 0 0' }}>{pwMsg}</p>}
              <button onClick={changePassword} disabled={pwSaving}
                style={{ width:'100%', marginTop:'12px', padding:'13px', borderRadius:'12px', border:'none', cursor: pwSaving ? 'not-allowed' : 'pointer', background: pwSaving ? D.input : tc.gradient, color: pwSaving ? D.sub : 'white', fontSize:'14px', fontWeight:800 }}>
                {pwSaving ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>

          </div>
  )
}
