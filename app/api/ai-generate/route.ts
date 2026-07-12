import { NextRequest, NextResponse } from 'next/server'
import { getAuthAndGeminiKey } from '@/lib/supabase-server'

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
]

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthAndGeminiKey()
    if (!auth.ok) {
      console.error('[ai-generate] auth/key failed', auth.error)
      return NextResponse.json({ error: 'AI 분석 설정을 확인해 주세요.' }, { status: auth.status })
    }

    const { base64, mimeType } = await req.json()
    if (!base64 || !mimeType)
      return NextResponse.json({ error: '이미지 데이터가 없어요.' }, { status: 400 })

    const prompt = `이 상품 이미지를 분석하고 전문 쇼핑몰 상세페이지 내용을 만들어주세요. 상품 종류에 관계없이 (식품, 조리기구, 생활용품, 전자기기 등 모두) 적용 가능하게 작성하세요. 다른 텍스트 없이 JSON만 응답하세요: {"name":"상품명","category":"카테고리","unit":"단위","wholesale_price":0,"retail_price":0,"intro":"소개글 2~3줄","origin":"원산지","features":["특징1","특징2","특징3","특징4"],"storage":"보관방법","recipe":"활용법"}`

    let lastError = ''

    for (const model of GEMINI_MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${auth.geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inlineData: { mimeType, data: base64 } },
                  { text: prompt },
                ],
              }],
              generationConfig: { maxOutputTokens: 2048 },
            }),
          }
        )

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          const msg = (err.error?.message || '').toLowerCase()
          // 키 오류는 즉시 중단
          if (res.status === 400 && msg.includes('api key')) {
            return NextResponse.json({ error: 'Gemini API 키가 잘못되었습니다. 설정에서 확인해주세요.' }, { status: 400 })
          }
          if (res.status === 403) {
            return NextResponse.json({ error: 'Gemini API 키 권한이 없습니다.' }, { status: 403 })
          }
          // 한도초과·과부하 → 다음 모델로
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

        return NextResponse.json({ text })
      } catch (e: any) {
        console.error('[ai-generate] model request failed', { model, error: e })
        lastError = `${model} 네트워크 오류: ${e.message}`
        continue
      }
    }

    console.error('[ai-generate] all models failed', lastError)
    return NextResponse.json({ error: 'AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  } catch (e: any) {
    console.error('[ai-generate] unexpected error', e)
    return NextResponse.json({ error: 'AI 분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
