// 이미지 자동 보정 파이프라인
// 페이지 테마에 따라 삽입되는 이미지의 필터/크롭/오버레이를 자동 조정
// → 스톡 이미지의 "붙인 티"를 줄이고 페이지 톤에 녹아들게 함

export type ThemeKey = 'dark' | 'gold' | 'white' | 'natural'

export type AdjustParams = {
  brightness: number    // 0.5 ~ 1.5
  saturation: number    // 0.5 ~ 1.5
  contrast: number      // 0.7 ~ 1.3
  sepia: number         // 0 ~ 1 (웜톤)
  blur: number          // 0 ~ 10 (px, 배경용)
  vignette: boolean     // 어두운 가장자리
  overlay: 'none' | 'gradient-bottom' | 'gradient-dark' | 'warm-wash'
}

// 테마별 기본 보정 프리셋
export function getThemePreset(theme: ThemeKey): AdjustParams {
  switch (theme) {
    case 'gold':
      // 프리미엄 골드 — 살짝 어둡고 웜톤 강조
      return {
        brightness: 0.94, saturation: 1.08, contrast: 1.05,
        sepia: 0.12, blur: 0, vignette: false,
        overlay: 'warm-wash',
      }
    case 'dark':
      // 모던 다크 — 콘트라스트 강화 + 비네팅
      return {
        brightness: 0.88, saturation: 1.15, contrast: 1.15,
        sepia: 0, blur: 0, vignette: true,
        overlay: 'gradient-dark',
      }
    case 'white':
      // 클린 화이트 — 밝고 채도 살짝 낮춤
      return {
        brightness: 1.03, saturation: 0.92, contrast: 0.98,
        sepia: 0, blur: 0, vignette: false,
        overlay: 'none',
      }
    case 'natural':
    default:
      // 내추럴 — 거의 원본, 살짝 웜톤
      return {
        brightness: 1.0, saturation: 1.0, contrast: 1.02,
        sepia: 0.05, blur: 0, vignette: false,
        overlay: 'none',
      }
  }
}

// AdjustParams → CSS filter 문자열
export function getCssFilter(p: AdjustParams): string {
  const parts: string[] = []
  if (p.brightness !== 1) parts.push(`brightness(${p.brightness})`)
  if (p.saturation !== 1) parts.push(`saturate(${p.saturation})`)
  if (p.contrast !== 1) parts.push(`contrast(${p.contrast})`)
  if (p.sepia > 0) parts.push(`sepia(${p.sepia})`)
  if (p.blur > 0) parts.push(`blur(${p.blur}px)`)
  return parts.join(' ')
}

// 섹션 타입에 따른 기본 화면비 (aspect-ratio)
// 왜: 조리는 와이드한 게 시원하고, 재료는 정사각 클로즈업이 좋고, 히어로는 세로로 길게
export function getAspectForSection(sectionType?: string): string {
  switch (sectionType) {
    case 'hero':
    case 'intro':
      return '3/4'      // 세로 길게, 몰입감
    case 'recipe':
    case 'cooking':
    case 'story':
      return '16/9'     // 와이드, 영화 같음
    case 'ingredients':
    case 'compare':
      return '1/1'      // 정사각, 강조
    case 'delivery':
    case 'storage':
      return '4/3'      // 실용적 비율
    default:
      return '16/9'
  }
}

// 오버레이 CSS 생성
function getOverlayCss(overlay: AdjustParams['overlay']): string {
  switch (overlay) {
    case 'gradient-bottom':
      return 'background:linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.45) 100%);'
    case 'gradient-dark':
      return 'background:linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.4));'
    case 'warm-wash':
      return 'background:linear-gradient(135deg, rgba(200,169,110,0.08), rgba(139,69,19,0.05));'
    case 'none':
    default:
      return ''
  }
}

// 최종적으로 상세페이지에 삽입될 이미지 HTML 덩어리
// 나중에 다시 보정할 수 있도록 data-* 속성에 원본 URL과 파라미터를 저장
export function makeProcessedImageHtml(
  url: string,
  theme: ThemeKey,
  sectionType?: string,
  customParams?: Partial<AdjustParams>,
): string {
  const base = getThemePreset(theme)
  const params: AdjustParams = { ...base, ...(customParams || {}) }
  const filter = getCssFilter(params)
  const aspect = getAspectForSection(sectionType)
  const overlayCss = getOverlayCss(params.overlay)

  // data-gulbi-img="true"로 마킹 → 클릭 이벤트에서 찾을 때 사용
  // data-img-src, data-theme, data-params(JSON) — 추후 재보정용
  const paramsJson = encodeURIComponent(JSON.stringify(params))

  return (
    '<div class="gulbi-img-block" data-gulbi-img="true"' +
    ` data-img-src="${url}" data-theme="${theme}"` +
    ` data-params="${paramsJson}"` +
    ` data-section-type="${sectionType || ''}"` +
    ' style="width:100%;margin:16px 0;border-radius:12px;overflow:hidden;position:relative;">' +
      `<img src="${url}" alt="" style="width:100%;height:auto;display:block;object-fit:cover;aspect-ratio:${aspect};` +
      (filter ? `filter:${filter};` : '') + '" />' +
      (params.vignette
        ? '<div style="position:absolute;inset:0;box-shadow:inset 0 0 80px rgba(0,0,0,0.45);pointer-events:none;"></div>'
        : '') +
      (overlayCss
        ? `<div style="position:absolute;inset:0;${overlayCss}pointer-events:none;"></div>`
        : '') +
    '</div>'
  )
}

// 기존 테마 키(`aiSelectedBg`: 'dark' | 'warm' | 'white')를 내부 ThemeKey로 변환
// 'warm'을 'gold'로 매핑 — 의미가 같음
export function mapBgToTheme(bg: string): ThemeKey {
  if (bg === 'warm') return 'gold'
  if (bg === 'dark') return 'dark'
  if (bg === 'white') return 'white'
  return 'natural'
}
