import { NextRequest, NextResponse } from 'next/server'
import { renderLanding, type LandingData } from '@/lib/landing-templates'
import { getAuthAndGeminiKey } from '@/lib/supabase-server'

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

function extractJson(text: string): any | null {
  if (!text) return null
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first === -1 || last === -1) return null
  const jsonStr = cleaned.slice(first, last + 1)
  try { return JSON.parse(jsonStr) } catch { return null }
}

function buildFallback(productName: string, retail: number, unit: string): Partial<LandingData> {
  return {
    brandName: '',
    productName,
    catchphrase: productName,
    subtitle: '엄선된 원재료로 정성껏 만든, 한 번 맛보면 잊을 수 없는 특별한 상품입니다',
    artisanQuote: '좋은 재료를 고르는 일에서부터 포장을 마무리하는 순간까지, 한 치의 타협도 없이 최선을 다합니다. 고객분들이 드셔보시면 그 차이를 바로 느끼실 거라 자신합니다.',
    artisanName: '대표',
    originLocation: '국내 엄선 산지',
    originStory: '오랜 세월 전통을 이어온 산지에서 직접 공수한 최상급 원재료만을 사용합니다. 사계절 일교차가 큰 천혜의 자연환경 덕분에 풍부한 맛과 향을 자랑합니다. 산지 농가와의 긴밀한 협력 관계를 통해 수확 직후 가장 신선한 상태로 받아볼 수 있습니다. 수십 년의 노하우를 가진 장인들이 직접 선별·가공하여 한결같은 품질을 유지합니다. 대형 유통망을 거치지 않고 소비자에게 직접 공급하기 때문에 더욱 신선하고 합리적인 가격으로 제공됩니다.',
    originStats: [
      { value: '100', unit: '%', label: 'ORIGIN', desc: '국내산 원재료만을 엄선하여 사용합니다. 수입산 원재료는 일절 사용하지 않습니다.' },
      { value: 'HACCP', unit: '', label: 'SAFETY', desc: '위해요소 중점관리 기준을 완벽히 준수합니다. 정기적인 위생 점검으로 안전을 보장합니다.' },
      { value: '24', unit: 'h', label: 'FRESH', desc: '주문 접수 후 24시간 이내 신선한 상태로 출고됩니다. 당일 제조·당일 출고를 원칙으로 합니다.' },
      { value: 'A+', unit: '', label: 'GRADE', desc: '전체 입고 물량 중 상위 등급만을 엄격하게 선별합니다. 기준에 미달하는 제품은 과감히 반품합니다.' },
    ],
    story: '이 상품은 수십 년의 경험과 열정이 담긴 장인의 손에서 태어납니다.\n\n매일 새벽, 가장 신선한 원재료가 도착하면 그날의 작업이 시작됩니다. 육안과 손의 감촉으로 하나하나 꼼꼼히 확인하는 선별 과정은 그 어떤 기계도 대신할 수 없는 사람의 일입니다.\n\n전통 방식을 고집하는 이유는 단 하나, 맛과 품질 때문입니다. 오랜 세월 쌓아온 노하우는 수치로 표현할 수 없는 감각의 영역입니다. 온도 하나, 시간 하나에도 세심하게 신경을 씁니다.\n\n완성된 제품은 다시 한번 품질 검수를 거칩니다. 색상·향·질감·맛을 최종 확인하고 나서야 포장 작업에 들어갑니다. 신선도를 최대한 유지하는 특수 포장재를 사용하여 고객님께 전달됩니다.\n\n저희의 목표는 단순히 상품을 파는 것이 아닙니다. 고객님의 식탁에 진심 어린 정성이 함께 전달되는 것, 그것이 저희가 매일 새벽 일어나는 이유입니다.',
    features: [
      { title: '엄선된 국내산 원재료', desc: '전국 최우수 산지에서 직접 공수한 국내산 원재료만을 사용합니다. 수입산이나 혼합 원재료는 일절 사용하지 않으며, 매 입고 시마다 신선도와 품질을 꼼꼼히 확인합니다. 원재료의 품질이 곧 완성품의 품질이라는 신념 하에, 기준에 미달하는 재료는 과감히 반품합니다.' },
      { title: '전통 제조 방식 고수', desc: '수십 년간 이어온 전통 제조 방식을 그대로 유지합니다. 대량 생산 설비를 도입하면 효율은 높아지지만, 그 과정에서 잃어버리는 맛과 질감이 있습니다. 저희는 생산량보다 품질을 우선시하며, 장인이 직접 손으로 만드는 소규모 생산 방식을 고집합니다.' },
      { title: '철저한 위생·품질 관리', desc: 'HACCP 인증 시설에서 엄격한 위생 기준을 준수하며 제조됩니다. 정기적인 외부 기관 검사와 매일 자체 위생 점검을 병행합니다. 완성된 제품은 출고 전 최종 품질 검수를 통과한 것들만 포장됩니다.' },
      { title: '주문 후 제조 · 신선 출고', desc: '재고를 쌓아두지 않습니다. 주문이 들어오면 그때부터 제조에 들어가기 때문에 항상 가장 신선한 상태로 받아보실 수 있습니다. 평일 오후 2시 이전 주문 건은 당일 출고를 원칙으로 하며, 신선도 유지를 위한 특수 포장재로 발송됩니다.' },
    ],
    keyNumber: { value: '100', unit: '%', label: '품질 약속', caption: '저희가 사용하는 모든 원재료는 국내산 100%입니다. 단 한 가지 재료도 예외 없이 이 원칙을 지킵니다. 소비자께 드리는 가장 기본적이고 중요한 약속입니다.' },
    differences: [
      { label: '원산지', theirs: '수입·혼합산 다수', ours: '국내산 100% 보장' },
      { label: '제조 방식', theirs: '대량 자동화 공장 생산', ours: '장인 소규모 수제 제조' },
      { label: '신선도', theirs: '장기 유통·재고 보관', ours: '주문 후 당일 제조·출고' },
      { label: '보존료', theirs: '합성 보존료 사용', ours: '천연 재료만, 무첨가' },
      { label: '품질 선별', theirs: '기계 선별·일괄 처리', ours: '장인이 직접 하나씩 선별' },
      { label: '포장', theirs: '일반 비닐 포장', ours: '신선도 유지 특수 포장' },
      { label: '유통 단계', theirs: '도매상→중간상→소매', ours: '산지 직송·직거래' },
    ],
    recipe: {
      title: '가장 맛있게 드시는 법',
      intro: '올바른 조리법을 따르시면 최고의 맛을 경험하실 수 있습니다. 몇 가지 포인트만 지켜주시면 어렵지 않게 훌륭한 요리가 완성됩니다.',
      steps: [
        { name: '해동', detail: '냉동 제품의 경우 냉장실에서 8~12시간 자연 해동해 주세요. 급할 경우 흐르는 찬물에 30분 해동하셔도 됩니다. 전자레인지 해동은 육질 손상 우려가 있으니 피해주세요.' },
        { name: '전처리', detail: '해동된 제품을 흐르는 찬물에 가볍게 헹구어 주세요. 표면의 수분은 키친타월로 가볍게 눌러 제거해 주시면 조리 시 기름 튀김을 줄일 수 있습니다.' },
        { name: '가열', detail: '중약불(160~170도)에서 서서히 가열하는 것이 핵심입니다. 너무 강한 불에서는 겉은 타고 속은 덜 익는 문제가 생깁니다. 앞뒤로 각 3~5분씩, 노릇하게 색이 올라올 때까지 조리해 주세요.' },
        { name: '플레이팅', detail: '완성 직후 바로 그릇에 담아 드세요. 식으면 식감이 달라지므로 따뜻할 때 드시는 것이 가장 맛있습니다. 레몬즙을 살짝 뿌리면 풍미가 한층 살아납니다.' },
      ],
      tip: '불 조절이 가장 중요합니다. 처음부터 강불을 사용하면 겉이 타고 속이 익지 않을 수 있습니다. 중약불에서 천천히, 충분한 시간을 들여 조리하시면 육즙이 살아있는 최고의 맛을 경험하실 수 있습니다. 뚜껑을 덮고 조리하시면 증기로 내부까지 고르게 익힐 수 있습니다.',
    },
    storage: {
      title: '신선함을 오래 지키는 보관법',
      recommended: '냉동 보관 (-18℃ 이하)',
      duration: '제조일로부터 최대 6개월',
      tips: [
        '받으신 즉시 냉동실에 넣어주세요. 상온에 오래 방치하면 신선도가 빠르게 저하되며, 해동 후 다시 냉동하면 품질이 크게 떨어집니다.',
        '원래 포장 그대로 보관하세요. 포장을 뜯으면 공기와 접촉하여 산화가 시작됩니다. 부득이하게 뜯으셨다면 밀폐 지퍼백에 담아 공기를 최대한 제거한 후 냉동하세요.',
        '냉동실 문쪽보다는 안쪽 깊숙이 보관하세요. 냉동실 문 부근은 온도 변화가 잦아 식품이 서서히 변질될 수 있습니다. 일정한 저온을 유지하는 안쪽에 보관하시는 것이 좋습니다.',
        '해동 후 남은 제품은 재냉동하지 마세요. 한 번 해동된 식품을 다시 냉동하면 세포 조직이 파괴되어 식감과 맛이 크게 떨어집니다. 한 번에 먹을 양만큼만 해동하세요.',
        '유통기한과 제조일을 꼭 확인하세요. 포장지 뒷면에 표기된 유통기한 내에 드시는 것이 가장 좋습니다. 유통기한이 지난 제품은 상태와 무관하게 드시지 않기를 권장합니다.',
      ],
    },
    reviews: [
      { text: '처음에는 반신반의하며 주문했는데 정말 깜짝 놀랐습니다. 마트에서 파는 것과는 차원이 다른 신선함이었어요. 특히 포장이 너무 꼼꼼해서 배송 중 손상도 전혀 없었습니다. 가족들이 너무 맛있다며 또 시켜달라고 해서 이미 재주문했습니다.', author: '김○○', date: '2026.03' },
      { text: '부모님 선물로 보냈는데 어머니가 전화하셔서 정말 맛있다고 칭찬을 많이 하셨어요. 백화점 식품관에서 파는 것 못지않다고 하시더라고요. 가격 대비 품질이 너무 좋아서 이제 명절 선물은 여기서만 살 것 같습니다.', author: '이○○', date: '2026.03' },
      { text: '온라인에서 식품 주문하는 걸 꺼렸는데 지인 추천으로 처음 구매했습니다. 걱정과 달리 신선도가 완벽하게 유지된 채로 도착했고, 맛도 기대 이상이었습니다. 배송도 빨라서 주문 다음날 받았네요. 앞으로 정기적으로 구매할 것 같습니다.', author: '박○○', date: '2026.02' },
      { text: '혼자 사는 1인 가구인데 소량 포장이 있어서 좋았어요. 한 번에 다 못 먹을까봐 걱정했는데 개별 포장이라 그때그때 꺼내 먹기 편했습니다. 조리도 간단해서 바쁜 아침에도 금방 먹을 수 있었습니다.', author: '최○○', date: '2026.02' },
      { text: '식품 관련 일을 하는 사람으로서 원재료 품질에 대해 꼼꼼히 따지는 편입니다. 여기 제품은 정말 원재료 관리가 철저하다는 느낌이 왔습니다. 향도 자연스럽고 인공적인 느낌이 전혀 없어요. 가격이 조금 있지만 그 값어치를 충분히 합니다.', author: '정○○', date: '2026.01' },
    ],
    info: [
      { key: '상품명', value: productName },
      { key: '원산지', value: '국내산' },
      { key: '중량', value: `1${unit || '개'}` },
      { key: '보관방법', value: '냉동 보관 (-18℃ 이하)' },
      { key: '유통기한', value: '제조일로부터 6개월' },
      { key: '제조방법', value: '수제 소규모 생산' },
      { key: '알레르기', value: '제품 포장지 표기 참조' },
      { key: '인증', value: 'HACCP 인증' },
      { key: '포장단위', value: `1${unit || '개'} 단위` },
      { key: '배송방법', value: '냉동 택배' },
    ],
    faq: [
      { q: '배송은 얼마나 걸리나요?', a: '평일 오후 2시 이전 주문 건은 당일 출고되며, 보통 다음날 수령 가능합니다. 제주·도서산간 지역은 1~2일 추가 소요될 수 있습니다.' },
      { q: '냉동 상태로 배송되나요?', a: '네, 신선도 유지를 위해 냉동 상태로 발송됩니다. 아이스팩과 단열 포장재를 사용하여 배송 중 품질 손상을 최소화합니다. 여름철에는 드라이아이스를 추가합니다.' },
      { q: '선물 포장이 가능한가요?', a: '기본 선물 포장으로 발송되며, 리본·메시지 카드 옵션을 추가하실 수 있습니다. 주문 시 요청사항란에 원하시는 내용을 적어주시면 반영해 드립니다.' },
      { q: '교환·환불은 어떻게 하나요?', a: '수령 후 7일 이내에 단순 변심 교환·환불이 가능합니다. 상품 이상이 있는 경우에는 수령 후 즉시 고객센터로 사진과 함께 연락 주시면 신속하게 처리해 드립니다.' },
      { q: '알레르기가 있는데 드셔도 될까요?', a: '포장지에 알레르기 유발 원료가 표시되어 있습니다. 구매 전 반드시 확인해 주시고, 특이 체질이시거나 알레르기가 있으신 분은 주치의와 상담 후 드실 것을 권장합니다.' },
      { q: '유통기한은 얼마나 되나요?', a: '냉동 보관 시 제조일로부터 6개월입니다. 냉장 보관 시에는 3~5일 이내에 드시는 것을 권장합니다. 해동 후에는 당일 내 드시는 것이 가장 좋습니다.' },
      { q: '대량 구매 시 할인이 되나요?', a: '도매 회원으로 가입하시면 도매 유통가로 구매하실 수 있습니다. 대량 주문은 카카오톡 문의 채널로 연락 주시면 맞춤 견적을 안내해 드립니다.' },
    ],
    delivery: [
      { label: 'DELIVERY', value: '무료 배송\n평일 오후 2시 이전 주문 시 당일 출고' },
      { label: 'PACKAGING', value: '선물 포장 기본\n아이스팩 + 단열 포장재 사용' },
      { label: 'RETURN', value: '수령 후 7일 이내\n교환·환불 가능' },
      { label: 'CONTACT', value: '평일 10:00 - 18:00\n카카오톡 채널 문의' },
    ],
    price: { retail, wholesale: 0, unit: unit || '개' },
  }
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
    originStats: pick(ai?.originStats, fb.originStats!),
    story: pick(ai?.story, fb.story!),
    features: pick(ai?.features, fb.features!),
    keyNumber: pick(ai?.keyNumber, fb.keyNumber!),
    differences: pick(ai?.differences, fb.differences!),
    recipe: pick(ai?.recipe, fb.recipe!),
    storage: pick(ai?.storage, fb.storage!),
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

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthAndGeminiKey()
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = await req.json()
    const { persona, productName, retailPrice, wholesalePrice, unit, theme } = body

    let imageList: { base64: string; mimeType: string }[] = []
    if (Array.isArray(body.images) && body.images.length > 0) {
      imageList = body.images.slice(0, 10)
    } else if (body.base64) {
      imageList = [{ base64: body.base64, mimeType: body.mimeType || 'image/jpeg' }]
    }

    if (imageList.length === 0) {
      return NextResponse.json({ error: '[v2] 이미지를 먼저 올려주세요. (업로드하신 이미지가 서버에 전달되지 않았습니다)' }, { status: 400 })
    }

    const geminiKey = auth.geminiKey

    const toneText = PERSONA_TONES[persona] || PERSONA_TONES.shohost

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
- 소매가: ${retailPrice || '?'}원
- 도매가: ${wholesalePrice || '-'}원
- 단위: ${unit || '개'}
- 테마: ${theme || 'premium'}

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
  "unusedIndices": [<미사용 인덱스>]
}

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
              generationConfig: { maxOutputTokens: 8192 },
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
        lastError = `${model} 네트워크 오류: ${e.message}`
        continue
      }
    }

    if (!rawText) {
      return NextResponse.json({ error: `모든 모델 실패: ${lastError}` }, { status: 500 })
    }
    const aiJson = extractJson(rawText)

    // 섹션 배치 매핑 — 중복 제거 안전장치
    const assignment = aiJson?.sectionAssignment || {}
    const usedIndices = new Set<number>()
    const sectionImages: LandingData['sectionImages'] = {}
    const sectionKeys = ['hero', 'origin', 'story', 'recipe', 'storage'] as const
    for (const key of sectionKeys) {
      const idx = assignment[key]
      if (typeof idx === 'number' && idx >= 0 && idx < imageList.length && !usedIndices.has(idx)) {
        usedIndices.add(idx)
        const img = imageList[idx]
        sectionImages[key] = `data:${img.mimeType};base64,${img.base64}`
      }
    }

    // hero가 할당 안 됐으면 첫 번째 미사용 이미지를 hero로
    if (!sectionImages.hero && imageList.length > 0) {
      for (let i = 0; i < imageList.length; i++) {
        if (!usedIndices.has(i)) {
          usedIndices.add(i)
          const img = imageList[i]
          sectionImages.hero = `data:${img.mimeType};base64,${img.base64}`
          break
        }
      }
    }

    const unusedImages: string[] = []
    for (let i = 0; i < imageList.length; i++) {
      if (!usedIndices.has(i)) {
        const img = imageList[i]
        unusedImages.push(`data:${img.mimeType};base64,${img.base64}`)
      }
    }

    const fb = buildFallback(productName || '상품', Number(retailPrice) || 0, unit || '개')
    const finalData = mergeData(aiJson, fb, productName || '상품', sectionImages, unusedImages)
    const html = renderLanding(finalData)

    return NextResponse.json({ html, data: finalData })
  } catch (e: any) {
    return NextResponse.json({ error: `오류: ${e.message}` }, { status: 500 })
  }
}
