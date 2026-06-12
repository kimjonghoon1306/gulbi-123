import crypto from 'crypto'

// ─────────────────────────────────────────────────────────────
// 서버사이드 전용 키 암호화 (AES-256-GCM)
//
// 환경변수 API_KEY_ENCRYPTION_SECRET 에는 32바이트(=64 hex chars) 키를 넣어야 함.
// 생성 방법: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
// 사용처: API 라우트 (/api/*)에서만. 클라이언트에 절대 노출 X.
// ─────────────────────────────────────────────────────────────

const ALGO = 'aes-256-gcm'
const IV_LEN = 12      // GCM 권장 IV 길이
const TAG_LEN = 16     // GCM auth tag 길이

function getKey(): Buffer {
  const hex = process.env.API_KEY_ENCRYPTION_SECRET
  if (!hex) {
    throw new Error('API_KEY_ENCRYPTION_SECRET 환경변수가 설정되지 않았습니다.')
  }
  if (hex.length !== 64) {
    throw new Error('API_KEY_ENCRYPTION_SECRET은 64자 hex 문자열이어야 합니다 (32바이트).')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * 평문 → 암호화 문자열 (DB에 text로 저장).
 * 구조: base64( [IV(12) | TAG(16) | CIPHERTEXT(..)] )
 * ※ Node Buffer를 supabase-js로 그대로 insert하면 JSON 객체로 직렬화돼 저장이 깨지므로
 *   반드시 base64 문자열로 저장한다.
 */
export function encryptKey(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

/**
 * 암호화 문자열 → 평문. base64(신규) / '\x..'hex(구 bytea) / Buffer 모두 처리.
 */
export function decryptKey(value: Buffer | Uint8Array | string): string {
  const key = getKey()
  let data: Buffer
  if (typeof value === 'string') {
    if (value.startsWith('\\x')) data = Buffer.from(value.slice(2), 'hex')   // 구 bytea hex
    else data = Buffer.from(value, 'base64')                                 // 신규 base64
  } else {
    data = Buffer.from(value)
  }
  const iv = data.subarray(0, IV_LEN)
  const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const enc = data.subarray(IV_LEN + TAG_LEN)
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return dec.toString('utf8')
}

/**
 * 화면 표시용 마스킹 힌트 만들기
 * 'sk-proj-abcdefghijklmnopXyz123' → 'sk-...Xyz123'
 */
export function makeKeyHint(plaintext: string): string {
  if (!plaintext || plaintext.length < 10) return '****'
  const prefix = plaintext.slice(0, 3)
  const suffix = plaintext.slice(-6)
  return `${prefix}-...${suffix}`
}
