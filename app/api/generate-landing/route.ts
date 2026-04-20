import { NextRequest, NextResponse } from 'next/server'
import { renderLanding, type LandingData } from '@/lib/landing-templates'

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
    subtitle: '정성으로 만든 상품',
    artisanQuote: '좋은 재료로 정성껏 만들었습니다.',
    artisanName: '대표',
    originLocation: '국내산',
    originStory: '엄선된 국내산 원재료로 정성껏 준비했습니다.',
    originStats: [
      { value: '100', unit: '%', label: 'ORIGIN', desc: '국내산 원재료' },
      { value: 'HACCP', unit: '', label: 'SAFETY', desc: '위해요소 관리' },
      { value: '24', unit: 'h', label: 'FRESH', desc: '당일 출고' },
      { value: 'A+', unit: '', label: 'GRADE', desc: '최상급 등급' },
    ],
    story: '엄선된 재료로 정성껏 만들었습니다.',
    features: [
      { title: '엄선된 원재료', desc: '최고 등급 재료만 사용합니다.' },
      { title: '전통 제조 방식', desc: '오랜 경험으로 완성한 맛.' },
      { title: '철저한 품질 관리', desc: '모든 과정을 직접 관리합니다.' },
    ],
    keyNumber: { value: '100', unit: '%', label: '품질 약속', caption: '품질에 자신있습니다.' },
    differences: [
      { label: '원산지', theirs: '수입·혼합', ours: '국내산 100%' },
      { label: '제조 방식', theirs: '대량 공장 생산', ours: '소규모 수제 제조' },
      { label: '신선도', theirs: '장기 유통', ours: '주문 후 제조' },
      { label: '보존료', theirs: '합성 보존료', ours: '무첨가' },
      { label: '포장', theirs: '일반 포장', ours: '신선 포장' },
    ],
    recipe: {
      title: '가장 맛있게 드시는 법',
      intro: '간단한 조리로 최고의 맛을 내실 수 있습니다.',
      steps: [
        { name: '해동', detail: '냉장실에서 6시간 자연 해동.' },
        { name: '조리', detail: '중불에서 앞뒤로 노릇하게.' },
        { name: '플레이팅', detail: '따뜻할 때 바로 드세요.' },
      ],
      tip: '전자레인지 사용 시 수분이 날아가니 찜기 사용 권장.',
    },
    storage: {
      title: '신선함을 지키는 보관법',
      recommended: '냉동 -18℃ 이하',
      duration: '최대 6개월',
      tips: [
        '받으신 즉시 냉동 보관해 주세요.',
        '해동 후 재냉동은 피해주세요.',
        '밀폐 후 보관하면 더 오래 신선합니다.',
      ],
    },
    reviews: [
      { text: '맛있게 잘 먹었습니다. 재주문합니다.', author: '김○○', date: '2026.03' },
      { text: '부모님 선물로 보냈는데 좋아하셨어요.', author: '이○○', date: '2026.03' },
      { text: '포장도 깔끔하고 품질 좋네요.', author: '박○○', date: '2026.02' },
    ],
    info: [
      { key: '상품명', value: productName },
      { key: '원산지', value: '국내산' },
      { key: '보관방법', value: '냉동 -18℃ 이하' },
      { key: '유통기한', value: '제조일로부터 6개월' },
    ],
    faq: [
      { q: '배송은 얼마나 걸리나요?', a: '주문 후 평일 기준 1~2일 내 수령 가능합니다.' },
      { q: '선물 포장이 되나요?', a: '기본 선물 포장으로 발송됩니다. 리본 옵션 추가 가능합니다.' },
      { q: '교환/환불은 어떻게 하나요?', a: '수령 후 7일 이내 단순 변심 교환·환불이 가능합니다.' },
    ],
    delivery: [
      { label: 'DELIVERY', value: '무료 배송\n평일 오후 2시 이전 주문 시 당일 출고' },
      { label: 'PACKAGING', value: '선물 포장 기본\n이중 완충 포장' },
      { label: 'RETURN', value: '수령 후 7일 이내\n교환·환불 가능' },
      { label: 'CONTACT', value: '평일 10:00 - 18:00\n카카오톡 문의' },
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
    const body = await req.json()
    const { persona, productName, retailPrice, wholesalePrice, unit, theme } = body

    // 두 가지 형식 모두 지원:
    // 신형: images: [{ base64, mimeType }, ...]
    // 구형: base64: string, mimeType: string (단일 이미지)
    let imageList: { base64: string; mimeType: string }[] = []
    if (Array.isArray(body.images) && body.images.length > 0) {
      imageList = body.images.slice(0, 10)
    } else if (body.base64) {
      imageList = [{ base64: body.base64, mimeType: body.mimeType || 'image/jpeg' }]
    }

    if (imageList.length === 0) {
      return NextResponse.json({ error: '[v2] 이미지를 먼저 올려주세요. (업로드하신 이미지가 서버에 전달되지 않았습니다)' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const keyRes = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?key=eq.openai_api_key&select=value`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const keyData = await keyRes.json()
    const openaiKey = keyData?.[0]?.value
    if (!openaiKey) return NextResponse.json({ error: '설정에서 OpenAI API 키를 입력해주세요.' }, { status: 400 })

    const toneText = PERSONA_TONES[persona] || PERSONA_TONES.shohost

    const systemPrompt = `당신은 대한민국 최고의 상세페이지 카피라이터 & 편집 디렉터입니다.
여러 장의 상품 이미지를 각각 꼼꼼히 보고 용도를 판단한 뒤,
상품 본질을 꿰뚫는 풍성한 카피를 만듭니다.
반드시 JSON 객체만 출력합니다. 코드블록, 설명, 다른 텍스트 금지.`

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

[출력 JSON 구조]
{
  "brandName": "브랜드명 2~6자",
  "productName": "정식 상품명",
  "catchphrase": "히어로 카피 8~14자",
  "subtitle": "서브 카피 20~30자",
  "artisanQuote": "장인 인용구 30~60자",
  "artisanName": "출처",
  "originLocation": "실제 한국 유명 산지",
  "originStory": "원산지 스토리 2~3문장",
  "originStats": [{"value":"","unit":"","label":"","desc":""}],
  "story": "상품 스토리 4~6문장",
  "features": [{"title":"","desc":""}],
  "keyNumber": {"value":"","unit":"","label":"","caption":""},
  "differences": [{"label":"","theirs":"","ours":""}],
  "recipe": {"title":"","intro":"","steps":[{"name":"","detail":""}],"tip":""},
  "storage": {"title":"","recommended":"","duration":"","tips":[""]},
  "reviews": [{"text":"","author":"","date":""}],
  "info": [{"key":"","value":""}],
  "faq": [{"q":"","a":""}],
  "delivery": [{"label":"","value":""}],

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
섹션에 어울리는 사진이 없으면 null. 억지로 채우면 안 됩니다.`

    const content: any[] = imageList.map((img) => ({
      type: 'image_url',
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    }))
    content.push({ type: 'text', text: `위 이미지들은 [0번]부터 [${imageList.length - 1}번]까지입니다.\n\n${userPrompt}` })

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 5000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content },
        ],
      }),
    })

    const data = await res.json()
    if (data.error) return NextResponse.json({ error: `API 오류: ${data.error.message}` }, { status: 500 })

    const rawText = data.choices?.[0]?.message?.content || ''
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
