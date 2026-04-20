import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json()
    if (!base64 || !mimeType) {
      return NextResponse.json({ error: '이미지가 없어요.' }, { status: 400 })
    }

    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'REMOVE_BG_API_KEY가 없어요.' }, { status: 500 })
    }

    // base64 → binary
    const binary = Buffer.from(base64, 'base64')
    const blob = new Blob([binary], { type: mimeType })

    const form = new FormData()
    form.append('image_file', blob, 'image.jpg')
    form.append('size', 'auto')

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: form,
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `배경제거 실패: ${err}` }, { status: 500 })
    }

    const buffer = await res.arrayBuffer()
    const resultBase64 = Buffer.from(buffer).toString('base64')
    return NextResponse.json({ base64: resultBase64, mimeType: 'image/png' })
  } catch (e: any) {
    return NextResponse.json({ error: `오류: ${e.message}` }, { status: 500 })
  }
}

