// ─────────────────────────────────────────────────────────────
// 쇼케이스 스타일 시스템 (다양성 엔진)
//
// 목적: "생성하면 카테고리에 맞는, 완전 다른 느낌의 이쁜 상세페이지"가 나오게.
//  · 레이아웃은 1개(히어로·임팩트·포인트·숫자·리뷰) — 데모로 검증된 구조
//  · 5카테고리 × 6무드 = 30스타일. 색감·폰트·무드만 다름 → 같은 상품도 30가지 느낌
//  · 배경은 상품 사진(mainImageUrl)을 풀블리드로 → 배경 조달 없이도 이쁨
//
// 기존 landing-templates.ts(9템플릿)는 건드리지 않음(백업). 이건 병렬 신규 시스템.
// 순수 함수라 서버/클라이언트 양쪽에서 렌더 가능.
// ─────────────────────────────────────────────────────────────

import type { LandingData } from './landing-templates'

export type ShowcaseCategory = 'seafood' | 'health' | 'produce' | 'meat' | 'processed'
export type ShowcaseMood = 'premium' | 'market' | 'clean' | 'traditional' | 'modern' | 'story'

export type ShowcaseStyle = {
  id: string            // "seafood.premium"
  category: ShowcaseCategory
  mood: ShowcaseMood
  name: string          // 표시명 "프리미엄 딥"
  catLabel: string      // "수산물"
  // ★레이아웃 골격 — 무드마다 이미지 배치/제목 위치가 실제로 다르다(색만 다른 게 아님)
  //  cinematic: 풀블리드 시네마틱(제목 하단) · poster: 상단 컬러바 제목+2열 그리드
  //  gallery: 여백+액자(제목 사진 위 흰바탕) · framed: 전통 테두리 액자
  //  split: 사진 위·제목 검은 띠 아래 분할 · editorial: 좌우 교차 매거진
  layoutKind: 'cinematic' | 'poster' | 'gallery' | 'framed' | 'split' | 'editorial'
  // 팔레트
  paper: string; ink: string; accent: string; accent2: string; muted: string; line: string
  heroGrad: string; heroJustify: 'center' | 'flex-end'; heroAlign: 'left' | 'center'
  brandColor: string; badgeColor: string; badgeBg: string; badgeRadius: string
  titleColor: string; subColor: string; titleEmBlock: boolean
  impactBg: string; impactFg: string; impactSub: string
  ptBg: string; numBg: string; numFg: string; numFig: string
  footBg: string; footFg: string
  // 폰트
  titleFont: string; titleWeight: string; bodyFont: string; brandFont: string; numFont: string
  // ★headFont: 특징 제목·소제목 등 '중간 크기' 글씨용. 큰 히어로 제목엔 개성 폰트(titleFont)를,
  //   작은 제목엔 깔끔한 폰트를 써서 예시가 기본으로 이쁘게(예: 활기찬 시장의 Black Han Sans는 큰 제목만).
  headFont: string
  titleSize: string; titleLh: string; titleLs: string
  eyebrowFont: string
}

// ── 카테고리 기본 색/라벨 ──
const CAT: Record<ShowcaseCategory, { label: string; accent: string; deep: string; light: string; warm: string; warmDeep: string }> = {
  seafood:   { label: '수산물', accent: '#5fd4e8', deep: '#0b1420', light: '#dce6f0', warm: '#f0954a', warmDeep: '#1a1310' },
  health:    { label: '건강식품', accent: '#c49a3a', deep: '#1e140c', light: '#f5f0e6', warm: '#c49a3a', warmDeep: '#241813' },
  produce:   { label: '농산물', accent: '#5a9a2e', deep: '#1e2d0f', light: '#f2f6e8', warm: '#e8a02e', warmDeep: '#2a2010' },
  meat:      { label: '정육', accent: '#d4a24a', deep: '#141110', light: '#eadfd8', warm: '#c0392b', warmDeep: '#2a1a17' },
  processed: { label: '반찬·가공', accent: '#cc6633', deep: '#1f1610', light: '#f2e8dc', warm: '#cc6633', warmDeep: '#241812' },
}

const MOOD_NAME: Record<ShowcaseMood, string> = {
  premium: '프리미엄 딥', market: '활기찬 시장', clean: '청정 미니멀',
  traditional: '전통', modern: '모던 블랙', story: '감성 스토리',
}

// 카테고리 메타(갤러리 그룹 헤더용) — 이모지·색으로 크게 구분
const CAT_EMOJI: Record<ShowcaseCategory, string> = {
  seafood: '🐟', health: '🌿', produce: '🥬', meat: '🥩', processed: '🍶',
}
export const SHOWCASE_CATEGORIES: { id: ShowcaseCategory; label: string; emoji: string; color: string }[] =
  (Object.keys(CAT) as ShowcaseCategory[]).map(id => ({ id, label: CAT[id].label, emoji: CAT_EMOJI[id], color: CAT[id].accent }))

// ── 무드별 스타일 생성 (카테고리 색을 주입) ──
function buildStyle(category: ShowcaseCategory, mood: ShowcaseMood): ShowcaseStyle {
  const c = CAT[category]
  const base = {
    id: `${category}.${mood}`, category, mood, name: MOOD_NAME[mood], catLabel: c.label,
    heroJustify: 'flex-end' as const, heroAlign: 'left' as const, titleEmBlock: true,
    titleWeight: '800', titleSize: '44px', titleLh: '1.16', titleLs: '-.02em',
    eyebrowFont: `'Pretendard',sans-serif`, brandFont: `'Pretendard',sans-serif`,
    bodyFont: `'Pretendard',sans-serif`, numFont: `'Pretendard',sans-serif`, titleFont: `'Pretendard',sans-serif`,
    brandColor: '#fff', badgeRadius: '40px', titleColor: '#fff', subColor: 'rgba(255,255,255,.86)',
    headFont: `'Pretendard',sans-serif`,   // 기본: 깔끔한 산세리프(무드별로 아래에서 덮어씀)
  }
  switch (mood) {
    case 'premium': return { ...base, layoutKind: 'cinematic',
      paper: c.deep, ink: c.light, accent: c.accent, accent2: c.accent, muted: '#8ca0b8', line: 'rgba(150,170,190,.18)',
      heroGrad: `linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,0) 35%,${c.deep} 96%)`,
      badgeColor: c.accent, badgeBg: 'rgba(255,255,255,.12)',
      impactBg: c.deep, impactFg: '#fff', impactSub: 'rgba(220,230,240,.55)',
      ptBg: c.deep, numBg: c.deep, numFg: '#fff', numFig: '#fff', footBg: c.deep, footFg: 'rgba(200,215,230,.45)',
    }
    case 'market': return { ...base, layoutKind: 'poster',
      heroJustify: 'center', heroAlign: 'center', titleFont: `'Black Han Sans',sans-serif`, titleWeight: '400',
      titleSize: '52px', titleLh: '1.08', titleLs: '.01em', brandFont: `'Do Hyeon',sans-serif`, numFont: `'Black Han Sans',sans-serif`,
      paper: '#fff8ee', ink: '#2a1a10', accent: '#ff3b2f', accent2: '#e8410a', muted: '#7a5a44', line: 'rgba(200,80,20,.18)',
      heroGrad: 'linear-gradient(180deg,rgba(30,15,8,.5),rgba(30,15,8,.55))',
      badgeColor: '#fff', badgeBg: '#ff3b2f', badgeRadius: '6px',
      impactBg: '#e8410a', impactFg: '#fff', impactSub: 'rgba(255,235,225,.85)',
      ptBg: '#fff8ee', numBg: '#ffd21e', numFg: '#2a1a10', numFig: '#e8410a', footBg: '#2a1a10', footFg: 'rgba(255,220,200,.5)',
    }
    case 'clean': return { ...base, layoutKind: 'gallery',
      titleWeight: '700', titleSize: '42px',
      paper: c.light, ink: c.deep, accent: c.accent, accent2: c.accent, muted: '#7a8894', line: 'rgba(40,60,80,.14)',
      heroGrad: `linear-gradient(180deg,rgba(20,30,40,.15),rgba(20,30,40,0) 45%,rgba(20,30,40,.72))`,
      badgeColor: c.accent, badgeBg: 'rgba(255,255,255,.85)',
      impactBg: '#ffffff', impactFg: c.deep, impactSub: '#8a97a3',
      ptBg: '#ffffff', numBg: c.deep, numFg: '#fff', numFig: c.accent, footBg: c.deep, footFg: 'rgba(210,220,228,.5)',
    }
    case 'traditional': return { ...base, layoutKind: 'framed', headFont: `'Nanum Myeongjo',serif`,
      heroJustify: 'center', heroAlign: 'center', titleFont: `'Nanum Myeongjo',serif`, titleWeight: '800',
      titleSize: '42px', titleLh: '1.4', titleLs: '0', brandFont: `'Nanum Myeongjo',serif`, numFont: `'Nanum Myeongjo',serif`,
      eyebrowFont: `'Nanum Myeongjo',serif`, bodyFont: `'Nanum Myeongjo',serif`,
      paper: '#f2ebdc', ink: '#241d14', accent: '#b8862f', accent2: '#8a5a1f', muted: '#6a5a44', line: 'rgba(60,45,25,.16)',
      heroGrad: 'linear-gradient(180deg,rgba(25,18,10,.55),rgba(25,18,10,.5))',
      badgeColor: '#fff', badgeBg: 'rgba(184,134,47,.9)', badgeRadius: '3px',
      impactBg: '#1a130a', impactFg: '#f2ebdc', impactSub: 'rgba(230,215,190,.5)',
      ptBg: '#ede4d2', numBg: 'linear-gradient(160deg,#33260f,#1a130a)', numFg: '#f2ebdc', numFig: '#f2ebdc',
      footBg: '#1a130a', footFg: 'rgba(230,215,190,.45)',
    }
    case 'modern': return { ...base, layoutKind: 'split', headFont: `'Playfair Display',serif`,
      titleFont: `'Playfair Display',serif`, titleWeight: '700', titleSize: '44px', titleLs: '-.01em',
      brandFont: `'Playfair Display',serif`, numFont: `'Playfair Display',serif`, eyebrowFont: `'Playfair Display',serif`,
      paper: '#101010', ink: '#e8e8e8', accent: c.accent, accent2: '#9a9a9a', muted: '#888', line: 'rgba(200,200,200,.14)',
      heroGrad: 'linear-gradient(180deg,rgba(16,16,16,.4),rgba(16,16,16,0) 35%,rgba(16,16,16,.96))',
      badgeColor: '#101010', badgeBg: '#e8e8e8', badgeRadius: '2px',
      impactBg: '#181818', impactFg: '#fff', impactSub: 'rgba(220,220,220,.5)',
      ptBg: '#141414', numBg: '#000', numFg: '#fff', numFig: '#fff', footBg: '#000', footFg: 'rgba(200,200,200,.4)',
    }
    case 'story': return { ...base, layoutKind: 'editorial', headFont: `'Gowun Batang',serif`,
      titleFont: `'Gowun Batang',serif`, titleWeight: '700', titleSize: '40px', titleLh: '1.35', titleLs: '-.01em',
      brandFont: `'Gowun Batang',serif`, numFont: `'Gowun Batang',serif`, eyebrowFont: `'Gowun Batang',serif`, bodyFont: `'Gowun Batang',serif`,
      paper: c.warmDeep, ink: '#f0e4d8', accent: c.warm, accent2: c.warm, muted: '#a08a78', line: 'rgba(200,150,110,.16)',
      heroGrad: `linear-gradient(180deg,rgba(20,12,8,.4),rgba(20,12,8,0) 35%,${c.warmDeep} 95%)`,
      badgeColor: c.warm, badgeBg: 'rgba(255,255,255,.14)',
      impactBg: '#241813', impactFg: '#f0e4d8', impactSub: 'rgba(230,210,190,.55)',
      ptBg: c.warmDeep, numBg: `linear-gradient(160deg,#3a2418,${c.warmDeep})`, numFg: '#f0e4d8', numFig: c.warm,
      footBg: c.warmDeep, footFg: 'rgba(230,210,190,.45)',
    }
  }
}

export const SHOWCASE_STYLES: ShowcaseStyle[] =
  (Object.keys(CAT) as ShowcaseCategory[]).flatMap(cat =>
    (['premium', 'market', 'clean', 'traditional', 'modern', 'story'] as ShowcaseMood[]).map(m => buildStyle(cat, m))
  )

export function getShowcaseStyle(id: string): ShowcaseStyle {
  return SHOWCASE_STYLES.find(s => s.id === id) || SHOWCASE_STYLES[0]
}

// 상품군(fresh/processed…)+세부품목+상품명 → 카테고리 추론
export function inferCategory(opts: { productGroup?: string; freshType?: string; productName?: string }): ShowcaseCategory {
  const name = (opts.productName || '').toLowerCase()
  if (opts.freshType === 'livestock' || /한우|소고기|돼지|정육|삼겹|목살|등심|안심/.test(name)) return 'meat'
  if (opts.freshType === 'seafood' || /생선|굴비|박대|고등어|갈치|새우|게|전복|조개|오징어|낙지|수산|해물/.test(name)) return 'seafood'
  if (opts.freshType === 'produce' || /과일|채소|사과|배|참외|딸기|쌀|농산|버섯|나물/.test(name)) return 'produce'
  if (opts.productGroup === 'processed' || /홍삼|즙|비타민|영양|건강|유산균|콜라겐/.test(name)) return 'health'
  if (/젓갈|김치|장|반찬|소스|절임|장아찌|간장|고추장|된장/.test(name)) return 'processed'
  if (opts.productGroup === 'processed') return 'processed'
  return 'seafood'
}

// 카테고리 기준 추천 스타일(그 카테고리 6개를 상단에)
export function recommendStyles(category: ShowcaseCategory): ShowcaseStyle[] {
  const own = SHOWCASE_STYLES.filter(s => s.category === category)
  const rest = SHOWCASE_STYLES.filter(s => s.category !== category)
  return [...own, ...rest]
}

// ── 렌더 ──
const FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gowun+Batang:wght@400;700&family=Nanum+Myeongjo:wght@400;700;800&family=Jua&family=Do+Hyeon&family=Playfair+Display:wght@700&display=swap" rel="stylesheet"><link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"/>`

const ed = (key: string) => `contenteditable="true" data-key="${key}" spellcheck="false"`
const esc = (s: any) => String(s ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export type ShowcaseLayout = 'balanced' | 'visual' | 'facts'

export function renderShowcase(d: LandingData, styleId: string, layout: ShowcaseLayout = 'balanced'): string {
  const s = getShowcaseStyle(styleId)
  const isVisual = layout === 'visual'
  const isFacts = layout === 'facts'
  // ★ 사용자가 올린 사진을 하나도 버리지 않는다. 모든 이미지를 모아 중복 제거.
  const si = d.sectionImages || {}
  const allImages = Array.from(new Set([
    si.hero, si.origin, si.story, si.feature, si.recipe, si.storage,
    ...(d.unusedImages || []), d.mainImageUrl,
  ].filter(Boolean))) as string[]
  const heroImg = allImages[0] || ''
  const bodyImages = allImages.slice(1)   // 히어로 배경 뺀 나머지는 큰 사진 섹션으로
  const title = d.catchphrase || d.productName || '상품명'
  const brand = d.brandName || '온종일팜'
  const feats = (d.features || []).slice(0, 3)
  const kn = d.keyNumber
  const reviews = (d.reviews || []).slice(0, 3)
  const infoRows = [...(d.info || []), ...(d.delivery || []).map(x => ({ key: x.label, value: x.value }))].slice(0, 6)
  // 히어로엔 짧은 한 줄만(긴 본문이 사진 위에 겹치지 않게). 본문 story는 별도 섹션.
  const heroLine = (d.subtitle || d.catchphrase || '').slice(0, 60)
  const shotCaps = ['정성껏 준비한 상품', '신선함을 그대로', '믿고 드시는 품질', '식탁 위의 완성']

  // 히어로 타이틀: 2줄로 나눠 두 번째 줄을 accent로(감성/임팩트)
  const words = title.split(' ')
  const t1 = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : title
  const t2 = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : ''

  const css = `
<style>
[data-showcase]{max-width:460px;margin:0 auto;background:${s.paper};color:${s.ink};font-family:${s.bodyFont};line-height:1.7;-webkit-font-smoothing:antialiased;overflow:hidden}
[data-showcase] *{box-sizing:border-box}
[data-showcase] img{display:block;width:100%}
[data-showcase] h1,[data-showcase] h2,[data-showcase] h3,[data-showcase] p,[data-showcase] span{word-break:keep-all}
[data-showcase] [contenteditable="true"]:hover{background:${s.accent}22;cursor:text;border-radius:3px}
[data-showcase] [contenteditable="true"]:focus{outline:2px dashed ${s.accent};outline-offset:3px;border-radius:4px}
.sc-hero{position:relative;min-height:92vh;overflow:hidden;display:flex;flex-direction:column;justify-content:${s.heroJustify}}
.sc-hbg{position:absolute;inset:0;background:${heroImg ? `url('${heroImg}') center/cover` : s.impactBg}}
.sc-hbg::after{content:"";position:absolute;inset:0;background:${s.heroGrad}}
.sc-htop{position:absolute;top:0;left:0;right:0;padding:20px 24px 0;display:flex;justify-content:space-between;align-items:center;z-index:3}
.sc-brand{font-family:${s.brandFont};font-weight:800;color:${s.brandColor};font-size:14px;letter-spacing:.2em}
.sc-badge{font-size:10px;font-weight:800;color:${s.badgeColor};background:${s.badgeBg};padding:5px 11px;border-radius:${s.badgeRadius};backdrop-filter:blur(3px)}
.sc-hin{position:relative;z-index:3;padding:0 26px 44px;text-align:${s.heroAlign}}
.sc-eyebrow{display:inline-block;color:${s.accent};font-size:15px;letter-spacing:.12em;font-weight:800;margin-bottom:14px;font-family:${s.eyebrowFont};text-shadow:0 2px 10px rgba(0,0,0,.75)}
.sc-title{font-family:${s.titleFont};font-weight:${s.titleWeight};color:${s.titleColor};font-size:${s.titleSize};line-height:${s.titleLh};letter-spacing:${s.titleLs};text-shadow:0 4px 24px rgba(0,0,0,.45)}
.sc-title em{font-style:normal;color:${s.accent};display:${s.titleEmBlock ? 'block' : 'inline'}}
.sc-sub{color:${s.titleColor};opacity:.92;font-size:17px;margin-top:16px;font-weight:400;line-height:1.75;${s.heroAlign === 'center' ? 'max-width:340px;margin-left:auto;margin-right:auto' : 'max-width:320px'}}
/* 본문 스토리 섹션(이미지 위 아님, 별도 섹션) — 글씨 크게, 대비 확보 */
.sc-story{background:${s.ptBg};color:${s.ink};padding:60px 28px}
.sc-story .k{font-size:12px;letter-spacing:.35em;color:${s.accent2};font-weight:800;margin-bottom:14px}
.sc-story h2{font-family:${s.headFont};font-weight:800;font-size:28px;line-height:1.35;margin-bottom:28px;color:${s.ink}}
.sc-story .body p{font-size:17px;line-height:1.95;color:${s.ink};opacity:.82;margin:0 0 18px}
.sc-photo{position:relative;width:100%;background:${s.ptBg}}
.sc-photo img{width:100%;display:block}
.sc-impact{background:${s.impactBg};color:${s.impactFg};padding:70px 30px;text-align:center}
/* POINT 라벨: impactBg가 accent색일 때 묻히지 않게 impactFg(대개 흰색) 기반 */
.sc-impact .k{font-size:13px;letter-spacing:.3em;color:${s.impactFg};opacity:.7;font-weight:800;margin-bottom:18px}
.sc-impact h2{font-family:${s.titleFont};font-weight:${s.titleWeight};font-size:32px;line-height:1.3;letter-spacing:-.01em;color:${s.impactFg};word-break:keep-all}
.sc-impact h2 em{font-style:normal;color:${s.impactFg}}
.sc-impact .tail{color:${s.impactFg};opacity:.85;font-size:16px;margin-top:20px;font-weight:400;line-height:1.85}
.sc-shot{position:relative}
.sc-shot::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.55),transparent 45%)}
.sc-shot .cap{position:absolute;left:24px;bottom:22px;right:24px;color:#fff;z-index:2}
.sc-shot .cap .t{font-family:${s.headFont};font-weight:800;font-size:22px;text-shadow:0 2px 12px rgba(0,0,0,.7)}
/* 이미지 집중형: 사진 더 크게(min-height), 캡션도 크게 */
.sc-shot.big{min-height:82vh;display:flex;overflow:hidden}
.sc-shot.big img{width:100%;height:88vh;object-fit:cover}
.sc-shot.big::after{background:linear-gradient(0deg,rgba(0,0,0,.75),rgba(0,0,0,0) 55%)}
.sc-shot.big .cap{bottom:40px}
/* ── 스크롤 등장 애니메이션(무료·후킹) : 사진 살짝 확대되며, 캡션 밑에서 올라옴 ── */
@media (prefers-reduced-motion: no-preference){
  [data-showcase][data-layout="visual"] .sc-shot.big img{
    animation:scKen linear both; animation-timeline:view(); animation-range:cover 0% cover 100%;
  }
  @keyframes scKen{ from{transform:scale(1.18) translateY(2%)} to{transform:scale(1) translateY(-2%)} }
  [data-showcase][data-layout="visual"] .sc-shot.big .cap{
    animation:scRise linear both; animation-timeline:view(); animation-range:entry 10% entry 60%;
  }
  @keyframes scRise{ from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:none} }
  /* 모든 텍스트 섹션: 들어올 때 스르륵 등장 */
  [data-showcase][data-layout="visual"] .sc-impact,
  [data-showcase][data-layout="visual"] .sc-num,
  [data-showcase][data-layout="visual"] .sc-rc{
    animation:scRise linear both; animation-timeline:view(); animation-range:entry 0% entry 45%;
  }
}
.sc-shot.big .cap .t{font-size:30px;line-height:1.25}
.sc-points{padding:64px 26px;background:${s.ptBg}}
.sc-sh{text-align:center;margin-bottom:40px}
.sc-sh .en{font-size:12px;letter-spacing:.35em;color:${s.accent2};font-weight:800}
.sc-sh .ko{font-family:${s.headFont};font-weight:800;font-size:30px;margin-top:10px;color:${s.ink}}
.sc-pt{display:flex;gap:18px;padding:24px 0;border-top:1px solid ${s.line}}
.sc-pt:last-child{border-bottom:1px solid ${s.line}}
.sc-pt .no{font-family:${s.numFont};font-size:34px;color:${s.accent2};line-height:1;flex:none;width:50px;font-weight:800}
.sc-pt h3{font-family:${s.headFont};font-weight:800;font-size:19px;margin-bottom:7px;color:${s.ink}}
.sc-pt p{font-size:16px;color:${s.ink};opacity:.78;line-height:1.75}
.sc-num{background:${s.numBg};color:${s.numFg};text-align:center;padding:66px 24px}
.sc-num .lead{font-size:14px;letter-spacing:.2em;color:${s.accent};font-weight:800;margin-bottom:14px}
.sc-num .fig{font-family:${s.numFont};font-size:68px;line-height:1;color:${s.numFig};font-weight:800}
.sc-num .fig .u{font-size:28px;color:${s.accent}}
.sc-num .st{color:${s.accent};letter-spacing:3px;font-size:16px;margin-top:12px}
.sc-num .desc{font-size:16px;color:${s.numFg};opacity:.82;margin-top:14px;font-weight:400}
.sc-rev{padding:56px 24px;background:${s.ptBg}}
.sc-rc{background:${s.mood === 'clean' || s.mood === 'market' || s.mood === 'traditional' ? '#ffffff' : 'rgba(255,255,255,.08)'};border:1px solid ${s.line};border-radius:14px;padding:20px;margin-bottom:14px}
.sc-rc .top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.sc-rc .av{width:34px;height:34px;border-radius:50%;background:${s.accent2};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px}
.sc-rc .nm{font-weight:700;font-size:15px;color:${s.mood === 'clean' || s.mood === 'market' || s.mood === 'traditional' ? '#222' : s.ink}}
.sc-rc .stars{margin-left:auto;color:${s.accent};font-size:13px}
.sc-rc p{font-size:15.5px;color:${s.mood === 'clean' || s.mood === 'market' || s.mood === 'traditional' ? '#444' : s.ink};opacity:.88;line-height:1.75}
/* 정보 섹션 — 본문 배경/글씨로 대비 확보(어두운 footBg에 안 묻히게) */
.sc-info{background:${s.ptBg};color:${s.ink};padding:48px 26px;border-top:1px solid ${s.line}}
.sc-info h4{font-family:${s.headFont};font-weight:800;font-size:18px;color:${s.accent2};margin-bottom:18px}
.sc-info .row{display:flex;gap:14px;padding:14px 0;border-top:1px solid ${s.line};font-size:15.5px}
.sc-info .row span:first-child{color:${s.accent2};flex:none;width:84px;font-weight:800}
.sc-info .row span:last-child{color:${s.ink};opacity:.85;line-height:1.6}
.sc-facts{background:${s.ptBg};color:${s.ink};padding:58px 24px}
.sc-facts .ey{font-size:12px;letter-spacing:.28em;color:${s.accent2};font-weight:900;margin-bottom:10px}
.sc-facts h2{font-family:${s.headFont};font-size:30px;line-height:1.3;margin-bottom:28px;color:${s.ink}}
.sc-statgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px}
.sc-stat{border:1px solid ${s.line};background:${s.paper};padding:18px 14px;min-height:118px}
.sc-stat b{display:block;font-family:${s.numFont};font-size:30px;line-height:1;color:${s.accent2};margin-bottom:9px}
.sc-stat strong{display:block;font-size:13px;color:${s.ink};margin-bottom:5px}.sc-stat p{font-size:12px;line-height:1.55;opacity:.7}
.sc-compare{border-top:2px solid ${s.accent2}}
.sc-crow{display:grid;grid-template-columns:72px 1fr 1fr;border-bottom:1px solid ${s.line};font-size:12.5px}
.sc-crow span{padding:12px 8px;line-height:1.45}.sc-crow span:first-child{font-weight:900;color:${s.accent2}}
.sc-crow .ours{font-weight:800;background:${s.accent}18;color:${s.ink}}
.sc-faq{background:${s.paper};padding:50px 24px;color:${s.ink}}
.sc-faq h3{font-family:${s.headFont};font-size:24px;margin-bottom:18px}.sc-faq .q{padding:16px 0;border-top:1px solid ${s.line}}
.sc-faq .q b{display:block;color:${s.accent2};font-size:15px;margin-bottom:7px}.sc-faq .q p{font-size:14px;line-height:1.7;opacity:.8}
.sc-foot{background:${s.footBg};color:${s.footFg};text-align:center;padding:28px 20px 40px;font-size:11px;border-top:1px solid rgba(255,255,255,.06)}
.sc-foot b{font-family:${s.brandFont};color:${s.accent};letter-spacing:.25em;font-weight:800;font-size:13px;display:block;margin-bottom:7px}

/* ═══ 레이아웃 골격: 무드마다 이미지 배치·제목 위치가 실제로 다르다 ═══ */
/* poster(활기찬 시장): 상단 컬러바에 제목, 그 아래 사진, 본문은 2열 그리드 콜라주 */
.lk-poster .phero{position:relative}
.lk-poster .pbar{background:${s.accent};color:#fff;padding:22px 22px 20px;text-align:center}
.lk-poster .pbar .brand{font-family:${s.brandFont};font-weight:800;font-size:12px;letter-spacing:.2em;opacity:.9}
.lk-poster .pbar h1{font-family:${s.titleFont};font-weight:${s.titleWeight};font-size:44px;line-height:1.05;margin:8px 0 6px;letter-spacing:.01em}
.lk-poster .pbar .sub{font-size:14px;opacity:.95;font-weight:700}
.lk-poster .pshot{aspect-ratio:4/3;overflow:hidden;border-bottom:6px solid ${s.numBg}}
.lk-poster .pshot img{width:100%;height:100%;object-fit:cover}
.lk-poster .pgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px;background:${s.paper}}
.lk-poster .pgrid .g{position:relative;aspect-ratio:1/1;overflow:hidden;border-radius:8px}
.lk-poster .pgrid .g img{width:100%;height:100%;object-fit:cover}
.lk-poster .pgrid .g .gcap{position:absolute;left:8px;bottom:8px;background:${s.accent};color:#fff;font-size:11px;font-weight:800;padding:4px 9px;border-radius:5px}
.lk-poster .pgrid .g.wide{grid-column:1/-1;aspect-ratio:16/9}

/* gallery(청정 미니멀): 넉넉한 여백, 제목은 흰 바탕 위(사진 위 아님), 사진은 액자처럼 여백+얇은 테두리 */
.lk-gallery .ghead{background:${s.paper};text-align:center;padding:64px 30px 36px}
.lk-gallery .ghead .eye{color:${s.accent};font-size:13px;letter-spacing:.24em;font-weight:800;margin-bottom:18px}
.lk-gallery .ghead h1{font-family:${s.titleFont};font-weight:${s.titleWeight};font-size:38px;line-height:1.25;color:${s.ink};letter-spacing:-.01em}
.lk-gallery .ghead .sub{color:${s.muted};font-size:15px;margin-top:16px;line-height:1.7;max-width:300px;margin-left:auto;margin-right:auto}
.lk-gallery .gframe{padding:14px 22px 40px;background:${s.paper}}
.lk-gallery .gframe .fr{border:1px solid ${s.line};padding:10px;background:#fff}
.lk-gallery .gframe .fr img{width:100%;display:block}
.lk-gallery .gframe .cap{text-align:center;color:${s.muted};font-size:13px;letter-spacing:.1em;margin-top:14px}

/* framed(전통): 사진을 이중 테두리 액자에 넣고, 제목은 아래 도장(印)과 함께 */
.lk-framed .fhero{background:${s.paper};padding:40px 26px 30px}
.lk-framed .fhero .art{border:2px solid ${s.accent2};padding:8px;position:relative}
.lk-framed .fhero .art::after{content:"";position:absolute;inset:3px;border:1px solid ${s.line};pointer-events:none}
.lk-framed .fhero .art img{width:100%;display:block;filter:sepia(.12)}
.lk-framed .fhero .seal{position:absolute;top:16px;right:16px;width:44px;height:44px;border:2px solid ${s.accent};color:${s.accent};display:flex;align-items:center;justify-content:center;font-family:${s.titleFont};font-weight:800;font-size:20px;background:rgba(255,255,255,.85);z-index:2}
.lk-framed .fhero .cap{text-align:center;margin-top:24px}
.lk-framed .fhero .cap .eye{color:${s.accent2};font-size:13px;letter-spacing:.3em;font-family:${s.eyebrowFont}}
.lk-framed .fhero .cap h1{font-family:${s.titleFont};font-weight:${s.titleWeight};font-size:34px;line-height:1.4;color:${s.ink};margin-top:12px}
.lk-framed .fbody .fr{margin:0 26px 24px;border:1px solid ${s.accent2};padding:7px;background:${s.paper}}
.lk-framed .fbody .fr img{width:100%;display:block}

/* split(모던 블랙): 사진 위 / 제목은 그 아래 검은 띠에 크게(오버레이 아님) */
.lk-split .shero .top{aspect-ratio:1/1;overflow:hidden}
.lk-split .shero .top img{width:100%;height:100%;object-fit:cover}
.lk-split .shero .band{background:${s.paper};padding:40px 26px 44px;border-top:3px solid ${s.accent}}
.lk-split .shero .band .eye{color:${s.accent};font-size:12px;letter-spacing:.3em;font-weight:700;margin-bottom:16px}
.lk-split .shero .band h1{font-family:${s.titleFont};font-weight:${s.titleWeight};font-size:46px;line-height:1.08;color:${s.ink};letter-spacing:-.02em}
.lk-split .shero .band .sub{color:${s.muted};font-size:15px;margin-top:18px;line-height:1.7}
.lk-split .sbody .row{position:relative}
.lk-split .sbody .row img{width:100%;display:block}
.lk-split .sbody .lbl{background:${s.paper};color:${s.ink};padding:26px;display:flex;gap:16px;align-items:baseline;border-bottom:1px solid ${s.line}}
.lk-split .sbody .lbl .n{font-family:${s.numFont};font-size:30px;color:${s.accent};flex:none}
.lk-split .sbody .lbl h3{font-family:${s.headFont};font-size:18px;font-weight:800;margin-bottom:6px}
.lk-split .sbody .lbl p{color:${s.muted};font-size:14.5px;line-height:1.7}

/* editorial(감성 스토리): 매거진 표지(사진+겹친 제목 카드) + 좌우 교차 본문 */
.lk-editorial .ehero{position:relative;padding-bottom:56px;background:${s.paper}}
.lk-editorial .ehero img{width:100%;display:block;aspect-ratio:3/4;object-fit:cover}
.lk-editorial .ehero .card{position:absolute;left:22px;right:40px;bottom:0;background:${s.paper};padding:26px 24px;border-top:3px solid ${s.accent}}
.lk-editorial .ehero .card .eye{color:${s.accent};font-family:${s.eyebrowFont};font-size:13px;letter-spacing:.14em;margin-bottom:12px}
.lk-editorial .ehero .card h1{font-family:${s.titleFont};font-weight:${s.titleWeight};font-size:34px;line-height:1.3;color:${s.ink}}
.lk-editorial .erow{display:grid;grid-template-columns:1fr 1fr;gap:0;align-items:stretch}
.lk-editorial .erow.rev{direction:rtl}.lk-editorial .erow.rev>*{direction:ltr}
.lk-editorial .erow img{width:100%;height:100%;min-height:180px;object-fit:cover}
.lk-editorial .erow .tx{padding:26px 22px;background:${s.paper};display:flex;flex-direction:column;justify-content:center}
.lk-editorial .erow .tx .n{font-family:${s.numFont};color:${s.accent};font-size:24px;margin-bottom:8px}
.lk-editorial .erow .tx h3{font-family:${s.headFont};font-weight:800;font-size:19px;margin-bottom:8px;color:${s.ink}}
.lk-editorial .erow .tx p{color:${s.muted};font-size:14px;line-height:1.75}
</style>`

  // 사진 섹션 헬퍼. big=이미지 집중형용 큰 캡션 오버레이
  const photo = (url: string, cap?: string, big = false) => url
    ? `<section class="sc-shot${big ? ' big' : ''}"><img src="${url}" alt=""/>${cap ? `<div class="cap"><div class="t">${esc(cap)}</div></div>` : ''}</section>`
    : ''
  const storyParas = esc(d.story || '').split('\n').map(x => x.trim()).filter(Boolean).map(x => `<p>${x}</p>`).join('')
  const capPool = [...feats.map(f => f.title), ...shotCaps, '한 번 보면 못 잊는 맛', '식탁의 주인공', '눈으로 먼저 반하는'].filter(Boolean)
  const capAt = (i: number) => capPool[i % capPool.length] || d.productName || ''
  const kind = s.layoutKind

  // ── 히어로: 레이아웃 골격마다 완전히 다른 구성 ──
  const eyebrow = esc(d.subtitle || '정성으로 준비한')
  const titleH = `<span ${ed('title1')}>${esc(t1)}</span>${t2 ? `<em ${ed('title2')}>${esc(t2)}</em>` : ''}`
  const origin = esc(d.originLocation || '국내산')
  let heroHtml = ''
  if (kind === 'poster') {
    heroHtml = `<section class="phero">
      <div class="pbar"><div class="brand" ${ed('brand')}>${esc(brand)}</div><h1 ${ed('title1')}>${esc(title)}</h1><div class="sub" ${ed('heroline')}>${esc(heroLine || origin)}</div></div>
      ${heroImg ? `<div class="pshot"><img src="${heroImg}" alt=""/></div>` : ''}
    </section>`
  } else if (kind === 'gallery') {
    heroHtml = `<section class="ghead"><div class="eye" ${ed('eyebrow')}>${eyebrow}</div><h1 ${ed('title1')}>${esc(title)}</h1>${heroLine ? `<div class="sub" ${ed('heroline')}>${esc(heroLine)}</div>` : ''}</section>
      ${heroImg ? `<div class="gframe"><div class="fr"><img src="${heroImg}" alt=""/></div></div>` : ''}`
  } else if (kind === 'framed') {
    heroHtml = `<section class="fhero">
      ${heroImg ? `<div class="art"><div class="seal">品</div><img src="${heroImg}" alt=""/></div>` : ''}
      <div class="cap"><div class="eye" ${ed('eyebrow')}>${eyebrow}</div><h1 ${ed('title1')}>${esc(title)}</h1></div>
    </section>`
  } else if (kind === 'split') {
    heroHtml = `<section class="shero">
      ${heroImg ? `<div class="top"><img src="${heroImg}" alt=""/></div>` : ''}
      <div class="band"><div class="eye" ${ed('eyebrow')}>${eyebrow} · <span ${ed('brand')}>${esc(brand)}</span></div><h1>${titleH}</h1>${heroLine ? `<div class="sub" ${ed('heroline')}>${esc(heroLine)}</div>` : ''}</div>
    </section>`
  } else if (kind === 'editorial') {
    heroHtml = `<section class="ehero">
      ${heroImg ? `<img src="${heroImg}" alt=""/>` : ''}
      <div class="card"><div class="eye" ${ed('eyebrow')}>${eyebrow}</div><h1>${titleH}</h1></div>
    </section>`
  } else { // cinematic
    heroHtml = `<section class="sc-hero"><div class="sc-hbg"></div>
      <div class="sc-htop"><div class="sc-brand" ${ed('brand')}>${esc(brand)}</div><span class="sc-badge" ${ed('badge')}>${origin}</span></div>
      <div class="sc-hin">
        <div class="sc-eyebrow" ${ed('eyebrow')}>${eyebrow}</div>
        <h1 class="sc-title">${titleH}</h1>
        ${heroLine ? `<p class="sc-sub" ${ed('heroline')}>${esc(heroLine)}</p>` : ''}
      </div>
    </section>`
  }

  // ── 이미지 갤러리: 레이아웃 골격마다 배치 방식이 다르다 ──
  const galleryFor = (imgs: string[]): string => {
    if (!imgs.length) return ''
    if (kind === 'poster') {
      return `<div class="pgrid">${imgs.map((u, i) => `<div class="g${i === 0 && imgs.length > 2 ? ' wide' : ''}"><img src="${u}" alt=""/><span class="gcap">${esc(capAt(i))}</span></div>`).join('')}</div>`
    }
    if (kind === 'gallery') {
      return `<div class="gframe">${imgs.map((u, i) => `<div class="fr"><img src="${u}" alt=""/></div><div class="cap">${esc(capAt(i))}</div>`).join('')}</div>`
    }
    if (kind === 'framed') {
      return `<div class="fbody">${imgs.map(u => `<div class="fr"><img src="${u}" alt=""/></div>`).join('')}</div>`
    }
    if (kind === 'split') {
      return `<div class="sbody">${imgs.map((u, i) => {
        const f = feats[i % Math.max(1, feats.length)]
        return `<div class="row"><img src="${u}" alt=""/></div>${f ? `<div class="lbl"><div class="n">${String(i + 1).padStart(2, '0')}</div><div><h3>${esc(f.title)}</h3><p>${esc(f.desc)}</p></div></div>` : ''}`
      }).join('')}</div>`
    }
    if (kind === 'editorial') {
      return imgs.map((u, i) => {
        const f = feats[i % Math.max(1, feats.length)]
        return `<div class="erow${i % 2 ? ' rev' : ''}"><img src="${u}" alt=""/><div class="tx"><div class="n">${String(i + 1).padStart(2, '0')}</div><h3>${esc(f ? f.title : capAt(i))}</h3><p>${esc(f ? f.desc : '')}</p></div></div>`
      }).join('')
    }
    // cinematic: 풀블리드 스택(비주얼이면 큰 사진)
    return imgs.map((u, i) => photo(u, capAt(i), isVisual)).join('')
  }

  const storySec = storyParas && !isVisual ? `<section class="sc-story">
    <div class="k">STORY</div>
    <h2 ${ed('storytitle')}>${esc(d.productName || '')}의 이야기</h2>
    <div class="body" ${ed('storybody')}>${storyParas}</div>
  </section>` : ''
  const pointsSec = feats.length && kind !== 'split' && kind !== 'editorial' ? `<section class="sc-points">
    <div class="sc-sh"><div class="en">POINT</div><div class="ko" ${ed('ptko')}>이 상품이 다른 이유</div></div>
    ${feats.map((f, i) => `<div class="sc-pt"><div class="no">${String(i + 1).padStart(2, '0')}</div><div><h3 ${ed('ptt' + i)}>${esc(f.title)}</h3><p ${ed('ptd' + i)}>${esc(f.desc)}</p></div></div>`).join('')}
  </section>` : ''
  const numSec = kn ? `<section class="sc-num">
    <div class="lead" ${ed('numlead')}>${esc(kn.label || '누적 판매')}</div>
    <div class="fig"><span ${ed('numval')}>${esc(kn.value)}</span><span class="u" ${ed('numunit')}>${esc(kn.unit || '건')}</span></div>
    <div class="st">★★★★★</div>
    ${!isVisual ? `<div class="desc" ${ed('numcap')}>${esc(kn.caption || '')}</div>` : ''}
  </section>` : ''

  const stats = (d.originStats || []).slice(0, 4)
  const compares = (d.differences || []).slice(0, 6)
  const factsSec = isFacts ? `<section class="sc-facts">
    <div class="ey">FACT CHECK</div><h2 ${ed('facttitle')}>숫자와 기준으로 확인하세요</h2>
    ${stats.length ? `<div class="sc-statgrid">${stats.map((x,i)=>`<div class="sc-stat"><b ${ed('statv'+i)}>${esc(x.value)}${esc(x.unit)}</b><strong ${ed('statl'+i)}>${esc(x.label)}</strong><p ${ed('statd'+i)}>${esc(x.desc)}</p></div>`).join('')}</div>` : ''}
    ${compares.length ? `<div class="sc-compare"><div class="sc-crow"><span>비교</span><span>일반 상품</span><span class="ours">이 상품</span></div>${compares.map((x,i)=>`<div class="sc-crow"><span ${ed('diffl'+i)}>${esc(x.label)}</span><span ${ed('difft'+i)}>${esc(x.theirs)}</span><span class="ours" ${ed('diffo'+i)}>${esc(x.ours)}</span></div>`).join('')}</div>` : ''}
  </section>` : ''
  const faqSec = isFacts && (d.faq || []).length ? `<section class="sc-faq"><h3>구매 전 꼭 확인하세요</h3>${d.faq.slice(0,5).map((x,i)=>`<div class="q"><b ${ed('faqq'+i)}>Q. ${esc(x.q)}</b><p ${ed('faqa'+i)}>${esc(x.a)}</p></div>`).join('')}</section>` : ''

  // 본문 조립: 골격별 갤러리 + 텍스트 섹션(스토리·포인트·숫자)
  const gallery = galleryFor(bodyImages)
  const bodyHtml = isVisual
    ? `${gallery}${numSec}`
    : isFacts
      ? `${pointsSec}${numSec}${factsSec}${bodyImages[0] ? photo(bodyImages[0], capAt(0)) : ''}`
      : `${storySec}${gallery}${pointsSec}${numSec}`

  return `${FONT_LINK}
<div data-showcase data-style="${s.id}" data-layout="${layout}" data-kind="${kind}" class="lk-${kind}">
  ${css}
  ${heroHtml}
  ${bodyHtml}

  ${reviews.slice(0, isVisual || isFacts ? 2 : 3).length ? `<section class="sc-rev">
    ${reviews.slice(0, isVisual || isFacts ? 2 : 3).map((r, i) => `<div class="sc-rc"><div class="top"><div class="av">${esc((r.author || '고').slice(0, 1))}</div><div class="nm" ${ed('rvn' + i)}>${esc(r.author || '고객')}</div><div class="stars">★★★★★</div></div><p ${ed('rvt' + i)}>${esc(r.text)}</p></div>`).join('')}
  </section>` : ''}

  ${infoRows.length ? `<section class="sc-info"><h4>상품 · 배송 안내</h4>
    ${infoRows.map((r, i) => `<div class="row"><span ${ed('infk' + i)}>${esc(r.key)}</span><span ${ed('infv' + i)}>${esc(r.value)}</span></div>`).join('')}
  </section>` : ''}
  ${faqSec}

  <div class="sc-foot"><b ${ed('footbrand')}>${esc(brand)}</b><span ${ed('foottag')}>신선한 ${esc(s.catLabel)}을 그대로</span></div>
</div>`
}
