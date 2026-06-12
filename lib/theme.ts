// 온종일팜 공통 색상 토큰
// 그동안 페이지마다 #15803d 등 녹색값이 곳곳에 하드코딩돼 있었음.
// 앞으로 새 코드/리팩터는 이 토큰을 import 해서 일관성을 유지할 것.
// (기존 인라인 스타일을 한꺼번에 바꾸진 않음 — 화면 깨짐 방지)

export const brand = {
  // 메인 녹색 계열
  green900: '#14532d',
  green800: '#15803d',
  green700: '#047857',
  green600: '#16a34a',
  green500: '#22c55e',
  greenBright: '#4ade80', // 다크모드 텍스트 가독성용

  // 회원 등급 구분색
  general: '#15803d',
  retail: '#14532d',
  wholesale: '#047857',

  // 포인트
  accentPink: '#ec4899',
  warn: '#f59e0b',
  danger: '#ef4444',
} as const

// 라이트/다크 표면 색
export const surface = {
  light: {
    bg: '#f0faf9',
    card: '#ffffff',
    text: '#0f172a',
    sub: '#64748b',
    border: 'rgba(0,0,0,0.08)',
  },
  dark: {
    bg: '#0a1c13',
    card: '#102a1d',
    card2: '#15391f',
    text: '#eaf5ee',
    sub: '#86a394',
    border: 'rgba(52,211,153,0.14)',
    headerBg: 'rgba(10,28,19,0.95)',
  },
} as const

// 자주 쓰는 그라데이션
export const gradient = {
  greenBtn: 'linear-gradient(135deg,#16a34a,#15803d)',
  greenDeep: 'linear-gradient(135deg,#14532d,#15803d)',
} as const
