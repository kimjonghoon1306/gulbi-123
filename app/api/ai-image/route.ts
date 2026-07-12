import { NextRequest, NextResponse } from 'next/server'
import { getAuthAndOpenAIKey } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthAndOpenAIKey()
    if (!auth.ok) {
      console.error('[ai-image] auth/key failed', auth.error)
      return NextResponse.json({ error: 'AI 이미지 생성 설정을 확인해 주세요.' }, { status: auth.status })
    }

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
    if (data.error) {
      console.error('[ai-image] provider error', data.error)
      return NextResponse.json({ error: '이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
    }

    const b64 = data.data?.[0]?.b64_json
    if (!b64) return NextResponse.json({ error: '이미지 생성 실패' }, { status: 500 })
    return NextResponse.json({ b64 })
  } catch (e: any) {
    console.error('[ai-image] unexpected error', e)
    return NextResponse.json({ error: '이미지 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
