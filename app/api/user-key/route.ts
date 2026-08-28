import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getAuthUser } from '@/lib/supabase-server'
import { encryptKey, makeKeyHint } from '@/lib/crypto-keys'

// ─────────────────────────────────────────────────────────────
// GET /api/user-key
// ─────────────────────────────────────────────────────────────
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('key_hint, gemini_key_hint, pexels_key_hint, pixabay_key_hint, replicate_key_hint, is_valid, validated_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[user-key] load failed', error)
    return NextResponse.json({ error: 'API 키 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }

  // 이미지 소스 키는 DB에 없어도 서버 env 기본값이 있으면 "기본 키 사용 중"으로 표시
  const envHint = (v?: string) => (v ? '기본 키 사용 중' : null)

  return NextResponse.json({
    hasKey: !!data,
    keyHint: data?.key_hint || null,
    geminiKeyHint: data?.gemini_key_hint || null,
    pexelsKeyHint: data?.pexels_key_hint || envHint(process.env.PEXELS_API_KEY),
    pixabayKeyHint: data?.pixabay_key_hint || envHint(process.env.PIXABAY_API_KEY),
    replicateKeyHint: data?.replicate_key_hint || envHint(process.env.REPLICATE_API_TOKEN),
    isValid: data?.is_valid || false,
    validatedAt: data?.validated_at || null,
    updatedAt: data?.updated_at || null,
  })
}

// ─────────────────────────────────────────────────────────────
// POST /api/user-key
// body: { openaiKey?: string, geminiKey?: string }
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const userId = user.id

  const body = await req.json()
  const supabase = await createServerSupabase()

  // ── OpenAI 키 저장 ──────────────────────────────────────────
  if (body.openaiKey !== undefined) {
    const trimmed = (body.openaiKey || '').trim()
    if (!trimmed) return NextResponse.json({ error: 'API 키를 입력해주세요.' }, { status: 400 })
    if (!trimmed.startsWith('sk-')) {
      return NextResponse.json({ error: 'OpenAI 키 형식이 아닙니다. (sk-로 시작해야 합니다)' }, { status: 400 })
    }

    // OpenAI 검증
    let isValid = false
    let validationError: string | null = null
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${trimmed}` },
      })
      if (res.ok) {
        isValid = true
      } else {
        const errBody = await res.json().catch(() => ({}))
        console.error('[user-key] openai validation failed', { status: res.status, error: errBody?.error })
        validationError = '입력한 API 키를 확인해 주세요.'
      }
    } catch (e: any) {
      console.error('[user-key] openai validation request failed', e)
      validationError = '키 확인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    }

    if (!isValid) {
      return NextResponse.json({ error: validationError || '입력한 API 키를 확인해 주세요.' }, { status: 400 })
    }

    let encrypted: string
    try { encrypted = encryptKey(trimmed) } catch (e: any) {
      console.error('[user-key] openai encrypt failed', e)
      return NextResponse.json({ error: 'API 키 저장 준비 중 문제가 발생했습니다. 고객센터로 문의해 주세요.' }, { status: 500 })
    }

    const { data: existing } = await supabase.from('user_api_keys').select('user_id').eq('user_id', user.id).maybeSingle()
    const openaiData = {
      openai_key_enc: encrypted,
      key_hint: makeKeyHint(trimmed),
      is_valid: true,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { error } = existing
      ? await supabase.from('user_api_keys').update(openaiData).eq('user_id', user.id)
      : await supabase.from('user_api_keys').insert({ user_id: user.id, ...openaiData })
    if (error) {
      console.error('[user-key] openai save failed', error)
      return NextResponse.json({ error: 'API 키 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, keyHint: makeKeyHint(trimmed), isValid: true })
  }

  // ── Gemini 키 저장 ──────────────────────────────────────────
  if (body.geminiKey !== undefined) {
    const trimmed = (body.geminiKey || '').trim()
    if (!trimmed) return NextResponse.json({ error: 'Gemini API 키를 입력해주세요.' }, { status: 400 })

    // Gemini 키 형식 확인 (AIza로 시작)
    if (!trimmed.startsWith('AIza')) {
      return NextResponse.json({ error: 'Gemini 키 형식이 아닙니다. (AIza로 시작해야 합니다)' }, { status: 400 })
    }

    // Gemini 검증 — 모델 목록 조회로 키 유효성만 확인 (generateContent 호출은 생성 quota를 소모해
    // 무료 사용량 0인 멀쩡한 키도 429로 거부되므로 사용하지 않음). 인증 실패(400/403)만 무효로 처리.
    let isValid = false
    let validationError: string | null = null
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`)
      if (res.ok || res.status === 429) {
        // 200 = 정상, 429 = 키는 유효하나 사용량 초과(키 자체는 정상이므로 저장 허용)
        isValid = true
      } else {
        const errBody = await res.json().catch(() => ({}))
        console.error('[user-key] gemini validation failed', { status: res.status, error: errBody?.error })
        validationError = '입력한 Gemini 키를 확인해 주세요.'
      }
    } catch (e: any) {
      console.error('[user-key] gemini validation request failed', e)
      validationError = '키 확인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    }

    if (!isValid) {
      return NextResponse.json({ error: validationError || '입력한 Gemini 키를 확인해 주세요.' }, { status: 400 })
    }

    let encrypted: string
    try { encrypted = encryptKey(trimmed) } catch (e: any) {
      console.error('[user-key] gemini encrypt failed', e)
      return NextResponse.json({ error: 'API 키 저장 준비 중 문제가 발생했습니다. 고객센터로 문의해 주세요.' }, { status: 500 })
    }

    const { data: existingG } = await supabase.from('user_api_keys').select('user_id').eq('user_id', user.id).maybeSingle()
    const geminiData = {
      gemini_key_enc: encrypted,
      gemini_key_hint: makeKeyHint(trimmed),
      updated_at: new Date().toISOString(),
    }
    const { error } = existingG
      ? await supabase.from('user_api_keys').update(geminiData).eq('user_id', user.id)
      : await supabase.from('user_api_keys').insert({ user_id: user.id, ...geminiData })
    if (error) {
      console.error('[user-key] gemini save failed', error)
      return NextResponse.json({ error: 'API 키 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, geminiKeyHint: makeKeyHint(trimmed) })
  }

  // ── 이미지 소스 키 3종 공통 저장 헬퍼 ───────────────────────
  // validate: 키 유효성 검증 함수(true면 저장), col: DB 컬럼 prefix
  async function saveImageKey(
    raw: string,
    colEnc: string,
    colHint: string,
    validate: (k: string) => Promise<boolean>,
    label: string,
  ) {
    const trimmed = (raw || '').trim()
    if (!trimmed) return NextResponse.json({ error: 'API 키를 입력해주세요.' }, { status: 400 })
    if (trimmed.includes('...')) {
      return NextResponse.json({ error: '새 키를 입력해주세요. (현재 표시된 것은 마스킹된 힌트입니다)' }, { status: 400 })
    }
    let ok = false
    try { ok = await validate(trimmed) } catch (e) { console.error(`[user-key] ${label} validate failed`, e) }
    if (!ok) return NextResponse.json({ error: `입력한 ${label} 키를 확인해 주세요.` }, { status: 400 })

    let encrypted: string
    try { encrypted = encryptKey(trimmed) } catch (e: any) {
      console.error(`[user-key] ${label} encrypt failed`, e)
      return NextResponse.json({ error: 'API 키 저장 준비 중 문제가 발생했습니다.' }, { status: 500 })
    }
    const { data: exist } = await supabase.from('user_api_keys').select('user_id').eq('user_id', userId).maybeSingle()
    const payload: any = { [colEnc]: encrypted, [colHint]: makeKeyHint(trimmed), updated_at: new Date().toISOString() }
    const { error } = exist
      ? await supabase.from('user_api_keys').update(payload).eq('user_id', userId)
      : await supabase.from('user_api_keys').insert({ user_id: userId, ...payload })
    if (error) {
      console.error(`[user-key] ${label} save failed`, error)
      return NextResponse.json({ error: 'API 키 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, hint: makeKeyHint(trimmed) })
  }

  // ── Pexels 키 저장 ─────────────────────────────────────────
  if (body.pexelsKey !== undefined) {
    return saveImageKey(body.pexelsKey, 'pexels_key_enc', 'pexels_key_hint', async (k) => {
      const res = await fetch('https://api.pexels.com/v1/search?query=test&per_page=1', { headers: { Authorization: k } })
      return res.ok
    }, 'Pexels')
  }

  // ── Pixabay 키 저장 ────────────────────────────────────────
  if (body.pixabayKey !== undefined) {
    return saveImageKey(body.pixabayKey, 'pixabay_key_enc', 'pixabay_key_hint', async (k) => {
      const res = await fetch(`https://pixabay.com/api/?key=${encodeURIComponent(k)}&q=test&per_page=3`)
      return res.ok
    }, 'Pixabay')
  }

  // ── Replicate 키 저장 ──────────────────────────────────────
  if (body.replicateKey !== undefined) {
    return saveImageKey(body.replicateKey, 'replicate_key_enc', 'replicate_key_hint', async (k) => {
      const res = await fetch('https://api.replicate.com/v1/account', { headers: { Authorization: `Bearer ${k}` } })
      return res.ok
    }, 'Replicate')
  }

  return NextResponse.json({ error: '저장할 키가 없습니다.' }, { status: 400 })
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/user-key
// ─────────────────────────────────────────────────────────────
export async function DELETE() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('user_api_keys').delete().eq('user_id', user.id)
  if (error) {
    console.error('[user-key] delete failed', error)
    return NextResponse.json({ error: 'API 키 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
