import { createServerSupabase } from './supabase-server'
import { decryptKey } from './crypto-keys'

// ─────────────────────────────────────────────────────────────
// AI 상세페이지 이미지 소스 키 (Pexels / Pixabay / Replicate)
//
// 원칙:
//  · 관리자 설정(DB user_api_keys)에 값이 있으면 그걸 우선 사용(복호화).
//  · 없으면 서버 환경변수(process.env) 기본값으로 폴백 → 관리자가 안 넣어도 동작.
//  · 서버(route handler)에서만 호출. 클라이언트에 절대 노출 X.
//
// 4개 키 전부 "항상 ON" (토글 없음). Replicate 하나가 ①사진 업스케일
// ②배경 누끼 ③Flux 배경생성 을 모두 담당한다.
// ─────────────────────────────────────────────────────────────

export type ImageSourceKeys = {
  pexels: string | null
  pixabay: string | null
  replicate: string | null
}

/** DB 저장 키(복호화) → 없으면 env 기본값. 오류 나면 그 소스만 null. */
export async function getImageSourceKeys(): Promise<ImageSourceKeys> {
  const envPexels = process.env.PEXELS_API_KEY || null
  const envPixabay = process.env.PIXABAY_API_KEY || null
  const envReplicate = process.env.REPLICATE_API_TOKEN || null

  let dbPexels: string | null = null
  let dbPixabay: string | null = null
  let dbReplicate: string | null = null

  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: row } = await supabase
        .from('user_api_keys')
        .select('pexels_key_enc, pixabay_key_enc, replicate_key_enc')
        .eq('user_id', user.id)
        .maybeSingle()
      if (row?.pexels_key_enc)    { try { dbPexels    = decryptKey(row.pexels_key_enc as any) }    catch {} }
      if (row?.pixabay_key_enc)   { try { dbPixabay   = decryptKey(row.pixabay_key_enc as any) }   catch {} }
      if (row?.replicate_key_enc) { try { dbReplicate = decryptKey(row.replicate_key_enc as any) } catch {} }
    }
  } catch {
    // DB 조회 실패해도 env 폴백으로 동작
  }

  return {
    pexels: dbPexels || envPexels,
    pixabay: dbPixabay || envPixabay,
    replicate: dbReplicate || envReplicate,
  }
}
