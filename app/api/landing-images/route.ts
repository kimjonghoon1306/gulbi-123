import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServerSupabase } from '@/lib/supabase-server'
import { getImageSourceKeys } from '@/lib/ai-image-keys'
import { logServerError } from '@/lib/log-error'
import {
  searchPexels, searchPixabay, upscaleImage, removeBackground,
  generateFluxBackground, isLowRes, type StockImage, type Orientation,
} from '@/lib/image-sources'

// ─────────────────────────────────────────────────────────────
// POST /api/landing-images
// 새 AI 상세페이지 에디터 전용. action 으로 분기.
//  · action:'search'     → 무료 스톡 배경 검색 (Pexels/Pixabay)
//  · action:'enhance'    → 사진 업스케일 + (옵션)배경제거
//  · action:'background' → Flux 배경 생성
// 관리자 전용(로그인 필요). 키는 설정(DB) 우선, 없으면 env 기본값.
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = body.action as string
  const keys = await getImageSourceKeys()

  try {
    // ── 스톡 검색 ────────────────────────────────────────────
    if (action === 'search') {
      const query = String(body.query || '').trim()
      if (!query) return NextResponse.json({ error: '검색어가 없습니다.' }, { status: 400 })
      const orientation = (body.orientation as Orientation) || 'portrait'
      const perPage = Math.min(Number(body.perPage) || 12, 30)
      // source 지정 없으면 둘 다 모아서 반환(Gemini 자동선택은 상위에서 query로 제어)
      const source = body.source as 'pexels' | 'pixabay' | undefined

      const results: StockImage[] = []
      const errors: string[] = []
      const wantPexels = (!source || source === 'pexels') && keys.pexels
      const wantPixabay = (!source || source === 'pixabay') && keys.pixabay

      await Promise.all([
        wantPexels ? searchPexels(keys.pexels!, query, { perPage, orientation })
          .then(r => results.push(...r)).catch(e => errors.push('pexels:' + e.message)) : null,
        wantPixabay ? searchPixabay(keys.pixabay!, query, { perPage, orientation })
          .then(r => results.push(...r)).catch(e => errors.push('pixabay:' + e.message)) : null,
      ])

      if (results.length === 0 && errors.length) {
        return NextResponse.json({ error: '이미지 검색에 실패했습니다.', detail: errors }, { status: 502 })
      }
      return NextResponse.json({ ok: true, images: results, count: results.length })
    }

    // ── 사진 보정 (업스케일 + 배경제거) ──────────────────────
    if (action === 'enhance') {
      if (!keys.replicate) return NextResponse.json({ error: '설정에서 Replicate 키를 확인해 주세요.' }, { status: 400 })
      const imageUrl = String(body.imageUrl || '').trim()
      if (!imageUrl) return NextResponse.json({ error: '이미지 URL이 없습니다.' }, { status: 400 })
      const doUpscale = body.upscale !== false     // 기본 true (단, 이미 고화질이면 스킵)
      const doRemoveBg = body.removeBg === true     // 기본 false (필요한 컷만)
      const width = Number(body.width) || 0
      const height = Number(body.height) || 0

      let current = imageUrl
      const steps: string[] = []
      // 이미 충분히 크면 업스케일 스킵(비용 절약)
      if (doUpscale && (width === 0 || isLowRes(width, height))) {
        current = await upscaleImage(keys.replicate, current); steps.push('upscale')
      }
      if (doRemoveBg) { current = await removeBackground(keys.replicate, current); steps.push('removeBg') }
      return NextResponse.json({ ok: true, url: current, steps })
    }

    // ── Flux 배경 생성 ───────────────────────────────────────
    if (action === 'background') {
      if (!keys.replicate) return NextResponse.json({ error: '설정에서 Replicate 키를 확인해 주세요.' }, { status: 400 })
      const prompt = String(body.prompt || '').trim()
      if (!prompt) return NextResponse.json({ error: '배경 설명(prompt)이 없습니다.' }, { status: 400 })
      const ar = (body.aspectRatio as any) || '3:4'
      const url = await generateFluxBackground(keys.replicate, prompt, ar)
      return NextResponse.json({ ok: true, url })
    }

    return NextResponse.json({ error: '알 수 없는 action 입니다.' }, { status: 400 })
  } catch (e: any) {
    console.error('[landing-images] failed', action, e)
    try { await logServerError(await createServerSupabase(), { area: 'ai-image', message: `이미지 처리 실패 (${action})`, detail: String(e?.message || e).slice(0, 1000) + ' — Flux/스톡 실패면 Replicate 토큰·한도 확인', path: '/api/landing-images' }) } catch {}
    return NextResponse.json({ error: '이미지 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.', detail: e?.message }, { status: 500 })
  }
}
