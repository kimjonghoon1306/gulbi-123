import { NextRequest, NextResponse } from 'next/server'
import { getAuthAndOpenAIKey } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthAndOpenAIKey()
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { base64, mimeType } = await req.json()
    if (!base64 || !mimeType)
      return NextResponse.json({ error: '이미지 데이터가 없어요.' }, { status: 400 })

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: `이 상품 이미지를 분석하고 전문 쇼핑몰 상세페이지 내용을 만들어주세요. 상품 종류에 관계없이 (식품, 조리기구, 생활용품, 전자기기 등 모두) 적용 가능하게 작성하세요. 다른 텍스트 없이 JSON만 응답하세요: {"name":"상품명","category":"카테고리","unit":"단위","wholesale_price":0,"retail_price":0,"intro":"소개글 2~3줄","origin":"원산지","features":["특징1","특징2","특징3","특징4"],"storage":"보관방법","recipe":"활용법"}` }
          ]
        }],
        max_tokens: 2048
      }),
    })

    const data = await res.json()
    if (data.error)
      return NextResponse.json({ error: `API 오류: ${data.error.message}` }, { status: 500 })

    const text = data.choices?.[0]?.message?.content || ''
    return NextResponse.json({ text })
  } catch (e: any) {
    return NextResponse.json({ error: `오류: ${e.message}` }, { status: 500 })
  }
}
