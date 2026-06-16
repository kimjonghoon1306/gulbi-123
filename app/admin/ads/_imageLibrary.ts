// 내장 이미지 라이브러리 — 광고 배너에 쓸 이미지가 없을 때 골라 쓰는 데모/공용 이미지.
// 파일은 public/library/ 에 있음. 카테고리별로 묶어 관리자 모달에서 선택.
export type LibImage = { file: string; label: string }
export type LibGroup = { key: string; name: string; emoji: string; images: LibImage[] }

const f = (file: string, label: string): LibImage => ({ file: `/library/${file}.webp`, label })

export const IMAGE_LIBRARY: LibGroup[] = [
  { key: 'produce', name: '농산물', emoji: '🥬', images: [
    f('produce_spinach', '시금치'), f('produce_carrot', '당근'), f('produce_broccoli', '브로콜리'),
    f('produce_garlic', '마늘'), f('produce_mushroom', '표고버섯'), f('produce_ssam', '쌈채소'),
  ]},
  { key: 'fruit', name: '과일', emoji: '🍎', images: [
    f('fruit_apple', '사과'), f('fruit_tangerine', '감귤'), f('fruit_strawberry', '딸기'),
    f('fruit_grape', '샤인머스캣'), f('fruit_mango', '망고'), f('fruit_peach', '복숭아'),
  ]},
  { key: 'seafood', name: '수산물', emoji: '🐟', images: [
    f('seafood_hairtail', '갈치'), f('seafood_prawn', '새우'), f('seafood_squid', '오징어'),
    f('seafood_oyster', '굴'), f('seafood_driedshrimp', '마른새우'), f('seafood_myeongnan', '명란젓'),
  ]},
  { key: 'meat', name: '축산물', emoji: '🥩', images: [
    f('meat_beef', '한우 등심'), f('meat_porkbelly', '삼겹살'), f('meat_bacon', '베이컨'),
    f('meat_chicken', '닭다리살'), f('meat_sausage', '소시지'), f('meat_striploin', '채끝'),
  ]},
  { key: 'bakery', name: '베이커리', emoji: '🥐', images: [
    f('bakery_bread', '식빵'), f('bakery_croissant', '크루아상'), f('bakery_baguette', '바게트'),
    f('bakery_cupcake', '컵케이크'), f('bakery_cookie', '쿠키'), f('bakery_pretzel', '프레첼'),
  ]},
  { key: 'traditional', name: '전통식품', emoji: '🏮', images: [
    f('traditional_doenjang', '된장'), f('traditional_gochujang', '고추장'), f('traditional_kimchi', '김치'),
    f('traditional_makgeolli', '막걸리'), f('traditional_tea', '쌍화차'), f('traditional_giftset', '명절세트'),
  ]},
  { key: 'banchan', name: '반찬', emoji: '🥢', images: [
    f('banchan_anchovy', '멸치볶음'), f('banchan_stew', '된장찌개'), f('banchan_geotjeori', '겉절이'),
    f('banchan_eomuk', '어묵볶음'), f('banchan_riceball', '주먹밥'), f('banchan_jangjorim', '장조림'),
  ]},
  { key: 'dairy', name: '유제품', emoji: '🥛', images: [
    f('dairy_milk', '우유'), f('dairy_cheese', '치즈'), f('dairy_icecream', '아이스크림'),
    f('dairy_butter', '버터'), f('dairy_yogurt', '요거트'), f('dairy_pudding', '푸딩'),
  ]},
  { key: 'gourmet', name: '프리미엄', emoji: '🎁', images: [
    f('gourmet_giftset', '선물세트'), f('gourmet_wine', '와인'), f('gourmet_cheeseplatter', '치즈플래터'),
    f('gourmet_oliveoil', '올리브유'), f('gourmet_chocolate', '초콜릿'), f('gourmet_teaset', '티세트'),
  ]},
  { key: 'etc', name: '기타', emoji: '🛍️', images: [
    f('food_egg', '유정란'), f('food_honey', '꿀'), f('candle', '캔들'), f('serum', '세럼'),
    f('sneaker', '스니커즈'), f('tote', '토트백'), f('watch', '시계'), f('earbuds', '이어폰'),
    f('sunglasses', '선글라스'), f('mug', '머그'), f('cap', '캡'), f('plant', '식물'),
  ]},
]
