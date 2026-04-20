// 큐레이션된 이미지 씬 카테고리
// 자유 검색 대신 미리 큐레이션된 검색어 조합으로 품질 일관성 확보
// 각 씬은 여러 검색어를 가지며, 호출 시 랜덤 또는 순환해서 다양성 확보

export type SceneKey =
  | 'cooking'    // 🍳 조리 장면
  | 'plating'    // 🥘 플레이팅
  | 'ingredients' // 🧺 재료 클로즈업
  | 'gift'       // 🎁 포장·선물
  | 'table'      // 🏠 식탁·부엌
  | 'fresh'      // ❄️ 신선함·보관
  | 'origin'     // 🌾 원산지·자연
  | 'handmade'   // ✋ 손길·정성
  | 'delivery'   // 📦 배송·언박싱

export type Scene = {
  key: SceneKey
  label: string
  emoji: string
  description: string
  // Unsplash는 한국어 검색이 약하므로 영문 키워드로. 여러개 제공해서 다양성 확보
  queries: string[]
  // 어떤 섹션 타입에 잘 어울리는지 (향후 자동 매칭용)
  fitsSections?: string[]
}

export const SCENES: Scene[] = [
  {
    key: 'cooking',
    label: '조리 장면',
    emoji: '🍳',
    description: '요리하는 순간, 불·팬·연기',
    queries: [
      'cooking pan stove flame',
      'asian cooking process',
      'cooking kitchen warm light',
      'food sizzling pan',
    ],
    fitsSections: ['recipe', 'feature'],
  },
  {
    key: 'plating',
    label: '플레이팅',
    emoji: '🥘',
    description: '완성된 요리, 그릇에 담긴 모습',
    queries: [
      'korean food plating',
      'traditional asian bowl dish',
      'food styling overhead',
      'plated meal wooden table',
    ],
    fitsSections: ['hero', 'feature', 'recipe'],
  },
  {
    key: 'ingredients',
    label: '재료 클로즈업',
    emoji: '🧺',
    description: '신선한 원재료, 텍스처',
    queries: [
      'fresh ingredients closeup',
      'food ingredients texture',
      'raw ingredients rustic',
      'natural food materials',
    ],
    fitsSections: ['origin', 'feature', 'compare'],
  },
  {
    key: 'gift',
    label: '포장·선물',
    emoji: '🎁',
    description: '선물 상자, 리본, 프리미엄 포장',
    queries: [
      'premium gift box packaging',
      'luxury food gift wrap',
      'elegant packaging ribbon',
      'korean traditional gift box',
    ],
    fitsSections: ['delivery', 'hero'],
  },
  {
    key: 'table',
    label: '식탁·부엌',
    emoji: '🏠',
    description: '가족 식탁, 따뜻한 공간',
    queries: [
      'family dining table korean',
      'warm kitchen interior',
      'cozy dining setting',
      'traditional korean table',
    ],
    fitsSections: ['story', 'feature'],
  },
  {
    key: 'fresh',
    label: '신선·보관',
    emoji: '❄️',
    description: '냉장·냉동·선도',
    queries: [
      'fresh food frozen',
      'ice cold fresh',
      'chilled food storage',
      'frost fresh ingredient',
    ],
    fitsSections: ['storage'],
  },
  {
    key: 'origin',
    label: '원산지·자연',
    emoji: '🌾',
    description: '바다, 산, 밭, 자연 풍경',
    queries: [
      'korean countryside landscape',
      'ocean coastal scenery',
      'mountain field nature',
      'sunrise sea scenery',
    ],
    fitsSections: ['origin', 'story'],
  },
  {
    key: 'handmade',
    label: '손길·정성',
    emoji: '✋',
    description: '장인의 손, 수작업, 정성',
    queries: [
      'craftsman hands working',
      'artisan handmade food',
      'hands preparing food',
      'traditional craft hands',
    ],
    fitsSections: ['story', 'feature'],
  },
  {
    key: 'delivery',
    label: '배송·언박싱',
    emoji: '📦',
    description: '배송 박스, 개봉 순간',
    queries: [
      'delivery box package',
      'unboxing gift present',
      'cardboard box opening',
      'shipping package door',
    ],
    fitsSections: ['delivery'],
  },
]

// 씬 키로 씬 객체 찾기
export function getScene(key: SceneKey): Scene | undefined {
  return SCENES.find(s => s.key === key)
}

// 씬의 쿼리 중 하나를 순환 선택 (페이지 호출 때마다 다른 쿼리)
let queryRotationIdx = 0
export function pickSceneQuery(scene: Scene): string {
  const q = scene.queries[queryRotationIdx % scene.queries.length]
  queryRotationIdx++
  return q
}
