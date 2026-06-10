import { NextRequest, NextResponse } from 'next/server'
import { getUserAIKeys, callAI, extractJson } from '@/lib/ai'

// ─────────────────────────────────────────────────────────────
//  POST /api/suggest-product
//  공급사 "사진 → 상품등록 자동완성" — 로그인한 공급사 본인 키로만 호출.
//  body: { base64, mimeType, categories: [{id,name}] }
//  반환: { name, categoryName, unit, suggestedWholesale, suggestedRetail, description }
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await getUserAIKeys()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json().catch(() => ({}))
  const { base64, mimeType, categories } = body
  if (!base64) return NextResponse.json({ error: '이미지가 전달되지 않았습니다.' }, { status: 400 })

  const catNames: string[] = Array.isArray(categories) ? categories.map((c: any) => c.name).filter(Boolean) : []
  const units = ['kg', 'g', '박스', '마리', '개', '묶음']

  const system = `당신은 농축수산물 직거래 플랫폼 '온종일팜'의 상품 등록 도우미입니다.
공급사가 올린 상품 사진 한 장을 보고, 상품 등록 폼을 자동으로 채울 초안을 만듭니다.
반드시 JSON 객체만 출력합니다. 사진에서 확인되지 않는 정보는 일반적인 상식 범위에서 합리적으로 추정하되, 과장하지 않습니다.`

  const prompt = `첨부된 사진은 판매할 농축수산물 상품입니다. 사진을 보고 아래 JSON을 채우세요.

[카테고리 후보] (categoryName은 반드시 이 중 하나를 그대로 쓰거나, 해당 없으면 "")
${catNames.length ? catNames.join(', ') : '(후보 없음 → categoryName은 "")'}

[단위 후보] (unit은 반드시 이 중 하나)
${units.join(', ')}

규칙:
- name: 자연스러운 한국어 상품명 (예: "완도 활전복", "해남 꿀고구마"). 사진에 산지/품종 단서가 없으면 품목명 위주로.
- suggestedWholesale / suggestedRetail: 원(KRW) 단위의 정수. 해당 품목의 일반적인 시세를 바탕으로 한 "대략적 제안가"입니다. 소매가는 도매가보다 높게. 확신이 없으면 보수적으로.
- description: 2~3문장의 담백한 상품 설명. 거짓 인증·허위 수치 금지.
- 모든 가격은 어디까지나 초안이며 관리자가 최종 확정한다는 점을 전제로 합리적 추정만.

[출력 JSON]
{
  "name": "상품명",
  "categoryName": "카테고리 후보 중 하나 또는 \\"\\"",
  "unit": "단위 후보 중 하나",
  "suggestedWholesale": 정수,
  "suggestedRetail": 정수,
  "description": "2~3문장 설명"
}`

  const ai = await callAI({
    keys: auth.keys,
    system,
    prompt,
    images: [{ base64, mimeType: mimeType || 'image/jpeg' }],
    maxTokens: 800,
    jsonMode: true,
  })
  if (!ai.ok) return NextResponse.json({ error: ai.error }, { status: 502 })

  const p = extractJson(ai.text) || {}
  // 카테고리 이름 → id 매핑은 클라이언트에서 처리 (categoryName 그대로 반환)
  const result = {
    name: typeof p.name === 'string' ? p.name : '',
    categoryName: catNames.includes(p.categoryName) ? p.categoryName : '',
    unit: units.includes(p.unit) ? p.unit : 'kg',
    suggestedWholesale: Number.isFinite(Number(p.suggestedWholesale)) ? Math.round(Number(p.suggestedWholesale)) : '',
    suggestedRetail: Number.isFinite(Number(p.suggestedRetail)) ? Math.round(Number(p.suggestedRetail)) : '',
    description: typeof p.description === 'string' ? p.description : '',
    provider: ai.provider,
  }
  return NextResponse.json(result)
}
