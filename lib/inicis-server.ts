import crypto from 'crypto'

// KG이니시스 서버 연동 설정.
// 기본값은 이니시스 공개 테스트 가맹점(INIpayTest). 실 서비스 시 Vercel 환경변수로 교체한다.
//   INICIS_MID       가맹점ID (실: yuanfnb568)
//   INICIS_SIGN_KEY  웹표준 signKey (상점관리자 > 상점정보 > 키관리 발급, server-only · 절대 노출 금지)
export const INICIS_MID = process.env.INICIS_MID || 'INIpayTest'
export const INICIS_SIGN_KEY = process.env.INICIS_SIGN_KEY || 'SU5JTElURV9UUklQTEVERVNfS0VZU1RS'

// 이니시스 서명 규칙: 대상 필드를 이름 알파벳순으로 정렬 → "key=value&key=value" (끝 & 없음, 공백 없음) → SHA256(hex)
export const sha256 = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest('hex')

// 승인/망취소 URL이 실제 이니시스 도메인인지 검증(위변조·SSRF 방지).
export function isInicisUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && /(^|\.)inicis\.com$/i.test(u.hostname)
  } catch {
    return false
  }
}
