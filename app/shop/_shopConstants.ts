// 쇼핑몰 메인에서 쓰는 순수 상수/타입 (화면 로직과 무관 — page.tsx에서 분리)

export type Product = {
  id: string; name: string; description: string; image_url: string
  wholesale_price: number; retail_price: number; member_price: number; stock: number; unit: string
  category_id: string; is_active: boolean
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
