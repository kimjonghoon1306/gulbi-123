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

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthAndGeminiKey()
    if (!auth.ok) {
      console.error('[generate-landing] auth/key failed', auth.error)
      return NextResponse.json({ error: 'AI 상세페이지 생성 설정을 확인해 주세요.' }, { status: auth.status })
    }

    const body = await req.json()
    const { persona, productName, origin, retailPrice, wholesalePrice, unit, theme, productGroup, basicInfo } = body

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
- 상품군: ${groupLabels[productGroup] || productGroup || '(미입력)'}
- 원산지: ${origin || '(미입력)'}
- 소매가: ${retailPrice || '?'}원
- 도매가: ${wholesalePrice || '-'}원
- 단위: ${unit || '개'}
- 테마: ${theme || 'premium'}

[판매자가 직접 작성한 상세 기본정보 — 가장 우선해서 반영]
${providedInfo || '- 추가 입력 없음'}

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

    const fb = buildFallback(productName || '상품', Number(retailPrice) || 0, unit || '개')
    const finalData = mergeData(aiJson, fb, productName || '상품', sectionImages, unusedImages)

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
