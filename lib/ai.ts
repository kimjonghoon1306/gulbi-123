import { createServerSupabase } from './supabase-server'
import { decryptKey } from './crypto-keys'

// ─────────────────────────────────────────────────────────────
//  공용 AI 헬퍼 — GPT(OpenAI) / Gemini(Google) 둘 다 지원
//
//  ★ 핵심 원칙: 키는 "로그인한 본인"의 키만 사용한다.
//     - 관리자는 관리자 본인 키, 공급사는 공급사 본인 키
//     - user_api_keys 테이블에서 현재 세션 사용자의 키만 복호화
//     - 소비자(쇼핑몰) 트래픽에는 절대 사용하지 않음
// ─────────────────────────────────────────────────────────────

export type AIKeys = { openaiKey?: string; geminiKey?: string }
export type AIImage = { base64: string; mimeType: string }

export type UserKeysResult =
  | { ok: true; userId: string; keys: AIKeys }
  | { ok: false; status: number; error: string }

// 로그인한 본인의 AI 키 가져오기 (OpenAI / Gemini 둘 중 등록된 것)
export async function getUserAIKeys(): Promise<UserKeysResult> {
  const supabase = await createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { ok: false, status: 401, error: '로그인이 필요합니다.' }

  const { data: row, error: dbErr } = await supabase
    .from('user_api_keys')
    .select('openai_key_enc, gemini_key_enc')
    .eq('user_id', user.id)
    .maybeSingle()

  if (dbErr) return { ok: false, status: 500, error: `키 조회 실패: ${dbErr.message}` }

  const keys: AIKeys = {}
  try { if (row?.openai_key_enc) keys.openaiKey = decryptKey(row.openai_key_enc as any) } catch {}
  try { if (row?.gemini_key_enc) keys.geminiKey = decryptKey(row.gemini_key_enc as any) } catch {}

  if (!keys.openaiKey && !keys.geminiKey) {
    return { ok: false, status: 400, error: '설정에서 OpenAI 또는 Gemini API 키를 먼저 등록해주세요.' }
  }
  return { ok: true, userId: user.id, keys }
}

// JSON 추출 (코드블록·잡텍스트 제거)
export function extractJson(text: string): any | null {
  if (!text) return null
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first === -1 || last === -1) return null
  try { return JSON.parse(cleaned.slice(first, last + 1)) } catch { return null }
}

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']
const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4o']

// 모델별 fetch에 타임아웃을 걸어, 응답이 늘어지면 끊고 다음 모델/폴백으로 넘어간다.
// (타임아웃이 없으면 Gemini 과부하 시 함수가 통째로 멈춰 Vercel 제한에 걸려 죽는다 = 간헐적 실패의 주범)
const AI_FETCH_TIMEOUT_MS = 8000
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = AI_FETCH_TIMEOUT_MS) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(t)
  }
}

async function callGemini(
  key: string, system: string, prompt: string, images: AIImage[], maxTokens: number, jsonMode: boolean,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const parts: any[] = images.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.base64 } }))
  parts.push({ text: prompt })
  const baseGenConfig: any = { maxOutputTokens: maxTokens }
  if (jsonMode) baseGenConfig.responseMimeType = 'application/json'

  let lastError = ''
  for (const model of GEMINI_MODELS) {
    // 2.5 계열은 thinking이 기본 켜져 있어 maxOutputTokens를 사고에 다 써버리고
    // 빈 응답을 줄 때가 있다 → thinking을 꺼서 응답 누락/지연을 막는다.
    const generationConfig = model.startsWith('gemini-2.5')
      ? { ...baseGenConfig, thinkingConfig: { thinkingBudget: 0 } }
      : baseGenConfig
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ parts }],
            generationConfig,
          }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg = (err.error?.message || '').toLowerCase()
        if (res.status === 400 && msg.includes('api key')) return { ok: false, error: 'Gemini API 키가 잘못되었습니다. 설정에서 확인해주세요.' }
        if (res.status === 403) return { ok: false, error: 'Gemini API 키 권한이 없습니다.' }
        if ([429, 503, 404].includes(res.status) || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('rate') || msg.includes('overloaded')) {
          lastError = `${model} 한도초과`; continue
        }
        lastError = `${model} 오류 (${res.status})`; continue
      }
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (!text) { lastError = `${model} 빈 응답`; continue }
      return { ok: true, text }
    } catch (e: any) {
      lastError = e?.name === 'AbortError' ? `${model} 응답 지연(타임아웃)` : `${model} 네트워크 오류: ${e.message}`; continue
    }
  }
  return { ok: false, error: `Gemini 실패: ${lastError}` }
}

async function callOpenAI(
  key: string, system: string, prompt: string, images: AIImage[], maxTokens: number, jsonMode: boolean,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const userContent: any[] = [{ type: 'text', text: prompt }]
  for (const img of images) {
    userContent.push({ type: 'image_url', image_url: { url: `data:${img.mimeType};base64,${img.base64}` } })
  }
  const body: any = {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    max_tokens: maxTokens,
  }
  if (jsonMode) body.response_format = { type: 'json_object' }

  let lastError = ''
  for (const model of OPENAI_MODELS) {
    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ ...body, model }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg = (err.error?.message || '').toLowerCase()
        if (res.status === 401) return { ok: false, error: 'OpenAI API 키가 잘못되었습니다. 설정에서 확인해주세요.' }
        if ([429, 503].includes(res.status) || msg.includes('quota') || msg.includes('rate')) { lastError = `${model} 한도초과`; continue }
        lastError = `${model} 오류 (${res.status})`; continue
      }
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || ''
      if (!text) { lastError = `${model} 빈 응답`; continue }
      return { ok: true, text }
    } catch (e: any) {
      lastError = e?.name === 'AbortError' ? `${model} 응답 지연(타임아웃)` : `${model} 네트워크 오류: ${e.message}`; continue
    }
  }
  return { ok: false, error: `OpenAI 실패: ${lastError}` }
}

// 통합 호출 — prefer 우선, 없으면 보유한 키 순서로 폴백
export async function callAI(opts: {
  keys: AIKeys
  system: string
  prompt: string
  images?: AIImage[]
  maxTokens?: number
  jsonMode?: boolean
  prefer?: 'openai' | 'gemini'
}): Promise<{ ok: true; text: string; provider: 'openai' | 'gemini' } | { ok: false; error: string }> {
  const { keys, system, prompt, images = [], maxTokens = 4096, jsonMode = false, prefer = 'gemini' } = opts

  const order: ('gemini' | 'openai')[] = []
  if (prefer === 'openai') {
    if (keys.openaiKey) order.push('openai')
    if (keys.geminiKey) order.push('gemini')
  } else {
    if (keys.geminiKey) order.push('gemini')
    if (keys.openaiKey) order.push('openai')
  }
  if (order.length === 0) return { ok: false, error: '등록된 AI 키가 없습니다.' }

  let lastError = ''
  for (const provider of order) {
    const r = provider === 'gemini'
      ? await callGemini(keys.geminiKey!, system, prompt, images, maxTokens, jsonMode)
      : await callOpenAI(keys.openaiKey!, system, prompt, images, maxTokens, jsonMode)
    if (r.ok) return { ok: true, text: r.text, provider }
    lastError = r.error
  }
  return { ok: false, error: lastError || 'AI 호출 실패' }
}
