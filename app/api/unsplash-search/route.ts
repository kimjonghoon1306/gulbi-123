import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ results: [] })

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return NextResponse.json({ error: 'UNSPLASH_ACCESS_KEY 없음' }, { status: 500 })

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=12&orientation=squarish`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    )
    const data = await res.json()
    return NextResponse.json({ results: data.results || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


