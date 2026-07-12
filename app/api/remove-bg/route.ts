import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { base64, mimeType } = await req.json()
    if (!base64 || !mimeType)
      return NextResponse.json({ error: '이미지가 없어요.' }, { status: 400 })

    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      console.error('[remove-bg] REMOVE_BG_API_KEY missing')
      return NextResponse.json({ error: '배경 제거 설정을 확인할 수 없습니다. 관리자에게 문의해 주세요.' }, { status: 500 })
    }

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
      console.error('[remove-bg] provider failed', { status: res.status, error: err })
      return NextResponse.json({ error: '배경 제거에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
    }

    const buffer = await res.arrayBuffer()
    const resultBase64 = Buffer.from(buffer).toString('base64')
    return NextResponse.json({ base64: resultBase64, mimeType: 'image/png' })
  } catch (e: any) {
    console.error('[remove-bg] unexpected error', e)
    return NextResponse.json({ error: '배경 제거 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
