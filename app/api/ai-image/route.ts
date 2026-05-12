import { NextRequest, NextResponse } from 'next/server'
import { getAuthAndOpenAIKey } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthAndOpenAIKey()
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: '상품명이 없어요.' }, { status: 400 })

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `Professional product photo of "${prompt}". Clean white background, studio lighting, high quality, e-commerce style, no text, no watermark`,
        n: 1, size: '1024x1024', quality: 'standard', response_format: 'b64_json'
      })
    })

    const data = await res.json()
    if (data.error)
      return NextResponse.json({ error: `이미지 생성 실패: ${data.error.message}` }, { status: 500 })

    const b64 = data.data?.[0]?.b64_json
    if (!b64) return NextResponse.json({ error: '이미지 생성 실패' }, { status: 500 })
    return NextResponse.json({ b64 })
  } catch (e: any) {
    return NextResponse.json({ error: `오류: ${e.message}` }, { status: 500 })
  }
}
