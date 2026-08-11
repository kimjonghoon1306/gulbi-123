'use client'

export type ProductGroup = '' | 'fresh' | 'processed' | 'living' | 'electronics' | 'craft'
export type LandingBasicInfo = Record<string, string>

export const PRODUCT_GROUPS: { value: ProductGroup; label: string; help: string }[] = [
  { value: '', label: '상품군을 선택해주세요', help: '' },
  { value: 'fresh', label: '🥬 신선식품·농축수산물', help: '맛·식감·선별·손질·보관·조리 정보' },
  { value: 'processed', label: '🍱 가공식품·건강식품', help: '원재료·제조·알레르기·섭취·보관 정보' },
  { value: 'living', label: '🏠 생활용품', help: '소재·크기·사용법·관리법 정보' },
  { value: 'electronics', label: '🔌 전자기기·디바이스', help: '모델·사양·구성품·호환·보증 정보' },
  { value: 'craft', label: '🎁 공예품·패션·기타', help: '소재·제작 과정·크기·관리법 정보' },
]

const COMMON_FIELDS = [
  ['oneLine', '상품 한 줄 소개', '예) 손질과 초벌을 마쳐 간편하게 즐기는 민물장어'],
  ['composition', '상품 구성·규격', '예) 장어 2미, 소스 1팩 · 총 1kg 내외'],
  ['highlights', '핵심 특징', '예) 두툼한 살, 잔가시 제거, 개별 진공포장'],
  ['difference', '차별점', '예) 주문 확인 후 손질하여 포장'],
  ['recommendedFor', '추천 대상·상황', '예) 가족 보양식, 부모님 선물, 캠핑 요리'],
  ['packagingShipping', '포장·배송 안내', '예) 진공포장 후 아이스박스 냉동배송'],
  ['certifications', '실제 인증·검사 정보', '예) HACCP 인증번호가 있을 때만 입력'],
] as const

const GROUP_FIELDS: Record<Exclude<ProductGroup, ''>, readonly (readonly [string, string, string])[]> = {
  fresh: [
    ['tasteTexture', '맛·향·식감', '예) 담백하고 고소하며 살이 두툼하고 부드러움'],
    ['selectionProduction', '선별·손질·생산 방식', '예) 크기 선별 후 세척·손질·초벌'],
    ['storageShelfLife', '보관 방법·소비기한', '예) -18℃ 이하 냉동, 포장지 표시일까지'],
    ['preparation', '해동·손질·조리법', '예) 냉장 해동 후 팬에서 앞뒤로 충분히 가열'],
    ['ingredientsAllergy', '원재료·알레르기', '예) 민물장어 100%, 소스에 대두 포함'],
  ],
  processed: [
    ['ingredientsAllergy', '원재료·함량·알레르기', '예) 주원료와 함량, 알레르기 유발 원료'],
    ['manufacturing', '제조 방식', '예) 저온 숙성, 소량 생산'],
    ['tasteTexture', '맛·향·식감', '예) 달지 않고 고소한 맛, 바삭한 식감'],
    ['storageShelfLife', '보관 방법·소비기한', '예) 서늘한 곳 보관, 개봉 후 냉장'],
    ['preparation', '섭취·활용 방법', '예) 1회 1포, 우유나 요거트와 함께'],
  ],
  living: [
    ['material', '소재', '예) 스테인리스 304, 실리콘'],
    ['sizeWeight', '크기·무게·색상', '예) 24×18cm, 850g, 아이보리'],
    ['functions', '주요 기능', '예) 미끄럼 방지, 손쉬운 세척'],
    ['usage', '사용 방법', '예) 처음 사용 전 중성세제로 세척'],
    ['care', '관리·주의사항', '예) 식기세척기 사용 가능, 화기 주의'],
  ],
  electronics: [
    ['modelSpecs', '모델명·주요 사양', '예) ABC-100, USB-C, 20W'],
    ['sizeWeight', '크기·무게·색상', '예) 120×70mm, 180g, 블랙'],
    ['components', '구성품', '예) 본체, 케이블, 설명서'],
    ['compatibility', '호환 정보', '예) iOS 16 이상, Android 12 이상'],
    ['usage', '사용 방법', '예) 전원 연결 후 버튼을 2초간 누름'],
    ['warranty', '인증·품질보증', '예) KC 인증번호, 구매일로부터 1년'],
  ],
  craft: [
    ['material', '소재·원재료', '예) 국내산 참죽나무, 천연 오일 마감'],
    ['sizeWeight', '크기·무게·색상', '예) 가로 20cm, 수작업 특성상 오차 있음'],
    ['makerStory', '제작자·제작 과정', '예) 20년 경력 공예가가 수작업 제작'],
    ['usage', '사용·착용 방법', '예) 일상 장식 또는 선물용'],
    ['care', '관리·주의사항', '예) 물에 오래 담그지 말고 마른 천으로 관리'],
  ],
}

type Props = {
  group: ProductGroup
  setGroup: (group: ProductGroup) => void
  value: LandingBasicInfo
  onChange: (value: LandingBasicInfo) => void
  dark: boolean
  isAutoFilling?: boolean
  onAutoFill?: () => void
}

export default function LandingBasicInfoFields({ group, setGroup, value, onChange, dark, isAutoFilling = false, onAutoFill }: Props) {
  const border = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)'
  const inputBg = dark ? 'rgba(255,255,255,0.06)' : '#fff'
  const text = dark ? '#fff' : '#111'
  const sub = dark ? 'rgba(255,255,255,0.48)' : '#666'
  const fields = group ? [...COMMON_FIELDS, ...GROUP_FIELDS[group]] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ padding: '11px 13px', borderRadius: '10px', border: `1px solid ${dark ? 'rgba(34,197,94,0.28)' : '#bbf7d0'}`, background: dark ? 'rgba(34,197,94,0.08)' : '#f0fdf4', color: dark ? 'rgba(255,255,255,0.72)' : '#166534', fontSize: '11px', lineHeight: 1.6 }}>
        <strong style={{ display: 'block', marginBottom: '2px', color: dark ? '#4ade80' : '#15803d' }}>사용 방법</strong>
        상품군을 선택한 뒤 <strong>AI 기본내용 작성</strong>을 눌러주세요. AI가 작성한 내용을 확인하고 필요한 부분을 수정한 뒤 <strong>AI 상세페이지 제작하기</strong>를 눌러주세요.
      </div>
      {isAutoFilling && <div role="status" style={{ padding: '10px 12px', borderRadius: '9px', background: dark ? 'rgba(59,130,246,0.12)' : '#eff6ff', color: dark ? '#93c5fd' : '#1d4ed8', fontSize: '11px', fontWeight: 700 }}>✨ 이미지에서 상품 정보를 읽어 초안을 작성하고 있어요...</div>}
      <div>
        <label style={{ display: 'block', color: sub, fontSize: '11px', fontWeight: 800, marginBottom: '6px' }}>상품군 <span style={{ color: '#f97316' }}>*</span></label>
        <select value={group} disabled={isAutoFilling} onChange={e => setGroup(e.target.value as ProductGroup)}
          style={{ width: '100%', padding: '13px 14px', borderRadius: '10px', border: `2px solid ${group ? '#22c55e' : border}`, background: inputBg, color: text, fontSize: '14px', fontWeight: 700, outline: 'none' }}>
          {PRODUCT_GROUPS.map(item => <option key={item.value} value={item.value} style={{ color: '#111' }}>{item.label}</option>)}
        </select>
        <p style={{ color: sub, fontSize: '11px', margin: '5px 2px 0' }}>{PRODUCT_GROUPS.find(item => item.value === group)?.help || '상품군을 선택하면 필요한 작성칸이 나타나요.'}</p>
      </div>

      {group && onAutoFill && (
        <button type="button" onClick={onAutoFill} disabled={isAutoFilling}
          style={{ width: '100%', padding: '14px 16px', borderRadius: '11px', border: 'none', background: isAutoFilling ? 'rgba(34,197,94,0.25)' : 'linear-gradient(135deg,#22c55e,#4ade80)', color: isAutoFilling ? (dark ? 'rgba(255,255,255,0.55)' : '#64748b') : '#071b0d', fontSize: '15px', fontWeight: 900, cursor: isAutoFilling ? 'wait' : 'pointer', boxShadow: isAutoFilling ? 'none' : '0 5px 18px rgba(34,197,94,0.28)' }}>
          {isAutoFilling ? '✨ 이미지 분석해서 기본내용 작성 중...' : '✨ AI 기본내용 작성'}
        </button>
      )}

      {group && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '9px' }}>
          {fields.map(([key, label]) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{ color: sub, fontSize: '10px', fontWeight: 800 }}>{label} <span style={{ fontWeight: 500 }}>(선택)</span></span>
              <textarea value={value[key] || ''} disabled={isAutoFilling} onChange={e => onChange({ ...value, [key]: e.target.value })}
                placeholder={isAutoFilling ? 'AI가 내용을 작성하고 있어요...' : ''} rows={2} maxLength={500}
                style={{ width: '100%', minHeight: '62px', resize: 'vertical', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '9px', border: `1px solid ${border}`, background: inputBg, color: text, fontSize: '12px', lineHeight: 1.5, outline: 'none', fontFamily: 'inherit' }} />
            </label>
          ))}
        </div>
      )}
      {group && <p style={{ color: dark ? '#e5e7eb' : '#334155', fontSize: '13px', lineHeight: 1.65, fontWeight: 700, margin: '2px 0 0' }}>AI가 작성한 내용을 확인하고 필요한 부분을 수정하세요. 원산지·함량·인증·소비기한은 상품 표시사항과 대조한 뒤 AI 상세페이지 제작하기를 눌러주세요.</p>}
    </div>
  )
}
