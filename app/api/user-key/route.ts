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
    .select('key_hint, gemini_key_hint, is_valid, validated_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    hasKey: !!data,
    keyHint: data?.key_hint || null,
    geminiKeyHint: data?.gemini_key_hint || null,
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
        validationError = errBody?.error?.message || `검증 실패 (HTTP ${res.status})`
      }
    } catch (e: any) {
      validationError = `검증 중 네트워크 오류: ${e.message}`
    }

    if (!isValid) {
      return NextResponse.json({ error: `유효하지 않은 API 키입니다: ${validationError}` }, { status: 400 })
    }

    let encrypted: Buffer
    try { encrypted = encryptKey(trimmed) } catch (e: any) {
      return NextResponse.json({ error: `암호화 실패: ${e.message}` }, { status: 500 })
    }

    const { error } = await supabase.from('user_api_keys').upsert({
      user_id: user.id,
      openai_key_enc: encrypted,
      key_hint: makeKeyHint(trimmed),
      is_valid: true,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    if (error) return NextResponse.json({ error: `저장 실패: ${error.message}` }, { status: 500 })

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

    // Gemini 검증 — gemini-2.0-flash로 ping
    let isValid = false
    let validationError: string | null = null
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${trimmed}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 5 } }),
        }
      )
      if (res.ok) {
        isValid = true
      } else {
        const errBody = await res.json().catch(() => ({}))
        validationError = errBody?.error?.message || `검증 실패 (HTTP ${res.status})`
      }
    } catch (e: any) {
      validationError = `검증 중 네트워크 오류: ${e.message}`
    }

    if (!isValid) {
      return NextResponse.json({ error: `유효하지 않은 Gemini 키입니다: ${validationError}` }, { status: 400 })
    }

    let encrypted: Buffer
    try { encrypted = encryptKey(trimmed) } catch (e: any) {
      return NextResponse.json({ error: `암호화 실패: ${e.message}` }, { status: 500 })
    }

    const { error } = await supabase.from('user_api_keys').upsert({
      user_id: user.id,
      gemini_key_enc: encrypted,
      gemini_key_hint: makeKeyHint(trimmed),
      updated_at: new Date().toISOString(),
    })
    if (error) return NextResponse.json({ error: `저장 실패: ${error.message}` }, { status: 500 })

    return NextResponse.json({ ok: true, geminiKeyHint: makeKeyHint(trimmed) })
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
