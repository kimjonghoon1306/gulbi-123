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
  }
  switch (mood) {
    case 'premium': return { ...base,
      paper: c.deep, ink: c.light, accent: c.accent, accent2: c.accent, muted: '#8ca0b8', line: 'rgba(150,170,190,.18)',
      heroGrad: `linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,0) 35%,${c.deep} 96%)`,
      badgeColor: c.accent, badgeBg: 'rgba(255,255,255,.12)',
      impactBg: c.deep, impactFg: '#fff', impactSub: 'rgba(220,230,240,.55)',
      ptBg: c.deep, numBg: c.deep, numFg: '#fff', numFig: '#fff', footBg: c.deep, footFg: 'rgba(200,215,230,.45)',
    }
    case 'market': return { ...base,
      heroJustify: 'center', heroAlign: 'center', titleFont: `'Black Han Sans',sans-serif`, titleWeight: '400',
      titleSize: '52px', titleLh: '1.08', titleLs: '.01em', brandFont: `'Do Hyeon',sans-serif`, numFont: `'Black Han Sans',sans-serif`,
      paper: '#fff8ee', ink: '#2a1a10', accent: '#ff3b2f', accent2: '#e8410a', muted: '#7a5a44', line: 'rgba(200,80,20,.18)',
      heroGrad: 'linear-gradient(180deg,rgba(30,15,8,.5),rgba(30,15,8,.55))',
      badgeColor: '#fff', badgeBg: '#ff3b2f', badgeRadius: '6px',
      impactBg: '#e8410a', impactFg: '#fff', impactSub: 'rgba(255,235,225,.85)',
      ptBg: '#fff8ee', numBg: '#ffd21e', numFg: '#2a1a10', numFig: '#e8410a', footBg: '#2a1a10', footFg: 'rgba(255,220,200,.5)',
    }
    case 'clean': return { ...base,
      titleWeight: '700', titleSize: '42px',
      paper: c.light, ink: c.deep, accent: c.accent, accent2: c.accent, muted: '#7a8894', line: 'rgba(40,60,80,.14)',
      heroGrad: `linear-gradient(180deg,rgba(20,30,40,.15),rgba(20,30,40,0) 45%,rgba(20,30,40,.72))`,
      badgeColor: c.accent, badgeBg: 'rgba(255,255,255,.85)',
      impactBg: '#ffffff', impactFg: c.deep, impactSub: '#8a97a3',
      ptBg: '#ffffff', numBg: c.deep, numFg: '#fff', numFig: c.accent, footBg: c.deep, footFg: 'rgba(210,220,228,.5)',
    }
    case 'traditional': return { ...base,
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
    case 'modern': return { ...base,
      titleFont: `'Playfair Display',serif`, titleWeight: '700', titleSize: '44px', titleLs: '-.01em',
      brandFont: `'Playfair Display',serif`, numFont: `'Playfair Display',serif`, eyebrowFont: `'Playfair Display',serif`,
      paper: '#101010', ink: '#e8e8e8', accent: c.accent, accent2: '#9a9a9a', muted: '#888', line: 'rgba(200,200,200,.14)',
      heroGrad: 'linear-gradient(180deg,rgba(16,16,16,.4),rgba(16,16,16,0) 35%,rgba(16,16,16,.96))',
      badgeColor: '#101010', badgeBg: '#e8e8e8', badgeRadius: '2px',
      impactBg: '#181818', impactFg: '#fff', impactSub: 'rgba(220,220,220,.5)',
      ptBg: '#141414', numBg: '#000', numFg: '#fff', numFig: '#fff', footBg: '#000', footFg: 'rgba(200,200,200,.4)',
    }
    case 'story': return { ...base,
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

export function renderShowcase(d: LandingData, styleId: string): string {
  const s = getShowcaseStyle(styleId)
  const heroImg = d.sectionImages?.hero || d.mainImageUrl || ''
  const featImg = d.sectionImages?.feature || d.sectionImages?.story || ''
  const title = d.catchphrase || d.productName || '상품명'
  const brand = d.brandName || '온종일팜'
  const feats = (d.features || []).slice(0, 3)
  const kn = d.keyNumber
  const reviews = (d.reviews || []).slice(0, 3)
  const infoRows = [...(d.info || []), ...(d.delivery || []).map(x => ({ key: x.label, value: x.value }))].slice(0, 6)

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
.sc-eyebrow{display:inline-block;color:${s.accent};font-size:11px;letter-spacing:.3em;font-weight:700;margin-bottom:14px;font-family:${s.eyebrowFont}}
.sc-title{font-family:${s.titleFont};font-weight:${s.titleWeight};color:${s.titleColor};font-size:${s.titleSize};line-height:${s.titleLh};letter-spacing:${s.titleLs};text-shadow:0 4px 24px rgba(0,0,0,.45)}
.sc-title em{font-style:normal;color:${s.accent};display:${s.titleEmBlock ? 'block' : 'inline'}}
.sc-sub{color:${s.subColor};font-size:14px;margin-top:15px;font-weight:300;line-height:1.85;${s.heroAlign === 'center' ? 'max-width:320px;margin-left:auto;margin-right:auto' : 'max-width:300px'}}
.sc-impact{background:${s.impactBg};color:${s.impactFg};padding:64px 30px;text-align:center}
.sc-impact .k{font-size:11px;letter-spacing:.35em;color:${s.accent};font-weight:700;margin-bottom:16px}
.sc-impact h2{font-family:${s.titleFont};font-weight:${s.titleWeight};font-size:32px;line-height:1.28}
.sc-impact h2 em{font-style:normal;color:${s.accent}}
.sc-impact .tail{color:${s.impactSub};font-size:13px;margin-top:18px;font-weight:300;line-height:1.9}
.sc-shot{position:relative}
.sc-shot::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.5),transparent 45%)}
.sc-shot .cap{position:absolute;left:22px;bottom:20px;color:#fff;z-index:2}
.sc-shot .cap .t{font-family:${s.titleFont};font-weight:800;font-size:19px;text-shadow:0 2px 12px rgba(0,0,0,.6)}
.sc-points{padding:60px 26px;background:${s.ptBg}}
.sc-sh{text-align:center;margin-bottom:36px}
.sc-sh .en{font-size:11px;letter-spacing:.35em;color:${s.accent2};font-weight:800}
.sc-sh .ko{font-family:${s.titleFont};font-weight:800;font-size:26px;margin-top:8px;color:${s.ink}}
.sc-pt{display:flex;gap:16px;padding:20px 0;border-top:1px solid ${s.line}}
.sc-pt:last-child{border-bottom:1px solid ${s.line}}
.sc-pt .no{font-family:${s.numFont};font-size:28px;color:${s.accent2};line-height:1;flex:none;width:44px;font-weight:800}
.sc-pt h3{font-family:${s.titleFont};font-weight:800;font-size:16px;margin-bottom:5px;color:${s.ink}}
.sc-pt p{font-size:13px;color:${s.muted};line-height:1.7}
.sc-num{background:${s.numBg};color:${s.numFg};text-align:center;padding:60px 24px}
.sc-num .lead{font-size:12px;letter-spacing:.2em;color:${s.accent};font-weight:700;margin-bottom:12px}
.sc-num .fig{font-family:${s.numFont};font-size:60px;line-height:1;color:${s.numFig};font-weight:800}
.sc-num .fig .u{font-size:24px;color:${s.accent}}
.sc-num .st{color:${s.accent};letter-spacing:3px;font-size:14px;margin-top:10px}
.sc-num .desc{font-size:13px;color:${s.impactSub};margin-top:12px;font-weight:300}
.sc-rev{padding:52px 24px;background:${s.ptBg}}
.sc-rc{background:${s.mood === 'clean' || s.mood === 'market' ? '#fff' : 'rgba(255,255,255,.06)'};border:1px solid ${s.line};border-radius:14px;padding:18px;margin-bottom:12px}
.sc-rc .top{display:flex;align-items:center;gap:9px;margin-bottom:8px}
.sc-rc .av{width:30px;height:30px;border-radius:50%;background:${s.accent2};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
.sc-rc .nm{font-weight:700;font-size:13px;color:${s.ink}}
.sc-rc .stars{margin-left:auto;color:${s.accent};font-size:11px}
.sc-rc p{font-size:13px;color:${s.muted};line-height:1.7}
.sc-info{background:${s.footBg};color:${s.footFg};padding:44px 26px}
.sc-info h4{font-family:${s.titleFont};font-weight:800;font-size:15px;color:${s.accent};margin-bottom:16px}
.sc-info .row{display:flex;gap:12px;padding:11px 0;border-top:1px solid rgba(255,255,255,.08);font-size:13px}
.sc-info .row span:first-child{color:${s.accent};flex:none;width:76px;font-weight:700}
.sc-info .row span:last-child{opacity:.85;line-height:1.6}
.sc-foot{background:${s.footBg};color:${s.footFg};text-align:center;padding:28px 20px 40px;font-size:11px;border-top:1px solid rgba(255,255,255,.06)}
.sc-foot b{font-family:${s.brandFont};color:${s.accent};letter-spacing:.25em;font-weight:800;font-size:13px;display:block;margin-bottom:7px}
</style>`

  return `${FONT_LINK}${css}
<div data-showcase data-style="${s.id}">
  <section class="sc-hero"><div class="sc-hbg"></div>
    <div class="sc-htop"><div class="sc-brand" ${ed('brand')}>${esc(brand)}</div><span class="sc-badge" ${ed('badge')}>${esc(d.originLocation || '국내산')}</span></div>
    <div class="sc-hin">
      <div class="sc-eyebrow" ${ed('eyebrow')}>${esc(d.subtitle || '정성으로 준비한')}</div>
      <h1 class="sc-title"><span ${ed('title1')}>${esc(t1)}</span>${t2 ? `<em ${ed('title2')}>${esc(t2)}</em>` : ''}</h1>
      <p class="sc-sub" ${ed('herodesc')}>${esc(d.story || d.subtitle || '')}</p>
    </div>
  </section>

  ${feats[0] ? `<section class="sc-impact">
    <div class="k">WHY</div>
    <h2><span ${ed('impact1')}>${esc(feats[0].title)}</span></h2>
    <p class="tail" ${ed('impacttail')}>${esc(feats[0].desc)}</p>
  </section>` : ''}

  ${featImg ? `<section class="sc-shot"><img src="${featImg}" alt=""><div class="cap"><div class="t" ${ed('shotcap')}>${esc(d.productName || '')}</div></div></section>` : ''}

  ${feats.length ? `<section class="sc-points">
    <div class="sc-sh"><div class="en">POINT</div><div class="ko" ${ed('ptko')}>이 상품이 다른 이유</div></div>
    ${feats.map((f, i) => `<div class="sc-pt"><div class="no">${String(i + 1).padStart(2, '0')}</div><div><h3 ${ed('ptt' + i)}>${esc(f.title)}</h3><p ${ed('ptd' + i)}>${esc(f.desc)}</p></div></div>`).join('')}
  </section>` : ''}

  ${kn ? `<section class="sc-num">
    <div class="lead" ${ed('numlead')}>${esc(kn.label || '누적 판매')}</div>
    <div class="fig"><span ${ed('numval')}>${esc(kn.value)}</span><span class="u" ${ed('numunit')}>${esc(kn.unit || '건')}</span></div>
    <div class="st">★★★★★</div>
    <div class="desc" ${ed('numcap')}>${esc(kn.caption || '')}</div>
  </section>` : ''}

  ${reviews.length ? `<section class="sc-rev">
    ${reviews.map((r, i) => `<div class="sc-rc"><div class="top"><div class="av">${esc((r.author || '고').slice(0, 1))}</div><div class="nm" ${ed('rvn' + i)}>${esc(r.author || '고객')}</div><div class="stars">★★★★★</div></div><p ${ed('rvt' + i)}>${esc(r.text)}</p></div>`).join('')}
  </section>` : ''}

  ${infoRows.length ? `<section class="sc-info"><h4>상품 · 배송 안내</h4>
    ${infoRows.map((r, i) => `<div class="row"><span ${ed('infk' + i)}>${esc(r.key)}</span><span ${ed('infv' + i)}>${esc(r.value)}</span></div>`).join('')}
  </section>` : ''}

  <div class="sc-foot"><b ${ed('footbrand')}>${esc(brand)}</b><span ${ed('foottag')}>신선한 ${esc(s.catLabel)}을 그대로</span></div>
</div>`
}
