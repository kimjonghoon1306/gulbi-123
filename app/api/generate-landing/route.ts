import { NextRequest, NextResponse } from 'next/server'
import { renderLanding, type LandingData, type PresetKey, type TemplateKey } from '@/lib/landing-templates'
import { getAuthAndGeminiKey } from '@/lib/supabase-server'
import { callAI } from '@/lib/ai'

// 페르소나별 카피 톤 지침
const PERSONA_TONES: Record<string, string> = {
  grandma:
    '따뜻하고 정감있는 할머니 말투. "우리 손주~", "얼마나 맛있는지~" 같은 표현. 과하게 신파 말고 자연스럽게. 모든 문장 끝은 부드럽게.',
  shohost:
    '프리미엄 홈쇼핑 쇼호스트. 감탄보다 "확신"에 가까운 톤. "드셔보시면 압니다", "이 차이를 느끼세요" 같은 표현. 이모지·느낌표 남용 금지.',
  expert:
    '식품 장인/전문가. 객관적, 데이터 기반, 신뢰감 있게. 성분·원산지·제조방식을 구체적 숫자와 함께 설명.',
  parent:
    '가족 건강을 생각하는 엄마·아빠. "아이들 먹이기 딱 좋아요", "온가족이 함께" 같은 표현. 안심·신뢰 키워드.',
}

// 잘린(truncated) JSON 복구: 열린 채 끝난 문자열·괄호를 닫아 최대한 파싱 가능하게 만듦
function repairTruncatedJson(s: string): string {
  let inStr = false, esc = false
  const stack: string[] = []
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (esc) { esc = false; continue }
    if (c === '\\') { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '{' || c === '[') stack.push(c)
    else if (c === '}' || c === ']') stack.pop()
  }
  let out = s
  if (inStr) out += '"'                       // 문자열이 열린 채 끝남
  out = out.replace(/,\s*$/, '')              // 마지막 미완성 쉼표 제거
  for (let i = stack.length - 1; i >= 0; i--) // 열린 괄호들 역순으로 닫기
    out += stack[i] === '{' ? '}' : ']'
  return out
}

function extractJson(text: string): any | null {
  if (!text) return null
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first === -1) return null
  // 1차: 정상 종료된 JSON 시도
  if (last !== -1) {
    try { return JSON.parse(cleaned.slice(first, last + 1)) } catch {}
  }
  // 2차: 잘린 응답 복구 시도 (first 이후 전체를 닫아서 파싱)
  try { return JSON.parse(repairTruncatedJson(cleaned.slice(first))) } catch { return null }
}

type LandingCtx = {
  freshType?: string
  productGroup?: string
  origin?: string
  shipCutoff?: string
  hasHaccp?: boolean
  haccpNo?: string
  isFreshFood?: boolean
}

// 배송 문구: 판매자가 기준시간 입력 시 그대로, 없으면 시간 지어내지 않는 안전 문구.
function shipLine(cutoff?: string): string {
  return cutoff ? `평일 ${cutoff} 이전 주문 시 당일 출고` : '주문 확인 후 순차 출고됩니다'
}
// 교환/반품: 농축수산물은 고정 문구, 그 외(공산품·생활용품 등)는 7일.
function returnFaq(isFresh?: boolean): string {
  return isFresh
    ? '농·축·수산물은 신선식품 특성상 단순 변심에 의한 교환·반품이 어렵습니다. 상품에 이상이 있는 경우 수령 즉시 사진과 함께 고객센터로 문의해 주시면 신속하게 처리해 드립니다.'
    : '수령 후 7일 이내 단순 변심 교환·반품이 가능합니다. 상품 이상이 있는 경우 고객센터로 사진과 함께 연락 주시면 신속하게 처리해 드립니다.'
}
function returnDelivery(isFresh?: boolean): string {
  return isFresh ? '상품에 이상이 있을 경우\n고객센터로 문의해 주세요' : '수령 후 7일 이내\n교환·반품 가능'
}

// 품목별 조리(recipe)·보관(storage) 기본값 — 축산/수산/농산/공산품이 서로 다르게.
const FRESH_RECIPE: Record<string, any> = {
  seafood: {
    title: '가장 맛있게 즐기는 법',
    intro: '신선한 수산물의 풍미를 살리려면 해동과 손질이 중요합니다. 몇 가지만 지켜주시면 됩니다.',
    steps: [
      { name: '해동', detail: '냉동 제품은 냉장실에서 8~12시간 자연 해동하는 것이 가장 좋습니다. 급하실 땐 밀봉해 흐르는 찬물에 30분 해동하세요. 실온·전자레인지 해동은 식감이 떨어지니 피해주세요.' },
      { name: '손질', detail: '해동 후 흐르는 찬물에 가볍게 헹구고, 키친타월로 물기를 눌러 제거해 주세요. 비린내가 신경 쓰이면 청주나 소금물에 잠깐 담갔다 헹구면 좋습니다.' },
      { name: '조리', detail: '구이는 중불에서 앞뒤로 노릇하게, 찜·조림은 센 불로 끓인 뒤 중약불로 익혀주세요. 과하게 익히면 살이 질겨지니 주의하세요.' },
      { name: '완성', detail: '조리 직후 따뜻할 때 드시는 것이 가장 맛있습니다. 레몬·생강을 곁들이면 풍미가 한층 살아납니다.' },
    ],
    tip: '해동은 반드시 냉장 저온에서 천천히 하는 것이 핵심입니다. 한 번 해동한 수산물은 재냉동하지 마시고, 그날 안에 조리해 드시는 것을 권장합니다.',
  },
  livestock: {
    title: '가장 맛있게 굽는 법',
    intro: '좋은 고기는 굽기 전 준비와 불 조절이 맛을 좌우합니다.',
    steps: [
      { name: '실온 두기', detail: '조리 30분 전 냉장고에서 꺼내 실온에 두세요. 차가운 상태로 바로 구우면 겉만 익고 속은 덜 익습니다. 표면 핏물은 키친타월로 가볍게 닦아주세요.' },
      { name: '예열', detail: '팬이나 그릴을 충분히 달군 뒤 고기를 올려야 육즙이 갇힙니다. 기름은 살짝만 두르거나 지방 부위로 팬을 코팅하세요.' },
      { name: '굽기', detail: '두꺼운 부위는 센 불로 겉면을 시어링한 뒤 중약불로 속까지 익혀주세요. 자주 뒤집지 말고 한 면씩 충분히 구워야 육즙이 유지됩니다.' },
      { name: '레스팅', detail: '구운 뒤 3~5분 두었다가 썰면 육즙이 고르게 퍼져 훨씬 부드럽습니다. 결 반대로 썰면 식감이 더 좋습니다.' },
    ],
    tip: '고기는 굽기 직전 소금을 뿌리는 것이 좋습니다. 미리 뿌리면 수분이 빠져 퍽퍽해질 수 있습니다. 레스팅을 꼭 거쳐야 육즙이 살아있는 최상의 맛을 즐길 수 있습니다.',
  },
  produce: {
    title: '신선하게 즐기는 법',
    intro: '농산물은 세척과 손질만 잘해도 본연의 맛을 오래 즐길 수 있습니다.',
    steps: [
      { name: '세척', detail: '드시기 직전 흐르는 물에 가볍게 씻어주세요. 미리 씻어 보관하면 물기 때문에 쉽게 무를 수 있습니다. 흙이 많은 뿌리채소는 부드러운 솔로 살살 닦아주세요.' },
      { name: '손질', detail: '무르거나 상한 부분은 잘라내고 사용하세요. 잎채소는 밑동을 살려 보관하면 더 오래갑니다.' },
      { name: '보관·활용', detail: '바로 드시지 않을 분량은 신문지·키친타월에 싸서 냉장 보관하세요. 조리 시에는 센 불에 짧게 볶거나 데쳐야 아삭한 식감과 영양이 유지됩니다.' },
    ],
    tip: '농산물은 수분과 온도에 민감합니다. 씻지 않은 상태로 보관하고, 드실 만큼만 그때그때 손질하는 것이 신선함을 오래 유지하는 비결입니다.',
  },
}
const FRESH_STORAGE: Record<string, any> = {
  seafood: {
    title: '신선함을 지키는 보관법', recommended: '냉동 보관 (-18℃ 이하)', duration: '포장지 표시 소비기한까지',
    tips: [
      '받으신 즉시 냉동실에 넣어주세요. 상온 방치 시 신선도가 빠르게 떨어집니다.',
      '한 번 해동한 제품은 재냉동하지 마세요. 세포가 파괴되어 식감과 맛이 크게 떨어집니다.',
      '원포장 그대로 보관하고, 개봉했다면 밀폐 지퍼백에 공기를 빼고 냉동하세요.',
      '냉동실 문쪽보다 온도가 일정한 안쪽에 보관하세요.',
      '포장지의 소비기한을 확인하고 그 안에 드시는 것이 가장 좋습니다.',
    ],
  },
  livestock: {
    title: '신선함을 지키는 보관법', recommended: '냉장 0~4℃ (단기) · 냉동 -18℃ (장기)', duration: '냉장 2~3일 · 냉동 소비기한까지',
    tips: [
      '금방 드실 분량은 냉장(0~4℃), 오래 두실 분량은 냉동 보관하세요.',
      '냉장 보관 시 핏물이 고이면 키친타월로 감싸 두면 신선도가 오래 유지됩니다.',
      '냉동한 고기는 냉장실에서 천천히 해동해야 육즙 손실이 적습니다.',
      '개봉 후에는 공기와 닿지 않게 밀폐 포장하여 보관하세요.',
      '해동한 고기는 재냉동하지 말고 그날 안에 조리해 드세요.',
    ],
  },
  produce: {
    title: '신선함을 지키는 보관법', recommended: '냉장 보관 (채소칸) · 일부 서늘한 실온', duration: '품목에 따라 3~10일',
    tips: [
      '씻지 않은 상태로 보관하세요. 물기가 있으면 쉽게 무릅니다.',
      '잎채소는 키친타월에 싸서 밀폐용기에 세워 보관하면 오래갑니다.',
      '감자·양파·고구마 등은 냉장보다 서늘하고 통풍되는 곳이 좋습니다.',
      '과일은 종류에 따라 냉장/실온이 다르니 특성에 맞게 보관하세요.',
      '무르거나 상한 것은 빨리 골라내야 다른 것까지 번지지 않습니다.',
    ],
  },
}
const PROCESSED_RECIPE = {
  title: '맛있게 즐기는 법', intro: '간단한 조리·활용법만 알면 더욱 맛있게 드실 수 있습니다.',
  steps: [
    { name: '준비', detail: '포장지의 조리 안내를 먼저 확인해 주세요. 필요한 물·부재료를 미리 준비하면 조리가 수월합니다.' },
    { name: '조리', detail: '표시된 시간과 화력에 맞춰 조리해 주세요. 기호에 따라 부재료(계란·채소 등)를 더하면 풍미가 살아납니다.' },
    { name: '완성', detail: '조리 직후 따뜻할 때 드시는 것이 가장 맛있습니다. 남은 제품은 밀폐하여 보관하세요.' },
  ],
  tip: '제품에 표시된 조리법을 기준으로 하되, 기호에 맞게 부재료를 더하면 나만의 요리로 즐길 수 있습니다.',
}
const PROCESSED_STORAGE = {
  title: '올바른 보관법', recommended: '직사광선을 피한 서늘한 실온 (개봉 후 냉장)', duration: '포장지 표시 소비기한까지',
  tips: [
    '개봉 전에는 직사광선을 피해 서늘하고 건조한 곳에 보관하세요.',
    '개봉 후에는 밀폐하여 냉장 보관하고 되도록 빨리 드세요.',
    '습기가 많은 곳을 피해 보관하면 품질이 오래 유지됩니다.',
    '포장지에 표시된 소비기한을 확인하고 그 안에 드세요.',
  ],
}

function buildFallback(productName: string, retail: number, unit: string, ctx: LandingCtx = {}): Partial<LandingData> {
  const { freshType, productGroup, origin, shipCutoff, hasHaccp, isFreshFood } = ctx
  const originValue = (origin && origin.trim()) || '상품 표시사항 기준 (확인 후 수정)'
  // 품목별 recipe/storage 선택
  let recipe: any = null, storage: any = null
  if (productGroup === 'fresh') {
    const ft = (freshType && FRESH_RECIPE[freshType]) ? freshType : 'seafood'
    recipe = FRESH_RECIPE[ft]; storage = FRESH_STORAGE[ft]
  } else if (productGroup === 'processed') {
    recipe = PROCESSED_RECIPE; storage = PROCESSED_STORAGE
  }
  // 원산지 stat + (해썹 있을 때만) 인증 stat
  const originStats: OriginStat[] = [
    { value: '100', unit: '%', label: 'ORIGIN', desc: `원산지 ${originValue} 기준으로 정직하게 표기합니다. 표시사항과 다르면 판매자가 수정합니다.` },
    hasHaccp
      ? { value: 'HACCP', unit: '', label: 'SAFETY', desc: '식품안전관리인증(HACCP)을 받은 시설에서 위생 기준을 준수합니다.' }
      : { value: '신선', unit: '', label: 'FRESH', desc: '주문 확인 후 신선한 상태로 준비해 빠르게 출고합니다.' },
    { value: 'A+', unit: '', label: 'GRADE', desc: '입고 물량 중 상위 등급만 엄격하게 선별하여 제공합니다.' },
    { value: '100', unit: '%', label: 'CHECK', desc: '출고 전 상태를 한 번 더 확인한 제품만 포장합니다.' },
  ]
  const info: { key: string; value: string }[] = [
    { key: '상품명', value: productName },
    { key: '원산지', value: origin && origin.trim() ? origin.trim() : '상품 표시사항 참조' },
    { key: '중량', value: `1${unit || '개'}` },
    { key: '보관방법', value: storage?.recommended || '상품 표시사항 참조' },
    { key: '유통기한', value: storage?.duration || '포장지 표시일까지' },
    { key: '포장단위', value: `1${unit || '개'} 단위` },
    { key: '배송방법', value: isFreshFood ? '냉장/냉동 택배' : '택배' },
  ]
  if (hasHaccp) info.push({ key: '인증', value: ctx.haccpNo ? `HACCP 인증 (${ctx.haccpNo})` : 'HACCP 인증' })

  const features = [
    { title: '엄선한 재료', desc: '좋은 산지의 재료를 직접 확인해 선별합니다. 상태가 기준에 못 미치는 것은 보내지 않습니다. 재료의 품질이 곧 상품의 품질이라 믿습니다.' },
    { title: '정성스러운 준비', desc: '한 번에 대량으로 찍어내지 않습니다. 손이 더 가더라도 상태를 살피며 준비하는 방식을 고집합니다. 그래야 좋은 상태로 보내드릴 수 있습니다.' },
    hasHaccp
      ? { title: '위생·품질 관리', desc: '식품안전관리인증(HACCP)을 받은 시설에서 위생 기준을 지켜 관리합니다. 정기 점검과 자체 위생 확인을 병행합니다. 상태를 확인한 제품만 포장합니다.' }
      : { title: '꼼꼼한 품질 확인', desc: '출고 전 상태를 한 번 더 확인합니다. 색·상태를 점검하고 이상이 없는 제품만 포장해 보냅니다. 기본에 충실한 것이 가장 중요하다고 생각합니다.' },
    { title: '주문 후 준비 · 신선 출고', desc: `재고를 오래 쌓아두지 않고 주문을 확인한 뒤 준비합니다. ${shipLine(shipCutoff)}. 신선도를 지키는 포장으로 보내드립니다.` },
  ]
  const faq = [
    { q: '배송은 얼마나 걸리나요?', a: `${shipLine(shipCutoff)}. 지역과 택배 사정에 따라 하루 정도 차이가 날 수 있으며, 제주·도서산간은 1~2일 더 걸릴 수 있습니다.` },
    { q: '어떻게 포장되어 오나요?', a: isFreshFood ? '신선도 유지를 위해 냉장 또는 냉동 상태로 발송됩니다. 아이스팩·단열 포장재로 배송 중 품질 손상을 줄입니다.' : '상품이 손상되지 않도록 안전하게 포장하여 발송됩니다.' },
    { q: '교환·환불은 어떻게 하나요?', a: returnFaq(isFreshFood) },
    { q: '보관은 어떻게 하나요?', a: storage ? `${storage.recommended}이(가) 좋습니다. ${storage.tips?.[0] || ''}` : '상품 표시사항의 보관 방법을 따라 주세요.' },
  ]
  const delivery = [
    { label: 'DELIVERY', value: `${shipLine(shipCutoff)}` },
    { label: 'PACKAGING', value: isFreshFood ? '아이스팩 + 단열 포장재\n신선 포장 발송' : '안전 포장 발송' },
    { label: 'RETURN', value: returnDelivery(isFreshFood) },
    { label: 'CONTACT', value: '평일 10:00 - 18:00\n고객센터·카카오톡 문의' },
  ]

  return _buildFallbackBody(productName, retail, unit, { originValue, origin, recipe, storage, originStats, info, features, faq, delivery, isFreshFood, shipCutoff, hasHaccp })
}

function _buildFallbackBody(productName: string, retail: number, unit: string, x: any): Partial<LandingData> {
  return {
    brandName: '',
    productName,
    catchphrase: productName,
    subtitle: '엄선된 원재료로 정성껏 만든, 한 번 맛보면 잊을 수 없는 특별한 상품입니다',
    artisanQuote: '좋은 재료를 고르는 일에서부터 포장을 마무리하는 순간까지, 한 치의 타협도 없이 최선을 다합니다. 고객분들이 드셔보시면 그 차이를 바로 느끼실 거라 자신합니다.',
    artisanName: '대표',
    originLocation: (x.origin && String(x.origin).trim()) || '엄선 산지',
    originStory: '좋은 재료를 찾기 위해 산지를 직접 발로 뛰며 확인합니다. 자연이 키운 재료 본연의 맛을 살리는 것을 가장 중요하게 생각합니다. 수확·손질 직후 가장 신선한 상태로 준비해 빠르게 보내드립니다. 오랜 경험으로 좋은 것과 그렇지 않은 것을 가려내는 눈을 갖췄습니다. 대형 유통을 거치지 않고 직접 공급해 신선함과 합리적인 가격을 함께 드립니다.',
    originStats: x.originStats,
    story: '이 상품은 좋은 재료를 고르는 일에서부터 시작됩니다.\n\n가장 신선한 재료가 도착하면 그날의 준비가 시작됩니다. 눈과 손으로 하나하나 확인하는 선별 과정은 사람의 정성이 필요한 일입니다.\n\n좋은 품질을 지키기 위해 번거로운 과정도 마다하지 않습니다. 오랜 경험에서 나오는 감각으로 상태를 세심하게 살핍니다.\n\n준비를 마친 제품은 다시 한번 확인을 거칩니다. 상태를 최종 점검하고 나서야 포장에 들어갑니다. 신선도를 지키는 포장으로 고객님께 전달됩니다.\n\n저희의 목표는 단순히 파는 것이 아닙니다. 고객님의 식탁에 정성이 함께 전달되는 것, 그것이 저희가 일하는 이유입니다.',
    features: x.features,
    keyNumber: { value: 'A+', unit: '', label: '품질 약속', caption: '입고되는 물량 중 상위 등급만 골라 드립니다. 좋은 상태의 제품만 보내는 것이 저희가 드리는 가장 기본적인 약속입니다.' },
    differences: [
      { label: '원산지', theirs: '표기 불명확', ours: x.origin && String(x.origin).trim() ? `${String(x.origin).trim()} · 정직 표기` : '표시사항 정직 표기' },
      { label: '신선도', theirs: '장기 유통·재고 보관', ours: '주문 확인 후 준비·신선 출고' },
      { label: '품질 선별', theirs: '일괄 처리', ours: '직접 하나씩 선별' },
      { label: '포장', theirs: '일반 포장', ours: '신선도 유지 포장' },
      { label: '유통 단계', theirs: '도매→중간→소매', ours: '산지 직송·직거래' },
      { label: '가격', theirs: '유통 마진 다수', ours: '직거래로 합리적 가격' },
    ],
    recipe: x.recipe,
    storage: x.storage,
    reviews: [
      { text: '처음에는 반신반의하며 주문했는데 정말 깜짝 놀랐습니다. 마트에서 파는 것과는 차원이 다른 신선함이었어요. 특히 포장이 너무 꼼꼼해서 배송 중 손상도 전혀 없었습니다. 가족들이 너무 맛있다며 또 시켜달라고 해서 이미 재주문했습니다.', author: '김○○', date: '2026.03' },
      { text: '부모님 선물로 보냈는데 어머니가 전화하셔서 정말 맛있다고 칭찬을 많이 하셨어요. 백화점 식품관에서 파는 것 못지않다고 하시더라고요. 가격 대비 품질이 너무 좋아서 이제 명절 선물은 여기서만 살 것 같습니다.', author: '이○○', date: '2026.03' },
      { text: '온라인에서 식품 주문하는 걸 꺼렸는데 지인 추천으로 처음 구매했습니다. 걱정과 달리 신선도가 완벽하게 유지된 채로 도착했고, 맛도 기대 이상이었습니다. 배송도 빨라서 주문 다음날 받았네요. 앞으로 정기적으로 구매할 것 같습니다.', author: '박○○', date: '2026.02' },
      { text: '혼자 사는 1인 가구인데 소량 포장이 있어서 좋았어요. 한 번에 다 못 먹을까봐 걱정했는데 개별 포장이라 그때그때 꺼내 먹기 편했습니다. 조리도 간단해서 바쁜 아침에도 금방 먹을 수 있었습니다.', author: '최○○', date: '2026.02' },
      { text: '식품 관련 일을 하는 사람으로서 원재료 품질에 대해 꼼꼼히 따지는 편입니다. 여기 제품은 정말 원재료 관리가 철저하다는 느낌이 왔습니다. 향도 자연스럽고 인공적인 느낌이 전혀 없어요. 가격이 조금 있지만 그 값어치를 충분히 합니다.', author: '정○○', date: '2026.01' },
    ],
    info: x.info,
    faq: x.faq,
    delivery: x.delivery,
    price: { retail, wholesale: 0, unit: unit || '개' },
  }
}

type OriginStat = { value: string; unit: string; label: string; desc: string }

// originStats는 2×2 고정 그리드로 렌더된다. AI가 덜 주거나 빈 값을 섞어 주면
// 빈칸이 생기므로, 항상 유효값 4개를 보장하도록 정규화한다.
// (AI 값 우선 → 빈 desc 등은 보정 → 부족분은 fallback에서 라벨 안 겹치게 채움)
function normalizeOriginStats(ai: any, fb: OriginStat[]): OriginStat[] {
  const clean: OriginStat[] = []
  const seen = new Set<string>()
  const genericDesc = '엄격한 기준으로 선별한, 믿고 드실 수 있는 품질입니다.'

  const push = (s: any) => {
    if (clean.length >= 4) return
    const value = String(s?.value ?? '').trim()
    const label = String(s?.label ?? '').trim()
    if (!value || !label) return
    const key = label.toUpperCase()
    if (seen.has(key)) return
    seen.add(key)
    const fbMatch = fb.find((f) => f.label.toUpperCase() === key)
    clean.push({
      value,
      unit: String(s?.unit ?? '').trim(),
      label,
      desc: String(s?.desc ?? '').trim() || fbMatch?.desc || genericDesc,
    })
  }

  if (Array.isArray(ai)) ai.forEach(push)
  // 부족분은 fallback stat으로 채워 항상 4개를 맞춘다.
  for (const f of fb) {
    if (clean.length >= 4) break
    push(f)
  }
  return clean.slice(0, 4)
}

function mergeData(
  ai: any,
  fb: Partial<LandingData>,
  productName: string,
  sectionImages: LandingData['sectionImages'],
  unusedImages: string[],
): LandingData {
  const pick = <T>(a: T | undefined, b: T): T => (a === undefined || a === null || (Array.isArray(a) && a.length === 0) ? b : a)
  return {
    brandName: pick(ai?.brandName, fb.brandName || ''),
    productName: ai?.productName || productName,
    catchphrase: pick(ai?.catchphrase, fb.catchphrase!),
    subtitle: pick(ai?.subtitle, fb.subtitle!),
    artisanQuote: pick(ai?.artisanQuote, fb.artisanQuote!),
    artisanName: pick(ai?.artisanName, fb.artisanName!),
    originLocation: pick(ai?.originLocation, fb.originLocation!),
    originStory: pick(ai?.originStory, fb.originStory!),
    originStats: normalizeOriginStats(ai?.originStats, fb.originStats as OriginStat[]),
    story: pick(ai?.story, fb.story!),
    features: pick(ai?.features, fb.features!),
    keyNumber: pick(ai?.keyNumber, fb.keyNumber!),
    differences: pick(ai?.differences, fb.differences!),
    recipe: pick(ai?.recipe, fb.recipe!),
    storage: pick(ai?.storage, fb.storage!),
    ingredients: ai?.ingredients,
    dosage: ai?.dosage,
    usage: ai?.usage,
    specs: ai?.specs,
    warranty: ai?.warranty,
    artist: ai?.artist,
    materials: ai?.materials,
    care: ai?.care,
    reviews: pick(ai?.reviews, fb.reviews!),
    info: pick(ai?.info, fb.info!),
    faq: pick(ai?.faq, fb.faq!),
    delivery: pick(ai?.delivery, fb.delivery!),
    price: fb.price!,
    mainImageUrl: sectionImages?.hero || '',
    sectionImages,
    unusedImages,
  }
}

// AI가 준 값이라도 판매자가 입력한 '사실'(원산지·배송시간·해썹·교환반품)과 다르면 강제로 바로잡는다.
// 사실과 다른 상세페이지가 나가면 안 되므로, 생성 후 마지막 안전장치.
function enforceFacts(d: LandingData, ctx: LandingCtx, fbOriginStats: OriginStat[]): LandingData {
  const originClean = (ctx.origin || '').trim()
  const { shipCutoff, hasHaccp, isFreshFood } = ctx

  // 1) 배송 시간 문구 전역 치환 — AI가 지어낸 "평일 오후 N시"류를 입력값(없으면 안전 문구)으로 통일
  const shipReplace = (s: string) =>
    s.replace(/(평일\s*)?(오전|오후)\s*\d{1,2}\s*시(\s*이전)?/g, shipCutoff ? `평일 ${shipCutoff} 이전` : '주문 확인 후')
  const walk = (v: any): any => {
    if (typeof v === 'string') return shipReplace(v)
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') { const o: any = {}; for (const k in v) o[k] = walk(v[k]); return o }
    return v
  }
  const out = walk(d) as LandingData

  // 2) 원산지 강제 (입력했을 때만)
  if (originClean) {
    if (Array.isArray(out.info)) out.info = out.info.map((it: any) => /원산지/.test(it?.key || '') ? { ...it, value: originClean } : it)
    if (Array.isArray(out.differences)) out.differences = out.differences.map((df: any) => /원산지/.test(df?.label || '') ? { ...df, ours: `${originClean} · 정직 표기` } : df)
    if (Array.isArray(out.originStats)) out.originStats = out.originStats.map((st: any) => (st?.label || '').toUpperCase() === 'ORIGIN' ? { ...st, desc: `원산지 ${originClean} 기준으로 정직하게 표기합니다.` } : st)
    out.originLocation = originClean
  }

  // 3) 해썹 미인증 → 인증/HACCP 언급 제거 (제작자가 해썹 입력했을 때만 노출)
  if (!hasHaccp) {
    if (Array.isArray(out.originStats)) out.originStats = out.originStats.filter((st: any) => !/HACCP|해썹|인증/i.test(`${st?.value} ${st?.label} ${st?.desc}`))
    if (Array.isArray(out.info)) out.info = out.info.filter((it: any) => !(/인증/.test(it?.key || '') || /HACCP|해썹/i.test(it?.value || '')))
    if (Array.isArray(out.features)) out.features = out.features.map((ft: any) => /HACCP|해썹|위해요소/i.test(ft?.desc || '')
      ? { ...ft, title: /HACCP|해썹|위생|인증/.test(ft?.title || '') ? '꼼꼼한 품질 확인' : ft.title, desc: '출고 전 상태를 한 번 더 확인합니다. 색·상태를 점검하고 이상이 없는 제품만 포장해 보냅니다. 기본에 충실한 것이 가장 중요하다고 생각합니다.' }
      : ft)
    // originStats가 4개 미만이 되면 fallback으로 다시 채움
    out.originStats = normalizeOriginStats(out.originStats, fbOriginStats)
  }

  // 4) 교환/반품 강제 — 농축수산물은 고정 문구, 그 외는 7일
  if (Array.isArray(out.faq)) out.faq = out.faq.map((f: any) => /교환|반품|환불/.test(f?.q || '') ? { ...f, a: returnFaq(isFreshFood) } : f)
  if (Array.isArray(out.delivery)) out.delivery = out.delivery.map((dv: any) => (dv?.label === 'RETURN' || /반품|교환/.test(dv?.label || '')) ? { ...dv, value: returnDelivery(isFreshFood) } : dv)

  return out
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthAndGeminiKey()
    if (!auth.ok) {
      console.error('[generate-landing] auth/key failed', auth.error)
      return NextResponse.json({ error: 'AI 상세페이지 생성 설정을 확인해 주세요.' }, { status: auth.status })
    }

    const body = await req.json()
    const { persona, productName, origin, retailPrice, wholesalePrice, unit, theme, productGroup, freshType, basicInfo } = body
    // 배송 기준시간(예: "오후 2시")·해썹 인증여부 — 판매자 입력. 없으면 안전 문구로.
    const shipCutoff: string = typeof body.shipCutoff === 'string' ? body.shipCutoff.trim() : ''
    const hasHaccp: boolean = body.hasHaccp === true
    const haccpNo: string = typeof body.haccpNo === 'string' ? body.haccpNo.trim() : ''
    // 농축수산물(신선식품)인지 = 교환/반품 규칙 분기
    const isFreshFood = productGroup === 'fresh'

    let imageList: { base64: string; mimeType: string }[] = []
    if (Array.isArray(body.images) && body.images.length > 0) {
      imageList = body.images.slice(0, 10)
    } else if (body.base64) {
      imageList = [{ base64: body.base64, mimeType: body.mimeType || 'image/jpeg' }]
    }
    if (body.mode === 'basic-info' && body.imageUrl && imageList.length < 10) {
      try {
        const imageUrl = new URL(body.imageUrl)
        if (imageUrl.protocol !== 'https:') throw new Error('invalid image URL')
        const imageResponse = await fetch(imageUrl, { cache: 'no-store' })
        if (!imageResponse.ok) throw new Error('image fetch failed')
        const imageBuffer = await imageResponse.arrayBuffer()
        if (imageBuffer.byteLength > 8 * 1024 * 1024) throw new Error('image too large')
        imageList.unshift({ base64: Buffer.from(imageBuffer).toString('base64'), mimeType: imageResponse.headers.get('content-type') || 'image/jpeg' })
      } catch {
        return NextResponse.json({ error: '기존 대표이미지를 불러오지 못했습니다.' }, { status: 400 })
      }
    }

    if (imageList.length === 0) {
      return NextResponse.json({ error: '[v2] 이미지를 먼저 올려주세요. (업로드하신 이미지가 서버에 전달되지 않았습니다)' }, { status: 400 })
    }

    // 완전히 동일한 이미지(같은 파일 중복 업로드)는 1장만 남긴다.
    {
      const seen = new Set<string>()
      imageList = imageList.filter((img) => {
        const sig = `${img.base64.length}:${img.base64.slice(0, 80)}:${img.base64.slice(-80)}`
        if (seen.has(sig)) return false
        seen.add(sig)
        return true
      })
    }

    const geminiKey = auth.geminiKey

    if (body.mode === 'basic-info') {
      const basicInfoPrompt = `첨부된 상품 이미지를 분석해 상세페이지 작성용 기본정보 초안을 만드세요.
상품명은 ${productName || '(알 수 없음)'}입니다. 사진과 상품명을 바탕으로 판매자가 수정해서 쓸 수 있는 자연스러운 초안을 작성하세요.
선택된 상품군은 ${productGroup || '(미선택)'}입니다. productGroup은 이 값을 그대로 반환하세요.
basicInfo에는 아래 공통 키와 선택한 상품군의 키를 모두 사용하고 모든 값을 빠짐없이 한 문장 이상 채우세요. 빈 문자열은 절대 반환하지 마세요.
공통: oneLine, composition, highlights, difference, recommendedFor, packagingShipping, certifications
fresh: tasteTexture, selectionProduction, storageShelfLife, preparation, ingredientsAllergy
processed: ingredientsAllergy, manufacturing, tasteTexture, storageShelfLife, preparation
living: material, sizeWeight, functions, usage, care
electronics: modelSpecs, sizeWeight, components, compatibility, usage, warranty
craft: material, sizeWeight, makerStory, usage, care
사진만으로 확정할 수 없는 원산지·함량·인증번호·소비기한은 사실처럼 만들지 말고 "상품 표시사항 기준으로 확인 후 수정해 주세요"처럼 판매자가 수정할 초안을 넣으세요.
반드시 {"productGroup":"fresh","basicInfo":{"oneLine":"..."}} 형태의 JSON 객체만 출력하세요.`
      const aiResult = await callAI({
        keys: { geminiKey },
        system: '당신은 상품 이미지를 분석해 판매자가 수정할 상세페이지 기본정보 초안을 JSON으로 작성하는 전문가입니다.',
        prompt: basicInfoPrompt,
        images: imageList.slice(0, 3),
        maxTokens: 3000,
        jsonMode: true,
        prefer: 'gemini',
      })
      if (!aiResult.ok) {
        console.error('[generate-landing/basic-info] AI failed', aiResult.error)
        return NextResponse.json({ error: aiResult.error || '이미지 분석에 실패했습니다.' }, { status: 502 })
      }
      const parsed = extractJson(aiResult.text)
      if (!parsed?.basicInfo) {
        console.error('[generate-landing/basic-info] invalid JSON response', aiResult.text.slice(0, 500))
        return NextResponse.json({ error: '상품 정보를 읽지 못했습니다.' }, { status: 502 })
      }
      const allowedGroups = new Set(['fresh', 'processed', 'living', 'electronics', 'craft'])
      if (!allowedGroups.has(productGroup)) return NextResponse.json({ error: '상품군을 먼저 선택해주세요.' }, { status: 400 })
      const commonKeys = ['oneLine', 'composition', 'highlights', 'difference', 'recommendedFor', 'packagingShipping', 'certifications']
      const groupKeys: Record<string, string[]> = {
        fresh: ['tasteTexture', 'selectionProduction', 'storageShelfLife', 'preparation', 'ingredientsAllergy'],
        processed: ['ingredientsAllergy', 'manufacturing', 'tasteTexture', 'storageShelfLife', 'preparation'],
        living: ['material', 'sizeWeight', 'functions', 'usage', 'care'],
        electronics: ['modelSpecs', 'sizeWeight', 'components', 'compatibility', 'usage', 'warranty'],
        craft: ['material', 'sizeWeight', 'makerStory', 'usage', 'care'],
      }
      const safeBasicInfo = Object.fromEntries([...commonKeys, ...groupKeys[productGroup]].map(key => {
        const value = typeof parsed.basicInfo[key] === 'string' ? parsed.basicInfo[key].trim() : ''
        return [key, value || '이미지와 상품 표시사항을 확인해 실제 정보로 수정해 주세요.']
      }))
      return NextResponse.json({ productGroup, basicInfo: safeBasicInfo, provider: aiResult.provider })
    }

    const toneText = PERSONA_TONES[persona] || PERSONA_TONES.shohost
    const groupLabels: Record<string, string> = {
      fresh: '신선식품·농축수산물', processed: '가공식품·건강식품', living: '생활용품',
      electronics: '전자기기·디바이스', craft: '공예품·패션·기타',
    }
    const providedInfo = Object.entries(basicInfo && typeof basicInfo === 'object' ? basicInfo : {})
      .filter(([, value]) => typeof value === 'string' && value.trim())
      .map(([key, value]) => `- ${key}: ${String(value).trim()}`)
      .join('\n')

    const systemPrompt = `당신은 대한민국 최고의 프리미엄 상세페이지 카피라이터 & 편집 디렉터입니다.
여러 장의 상품 이미지를 각각 꼼꼼히 보고 용도를 판단한 뒤,
상품 본질을 꿰뚫는 풍성하고 설득력 있는 카피를 만듭니다.

반드시 JSON 객체만 출력합니다. 코드블록, 설명, 다른 텍스트 금지.

★ 핵심 원칙: 내용은 언제나 충분히 길고 풍부하게. 짧고 단조로운 문장은 절대 금지.
각 desc, story, detail, tip, a(FAQ 답변) 필드는 반드시 구체적인 근거·느낌·수치·배경을 담아 작성하세요.`

    const userPrompt = `
첨부된 이미지는 총 ${imageList.length}장. 각 이미지를 순서대로 [0번], [1번]... 으로 부릅니다.
각 이미지를 분석해 어떤 상세페이지 섹션에 쓸지 판단하고, 그에 맞는 카피를 만드세요.

[상품 정보]
- 상품명: ${productName || '(이미지로 파악)'}
- 상품군: ${groupLabels[productGroup] || productGroup || '(미입력)'}${productGroup === 'fresh' ? ` / 세부품목: ${freshType === 'livestock' ? '축산물(정육)' : freshType === 'seafood' ? '수산물' : freshType === 'produce' ? '농산물' : '(미선택)'}` : ''}
- 원산지: ${origin || '(미입력)'}
- 당일배송 기준시간: ${shipCutoff || '(미입력 — 배송 시간을 지어내지 말 것)'}
- 해썹(HACCP) 인증: ${hasHaccp ? `있음${haccpNo ? ` (인증번호 ${haccpNo})` : ''}` : '없음 — 인증/HACCP/위해요소 관련 문구 절대 작성 금지'}
- 소매가: ${retailPrice || '?'}원
- 도매가: ${wholesalePrice || '-'}원
- 단위: ${unit || '개'}
- 테마: ${theme || 'premium'}

[판매자가 직접 작성한 상세 기본정보 — 가장 우선해서 반영]
${providedInfo || '- 추가 입력 없음'}

[★★ 절대 지킬 사실 규칙 — 어기면 안 됨 ★★]
- 원산지: 위 '원산지' 값을 그대로 쓰세요. "국내산"이라고 임의로 쓰지 마세요. 입력값이 노르웨이산이면 노르웨이산으로, 미입력이면 "상품 표시사항 기준"으로.
- 배송: 위 '당일배송 기준시간'이 입력됐으면 그 시간만 쓰고, 미입력이면 "주문 확인 후 순차 출고"로만 쓰세요. 오전/오후 몇 시 같은 시간을 절대 지어내지 마세요.
- 해썹: 위 '해썹 인증'이 '없음'이면 HACCP·해썹·위생인증·위해요소 관련 문구를 originStats/info/features/story 어디에도 쓰지 마세요.
- 교환/반품: ${isFreshFood ? '농·축·수산물이므로 "단순 변심 교환·반품 불가, 이상 시 고객센터 문의"로만 쓰세요. "7일 이내" 같은 문구 금지.' : '"수령 후 7일 이내 교환·반품 가능"으로 쓰세요.'}
- 보관·조리: ${productGroup === 'fresh' ? (freshType === 'livestock' ? '축산물이므로 냉장/냉동 보관, 실온에 잠깐 두었다 굽기·핏물 제거 등 정육 기준으로 쓰세요. 해동·냉동생선 문구 금지.' : freshType === 'seafood' ? '수산물이므로 해동·냉동 보관 기준으로 쓰세요.' : freshType === 'produce' ? '농산물이므로 세척·냉장 보관, 흙 손질 등 채소·과일 기준으로 쓰세요. 해동 문구 금지.' : '세부품목에 맞게 쓰세요.') : productGroup === 'processed' ? '공산품(가공식품)이므로 조리·활용법과 실온/개봉 후 냉장 보관 기준으로 쓰세요. 해동 문구 금지.' : '해당 상품군에 맞게 쓰세요.'}

[작성 방향]
- 판매자가 입력한 기본정보를 핵심 근거로 삼아 자연스럽고 풍성한 구매 카피로 확장하세요.
- 상품군에 맞는 내용에 집중하세요. 신선식품은 맛·식감·선별·보관·조리, 가공식품은 원재료·제조·섭취, 생활용품은 소재·크기·사용·관리, 전자기기는 사양·호환·구성품·보증, 공예품은 소재·제작 과정·관리 중심입니다.
- 입력하지 않은 항목도 이미지에서 확실히 관찰되는 특징과 일반적인 활용 제안은 풍성하게 작성할 수 있습니다.
- 입력값과 이미지로 확인할 수 없는 인증번호·원산지·성분 함량·배송 약속·보증기간은 임의로 만들지 마세요.

[카피 톤 — 반드시 지킬 것]
${toneText}

[섹션 이미지 배치 규칙]
- hero   : 상품 메인 샷 (상품 자체가 중앙에 잘 보이는 사진) — 1장 필수
- origin : 원산지·자연 풍경, 재료 산지 느낌 사진
- story  : 작업 장면, 사람 손길, 공방 분위기
- recipe : 조리 과정, 플레이팅, 완성된 요리
- storage: 냉동/보관 관련

중복 금지: 같은 이미지를 두 섹션에 쓰지 마세요.
부적절 금지: 해당 섹션에 어울리지 않으면 null. 억지로 넣지 마세요.
unusedIndices: 어느 섹션에도 안 어울리는 이미지 인덱스들.

★ 유사 이미지 그룹 (nearDuplicateGroups): 시각적으로 거의 같은 사진(같은 피사체를 각도·거리만 살짝 달리해 찍은 것, 사실상 똑같은 컷)들을 한 그룹으로 묶으세요. 그룹 안에서는 대표 1장만 본문에 쓰고 나머지는 아래 갤러리로 내립니다. 조금이라도 다른 정보를 담은 사진(다른 장면·다른 구성)은 절대 같은 그룹에 넣지 마세요. 서로 다른 사진들은 최대한 본문 여러 섹션에 골고루 배치되도록 서로 다른 섹션에 할당하세요.

★★★ 글 분량 & 품질 요구사항 — 반드시 지킬 것 ★★★

① catchphrase: 10~16자. 강렬하고 기억에 남는 히어로 카피.
② subtitle: 30~45자. 상품 핵심 가치와 차별점을 한 줄로 압축.
③ artisanQuote: 60~100자. 장인의 철학·신념·자부심이 느껴지는 진심 어린 문장.
④ originStory: 최소 5문장. 산지의 지리적 특성, 기후, 오랜 역사, 장인 정신을 구체적으로 서술.
⑤ story: 최소 10문장 이상. 상품이 탄생하는 전 과정을 감성적으로 묘사. 재료 선별→가공→완성→포장까지 흐름 있게. 각 문장 최소 20자 이상. 줄바꿈은 \\n 사용.
⑥ features: 반드시 4~5개. 각 desc는 3~4문장으로 구체적인 이유·수치·차별점 포함.
⑦ keyNumber.caption: 2~3문장. 숫자의 의미와 배경을 충분히 설명.
⑧ differences: 반드시 6~7개 항목. 소비자가 실제로 체감하는 차이 위주로 선정.
⑨ recipe.steps: 4~6단계. 각 detail은 2~3문장으로 온도·시간·요령 등 구체적 정보 포함.
⑩ recipe.tip: 3~4문장. 전문가만 아는 핵심 비법을 구체적으로.
⑪ storage.tips: 반드시 5개. 각 tip은 보관 방법 + 이유를 설명하는 2문장으로.
⑫ reviews: 반드시 5개. 각 text는 3~5문장의 생생한 실사용 후기. 단순 칭찬 금지, 구체적 경험 서술.
⑬ faq: 반드시 6~7개. 각 a(답변)는 2~3문장으로 충분히 설명.
⑭ info: 8~10개 항목. 상품명·원산지·중량·보관방법·유통기한·제조방법·알레르기 등 포함.

[상품군별 전용 섹션]
- fresh: recipe와 storage를 작성하세요.
- processed: ingredients를 작성하고, 섭취법이 있으면 dosage, 조리·활용법이 있으면 recipe를 작성하세요.
- living: usage, specs, care를 작성하세요. recipe와 storage는 null로 두세요.
- electronics: usage, specs, warranty를 작성하세요. recipe와 storage는 null로 두세요.
- craft: materials, usage, care를 작성하고 판매자가 제작자 정보를 입력한 경우에만 artist를 작성하세요. recipe와 storage는 null로 두세요.
- 해당하지 않거나 작성 근거가 없는 전용 섹션은 null로 반환하세요.

[출력 JSON 구조]
{
  "brandName": "브랜드명 2~6자",
  "productName": "정식 상품명",
  "catchphrase": "히어로 카피 10~16자",
  "subtitle": "서브 카피 30~45자",
  "artisanQuote": "장인 인용구 60~100자",
  "artisanName": "출처/직책",
  "originLocation": "실제 한국 유명 산지 (예: 전남 영광 법성포)",
  "originStory": "5문장 이상 원산지 스토리",
  "originStats": [{"value":"","unit":"","label":"","desc":"구체적 설명 1~2문장"}],
  "story": "10문장 이상 상품 탄생 스토리 (줄바꿈은 \\n 사용)",
  "features": [
    {"title":"특징명 6~10자","desc":"3~4문장 구체적 설명 — 이유·수치·차별점 포함"}
  ],
  "keyNumber": {"value":"숫자","unit":"단위","label":"의미 레이블","caption":"2~3문장 설명"},
  "differences": [{"label":"항목명","theirs":"일반제품","ours":"당사제품"}],
  "recipe": {
    "title": "조리법 제목",
    "intro": "2~3문장 도입",
    "steps": [{"name":"단계명","detail":"2~3문장 구체적 방법 (온도·시간·요령 포함)"}],
    "tip": "3~4문장 전문가 핵심 비법"
  },
  "storage": {
    "title": "보관법 제목",
    "recommended": "보관 방법",
    "duration": "보관 기간",
    "tips": ["보관 방법 + 이유를 설명하는 2문장짜리 tip — 반드시 5개"]
  },
  "ingredients": {"title":"원재료·성분","intro":"설명","items":[{"name":"원재료명","amount":"함량 또는 빈 문자열","effect":"특징 설명"}]},
  "dosage": {"title":"섭취 방법","intro":"설명","steps":[{"name":"단계명","detail":"방법"}],"caution":"주의사항"},
  "usage": {"title":"사용 방법","intro":"설명","steps":[{"name":"단계명","detail":"방법"}],"tip":"활용 팁"},
  "specs": {"title":"상품 사양","items":[{"key":"항목","value":"값"}]},
  "warranty": {"title":"품질보증","period":"기간","scope":"범위","contact":"문의 방법"},
  "artist": {"title":"제작자 이야기","name":"이름","career":"경력","quote":"제작 철학"},
  "materials": {"title":"소재와 제작","intro":"설명","items":[{"name":"소재명","desc":"특징"}]},
  "care": {"title":"관리 방법","tips":["관리 팁"]},
  "reviews": [
    {"text":"3~5문장 구체적 실사용 후기 (구체적 경험·상황 포함, 단순 칭찬 금지)","author":"홍○○","date":"2026.03"}
  ],
  "info": [{"key":"항목명","value":"상세값"}],
  "faq": [{"q":"실제 구매자가 궁금해할 질문","a":"2~3문장 충분한 답변"}],
  "delivery": [{"label":"레이블","value":"내용"}],

  "sectionAssignment": {
    "hero": <인덱스 또는 null>,
    "origin": <인덱스 또는 null>,
    "story": <인덱스 또는 null>,
    "recipe": <인덱스 또는 null>,
    "storage": <인덱스 또는 null>
  },
  "unusedIndices": [<미사용 인덱스>],
  "nearDuplicateGroups": [[<서로 거의 동일한 이미지 인덱스들>]],
  "recommendedTemplate": "<이 상품에 가장 어울리는 템플릿 1개>"
}

[templates] recommendedTemplate은 다음 중 상품 성격에 맞게 하나 고르세요:
- premium: 고급 명품 스타일(식품·선물세트 등 프리미엄)
- luxury: 다크 골드 명품(고가·프리미엄 주류/한우 등)
- magazine: 에디토리얼 세리프(스토리가 중요한 산지 직송·전통식품)
- pop: 밝고 컬러풀·MZ 감성(간식·디저트·음료 등 젊은 타깃)
- clean: 화이트 미니멀(화장품·패션·건강기능식품)
- modern/business/traditional/emotional: 그 외 성격에 맞게
상품이 어떤 느낌이든 premium만 고르지 말고, 상품 특성에 맞는 걸 자신 있게 추천하세요.

중요: sectionAssignment에서 같은 인덱스를 두 번 쓰지 마세요.
섹션에 어울리는 사진이 없으면 null. 억지로 채우면 안 됩니다.
★ 모든 텍스트 필드는 충분히 길고 구체적으로 작성. 단답형·단문 절대 금지.`

    // Gemini 멀티모달 parts 구성 (이미지 + 텍스트)
    const parts: any[] = imageList.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.base64 },
    }))
    parts.push({ text: `위 이미지들은 [0번]부터 [${imageList.length - 1}번]까지입니다.\n\n${userPrompt}` })

    const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']
    let rawText = ''
    let lastError = ''

    for (const model of GEMINI_MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts }],
              generationConfig: { maxOutputTokens: 8192, responseMimeType: 'application/json' },
            }),
          }
        )

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          const msg = (err.error?.message || '').toLowerCase()
          if (res.status === 400 && msg.includes('api key')) {
            return NextResponse.json({ error: 'Gemini API 키가 잘못되었습니다. 설정에서 확인해주세요.' }, { status: 400 })
          }
          if (res.status === 403) {
            return NextResponse.json({ error: 'Gemini API 키 권한이 없습니다.' }, { status: 403 })
          }
          if ([429, 503, 404].includes(res.status) || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('rate') || msg.includes('overloaded')) {
            lastError = `${model} 한도초과`
            continue
          }
          lastError = `${model} 오류 (${res.status})`
          continue
        }

        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (!text) { lastError = `${model} 빈 응답`; continue }
        rawText = text
        break
      } catch (e: any) {
        console.error('[generate-landing] model request failed', { model, error: e })
        lastError = `${model} 네트워크 오류: ${e.message}`
        continue
      }
    }

    if (!rawText) {
      console.error('[generate-landing] all models failed', lastError)
      return NextResponse.json({ error: '상세페이지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
    }
    const aiJson = extractJson(rawText)

    // 섹션 배치 매핑 — 서로 다른 이미지를 본문 5칸에 골고루, 유사본은 갤러리로
    const assignment = aiJson?.sectionAssignment || {}
    const usedIndices = new Set<number>()
    const sectionImages: LandingData['sectionImages'] = {}
    const sectionKeys = ['hero', 'origin', 'story', 'recipe', 'storage'] as const
    const dataUrl = (i: number) => `data:${imageList[i].mimeType};base64,${imageList[i].base64}`

    // 유사(거의 동일)하다고 판단된 이미지는 대표 1장만 본문에 쓰고 나머지는 갤러리로 강제
    const forcedGallery = new Set<number>()
    const groups: unknown[] = Array.isArray(aiJson?.nearDuplicateGroups) ? aiJson.nearDuplicateGroups : []
    const assignedIdx = Object.values(assignment).filter((v): v is number => typeof v === 'number')
    for (const g of groups) {
      if (!Array.isArray(g)) continue
      const valid = g.filter((i: unknown): i is number => typeof i === 'number' && i >= 0 && i < imageList.length)
      if (valid.length < 2) continue
      // 대표: AI가 섹션에 지정한 인덱스가 그룹에 있으면 그것, 없으면 첫 번째
      const rep = valid.find((i) => assignedIdx.includes(i)) ?? valid[0]
      for (const i of valid) if (i !== rep) forcedGallery.add(i)
    }

    // 1) AI가 지정한 섹션 배치 (유사본 제외)
    for (const key of sectionKeys) {
      const idx = assignment[key]
      if (typeof idx === 'number' && idx >= 0 && idx < imageList.length && !usedIndices.has(idx) && !forcedGallery.has(idx)) {
        usedIndices.add(idx)
        sectionImages[key] = dataUrl(idx)
      }
    }

    // 2) hero 미할당 시 서로 다른(유사본 아닌) 첫 이미지로
    if (!sectionImages.hero) {
      for (let i = 0; i < imageList.length; i++) {
        if (!usedIndices.has(i) && !forcedGallery.has(i)) { usedIndices.add(i); sectionImages.hero = dataUrl(i); break }
      }
    }

    // 3) 빈 섹션을 서로 다른 이미지로 채워 본문에 골고루 분산 (본문 최대 5칸)
    for (const key of ['origin', 'story', 'recipe', 'storage'] as const) {
      if (sectionImages[key]) continue
      for (let i = 0; i < imageList.length; i++) {
        if (!usedIndices.has(i) && !forcedGallery.has(i)) { usedIndices.add(i); sectionImages[key] = dataUrl(i); break }
      }
    }

    // 4) 본문에 못 들어간 나머지(유사본 + 5칸 초과분)는 맨 아래 갤러리로
    const unusedImages: string[] = []
    for (let i = 0; i < imageList.length; i++) {
      if (!usedIndices.has(i)) unusedImages.push(dataUrl(i))
    }

    const landingCtx: LandingCtx = { freshType, productGroup, origin, shipCutoff, hasHaccp, haccpNo, isFreshFood }
    const fb = buildFallback(productName || '상품', Number(retailPrice) || 0, unit || '개', landingCtx)
    let finalData = mergeData(aiJson, fb, productName || '상품', sectionImages, unusedImages)
    finalData = enforceFacts(finalData, landingCtx, fb.originStats as OriginStat[])

    // 템플릿 선택: 사용자가 고른 게 있으면 그것, 없으면 AI 추천, 그것도 없으면 랜덤
    // (프리미엄 고정 방지 — 사용자는 나중에 UI에서 바꿀 수 있음)
    const VALID_TEMPLATES: TemplateKey[] = ['premium', 'modern', 'traditional', 'business', 'emotional', 'magazine', 'luxury', 'pop', 'clean']
    const TEMPLATE_PRESET: Record<TemplateKey, PresetKey> = {
      premium: 'gold', luxury: 'dark', pop: 'pink', clean: 'white',
      modern: 'blue', magazine: 'dark', business: 'blue', emotional: 'red', traditional: 'gold',
    }
    const userChoice = typeof theme === 'string' && VALID_TEMPLATES.includes(theme as TemplateKey) ? (theme as TemplateKey) : null
    const aiChoice = VALID_TEMPLATES.includes(aiJson?.recommendedTemplate) ? (aiJson.recommendedTemplate as TemplateKey) : null
    const templateKey: TemplateKey = userChoice || aiChoice || VALID_TEMPLATES[Math.floor(Math.random() * VALID_TEMPLATES.length)]
    const presetKey: PresetKey = TEMPLATE_PRESET[templateKey] || 'gold'

    const html = renderLanding(finalData, presetKey, templateKey)

    return NextResponse.json({ html, data: finalData, templateKey, presetKey })
  } catch (e: any) {
    console.error('[generate-landing] unexpected error', e)
    return NextResponse.json({ error: '상세페이지 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
