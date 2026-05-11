import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getAuthUser } from '@/lib/supabase-server'
import { encryptKey, makeKeyHint } from '@/lib/crypto-keys'

// ─────────────────────────────────────────────────────────────
// GET /api/user-key
// 본인이 등록한 키의 상태 조회 (키 자체는 안 내려감, hint만)
// ─────────────────────────────────────────────────────────────
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('key_hint, is_valid, validated_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    hasKey: !!data,
    keyHint: data?.key_hint || null,
    isValid: data?.is_valid || false,
    validatedAt: data?.validated_at || null,
    updatedAt: data?.updated_at || null,
  })
}

// ─────────────────────────────────────────────────────────────
// POST /api/user-key
// 키 등록/갱신. body: { openaiKey: string }
// OpenAI에 검증 ping 보낸 다음에만 저장 (잘못된 키 사전 차단)
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { openaiKey } = await req.json()
  if (!openaiKey || typeof openaiKey !== 'string') {
    return NextResponse.json({ error: 'API 키를 입력해주세요.' }, { status: 400 })
  }
  const trimmed = openaiKey.trim()
  if (!trimmed.startsWith('sk-')) {
    return NextResponse.json({ error: 'OpenAI 키 형식이 아닙니다. (sk-로 시작해야 합니다)' }, { status: 400 })
  }

  // ── 1. OpenAI에 검증 호출 ──────────────────────────
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
    return NextResponse.json(
      { error: `유효하지 않은 API 키입니다: ${validationError}` },
      { status: 400 }
    )
  }

  // ── 2. 암호화 후 저장 ──────────────────────────────
  let encrypted: Buffer
  try {
    encrypted = encryptKey(trimmed)
  } catch (e: any) {
    return NextResponse.json({ error: `암호화 실패: ${e.message}` }, { status: 500 })
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('user_api_keys')
    .upsert({
      user_id: user.id,
      openai_key_enc: encrypted,
      key_hint: makeKeyHint(trimmed),
      is_valid: true,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) return NextResponse.json({ error: `저장 실패: ${error.message}` }, { status: 500 })

  return NextResponse.json({
    ok: true,
    keyHint: makeKeyHint(trimmed),
    isValid: true,
  })
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/user-key
// 본인 키 삭제
// ─────────────────────────────────────────────────────────────
export async function DELETE() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

