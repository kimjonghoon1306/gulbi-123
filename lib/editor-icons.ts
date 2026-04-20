// SVG 아이콘 라이브러리
// 모든 아이콘은 24x24 viewBox, currentColor 사용 → 색상 자동 매칭
// 카테고리: arrow, divider, kitchen, food, storage, certify, decor

export type IconCategory = 'arrow' | 'divider' | 'kitchen' | 'food' | 'storage' | 'certify' | 'decor'

export type IconItem = {
  key: string
  name: string
  category: IconCategory
  svg: string
  // 삽입 시 기본 크기 (식품 카테고리는 작게, 디바이더는 길게)
  defaultWidth?: number
  defaultHeight?: number
}

// 공통 SVG wrapper
const wrap = (content: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`

// 채워진 SVG (장식용)
const fill = (content: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${content}</svg>`

// 길쭉한 디바이더 SVG
const divider = (content: string, width = 200, height = 24) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">${content}</svg>`

export const ICONS: IconItem[] = [
  // ============ 화살표 ============
  {
    key: 'arrow-right',
    name: '오른쪽 화살표',
    category: 'arrow',
    svg: wrap('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  },
  {
    key: 'arrow-down',
    name: '아래 화살표',
    category: 'arrow',
    svg: wrap('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  },
  {
    key: 'arrow-curve',
    name: '곡선 화살표',
    category: 'arrow',
    svg: wrap('<path d="M3 10c4-4 10-4 14 0"/><path d="M13 4l4 6-6 2"/>'),
  },
  {
    key: 'arrow-thin',
    name: '얇은 화살표',
    category: 'arrow',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 12" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"><line x1="2" y1="6" x2="55" y2="6"/><path d="M50 2l5 4-5 4"/></svg>`,
    defaultWidth: 120,
    defaultHeight: 24,
  },
  {
    key: 'arrow-double',
    name: '이중 화살표',
    category: 'arrow',
    svg: wrap('<path d="M5 8h12M11 4l6 4-6 4M5 16h12M11 12l6 4-6 4"/>'),
  },
  {
    key: 'pointer',
    name: '포인터',
    category: 'arrow',
    svg: wrap('<path d="M4 4l16 16M4 4v9M4 4h9"/>'),
  },

  // ============ 디바이더 / 라인 ============
  {
    key: 'divider-line',
    name: '심플 라인',
    category: 'divider',
    svg: divider('<line x1="0" y1="12" x2="200" y2="12"/>'),
    defaultWidth: 200,
    defaultHeight: 24,
  },
  {
    key: 'divider-dot-line',
    name: '점 + 라인',
    category: 'divider',
    svg: divider('<line x1="0" y1="12" x2="80" y2="12"/><circle cx="100" cy="12" r="3" fill="currentColor"/><line x1="120" y1="12" x2="200" y2="12"/>'),
    defaultWidth: 200,
    defaultHeight: 24,
  },
  {
    key: 'divider-diamond',
    name: '다이아몬드 라인',
    category: 'divider',
    svg: divider('<line x1="0" y1="12" x2="85" y2="12"/><path d="M100 5 L107 12 L100 19 L93 12 Z" fill="currentColor"/><line x1="115" y1="12" x2="200" y2="12"/>'),
    defaultWidth: 200,
    defaultHeight: 24,
  },
  {
    key: 'divider-leaf',
    name: '잎 디바이더',
    category: 'divider',
    svg: divider('<line x1="0" y1="12" x2="80" y2="12"/><path d="M90 12 Q100 4 110 12 Q100 20 90 12 Z" fill="currentColor"/><line x1="120" y1="12" x2="200" y2="12"/>'),
    defaultWidth: 200,
    defaultHeight: 24,
  },
  {
    key: 'divider-three-dot',
    name: '점 세 개',
    category: 'divider',
    svg: divider('<circle cx="90" cy="12" r="2" fill="currentColor"/><circle cx="100" cy="12" r="2" fill="currentColor"/><circle cx="110" cy="12" r="2" fill="currentColor"/>', 200, 24),
    defaultWidth: 200,
    defaultHeight: 24,
  },
  {
    key: 'divider-double',
    name: '이중 라인',
    category: 'divider',
    svg: divider('<line x1="0" y1="9" x2="200" y2="9"/><line x1="0" y1="15" x2="200" y2="15"/>'),
    defaultWidth: 200,
    defaultHeight: 24,
  },
  {
    key: 'corner-frame',
    name: '코너 프레임',
    category: 'divider',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 20V5h15M40 5h15v15M55 40v15H40M20 55H5V40"/></svg>`,
    defaultWidth: 60,
    defaultHeight: 60,
  },
  {
    key: 'rect-frame',
    name: '사각 프레임',
    category: 'divider',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="54" height="54"/></svg>`,
    defaultWidth: 60,
    defaultHeight: 60,
  },

  // ============ 조리 도구 ============
  {
    key: 'pan',
    name: '프라이팬',
    category: 'kitchen',
    svg: wrap('<path d="M3 12h14a3 3 0 0 1 0 6H8a5 5 0 0 1-5-5v-1z"/><path d="M17 15h4"/>'),
  },
  {
    key: 'pot',
    name: '냄비',
    category: 'kitchen',
    svg: wrap('<path d="M5 9h14v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9z"/><path d="M3 9h18"/><path d="M7 5v3M17 5v3"/>'),
  },
  {
    key: 'steamer',
    name: '찜기',
    category: 'kitchen',
    svg: wrap('<path d="M5 11h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6z"/><path d="M3 11h18"/><path d="M9 4c0 2-2 2-2 4M15 4c0 2-2 2-2 4"/>'),
  },
  {
    key: 'kettle',
    name: '주전자',
    category: 'kitchen',
    svg: wrap('<path d="M6 9h11l1 4a4 4 0 0 1-4 5H9a4 4 0 0 1-4-5l1-4z"/><path d="M17 11l3-2"/><path d="M9 9V6a2 2 0 0 1 4 0"/>'),
  },
  {
    key: 'knife',
    name: '칼',
    category: 'kitchen',
    svg: wrap('<path d="M3 19l8-2L20 4l-1-1-9 9-7 5z"/>'),
  },
  {
    key: 'fork-spoon',
    name: '포크 + 숟가락',
    category: 'kitchen',
    svg: wrap('<path d="M7 2v6m-2-6v4a2 2 0 0 0 4 0V2M7 8v14"/><path d="M17 2c-2 0-3 2-3 5s1 5 3 5v10"/>'),
  },
  {
    key: 'chopsticks',
    name: '젓가락',
    category: 'kitchen',
    svg: wrap('<line x1="6" y1="3" x2="14" y2="21"/><line x1="10" y1="3" x2="18" y2="21"/>'),
  },
  {
    key: 'flame',
    name: '불꽃',
    category: 'kitchen',
    svg: wrap('<path d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-3-2-4-2-7M9 14a3 3 0 0 0 6 0c0-2-2-2-3-4"/>'),
  },
  {
    key: 'timer',
    name: '타이머',
    category: 'kitchen',
    svg: wrap('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6"/>'),
  },
  {
    key: 'thermometer',
    name: '온도계',
    category: 'kitchen',
    svg: wrap('<path d="M12 2a2 2 0 0 0-2 2v11a4 4 0 1 0 4 0V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="18" r="2" fill="currentColor"/>'),
  },
  {
    key: 'cup',
    name: '컵',
    category: 'kitchen',
    svg: wrap('<path d="M5 4h14l-1 14a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3L5 4z"/><path d="M19 8c2 0 3 1 3 3s-1 3-3 3"/>'),
  },
  {
    key: 'plate',
    name: '접시',
    category: 'kitchen',
    svg: wrap('<ellipse cx="12" cy="14" rx="10" ry="4"/><ellipse cx="12" cy="13" rx="7" ry="2.5"/>'),
  },

  // ============ 식품 / 식재료 ============
  {
    key: 'fish',
    name: '생선',
    category: 'food',
    svg: wrap('<path d="M3 12c3-5 9-5 14 0c-5 5-11 5-14 0z"/><path d="M17 12c2-2 4-2 4 0s-2 2-4 0"/><circle cx="7" cy="11" r="0.5" fill="currentColor"/>'),
  },
  {
    key: 'wheat',
    name: '밀/곡물',
    category: 'food',
    svg: wrap('<path d="M12 22V8M8 12c0-2 2-3 4-2c2-1 4 0 4 2c-2 1-4 0-4 2c0-2-2-3-4-2zM8 8c0-2 2-3 4-2c2-1 4 0 4 2c-2 1-4 0-4 2c0-2-2-3-4-2zM10 4c0-1 1-1.5 2-1c1-.5 2 0 2 1c-1 .5-2 0-2 1c0-1-1-1.5-2-1z"/>'),
  },
  {
    key: 'leaf',
    name: '잎',
    category: 'food',
    svg: wrap('<path d="M11 20s8-4 8-12c0-4-3-6-7-6c-4 0-7 4-7 8c0 6 6 10 6 10z"/><path d="M11 20c0-4 1-8 4-12"/>'),
  },
  {
    key: 'herb',
    name: '허브',
    category: 'food',
    svg: wrap('<path d="M12 22V10M8 14c2-1 4-1 4-3c0 2 2 2 4 3M6 10c3-1 6-1 6-3c0 2 3 2 6 3M9 6c1-1 3-1 3-2c0 1 2 1 3 2"/>'),
  },
  {
    key: 'fruit',
    name: '과일',
    category: 'food',
    svg: wrap('<path d="M6 12a6 6 0 0 1 12 0v3a6 6 0 0 1-12 0v-3z"/><path d="M12 6V3"/><path d="M14 4c0-1-1-1-2-1"/>'),
  },
  {
    key: 'pepper',
    name: '고추',
    category: 'food',
    svg: wrap('<path d="M14 4c4 2 5 8 1 13c-3 4-9 4-12-1c4-1 7-4 8-7c1-2 2-4 3-5z"/><path d="M14 4c0-1 1-2 2-2"/>'),
  },
  {
    key: 'salt',
    name: '소금',
    category: 'food',
    svg: wrap('<path d="M9 3h6v3l-1 14H10L9 6z"/><path d="M9 6h6"/><circle cx="11" cy="11" r="0.5" fill="currentColor"/><circle cx="13" cy="14" r="0.5" fill="currentColor"/>'),
  },
  {
    key: 'oil-bottle',
    name: '기름병',
    category: 'food',
    svg: wrap('<path d="M9 7h6l1 2v9a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V9l1-2z"/><path d="M10 7V3h4v4"/>'),
  },
  {
    key: 'honey-jar',
    name: '꿀병',
    category: 'food',
    svg: wrap('<path d="M6 9h12v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V9z"/><path d="M5 6h14M8 6V3h8v3"/>'),
  },
  {
    key: 'water-drop',
    name: '물방울',
    category: 'food',
    svg: wrap('<path d="M12 3c-3 5-6 8-6 12a6 6 0 0 0 12 0c0-4-3-7-6-12z"/>'),
  },

  // ============ 보관 ============
  {
    key: 'fridge',
    name: '냉장고',
    category: 'storage',
    svg: wrap('<rect x="5" y="2" width="14" height="20" rx="1"/><path d="M5 10h14"/><path d="M8 6v2M8 14v3"/>'),
  },
  {
    key: 'snowflake',
    name: '눈송이 (냉동)',
    category: 'storage',
    svg: wrap('<path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/><path d="M12 6l-2-2 2-2 2 2-2 2zM12 22l-2-2 2-2 2 2-2 2zM6 12l-2-2-2 2 2 2 2-2zM22 12l-2-2-2 2 2 2 2-2z" fill="currentColor"/>'),
  },
  {
    key: 'sun',
    name: '햇빛',
    category: 'storage',
    svg: wrap('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'),
  },
  {
    key: 'box',
    name: '박스',
    category: 'storage',
    svg: wrap('<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/>'),
  },
  {
    key: 'gift',
    name: '선물',
    category: 'storage',
    svg: wrap('<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18"/><path d="M12 9v12"/><path d="M12 9c-2 0-4-1-4-3s2-3 4 0c2-3 4-2 4 0s-2 3-4 3z"/>'),
  },
  {
    key: 'truck',
    name: '배송 트럭',
    category: 'storage',
    svg: wrap('<rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
  },
  {
    key: 'shield',
    name: '방패 (안전)',
    category: 'storage',
    svg: wrap('<path d="M12 2l8 3v7c0 5-3 8-8 10c-5-2-8-5-8-10V5l8-3z"/><path d="M9 12l2 2 4-4"/>'),
  },
  {
    key: 'clock',
    name: '시계',
    category: 'storage',
    svg: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  },
  {
    key: 'calendar',
    name: '달력',
    category: 'storage',
    svg: wrap('<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  },
  {
    key: 'heart',
    name: '하트',
    category: 'storage',
    svg: wrap('<path d="M12 21s-7-4-7-10a4 4 0 0 1 7-2a4 4 0 0 1 7 2c0 6-7 10-7 10z"/>'),
  },

  // ============ 인증 / 신뢰 ============
  {
    key: 'check-circle',
    name: '체크 원',
    category: 'certify',
    svg: wrap('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'),
  },
  {
    key: 'check',
    name: '체크',
    category: 'certify',
    svg: wrap('<path d="M5 12l5 5L20 7"/>'),
  },
  {
    key: 'medal',
    name: '메달',
    category: 'certify',
    svg: wrap('<circle cx="12" cy="14" r="6"/><path d="M9 8L7 2h10l-2 6"/><path d="M12 11v6M9 14h6"/>'),
  },
  {
    key: 'award',
    name: '어워드',
    category: 'certify',
    svg: wrap('<circle cx="12" cy="9" r="6"/><path d="M9 14l-2 8 5-3 5 3-2-8"/>'),
  },
  {
    key: 'star',
    name: '별',
    category: 'certify',
    svg: wrap('<path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7L2 9h7z"/>'),
  },
  {
    key: 'star-filled',
    name: '별 (채움)',
    category: 'certify',
    svg: fill('<path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7L2 9h7z"/>'),
  },
  {
    key: 'badge',
    name: '뱃지',
    category: 'certify',
    svg: wrap('<path d="M12 2l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V5h4l3-3z"/><path d="M9 12l2 2 4-4"/>'),
  },
  {
    key: 'ribbon',
    name: '리본',
    category: 'certify',
    svg: wrap('<circle cx="12" cy="9" r="6"/><path d="M9 14l-2 8 5-3 5 3-2-8"/><path d="M12 9l-2-2M12 9l2-2"/>'),
  },
  {
    key: 'thumbs-up',
    name: '엄지 척',
    category: 'certify',
    svg: wrap('<path d="M7 10v11h11l3-7v-2h-7l1-4c0-2-2-3-3-2l-2 4H7v0z"/><path d="M3 10h4v11H3z"/>'),
  },
  {
    key: 'crown',
    name: '왕관',
    category: 'certify',
    svg: wrap('<path d="M3 8l3 8h12l3-8-5 4-4-7-4 7z"/><path d="M5 18h14"/>'),
  },

  // ============ 장식 ============
  {
    key: 'sparkle',
    name: '반짝',
    category: 'decor',
    svg: wrap('<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>'),
  },
  {
    key: 'circle-dot',
    name: '점 원',
    category: 'decor',
    svg: fill('<circle cx="12" cy="12" r="3"/>'),
  },
  {
    key: 'circle-outline',
    name: '원 외곽',
    category: 'decor',
    svg: wrap('<circle cx="12" cy="12" r="9"/>'),
  },
  {
    key: 'square',
    name: '사각형',
    category: 'decor',
    svg: wrap('<rect x="3" y="3" width="18" height="18"/>'),
  },
  {
    key: 'square-filled',
    name: '사각 채움',
    category: 'decor',
    svg: fill('<rect x="3" y="3" width="18" height="18"/>'),
  },
  {
    key: 'triangle',
    name: '삼각형',
    category: 'decor',
    svg: wrap('<path d="M12 3l9 17H3z"/>'),
  },
  {
    key: 'diamond',
    name: '다이아몬드',
    category: 'decor',
    svg: wrap('<path d="M12 2L22 12L12 22L2 12z"/>'),
  },
  {
    key: 'roman-i',
    name: '로마숫자 I',
    category: 'decor',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-family="serif" font-size="18" font-weight="700">I</text></svg>`,
  },
  {
    key: 'roman-ii',
    name: '로마숫자 II',
    category: 'decor',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-family="serif" font-size="18" font-weight="700">II</text></svg>`,
  },
  {
    key: 'roman-iii',
    name: '로마숫자 III',
    category: 'decor',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-family="serif" font-size="18" font-weight="700">III</text></svg>`,
  },
  {
    key: 'quote',
    name: '인용 부호',
    category: 'decor',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><text x="12" y="20" text-anchor="middle" font-family="serif" font-size="32" font-weight="700">"</text></svg>`,
  },
  {
    key: 'and',
    name: '앤퍼샌드',
    category: 'decor',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-family="serif" font-size="20" font-style="italic" font-weight="400">&amp;</text></svg>`,
  },
]

// 카테고리 메타 정보
export const ICON_CATEGORIES: { key: IconCategory; name: string; desc: string }[] = [
  { key: 'arrow', name: '화살표', desc: '방향·강조' },
  { key: 'divider', name: '구분선', desc: '섹션 구분' },
  { key: 'kitchen', name: '조리도구', desc: '냄비·칼·불꽃' },
  { key: 'food', name: '식재료', desc: '생선·곡물·과일' },
  { key: 'storage', name: '보관·배송', desc: '냉장·박스·시간' },
  { key: 'certify', name: '인증·신뢰', desc: '체크·메달·별' },
  { key: 'decor', name: '장식·도형', desc: '점·사각·로마숫자' },
]

// 카테고리별 아이콘 가져오기
export function getIconsByCategory(category: IconCategory): IconItem[] {
  return ICONS.filter(i => i.category === category)
}

// 키로 아이콘 가져오기
export function getIconByKey(key: string): IconItem | undefined {
  return ICONS.find(i => i.key === key)
}

// HTML 삽입용 SVG 문자열 (편집 가능하게)
export function makeIconHtml(icon: IconItem, color = 'currentColor', size = 24): string {
  const w = icon.defaultWidth || size
  const h = icon.defaultHeight || size
  // SVG에 width/height와 색상 적용
  const styled = icon.svg
    .replace('<svg ', `<svg style="width:${w}px;height:${h}px;color:${color};vertical-align:middle;display:inline-block;" `)
  return `<span data-icon="${icon.key}" contenteditable="false" style="display:inline-block;line-height:1;color:${color};margin:0 4px;vertical-align:middle;">${styled}</span>`
}
