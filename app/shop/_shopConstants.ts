// 쇼핑몰 메인에서 쓰는 순수 상수/타입 (화면 로직과 무관 — page.tsx에서 분리)

export type Product = {
  id: string; name: string; description: string; image_url: string
  origin?: string | null
  wholesale_price: number; retail_price: number; member_price: number; stock: number; unit: string
  weight?: number | null
  category_id: string; is_active: boolean
}

// 중량/수량 수치를 단위와 합쳐 "1.5kg"처럼 표시. 값이 없으면 빈 문자열.
export function weightLabel(p: { weight?: number | null; unit?: string }): string {
  if (p.weight == null || Number(p.weight) <= 0) return ''
  return `${Number(p.weight)}${p.unit || ''}`
}
export type Category = { id: string; name: string }

// ★ 회원 등급별 실제 적용가 — 쇼핑몰 전 구간(목록·상세·장바구니·헤더·찜·미니카드) 단일 기준.
//   여기만 고치면 모든 화면이 동일하게 따라온다. 단가가 어긋나는 일을 원천 차단.
//   미설정(0)이면 일반 구매가로 폴백해 "0원" 노출을 방지.
export function priceFor(
  p: { wholesale_price?: number; member_price?: number; retail_price?: number },
  memberType: string
): number {
  if (memberType === '도매업') return (p.wholesale_price || p.retail_price) ?? 0
  if (memberType === '소매업') return (p.member_price || p.retail_price) ?? 0
  return p.retail_price ?? 0
}

export const CAT_ICONS: Record<string, string> = {
  '농산물': '🥬', '과일': '🍎', '축산물': '🥩', '농축수산물': '🧺', '해조류': '🌿', '어류': '🧺', '갑각류': '🦀', '패류': '🦪',
  '건어물/염장류': '🐠', '기타': '🐙', '전체': '🛒'
}

// 카테고리 대표 사진(둘러보기 네비용). 없으면 노출 안 함.
export const CAT_PHOTOS: Record<string, string> = {
  '농산물': '/demo-food/produce_ssam.webp',
  '과일': '/demo-food/fruit_strawberry.webp',
  '축산물': '/demo-food/meat_beef.webp',
  '어류': '/demo-food/seafood_hairtail.webp',
  '갑각류': '/demo-food/seafood_prawn.webp',
  '패류': '/demo-food/seafood_oyster.webp',
  '건어물/염장류': '/demo-food/seafood_driedshrimp.webp',
}

// 카테고리 이름의 키워드로 실사 대표 사진을 매칭(이름이 조금 달라도 잡히게).
// 이미지 = public/ai-images/food/*.webp (실사 56종). '전체'는 사진 없이 아이콘.
const CAT_PHOTO_RULES: { keys: string[]; src: string }[] = [
  { keys: ['채소', '야채', '농산'],                 src: '/ai-images/food/produce_ssam.webp' },
  { keys: ['과일', '청과'],                          src: '/ai-images/food/fruit_strawberry.webp' },
  { keys: ['축산', '정육', '한우', '고기', '육류'],   src: '/ai-images/food/meat_beef.webp' },
  { keys: ['수산', '해산', '생선', '어류', '건어'],   src: '/ai-images/food/seafood_hairtail.webp' },
  { keys: ['갑각', '새우', '대하', '게'],             src: '/ai-images/food/seafood_prawn.webp' },
  { keys: ['패류', '조개', '굴'],                     src: '/ai-images/food/seafood_oyster.webp' },
  { keys: ['쌀', '잡곡', '곡물', '미곡'],             src: '/ai-images/food/banchan_riceball.webp' },
  { keys: ['유제품', '계란', '달걀', '우유', '란'],   src: '/ai-images/food/food_egg.webp' },
  { keys: ['김치', '반찬'],                          src: '/ai-images/food/traditional_kimchi.webp' },
  { keys: ['베이커리', '간식', '빵', '제과', '디저트'], src: '/ai-images/food/bakery_bread.webp' },
  { keys: ['선물', '전통', '장류', '기타'],           src: '/ai-images/food/traditional_giftset.webp' },
]

// 카테고리 캐릭터 아이콘(3D, 투명) — 실제 등록된 25개 카테고리명 → 아이콘 정확 매핑.
// public/category-icons/<slug>.webp
const CAT_ICON_SLUG: Record<string, string> = {
  '채소': 'produce', '과일': 'fruit', '축산·정육': 'meat', '수산·해산물': 'seafood',
  '쌀·잡곡': 'grain', '유제품·계란': 'dairy', '김치·반찬': 'kimchi', '베이커리·간식': 'bakery',
  '음료·커피·차': 'drink', '건강·선물세트': 'giftset', '어류': 'fish', '갑각류': 'crab',
  '패류': 'shellfish', '해조류': 'seaweed', '건어물/염장류': 'dried', '패션': 'fashion',
  '뷰티': 'beauty', '리빙': 'living', '디바이스': 'device',
  '테크': 'tech', '액세사리': 'accessory', '전통': 'traditional', '고메': 'gourmet', '기타': 'etc',
}

// 이름이 조금 달라도 잡히게 하는 키워드 폴백
const CAT_ICON_KW: { keys: string[]; slug: string }[] = [
  { keys: ['갑각', '새우', '대하', '크랩'], slug: 'crab' },
  { keys: ['패류', '조개', '굴', '전복', '홍합'], slug: 'shellfish' },
  { keys: ['해조', '미역', '다시마', '톳'], slug: 'seaweed' },
  { keys: ['건어', '염장', '마른'], slug: 'dried' },
  { keys: ['어류', '생선'], slug: 'fish' },
  { keys: ['수산', '해산'], slug: 'seafood' },
  { keys: ['과일', '청과'], slug: 'fruit' },
  { keys: ['축산', '정육', '한우', '육류'], slug: 'meat' },
  { keys: ['유제품', '계란', '달걀', '우유'], slug: 'dairy' },
  { keys: ['채소', '야채', '농산'], slug: 'produce' },
  { keys: ['쌀', '잡곡', '곡물'], slug: 'grain' },
  { keys: ['김치', '반찬'], slug: 'kimchi' },
  { keys: ['베이커리', '빵', '간식', '제과'], slug: 'bakery' },
  { keys: ['음료', '커피', '차'], slug: 'drink' },
  { keys: ['선물', '세트'], slug: 'giftset' },
  { keys: ['패션', '의류', '옷'], slug: 'fashion' },
  { keys: ['뷰티', '화장'], slug: 'beauty' },
  { keys: ['리빙', '생활', '가구'], slug: 'living' },
  { keys: ['디바이스', '가전'], slug: 'device' },
  { keys: ['테크', '전자'], slug: 'tech' },
  { keys: ['액세', '악세'], slug: 'accessory' },
  { keys: ['전통'], slug: 'traditional' },
  { keys: ['고메', '미식'], slug: 'gourmet' },
]

// 메인에는 식품 위주만 노출, 비식품은 햄버거(전체) 안에만.
export const NON_FOOD_CATS = new Set(['패션', '뷰티', '리빙', '건강식품', '디바이스', '테크', '액세사리', '기타'])
export function isFoodCat(name: string): boolean {
  return name !== '전체' && !NON_FOOD_CATS.has(name)
}

// 카테고리 아이콘 이미지 경로. '전체'는 null(텍스트), 매칭 없으면 기타.
export function catIconImg(name: string): string | null {
  if (!name || name === '전체') return null
  const slug = CAT_ICON_SLUG[name] || CAT_ICON_KW.find(r => r.keys.some(k => name.includes(k)))?.slug || 'etc'
  return `/category-icons/${slug}.webp`
}

export function catPhoto(name: string): string | null {
  if (!name || name === '전체') return null
  if (CAT_PHOTOS[name]) return CAT_PHOTOS[name]           // 정확 매칭 우선
  for (const rule of CAT_PHOTO_RULES) {
    if (rule.keys.some(k => name.includes(k))) return rule.src
  }
  return null
}

export const CAT_COLORS: Record<string, { bg: string; border: string; shadow: string }> = {
  '전체':           { bg: 'linear-gradient(135deg,#14532d,#15803d)', border: '#14532d', shadow: 'rgba(22,163,74,0.4)' },
  '어류':           { bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: '#3b82f6', shadow: 'rgba(59,130,246,0.4)' },
  '갑각류':         { bg: 'linear-gradient(135deg,#f97316,#ef4444)', border: '#f97316', shadow: 'rgba(249,115,22,0.4)' },
  '패류':           { bg: 'linear-gradient(135deg,#ec4899,#f43f5e)', border: '#ec4899', shadow: 'rgba(236,72,153,0.4)' },
  '해조류':         { bg: 'linear-gradient(135deg,#22c55e,#10b981)', border: '#22c55e', shadow: 'rgba(34,197,94,0.4)' },
  '건어물/염장류':  { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', border: '#f59e0b', shadow: 'rgba(245,158,11,0.4)' },
  '기타':           { bg: 'linear-gradient(135deg,#8b5cf6,#a855f7)', border: '#8b5cf6', shadow: 'rgba(139,92,246,0.4)' },
}

export const getDefaultCatColor = (index: number) => {
  const colors = [
    { bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: '#3b82f6', shadow: 'rgba(59,130,246,0.4)' },
    { bg: 'linear-gradient(135deg,#f97316,#ef4444)', border: '#f97316', shadow: 'rgba(249,115,22,0.4)' },
    { bg: 'linear-gradient(135deg,#ec4899,#f43f5e)', border: '#ec4899', shadow: 'rgba(236,72,153,0.4)' },
    { bg: 'linear-gradient(135deg,#22c55e,#10b981)', border: '#22c55e', shadow: 'rgba(34,197,94,0.4)' },
    { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', border: '#f59e0b', shadow: 'rgba(245,158,11,0.4)' },
    { bg: 'linear-gradient(135deg,#8b5cf6,#a855f7)', border: '#8b5cf6', shadow: 'rgba(139,92,246,0.4)' },
  ]
  return colors[index % colors.length]
}

export const POPUP_NAMES = ['김민준','이서연','박지훈','최유나','정성호','강미래','윤도현','임하은','신준서','오채원','한동욱','배수아']
export const POPUP_ACTIONS = ['방금 구매했어요 🛒','장바구니에 담았어요 💚','찜했어요 ❤️','구매 완료했어요 ✅','리뷰를 남겼어요 ⭐']
