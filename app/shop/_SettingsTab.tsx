'use client'

import { openPostcode } from '@/lib/postcode'

type Address = {
  id: string
  label: string
  recipient?: string | null
  phone?: string | null
  postcode?: string | null
  address1: string
  address2?: string | null
  is_default?: boolean
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

type Props = {
  D: any
  tc: any
  addresses: Address[]
  addressForm: AddressForm
  setAddressForm: (v: AddressForm | ((prev: AddressForm) => AddressForm)) => void
  editingAddressId: string | null
  editAddress: (a: Address) => void
  cancelAddressEdit: () => void
  saveAddress: () => void
  deleteAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
  addrSaving: boolean
  addrMsg: string
  setAddrMsg: (v: string) => void
  legacyAddress: string
  importLegacyAddress: () => void
  pw1: string
  pw2: string
  setPw1: (v: string) => void
  setPw2: (v: string) => void
  pwSaving: boolean
  pwMsg: string
  setPwMsg: (v: string) => void
  changePassword: () => void
}

const fullAddress = (a: Address) => [a.address1, a.address2].filter(Boolean).join(' ').trim()

export function SettingsTab({
  D, tc, addresses, addressForm, setAddressForm, editingAddressId, editAddress, cancelAddressEdit,
  saveAddress, deleteAddress, setDefaultAddress, addrSaving, addrMsg, setAddrMsg, legacyAddress,
  importLegacyAddress, pw1, pw2, setPw1, setPw2, pwSaving, pwMsg, setPwMsg, changePassword,
}: Props) {
  return (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

            <div style={{ background:D.card, borderRadius:'20px', padding:'22px', border:`1px solid ${D.border}` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', marginBottom:'14px' }}>
                <div>
                  <p style={{ fontSize:'16px', fontWeight:900, color:D.text, margin:'0 0 4px' }}>📍 배송지 주소록</p>
                  <p style={{ fontSize:'12px', color:D.sub, margin:0 }}>집, 부모님댁, 회사처럼 자주 쓰는 배송지를 저장해두세요.</p>
                </div>
                <span style={{ fontSize:'12px', fontWeight:900, color:tc.color, background:'rgba(22,163,74,0.1)', padding:'6px 11px', borderRadius:'999px', flexShrink:0 }}>{addresses.length}개</span>
              </div>

              {addresses.length === 0 && legacyAddress && (
                <div style={{ border:`2px solid ${tc.color}`, background:'rgba(22,163,74,0.06)', borderRadius:'16px', padding:'15px', marginBottom:'14px' }}>
                  <p style={{ fontSize:'13px', fontWeight:900, color:D.text, margin:'0 0 5px' }}>기존 기본 배송지</p>
                  <p style={{ fontSize:'13px', color:D.sub, lineHeight:1.6, margin:'0 0 12px' }}>{legacyAddress}</p>
                  <button onClick={importLegacyAddress}
                    style={{ width:'100%', padding:'12px', borderRadius:'12px', border:'none', background:tc.gradient, color:'white', fontSize:'14px', fontWeight:900, cursor:'pointer' }}>
                    주소록에 기본배송지로 저장
                  </button>
                </div>
              )}

              {addresses.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'18px' }}>
                  {addresses.map(a => (
                    <div key={a.id} style={{ border:`3px solid ${a.is_default ? tc.color : D.border}`, background:a.is_default?'rgba(22,163,74,0.06)':D.input, borderRadius:'16px', padding:'15px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'10px' }}>
                        <div style={{ minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'7px', flexWrap:'wrap', marginBottom:'5px' }}>
                            <p style={{ fontSize:'16px', fontWeight:900, color:D.text, margin:0 }}>{a.label || '배송지'}</p>
                            {a.is_default && <span style={{ fontSize:'11px', fontWeight:900, color:tc.color, background:'rgba(22,163,74,0.12)', padding:'3px 8px', borderRadius:'999px' }}>기본배송지</span>}
                          </div>
                          <p style={{ fontSize:'13px', fontWeight:800, color:D.text, margin:'0 0 4px' }}>{a.recipient || '받는사람 미입력'} {a.phone ? `· ${a.phone}` : ''}</p>
                          <p style={{ fontSize:'13px', color:D.sub, lineHeight:1.55, margin:0 }}>{a.postcode ? `(${a.postcode}) ` : ''}{fullAddress(a)}</p>
                        </div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:a.is_default?'1fr 1fr':'1fr 1fr 1fr', gap:'8px', marginTop:'12px' }}>
                        {!a.is_default && (
                          <button onClick={() => setDefaultAddress(a.id)}
                            style={{ padding:'11px 8px', borderRadius:'12px', border:`1.5px solid ${tc.color}`, background:'transparent', color:tc.color, fontSize:'13px', fontWeight:900, cursor:'pointer' }}>
                            기본 지정
                          </button>
                        )}
                        <button onClick={() => editAddress(a)}
                          style={{ padding:'11px 8px', borderRadius:'12px', border:`1.5px solid ${D.border}`, background:D.card, color:D.text, fontSize:'13px', fontWeight:800, cursor:'pointer' }}>
                          수정
                        </button>
                        <button onClick={() => deleteAddress(a.id)}
                          style={{ padding:'11px 8px', borderRadius:'12px', border:'none', background:'rgba(239,68,68,0.1)', color:'#ef4444', fontSize:'13px', fontWeight:800, cursor:'pointer' }}>
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop:`1px solid ${D.border}`, paddingTop:'16px' }}>
                <p style={{ fontSize:'14px', fontWeight:900, color:D.text, margin:'0 0 12px' }}>{editingAddressId ? '배송지 수정' : '배송지 추가'}</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                  <input value={addressForm.label} onChange={e => { setAddressForm(p => ({ ...p, label: e.target.value })); setAddrMsg('') }}
                    placeholder="별칭 예: 집, 부모님댁"
                    style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
                  <input value={addressForm.recipient} onChange={e => { setAddressForm(p => ({ ...p, recipient: e.target.value })); setAddrMsg('') }}
                    placeholder="받는사람"
                    style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
                </div>
                <input value={addressForm.phone} onChange={e => { setAddressForm(p => ({ ...p, phone: e.target.value })); setAddrMsg('') }}
                  placeholder="연락처"
                  style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'10px' }} />
                <button onClick={async () => {
                  const r = await openPostcode()
                  if (r) { setAddressForm(p => ({ ...p, postcode: r.zonecode, address1: r.address })); setAddrMsg('') }
                }}
                  style={{ width:'100%', marginBottom:'10px', padding:'13px', borderRadius:'12px', border:`2px dashed ${D.border}`, background:D.input, color:D.text, fontSize:'14px', fontWeight:800, cursor:'pointer' }}>
                  🔍 주소 검색
                </button>
                <input value={addressForm.address1} onChange={e => { setAddressForm(p => ({ ...p, address1: e.target.value })); setAddrMsg('') }}
                  placeholder="주소 검색으로 도로명/지번 주소를 입력해주세요"
                  style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'10px' }} />
                <input value={addressForm.address2} onChange={e => { setAddressForm(p => ({ ...p, address2: e.target.value })); setAddrMsg('') }}
                  placeholder="상세주소 예: 101동 1203호"
                  style={{ width:'100%', padding:'13px 14px', borderRadius:'12px', border:`2px solid ${D.border}`, background:D.input, color:D.text, fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
                <label style={{ display:'flex', alignItems:'center', gap:'9px', marginTop:'12px', cursor:'pointer' }}>
                  <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm(p => ({ ...p, is_default: e.target.checked }))}
                    style={{ width:'20px', height:'20px', accentColor:tc.color }} />
                  <span style={{ fontSize:'13px', fontWeight:800, color:D.text }}>기본 배송지로 사용</span>
                </label>
                {addrMsg && <p style={{ fontSize:'12px', fontWeight:800, color: addrMsg.startsWith('✅') ? '#16a34a' : '#ef4444', margin:'10px 0 0' }}>{addrMsg}</p>}
                <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
                  {editingAddressId && (
                    <button onClick={cancelAddressEdit}
                      style={{ flex:1, padding:'13px', borderRadius:'12px', border:`1.5px solid ${D.border}`, cursor:'pointer', background:'transparent', color:D.sub, fontSize:'14px', fontWeight:800 }}>
                      취소
                    </button>
                  )}
                  <button onClick={saveAddress} disabled={addrSaving}
                    style={{ flex:2, padding:'13px', borderRadius:'12px', border:'none', cursor: addrSaving ? 'not-allowed' : 'pointer', background: addrSaving ? D.input : tc.gradient, color: addrSaving ? D.sub : 'white', fontSize:'14px', fontWeight:900 }}>
                    {addrSaving ? '저장 중...' : editingAddressId ? '수정 완료' : '배송지 저장'}
                  </button>
                </div>
              </div>
            </div>

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
