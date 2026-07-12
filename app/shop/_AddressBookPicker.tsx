'use client'

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

type Props = {
  addresses: Address[]
  selectedAddress: string
  onSelect: (address: string, selected: Address) => void
  D: any
  dark: boolean
  accent?: string
}

export const addressToText = (a: Address) => [a.address1, a.address2].filter(Boolean).join(' ').trim()

export function AddressBookPicker({ addresses, selectedAddress, onSelect, D, dark, accent }: Props) {
  if (!addresses || addresses.length === 0) return null
  const green = accent || (dark ? '#4ade80' : '#15803d')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'12px' }}>
      <p style={{ fontSize:'13px', fontWeight:900, color:D.text, margin:0 }}>저장된 배송지</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'8px' }}>
        {addresses.map((addr) => {
          const full = addressToText(addr)
          const selected = full === selectedAddress
          return (
            <button
              key={addr.id}
              type="button"
              onClick={() => onSelect(full, addr)}
              style={{
                width:'100%',
                textAlign:'left',
                padding:'14px 15px',
                borderRadius:'14px',
                border:`3px solid ${selected ? green : D.border}`,
                background:selected ? (dark ? 'rgba(74,222,128,0.14)' : 'rgba(22,163,74,0.08)') : D.input,
                color:D.text,
                cursor:'pointer',
                display:'flex',
                gap:'12px',
                alignItems:'flex-start',
                transition:'transform 0.18s, border-color 0.18s, background 0.18s',
              }}
            >
              <span style={{
                width:'26px',
                height:'26px',
                borderRadius:'50%',
                background:selected ? green : 'transparent',
                border:`2px solid ${selected ? green : D.border}`,
                color:selected ? (dark ? '#052e16' : 'white') : D.sub,
                display:'inline-flex',
                alignItems:'center',
                justifyContent:'center',
                fontSize:'16px',
                fontWeight:900,
                flexShrink:0,
                marginTop:'1px',
              }}>{selected ? '✓' : ''}</span>
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:'flex', alignItems:'center', gap:'7px', flexWrap:'wrap', marginBottom:'4px' }}>
                  <span style={{ fontSize:'15px', fontWeight:900 }}>{addr.label || '배송지'}</span>
                  {addr.is_default && <span style={{ fontSize:'11px', fontWeight:900, color:green, background:dark?'rgba(74,222,128,0.12)':'rgba(22,163,74,0.1)', padding:'3px 8px', borderRadius:'999px' }}>기본</span>}
                </span>
                <span style={{ display:'block', fontSize:'13px', fontWeight:800, color:D.text, lineHeight:1.45 }}>
                  {addr.recipient || '받는사람 미입력'} {addr.phone ? `· ${addr.phone}` : ''}
                </span>
                <span style={{ display:'block', fontSize:'13px', color:D.sub, lineHeight:1.55, marginTop:'3px' }}>
                  {addr.postcode ? `(${addr.postcode}) ` : ''}{full}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
