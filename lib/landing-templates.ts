// 상세페이지 템플릿 엔진 v2
// 1개 엔진 + 5개 프리셋(food/health/goods/craft/misc) + 섹션 블록 조합
// 모든 텍스트는 contenteditable="true" 로 편집 가능

// ============================================================
// 타입 정의
// ============================================================

export type PresetKey = 'gold' | 'dark' | 'blue' | 'red' | 'pink' | 'white'
export type TemplateKey = 'premium' | 'modern' | 'traditional' | 'business' | 'emotional' | 'magazine' | 'luxury' | 'pop' | 'clean'
export const TEMPLATES: { key: TemplateKey; name: string; emoji: string; desc: string }[] = [
  { key: 'premium',     name: '프리미엄', emoji: '👑', desc: '고급 명품 스타일' },
  { key: 'modern',      name: '모던',     emoji: '✦',  desc: '심플하고 깔끔한' },
  { key: 'traditional', name: '전통',     emoji: '🏮', desc: '한국 전통 한지' },
  { key: 'business',    name: '비즈니스', emoji: '📊', desc: '신뢰감 있는 기업형' },
  { key: 'emotional',   name: '감성',     emoji: '🌊', desc: '스토리텔링 감성형' },
  { key: 'magazine',    name: '매거진',   emoji: '📖', desc: '잡지 에디토리얼' },
  { key: 'luxury',      name: '럭셔리',   emoji: '🖤', desc: '다크 골드 명품' },
  { key: 'pop',         name: '팝',       emoji: '🍭', desc: '밝고 컬러풀·MZ 감성' },
  { key: 'clean',       name: '클린',     emoji: '🤍', desc: '화이트 미니멀·화장품/패션' },
]

export type Preset = {
  name: string
  description: string
  colors: {
    primary: string
    deep: string
    light: string
    cream: string
    ink: string
    inkSoft: string
    paper: string
    line: string
    heroGrad: string
    originGrad: string
    imgBg: string
  }
  fonts: {
    serif: string
    sans: string
    deco: string
  }
  labels: {
    origin: string
    recipe: string
    storage: string
    difference: string
    features: string
    story: string
    proof: string
    voices: string
    spec: string
  }
  sections: string[]
}

export type LandingData = {
  brandName: string
  productName: string
  catchphrase: string
  subtitle: string
  artisanQuote: string
  artisanName: string

  originLocation: string
  originStory: string
  originStats: { value: string; unit: string; label: string; desc: string }[]

  story: string

  features: { title: string; desc: string }[]

  keyNumber: { value: string; unit: string; label: string; caption: string }

  differences: { label: string; theirs: string; ours: string }[]

  // 식품 전용
  recipe?: { title: string; intro: string; steps: { name: string; detail: string }[]; tip: string }
  storage?: { title: string; recommended: string; duration: string; tips: string[] }

  // 건강식품 전용
  ingredients?: { title: string; intro: string; items: { name: string; amount: string; effect: string }[] }
  dosage?: { title: string; intro: string; steps: { name: string; detail: string }[]; caution: string }

  // 공산품 전용
  usage?: { title: string; intro: string; steps: { name: string; detail: string }[]; tip: string }
  specs?: { title: string; items: { key: string; value: string }[] }
  warranty?: { title: string; period: string; scope: string; contact: string }

  // 공예품 전용
  artist?: { title: string; name: string; career: string; quote: string }
  materials?: { title: string; intro: string; items: { name: string; desc: string }[] }
  care?: { title: string; tips: string[] }

  reviews: { text: string; author: string; date: string }[]
  info: { key: string; value: string }[]
  faq: { q: string; a: string }[]
  delivery: { label: string; value: string }[]
  price: { retail: number; wholesale?: number; unit: string }
  mainImageUrl: string

  // ✅ 섹션별 이미지 매핑 (GPT-4o가 판단해 배치)
  // 값이 있으면 이미지 버전, 없으면(undefined) 도형 fallback 버전 렌더
  sectionImages?: {
    hero?: string
    origin?: string
    story?: string
    recipe?: string
    storage?: string
    feature?: string
    compare?: string
    ingredients?: string
    dosage?: string
    usage?: string
    specs?: string
  }
  // 사용 안 된 이미지들 (갤러리 등으로 쓰거나 버릴 것)
  unusedImages?: string[]
}

// ============================================================
// 프리셋 5종
// ============================================================

export const PRESETS: Record<PresetKey, Preset> = {

  // ① 골드 — 앰버·골드 프리미엄 (기본, 수산물/식품에 최적)
  gold: {
    name: '골드',
    description: '앰버 골드 · 프리미엄 식품에 최적',
    colors: {
      primary: '#C8842D', deep: '#8B4513', light: '#E8B87A',
      cream: '#F7F0E1', ink: '#1C1610', inkSoft: '#3D342A',
      paper: '#FBF7EE', line: 'rgba(28,22,16,0.12)',
      heroGrad: 'linear-gradient(180deg, #2a1810 0%, #3d2817 40%, #6b4423 100%)',
      originGrad: 'linear-gradient(135deg, #4a3820 0%, #3d2e15 100%)',
      imgBg: 'linear-gradient(135deg, #3d2817, #6b4423)',
    },
    fonts: {
      serif: `'Noto Serif KR', 'Nanum Myeongjo', serif`,
      sans: `'Pretendard Variable', 'Pretendard', -apple-system, sans-serif`,
      deco: `'Gowun Batang', 'Noto Serif KR', serif`,
    },
    labels: {
      origin: 'ORIGIN · 원산지', recipe: 'RECIPE · 조리법', storage: 'STORAGE · 보관법',
      difference: 'DIFFERENCE · 차이', features: 'FEATURES · 핵심 특징',
      story: 'STORY · 상품 이야기', proof: 'PROOF', voices: 'VOICES', spec: 'SPEC',
    },
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','gallery','reviews','info','faq','cta','ship','seal'],
  },

  // ② 검정 — 다크·럭셔리 블랙
  dark: {
    name: '검정',
    description: '럭셔리 블랙 · 고급 프리미엄',
    colors: {
      primary: '#E8E8E8', deep: '#FFFFFF', light: '#B0B0B0',
      cream: '#1A1A1A', ink: '#F5F5F5', inkSoft: '#C0C0C0',
      paper: '#0D0D0D', line: 'rgba(255,255,255,0.12)',
      heroGrad: 'linear-gradient(180deg, #000000 0%, #0D0D0D 50%, #1A1A1A 100%)',
      originGrad: 'linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%)',
      imgBg: 'linear-gradient(135deg, #1a1a1a, #0d0d0d)',
    },
    fonts: {
      serif: `'Noto Serif KR', 'Nanum Myeongjo', serif`,
      sans: `'Pretendard Variable', 'Pretendard', -apple-system, sans-serif`,
      deco: `'Gowun Batang', 'Noto Serif KR', serif`,
    },
    labels: {
      origin: 'ORIGIN · 원산지', recipe: 'RECIPE · 조리법', storage: 'STORAGE · 보관법',
      difference: 'DIFFERENCE · 차이', features: 'FEATURES · 특징',
      story: 'STORY · 이야기', proof: 'PROOF', voices: 'VOICES', spec: 'SPEC',
    },
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','gallery','reviews','info','faq','cta','ship','seal'],
  },

  // ③ 파랑 — 로열 블루
  blue: {
    name: '파랑',
    description: '로열 블루 · 신뢰·신선',
    colors: {
      primary: '#1D4ED8', deep: '#1E3A8A', light: '#60A5FA',
      cream: '#EFF6FF', ink: '#1E3A8A', inkSoft: '#1E40AF',
      paper: '#F0F7FF', line: 'rgba(30,58,138,0.15)',
      heroGrad: 'linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
      originGrad: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
      imgBg: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
    },
    fonts: {
      serif: `'Noto Serif KR', 'Nanum Myeongjo', serif`,
      sans: `'Pretendard Variable', 'Pretendard', -apple-system, sans-serif`,
      deco: `'Gowun Batang', 'Noto Serif KR', serif`,
    },
    labels: {
      origin: 'ORIGIN · 원산지', recipe: 'RECIPE · 조리법', storage: 'STORAGE · 보관법',
      difference: 'DIFFERENCE · 차이', features: 'FEATURES · 특징',
      story: 'STORY · 이야기', proof: 'PROOF', voices: 'VOICES', spec: 'SPEC',
    },
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','gallery','reviews','info','faq','cta','ship','seal'],
  },

  // ④ 빨강 — 볼드 레드
  red: {
    name: '빨강',
    description: '볼드 레드 · 강렬한 임팩트',
    colors: {
      primary: '#DC2626', deep: '#991B1B', light: '#F87171',
      cream: '#FFF5F5', ink: '#450A0A', inkSoft: '#7F1D1D',
      paper: '#FFF8F8', line: 'rgba(69,10,10,0.12)',
      heroGrad: 'linear-gradient(180deg, #450a0a 0%, #7f1d1d 40%, #991b1b 100%)',
      originGrad: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
      imgBg: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
    },
    fonts: {
      serif: `'Noto Serif KR', 'Nanum Myeongjo', serif`,
      sans: `'Pretendard Variable', 'Pretendard', -apple-system, sans-serif`,
      deco: `'Gowun Batang', 'Noto Serif KR', serif`,
    },
    labels: {
      origin: 'ORIGIN · 원산지', recipe: 'RECIPE · 조리법', storage: 'STORAGE · 보관법',
      difference: 'DIFFERENCE · 차이', features: 'FEATURES · 특징',
      story: 'STORY · 이야기', proof: 'PROOF', voices: 'VOICES', spec: 'SPEC',
    },
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','gallery','reviews','info','faq','cta','ship','seal'],
  },

  // ⑤ 핑크 — 로즈 핑크
  pink: {
    name: '핑크',
    description: '로즈 핑크 · 우아한 감성',
    colors: {
      primary: '#DB2777', deep: '#9D174D', light: '#F9A8D4',
      cream: '#FDF2F8', ink: '#500724', inkSoft: '#831843',
      paper: '#FFF0F7', line: 'rgba(80,7,36,0.12)',
      heroGrad: 'linear-gradient(180deg, #500724 0%, #831843 40%, #9d174d 100%)',
      originGrad: 'linear-gradient(135deg, #9d174d 0%, #500724 100%)',
      imgBg: 'linear-gradient(135deg, #831843, #9d174d)',
    },
    fonts: {
      serif: `'Noto Serif KR', 'Nanum Myeongjo', serif`,
      sans: `'Pretendard Variable', 'Pretendard', -apple-system, sans-serif`,
      deco: `'Gowun Batang', 'Noto Serif KR', serif`,
    },
    labels: {
      origin: 'ORIGIN · 원산지', recipe: 'RECIPE · 조리법', storage: 'STORAGE · 보관법',
      difference: 'DIFFERENCE · 차이', features: 'FEATURES · 특징',
      story: 'STORY · 이야기', proof: 'PROOF', voices: 'VOICES', spec: 'SPEC',
    },
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','gallery','reviews','info','faq','cta','ship','seal'],
  },

  // ⑥ 하양 — 울트라 클린 화이트
  white: {
    name: '하양',
    description: '울트라 화이트 · 미니멀 클린',
    colors: {
      primary: '#374151', deep: '#111827', light: '#9CA3AF',
      cream: '#F9FAFB', ink: '#111827', inkSoft: '#374151',
      paper: '#FFFFFF', line: 'rgba(17,24,39,0.10)',
      heroGrad: 'linear-gradient(180deg, #111827 0%, #1f2937 50%, #374151 100%)',
      originGrad: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
      imgBg: 'linear-gradient(135deg, #1f2937, #374151)',
    },
    fonts: {
      serif: `'Pretendard Variable', 'Pretendard', -apple-system, sans-serif`,
      sans: `'Pretendard Variable', 'Pretendard', -apple-system, sans-serif`,
      deco: `'Pretendard Variable', 'Pretendard', sans-serif`,
    },
    labels: {
      origin: 'ORIGIN · 원산지', recipe: 'RECIPE · 조리법', storage: 'STORAGE · 보관법',
      difference: 'DIFFERENCE · 차이', features: 'FEATURES · 특징',
      story: 'STORY · 이야기', proof: 'PROOF', voices: 'VOICES', spec: 'SPEC',
    },
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','gallery','reviews','info','faq','cta','ship','seal'],
  },
}

// ============================================================
// 유틸
// ============================================================

function esc(s: any): string {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function ce(key: string): string {
  return `contenteditable="true" data-key="${key}" spellcheck="false"`
}

function comma(n: number): string {
  return (n || 0).toLocaleString('ko-KR')
}

function imgTag(url: string, alt: string, style: string): string {
  return url ? `<img src="${url}" alt="${esc(alt)}" style="${style}" />` : ''
}

// ✅ 섹션에 들어갈 이미지 래퍼 (편집 시 ✕ 버튼으로 삭제 가능하게 data-section-img 표식)
function imgSection(url: string, alt: string, sectionKey: string, aspect = '4/3'): string {
  if (!url) return ''
  return `<div class="gulbi-section-img" data-section-img="${sectionKey}" style="width:100%;margin:0;overflow:hidden;position:relative;aspect-ratio:${aspect};background:#f5f5f5;">
    <img src="${url}" alt="${esc(alt)}" style="width:100%;height:100%;object-fit:cover;display:block;" />
  </div>`
}

// ✅ 도형 fallback — 이미지 대신 쓰이는 비주얼 (섹션 타입별로 다른 스타일)
// A형: 아이콘 + 큰 강조 텍스트 (보관, 신선도)
// B형: 번호 단계 리스트 (조리, 사용법)
// C형: 인포그래픽 카드 그리드 (특징, 스펙)
function fallbackStorage(d: LandingData, C: any, F: any): string {
  const s = d.storage
  if (!s) return ''
  return `<div style="background:linear-gradient(135deg,#E8F4FD,#F0F8FF);border-radius:14px;padding:36px 24px;margin:24px 0;text-align:center;">
    <div style="font-size:52px;margin-bottom:8px;">❄️</div>
    <p ${ce('storage.rec')} style="font-family:${F.serif};color:#0066cc;font-size:28px;font-weight:900;margin:0 0 4px;letter-spacing:-0.02em;">${esc(s.recommended)}</p>
    <p ${ce('storage.dur')} style="color:#0066cc;font-size:14px;opacity:0.7;margin:0 0 20px;">${esc(s.duration)}</p>
    <div style="display:grid;grid-template-columns:1fr;gap:10px;max-width:420px;margin:0 auto;">
      ${(s.tips || []).map((tip, i) => `<div style="background:white;padding:12px 16px;border-radius:10px;display:flex;align-items:center;gap:12px;text-align:left;">
        <div style="width:26px;height:26px;border-radius:50%;background:#0066cc;color:white;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</div>
        <p ${ce('storage.tip.'+i)} style="font-size:13px;color:#222;margin:0;line-height:1.5;">${esc(tip)}</p>
      </div>`).join('')}
    </div>
  </div>`
}

function fallbackRecipe(d: LandingData, C: any, F: any): string {
  const r = d.recipe
  if (!r) return ''
  return `<div style="background:${C.cream};border-radius:14px;padding:28px 20px;margin:24px 0;">
    <div style="display:grid;grid-template-columns:1fr;gap:14px;">
      ${(r.steps || []).map((step, i) => `<div style="display:flex;align-items:flex-start;gap:14px;background:white;padding:16px;border-radius:12px;border-left:4px solid ${C.primary};">
        <div style="width:36px;height:36px;border-radius:50%;background:${C.primary};color:white;font-weight:900;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</div>
        <div style="flex:1;">
          <p ${ce('recipe.step.'+i+'.name')} style="font-family:${F.serif};font-weight:900;color:${C.ink};font-size:16px;margin:0 0 4px;">${esc(step.name)}</p>
          <p ${ce('recipe.step.'+i+'.detail')} style="color:${C.inkSoft};font-size:13px;margin:0;line-height:1.7;">${esc(step.detail)}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>`
}

function fallbackFeatures(d: LandingData, C: any, F: any): string {
  const items = d.features || []
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:24px 0;">
    ${items.map((it, i) => `<div style="background:${C.paper};border:2px solid ${C.light};border-radius:14px;padding:22px 16px;text-align:center;">
      <div style="width:48px;height:48px;border-radius:50%;background:${C.primary};color:white;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-weight:900;font-size:18px;font-family:${F.serif};">${i+1}</div>
      <p ${ce('feat.'+i+'.title')} style="font-family:${F.serif};font-weight:900;color:${C.ink};font-size:15px;margin:0 0 6px;letter-spacing:-0.01em;">${esc(it.title)}</p>
      <p ${ce('feat.'+i+'.desc')} style="color:${C.inkSoft};font-size:12px;line-height:1.7;margin:0;">${esc(it.desc)}</p>
    </div>`).join('')}
  </div>`
}

function fallbackOrigin(d: LandingData, C: any, F: any): string {
  const stats = d.originStats || []
  return `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:24px 0;">
    ${stats.slice(0,4).map((s, i) => `<div style="background:${C.paper};border:1px solid ${C.line};border-radius:12px;padding:20px 14px;text-align:center;">
      <p ${ce('origin.stat.'+i+'.label')} style="font-family:${F.serif};font-size:10px;color:${C.primary};letter-spacing:0.2em;margin:0 0 8px;">${esc(s.label)}</p>
      <p style="margin:0 0 4px;"><span ${ce('origin.stat.'+i+'.value')} style="font-family:${F.serif};font-size:28px;font-weight:900;color:${C.ink};">${esc(s.value)}</span><span ${ce('origin.stat.'+i+'.unit')} style="font-family:${F.serif};font-size:14px;color:${C.inkSoft};margin-left:2px;">${esc(s.unit)}</span></p>
      <p ${ce('origin.stat.'+i+'.desc')} style="font-size:11px;color:${C.inkSoft};margin:0;line-height:1.5;">${esc(s.desc)}</p>
    </div>`).join('')}
  </div>`
}

// ============================================================
// 섹션 렌더 함수들
// ============================================================

function renderIntro(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F } = p
  return `
<section data-section="intro" style="padding:72px 28px 64px;background:${C.paper};text-align:center;">
  <p ${ce('intro.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.primary};margin:0 0 24px;">I.&nbsp;&nbsp;시작하며</p>
  <p ${ce('intro.quote')} style="font-family:${F.deco};font-size:22px;line-height:1.85;color:${C.ink};letter-spacing:-0.01em;margin:0 0 36px;">${esc(d.artisanQuote)}</p>
  <p ${ce('intro.sig')} style="font-family:${F.serif};font-size:13px;color:${C.inkSoft};letter-spacing:0.1em;margin:0;"><span style="color:${C.primary};margin-right:10px;">—</span>${esc(d.artisanName)}</p>
</section>`
}

function renderHero(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F } = p
  const img = d.sectionImages?.hero || d.mainImageUrl
  return `
<section data-section="hero" style="background:${C.heroGrad};padding:56px 28px 72px;text-align:center;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 40%, ${C.light}40, transparent 50%), radial-gradient(circle at 70% 70%, ${C.primary}40, transparent 60%);pointer-events:none;"></div>
  <div style="position:relative;z-index:2;">
    <p ${ce('hero.brand')} style="font-family:${F.serif};color:${C.light};font-size:11px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 20px;">${esc(d.brandName)}</p>
    <h1 ${ce('hero.catch')} style="font-family:${F.serif};color:${C.cream};font-weight:300;font-size:clamp(32px,8vw,52px);line-height:1.05;letter-spacing:-0.02em;margin:0 0 28px;">${esc(d.catchphrase)}</h1>
    <div style="width:40px;height:1px;background:${C.light};margin:0 auto 28px;opacity:0.6;"></div>
    <p ${ce('hero.sub')} style="font-family:${F.deco};color:${C.cream};font-size:15px;line-height:2;opacity:0.9;max-width:300px;margin:0 auto 40px;">${esc(d.subtitle)}</p>
    ${img ? `<div class="gulbi-section-img" data-section-img="hero" style="margin:32px auto 0;max-width:min(440px,90vw);aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);border-radius:8px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);position:relative;">${imgTag(img, d.productName, 'width:90%;height:90%;object-fit:contain;')}</div>` : ''}
  </div>
</section>`
}

function renderOrigin(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F, labels: L } = p
  const img = d.sectionImages?.origin
  return `
<section data-section="origin" style="background:${C.ink};color:${C.cream};padding:80px 28px 0;">
  <p ${ce('origin.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.light};margin:0 0 16px;">II.&nbsp;&nbsp;${esc(L.origin)}</p>
  <h2 ${ce('origin.location')} style="font-family:${F.serif};font-weight:700;font-size:clamp(28px,7vw,40px);line-height:1.1;letter-spacing:-0.02em;margin:0 0 24px;color:${C.light};">${esc(d.originLocation)}</h2>
  <p ${ce('origin.story')} style="font-family:${F.deco};font-size:15px;line-height:1.95;opacity:0.85;margin:0 0 40px;">${esc(d.originStory)}</p>
  ${img ? `<div class="gulbi-section-img" data-section-img="origin" style="margin:0 -28px 0;aspect-ratio:16/9;background:#000;overflow:hidden;position:relative;"><img src="${img}" alt="${esc(d.productName)}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>` : ''}
  ${(() => {
    const stats = d.originStats.filter(s => s.value && s.value.trim()).slice(0,4)
    if (stats.length === 0) return ''
    const cols = stats.length === 1 ? 1 : 2
    return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:1px;background:${C.light}33;margin:0 -28px;border-top:1px solid ${C.light}33;">
    ${stats.map((s,i) => {
      const spanFull = cols === 2 && stats.length % 2 === 1 && i === stats.length - 1
      return `
    <div style="background:${C.ink};padding:28px 20px;${spanFull ? 'grid-column:1/-1;' : ''}">
      <div style="font-family:${F.serif};font-size:36px;font-weight:300;color:${C.light};line-height:1;margin-bottom:8px;letter-spacing:-0.02em;">
        <span ${ce('origin.stat.' + i + '.value')}>${esc(s.value)}</span><span ${ce('origin.stat.' + i + '.unit')} style="font-size:14px;margin-left:4px;">${esc(s.unit)}</span>
      </div>
      <div ${ce('origin.stat.' + i + '.label')} style="font-size:10px;letter-spacing:0.25em;opacity:0.6;text-transform:uppercase;color:${C.cream};">${esc(s.label)}</div>
      <div ${ce('origin.stat.' + i + '.desc')} style="font-family:${F.deco};font-size:12px;line-height:1.7;margin-top:10px;opacity:0.85;color:${C.cream};">${esc(s.desc)}</div>
    </div>`
    }).join('')}
  </div>`
  })()}
</section>`
}

function renderStory(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F, labels: L } = p
  const img = d.sectionImages?.story
  const paragraphs = esc(d.story).split('\n').filter(Boolean).map(x => `<p style="margin:0 0 18px;">${x}</p>`).join('')
  return `
<section data-section="story" style="padding:80px 28px;background:${C.cream};">
  <p ${ce('story.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;">III.&nbsp;&nbsp;${esc(L.story)}</p>
  <h2 ${ce('story.title')} style="font-family:${F.serif};font-weight:300;font-size:34px;line-height:1.15;letter-spacing:-0.02em;margin:0 0 36px;color:${C.ink};"><em style="font-style:normal;font-weight:700;color:${C.deep};">${esc(d.productName)}</em>의 하루.</h2>
  ${img ? imgSection(img, d.productName, 'story', '16/10') : ''}
  <div ${ce('story.body')} style="font-family:${F.deco};font-size:15px;line-height:2.05;color:${C.inkSoft};${img ? 'margin-top:32px;' : ''}">${paragraphs}</div>
</section>`
}

function renderFeatures(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F, labels: L } = p
  return `
<section data-section="features" style="padding:80px 28px;background:${C.paper};">
  <div style="text-align:center;margin-bottom:56px;">
    <p ${ce('features.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;">IV.&nbsp;&nbsp;${esc(L.features)}</p>
    <h2 ${ce('features.title')} style="font-family:${F.serif};font-weight:300;font-size:34px;line-height:1.2;letter-spacing:-0.02em;margin:0;color:${C.ink};">왜 <em style="font-style:normal;font-weight:700;color:${C.deep};">다른가.</em></h2>
  </div>
  <div>
    ${d.features.slice(0,3).map((f,i) => `
    <div style="display:grid;grid-template-columns:64px 1fr;gap:20px;padding:28px 0;border-top:1px solid ${C.line};${i === d.features.length-1 ? 'border-bottom:1px solid ' + C.line + ';' : ''}align-items:start;">
      <div style="font-family:${F.serif};font-size:28px;font-weight:300;color:${C.deep};line-height:1;"><span style="font-size:11px;color:${C.primary};vertical-align:top;">0</span>${i+1}</div>
      <div>
        <h3 ${ce('features.' + i + '.title')} style="font-family:${F.serif};font-weight:700;font-size:19px;margin:0 0 10px;letter-spacing:-0.01em;color:${C.ink};">${esc(f.title)}</h3>
        <p ${ce('features.' + i + '.desc')} style="font-family:${F.deco};font-size:14px;line-height:1.85;color:${C.inkSoft};margin:0;">${esc(f.desc)}</p>
      </div>
    </div>`).join('')}
  </div>
</section>`
}

function renderKeynum(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F, labels: L } = p
  return `
<section data-section="keynum" style="padding:100px 28px;background:${C.paper};text-align:center;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};">
  <p ${ce('keynum.label')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;">V.&nbsp;&nbsp;${esc(L.proof)}</p>
  <p ${ce('keynum.caption1')} style="font-family:${F.serif};font-size:14px;letter-spacing:0.15em;color:${C.inkSoft};margin:0 0 16px;">${esc(d.keyNumber.label)}</p>
  <div style="font-family:${F.serif};font-size:clamp(60px,16vw,110px);line-height:0.9;font-weight:700;color:${C.deep};letter-spacing:-0.05em;margin:32px 0 24px;">
    <span ${ce('keynum.value')}>${esc(d.keyNumber.value)}</span><sup ${ce('keynum.unit')} style="font-size:0.25em;vertical-align:top;font-weight:400;color:${C.primary};margin-left:8px;position:relative;top:1.4em;">${esc(d.keyNumber.unit)}</sup>
  </div>
  <p ${ce('keynum.caption')} style="font-family:${F.deco};font-size:14px;line-height:1.85;max-width:360px;margin:0 auto;color:${C.inkSoft};">${esc(d.keyNumber.caption)}</p>
</section>`
}

function renderCompare(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F, labels: L } = p
  return `
<section data-section="compare" style="padding:80px 0;background:${C.ink};color:${C.cream};">
  <div style="padding:0 28px 48px;text-align:center;">
    <p ${ce('compare.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.light};margin:0 0 16px;">VI.&nbsp;&nbsp;${esc(L.difference)}</p>
    <h2 ${ce('compare.title')} style="font-family:${F.serif};font-weight:300;font-size:32px;line-height:1.2;letter-spacing:-0.02em;margin:0 0 16px;">일반 제품과<br>무엇이 <em style="font-style:normal;font-weight:700;color:${C.light};">다른가.</em></h2>
    <p ${ce('compare.lead')} style="font-family:${F.deco};font-size:14px;opacity:0.7;margin:0;">직접 비교해봤습니다.</p>
  </div>
  <div style="margin:0 28px;border:1px solid ${C.light}4D;">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid ${C.light}33;background:${C.light}0D;">
      <div style="padding:14px 10px;font-family:${F.serif};font-size:10px;letter-spacing:0.2em;opacity:0.6;text-transform:uppercase;text-align:center;">항목</div>
      <div style="padding:14px 10px;font-family:${F.serif};font-size:10px;letter-spacing:0.2em;opacity:0.6;text-transform:uppercase;text-align:center;">일반 제품</div>
      <div style="padding:14px 10px;font-family:${F.serif};font-size:10px;letter-spacing:0.2em;color:${C.light};text-transform:uppercase;text-align:center;font-weight:700;">저희 제품</div>
    </div>
    ${d.differences.slice(0,5).map((diff,i) => `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;${i < d.differences.length-1 ? 'border-bottom:1px solid ' + C.light + '26;' : ''}">
      <div ${ce('diff.' + i + '.label')} style="padding:16px 10px;font-family:${F.deco};font-size:13px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.5;">${esc(diff.label)}</div>
      <div ${ce('diff.' + i + '.theirs')} style="padding:16px 10px;font-size:12px;opacity:0.5;text-decoration:line-through;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.5;">${esc(diff.theirs)}</div>
      <div ${ce('diff.' + i + '.ours')} style="padding:16px 10px;background:${C.primary}26;color:${C.light};font-weight:600;font-family:${F.serif};font-size:13px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.5;">${esc(diff.ours)}</div>
    </div>`).join('')}
  </div>
</section>`
}

// 식품: 조리법
function renderRecipe(d: LandingData, p: Preset): string {
  if (!d.recipe) return ''
  const { colors: C, fonts: F, labels: L } = p
  const img = d.sectionImages?.recipe
  return `
<section data-section="recipe" style="padding:80px 28px;background:${C.cream};">
  <p ${ce('recipe.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;text-align:center;">VII.&nbsp;&nbsp;${esc(L.recipe)}</p>
  <h2 ${ce('recipe.title')} style="font-family:${F.serif};font-weight:300;font-size:32px;line-height:1.2;letter-spacing:-0.02em;margin:0 0 20px;color:${C.ink};text-align:center;">${esc(d.recipe.title)}</h2>
  <p ${ce('recipe.intro')} style="font-family:${F.deco};font-size:14px;line-height:1.9;color:${C.inkSoft};text-align:center;max-width:400px;margin:0 auto 48px;">${esc(d.recipe.intro)}</p>
  ${img ? imgSection(img, d.productName, 'recipe', '16/9') : ''}
  <div style="${img ? 'margin-top:32px;' : ''}">
    ${d.recipe.steps.map((s,i) => `
    <div style="display:grid;grid-template-columns:48px 1fr;gap:18px;padding:22px 0;border-top:1px solid ${C.line};${i === d.recipe!.steps.length-1 ? 'border-bottom:1px solid ' + C.line + ';' : ''}align-items:start;">
      <div style="width:40px;height:40px;border-radius:50%;background:${C.deep};color:${C.cream};display:flex;align-items:center;justify-content:center;font-family:${F.serif};font-weight:700;font-size:16px;">${i+1}</div>
      <div>
        <h4 ${ce('recipe.step.' + i + '.name')} style="font-family:${F.serif};font-weight:700;font-size:16px;margin:0 0 6px;color:${C.ink};">${esc(s.name)}</h4>
        <p ${ce('recipe.step.' + i + '.detail')} style="font-family:${F.deco};font-size:14px;line-height:1.8;color:${C.inkSoft};margin:0;">${esc(s.detail)}</p>
      </div>
    </div>`).join('')}
  </div>
  <div style="margin-top:36px;padding:20px 24px;background:${C.primary}1F;border-left:3px solid ${C.primary};">
    <p style="font-family:${F.serif};font-size:10px;letter-spacing:0.25em;color:${C.deep};font-weight:700;margin:0 0 8px;">CHEF'S TIP</p>
    <p ${ce('recipe.tip')} style="font-family:${F.deco};font-size:14px;line-height:1.85;color:${C.ink};margin:0;">${esc(d.recipe.tip)}</p>
  </div>
</section>`
}

// 식품: 보관법
function renderStorage(d: LandingData, p: Preset): string {
  if (!d.storage) return ''
  const { colors: C, fonts: F, labels: L } = p
  const img = d.sectionImages?.storage
  return `
<section data-section="storage" style="padding:80px 28px;background:${C.paper};">
  <p ${ce('storage.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;text-align:center;">VIII.&nbsp;&nbsp;${esc(L.storage)}</p>
  <h2 ${ce('storage.title')} style="font-family:${F.serif};font-weight:300;font-size:32px;line-height:1.2;letter-spacing:-0.02em;margin:0 0 48px;color:${C.ink};text-align:center;">${esc(d.storage.title)}</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid ${C.line};margin-bottom:32px;">
    <div style="padding:28px 20px;border-right:1px solid ${C.line};text-align:center;">
      <p style="font-family:${F.serif};font-size:10px;letter-spacing:0.3em;color:${C.primary};margin:0 0 10px;text-transform:uppercase;">권장 보관</p>
      <p ${ce('storage.recommended')} style="font-family:${F.serif};font-size:18px;font-weight:700;color:${C.ink};margin:0;line-height:1.4;">${esc(d.storage.recommended)}</p>
    </div>
    <div style="padding:28px 20px;text-align:center;">
      <p style="font-family:${F.serif};font-size:10px;letter-spacing:0.3em;color:${C.primary};margin:0 0 10px;text-transform:uppercase;">보관 기간</p>
      <p ${ce('storage.duration')} style="font-family:${F.serif};font-size:18px;font-weight:700;color:${C.ink};margin:0;line-height:1.4;">${esc(d.storage.duration)}</p>
    </div>
  </div>
  ${img ? imgSection(img, d.productName, 'storage', '16/9') : ''}
  <div style="${img ? 'margin-top:32px;' : ''}">
    <p style="font-family:${F.serif};font-size:11px;letter-spacing:0.25em;color:${C.deep};font-weight:700;margin:0 0 16px;">보관 TIP</p>
    ${d.storage.tips.map((t,i) => `
    <div style="display:grid;grid-template-columns:24px 1fr;gap:10px;padding:14px 0;border-top:1px solid ${C.line};${i === d.storage!.tips.length-1 ? 'border-bottom:1px solid ' + C.line + ';' : ''}">
      <span style="color:${C.primary};font-family:${F.serif};font-weight:700;">•</span>
      <p ${ce('storage.tip.' + i)} style="font-family:${F.deco};font-size:13px;line-height:1.75;color:${C.inkSoft};margin:0;">${esc(t)}</p>
    </div>`).join('')}
  </div>
</section>`
}

// 건강식품: 성분표
function renderIngredients(d: LandingData, p: Preset): string {
  if (!d.ingredients) return ''
  const { colors: C, fonts: F } = p
  return `
<section data-section="ingredients" style="padding:80px 28px;background:${C.cream};">
  <p ${ce('ingredients.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;text-align:center;">INGREDIENTS · 성분</p>
  <h2 ${ce('ingredients.title')} style="font-family:${F.serif};font-weight:300;font-size:30px;line-height:1.2;margin:0 0 20px;color:${C.ink};text-align:center;">${esc(d.ingredients.title)}</h2>
  <p ${ce('ingredients.intro')} style="font-family:${F.deco};font-size:14px;line-height:1.9;color:${C.inkSoft};text-align:center;max-width:420px;margin:0 auto 48px;">${esc(d.ingredients.intro)}</p>
  <div style="border-top:2px solid ${C.ink};">
    ${d.ingredients.items.map((item,i) => `
    <div style="padding:20px 0;border-bottom:1px solid ${C.line};">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;gap:16px;">
        <h4 ${ce('ingredients.' + i + '.name')} style="font-family:${F.serif};font-weight:700;font-size:17px;color:${C.ink};margin:0;">${esc(item.name)}</h4>
        <span ${ce('ingredients.' + i + '.amount')} style="font-family:${F.serif};font-size:14px;color:${C.primary};font-weight:600;flex-shrink:0;">${esc(item.amount)}</span>
      </div>
      <p ${ce('ingredients.' + i + '.effect')} style="font-family:${F.deco};font-size:13px;line-height:1.8;color:${C.inkSoft};margin:0;">${esc(item.effect)}</p>
    </div>`).join('')}
  </div>
</section>`
}

// 건강식품: 복용법
function renderDosage(d: LandingData, p: Preset): string {
  if (!d.dosage) return ''
  const { colors: C, fonts: F } = p
  return `
<section data-section="dosage" style="padding:80px 28px;background:${C.paper};">
  <p ${ce('dosage.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;text-align:center;">DOSAGE · 복용법</p>
  <h2 ${ce('dosage.title')} style="font-family:${F.serif};font-weight:300;font-size:30px;line-height:1.2;margin:0 0 20px;color:${C.ink};text-align:center;">${esc(d.dosage.title)}</h2>
  <p ${ce('dosage.intro')} style="font-family:${F.deco};font-size:14px;line-height:1.9;color:${C.inkSoft};text-align:center;max-width:420px;margin:0 auto 48px;">${esc(d.dosage.intro)}</p>
  <div>
    ${d.dosage.steps.map((s,i) => `
    <div style="display:grid;grid-template-columns:48px 1fr;gap:18px;padding:22px 0;border-top:1px solid ${C.line};${i === d.dosage!.steps.length-1 ? 'border-bottom:1px solid ' + C.line + ';' : ''}">
      <div style="width:40px;height:40px;border-radius:50%;background:${C.deep};color:${C.cream};display:flex;align-items:center;justify-content:center;font-family:${F.serif};font-weight:700;font-size:16px;">${i+1}</div>
      <div>
        <h4 ${ce('dosage.step.' + i + '.name')} style="font-family:${F.serif};font-weight:700;font-size:16px;margin:0 0 6px;color:${C.ink};">${esc(s.name)}</h4>
        <p ${ce('dosage.step.' + i + '.detail')} style="font-family:${F.deco};font-size:14px;line-height:1.8;color:${C.inkSoft};margin:0;">${esc(s.detail)}</p>
      </div>
    </div>`).join('')}
  </div>
  <div style="margin-top:36px;padding:20px 24px;background:${C.primary}14;border-left:3px solid ${C.primary};">
    <p style="font-family:${F.serif};font-size:10px;letter-spacing:0.25em;color:${C.deep};font-weight:700;margin:0 0 8px;">⚠ 주의사항</p>
    <p ${ce('dosage.caution')} style="font-family:${F.deco};font-size:14px;line-height:1.85;color:${C.ink};margin:0;">${esc(d.dosage.caution)}</p>
  </div>
</section>`
}

// 공산품: 사용법
function renderUsage(d: LandingData, p: Preset): string {
  if (!d.usage) return ''
  const { colors: C, fonts: F, labels: L } = p
  const img = d.mainImageUrl
  return `
<section data-section="usage" style="padding:80px 28px;background:${C.cream};">
  <p ${ce('usage.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;text-align:center;">${esc(L.recipe)}</p>
  <h2 ${ce('usage.title')} style="font-family:${F.serif};font-weight:300;font-size:30px;line-height:1.2;margin:0 0 20px;color:${C.ink};text-align:center;">${esc(d.usage.title)}</h2>
  <p ${ce('usage.intro')} style="font-family:${F.deco};font-size:14px;line-height:1.9;color:${C.inkSoft};text-align:center;max-width:420px;margin:0 auto 48px;">${esc(d.usage.intro)}</p>
  ${img ? `<div style="margin:0 0 40px;overflow:hidden;background:${C.imgBg};aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;">${imgTag(img, d.productName, 'max-width:55%;max-height:75%;object-fit:contain;')}</div>` : ''}
  <div>
    ${d.usage.steps.map((s,i) => `
    <div style="display:grid;grid-template-columns:48px 1fr;gap:18px;padding:22px 0;border-top:1px solid ${C.line};${i === d.usage!.steps.length-1 ? 'border-bottom:1px solid ' + C.line + ';' : ''}">
      <div style="width:40px;height:40px;border-radius:50%;background:${C.deep};color:${C.cream};display:flex;align-items:center;justify-content:center;font-family:${F.serif};font-weight:700;font-size:16px;">${i+1}</div>
      <div>
        <h4 ${ce('usage.step.' + i + '.name')} style="font-family:${F.serif};font-weight:700;font-size:16px;margin:0 0 6px;color:${C.ink};">${esc(s.name)}</h4>
        <p ${ce('usage.step.' + i + '.detail')} style="font-family:${F.deco};font-size:14px;line-height:1.8;color:${C.inkSoft};margin:0;">${esc(s.detail)}</p>
      </div>
    </div>`).join('')}
  </div>
  ${d.usage.tip ? `
  <div style="margin-top:36px;padding:20px 24px;background:${C.primary}14;border-left:3px solid ${C.primary};">
    <p style="font-family:${F.serif};font-size:10px;letter-spacing:0.25em;color:${C.deep};font-weight:700;margin:0 0 8px;">TIP</p>
    <p ${ce('usage.tip')} style="font-family:${F.deco};font-size:14px;line-height:1.85;color:${C.ink};margin:0;">${esc(d.usage.tip)}</p>
  </div>` : ''}
</section>`
}

// 공산품: 사양
function renderSpecs(d: LandingData, p: Preset): string {
  if (!d.specs) return ''
  const { colors: C, fonts: F } = p
  return `
<section data-section="specs" style="padding:80px 28px;background:${C.paper};">
  <p ${ce('specs.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;">SPECIFICATIONS · 사양</p>
  <h2 ${ce('specs.title')} style="font-family:${F.serif};font-weight:300;font-size:30px;line-height:1.2;margin:0 0 32px;color:${C.ink};">${esc(d.specs.title)}</h2>
  <table style="width:100%;border-top:2px solid ${C.ink};border-collapse:collapse;">
    ${d.specs.items.map((it,i) => `
    <tr style="border-bottom:1px solid ${C.line};">
      <th ${ce('specs.' + i + '.key')} style="padding:16px 8px 16px 0;text-align:left;vertical-align:top;font-size:13px;font-family:${F.serif};font-weight:400;width:130px;color:${C.inkSoft};letter-spacing:0.05em;">${esc(it.key)}</th>
      <td ${ce('specs.' + i + '.value')} style="padding:16px 0 16px 8px;text-align:left;vertical-align:top;font-size:13px;font-family:${F.sans};color:${C.ink};line-height:1.7;font-weight:500;">${esc(it.value)}</td>
    </tr>`).join('')}
  </table>
</section>`
}

// 공산품: A/S
function renderWarranty(d: LandingData, p: Preset): string {
  if (!d.warranty) return ''
  const { colors: C, fonts: F } = p
  return `
<section data-section="warranty" style="padding:60px 28px;background:${C.cream};">
  <p ${ce('warranty.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;text-align:center;">WARRANTY · 보증</p>
  <h2 ${ce('warranty.title')} style="font-family:${F.serif};font-weight:300;font-size:26px;line-height:1.2;margin:0 0 36px;color:${C.ink};text-align:center;">${esc(d.warranty.title)}</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border:1px solid ${C.line};">
    <div style="padding:28px 16px;text-align:center;border-right:1px solid ${C.line};">
      <p style="font-family:${F.serif};font-size:10px;letter-spacing:0.3em;color:${C.primary};margin:0 0 10px;text-transform:uppercase;">보증 기간</p>
      <p ${ce('warranty.period')} style="font-family:${F.serif};font-size:16px;font-weight:700;color:${C.ink};margin:0;">${esc(d.warranty.period)}</p>
    </div>
    <div style="padding:28px 16px;text-align:center;border-right:1px solid ${C.line};">
      <p style="font-family:${F.serif};font-size:10px;letter-spacing:0.3em;color:${C.primary};margin:0 0 10px;text-transform:uppercase;">보증 범위</p>
      <p ${ce('warranty.scope')} style="font-family:${F.serif};font-size:16px;font-weight:700;color:${C.ink};margin:0;">${esc(d.warranty.scope)}</p>
    </div>
    <div style="padding:28px 16px;text-align:center;">
      <p style="font-family:${F.serif};font-size:10px;letter-spacing:0.3em;color:${C.primary};margin:0 0 10px;text-transform:uppercase;">A/S 문의</p>
      <p ${ce('warranty.contact')} style="font-family:${F.serif};font-size:14px;font-weight:700;color:${C.ink};margin:0;white-space:pre-line;">${esc(d.warranty.contact)}</p>
    </div>
  </div>
</section>`
}

// 공예품: 작가
function renderArtist(d: LandingData, p: Preset): string {
  if (!d.artist) return ''
  const { colors: C, fonts: F } = p
  return `
<section data-section="artist" style="padding:80px 28px;background:${C.ink};color:${C.cream};text-align:center;position:relative;overflow:hidden;">
  <div style="position:absolute;top:30px;right:30px;width:80px;height:80px;border:2px solid ${C.primary};display:flex;align-items:center;justify-content:center;transform:rotate(-8deg);">
    <span style="font-family:${F.serif};font-weight:700;font-size:14px;color:${C.primary};letter-spacing:0.15em;">匠</span>
  </div>
  <p ${ce('artist.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.light};margin:0 0 16px;">ARTISAN · 장인</p>
  <h2 ${ce('artist.title')} style="font-family:${F.serif};font-weight:300;font-size:28px;line-height:1.2;margin:0 0 40px;">${esc(d.artist.title)}</h2>
  <div style="width:100px;height:100px;background:${C.primary}33;border-radius:50%;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;font-family:${F.serif};font-size:32px;font-weight:300;color:${C.light};">${esc(d.artist.name.charAt(0))}</div>
  <h3 ${ce('artist.name')} style="font-family:${F.serif};font-weight:700;font-size:22px;margin:0 0 8px;color:${C.cream};">${esc(d.artist.name)}</h3>
  <p ${ce('artist.career')} style="font-family:${F.deco};font-size:13px;color:${C.light};margin:0 0 36px;opacity:0.9;letter-spacing:0.05em;">${esc(d.artist.career)}</p>
  <p ${ce('artist.quote')} style="font-family:${F.deco};font-size:17px;line-height:1.9;color:${C.cream};max-width:380px;margin:0 auto;font-style:italic;opacity:0.92;">"${esc(d.artist.quote)}"</p>
</section>`
}

// 공예품: 소재
function renderMaterials(d: LandingData, p: Preset): string {
  if (!d.materials) return ''
  const { colors: C, fonts: F } = p
  return `
<section data-section="materials" style="padding:80px 28px;background:${C.cream};">
  <p ${ce('materials.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;">MATERIALS · 소재</p>
  <h2 ${ce('materials.title')} style="font-family:${F.serif};font-weight:300;font-size:30px;line-height:1.2;margin:0 0 20px;color:${C.ink};">${esc(d.materials.title)}</h2>
  <p ${ce('materials.intro')} style="font-family:${F.deco};font-size:14px;line-height:1.9;color:${C.inkSoft};margin:0 0 40px;">${esc(d.materials.intro)}</p>
  <div>
    ${d.materials.items.map((it,i) => `
    <div style="padding:24px 0;border-top:1px solid ${C.line};${i === d.materials!.items.length-1 ? 'border-bottom:1px solid ' + C.line + ';' : ''}">
      <h4 ${ce('materials.' + i + '.name')} style="font-family:${F.serif};font-weight:700;font-size:17px;margin:0 0 10px;color:${C.ink};">${esc(it.name)}</h4>
      <p ${ce('materials.' + i + '.desc')} style="font-family:${F.deco};font-size:13px;line-height:1.85;color:${C.inkSoft};margin:0;">${esc(it.desc)}</p>
    </div>`).join('')}
  </div>
</section>`
}

// 공예품: 관리법
function renderCare(d: LandingData, p: Preset): string {
  if (!d.care) return ''
  const { colors: C, fonts: F } = p
  return `
<section data-section="care" style="padding:70px 28px;background:${C.paper};">
  <p ${ce('care.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;text-align:center;">CARE · 관리법</p>
  <h2 ${ce('care.title')} style="font-family:${F.serif};font-weight:300;font-size:28px;line-height:1.2;margin:0 0 40px;color:${C.ink};text-align:center;">${esc(d.care.title)}</h2>
  <div style="max-width:500px;margin:0 auto;">
    ${d.care.tips.map((t,i) => `
    <div style="display:grid;grid-template-columns:28px 1fr;gap:14px;padding:16px 0;border-top:1px solid ${C.line};${i === d.care!.tips.length-1 ? 'border-bottom:1px solid ' + C.line + ';' : ''}">
      <span style="color:${C.primary};font-family:${F.serif};font-weight:700;font-size:14px;">${String(i+1).padStart(2,'0')}</span>
      <p ${ce('care.tip.' + i)} style="font-family:${F.deco};font-size:13px;line-height:1.85;color:${C.inkSoft};margin:0;">${esc(t)}</p>
    </div>`).join('')}
  </div>
</section>`
}

function renderReviews(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F, labels: L } = p
  return `
<section data-section="reviews" style="padding:80px 28px;background:${C.cream};">
  <div style="text-align:center;margin-bottom:48px;">
    <p ${ce('reviews.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;">IX.&nbsp;&nbsp;${esc(L.voices)}</p>
    <h2 ${ce('reviews.title')} style="font-family:${F.serif};font-weight:300;font-size:32px;line-height:1.2;letter-spacing:-0.02em;margin:0 0 20px;color:${C.ink};">먼저 써보신<br><em style="font-style:normal;font-weight:700;color:${C.deep};">분들의 말.</em></h2>
    <div style="font-family:${F.serif};font-size:clamp(36px,9vw,48px);font-weight:700;color:${C.deep};line-height:1;">4.9<span style="font-size:15px;color:${C.inkSoft};font-weight:400;"> / 5.0</span></div>
    <div style="color:${C.primary};letter-spacing:4px;font-size:14px;margin-top:8px;">★ ★ ★ ★ ★</div>
  </div>
  ${d.reviews.slice(0,3).map((r,i) => `
  <div style="background:${C.paper};padding:28px 24px;margin-bottom:16px;position:relative;border-left:2px solid ${C.primary};">
    <span style="position:absolute;top:-5px;left:20px;font-family:${F.serif};font-size:60px;color:${C.light};line-height:1;">"</span>
    <div style="color:${C.primary};letter-spacing:2px;font-size:13px;margin-bottom:10px;margin-top:8px;">★ ★ ★ ★ ★</div>
    <p ${ce('review.' + i + '.text')} style="font-family:${F.deco};font-size:15px;line-height:1.95;color:${C.ink};margin:0 0 18px;">${esc(r.text)}</p>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:${C.inkSoft};letter-spacing:0.08em;">
      <span ${ce('review.' + i + '.author')}>${esc(r.author)}</span>
      <span ${ce('review.' + i + '.date')}>${esc(r.date)}</span>
    </div>
  </div>`).join('')}
</section>`
}

function renderInfo(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F, labels: L } = p
  return `
<section data-section="info" style="padding:80px 28px 60px;background:${C.paper};">
  <p ${ce('info.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;">X.&nbsp;&nbsp;${esc(L.spec)}</p>
  <h2 ${ce('info.title')} style="font-family:${F.serif};font-weight:300;font-size:28px;line-height:1.2;letter-spacing:-0.02em;margin:0 0 32px;color:${C.ink};">상품 정보</h2>
  <table style="width:100%;border-top:2px solid ${C.ink};border-collapse:collapse;">
    ${d.info.map((row,i) => `
    <tr style="border-bottom:1px solid ${C.line};">
      <th ${ce('info.row.' + i + '.key')} style="padding:16px 8px 16px 0;text-align:left;vertical-align:top;font-size:13px;font-family:${F.serif};font-weight:400;width:100px;color:${C.inkSoft};letter-spacing:0.05em;">${esc(row.key)}</th>
      <td ${ce('info.row.' + i + '.value')} style="padding:16px 0 16px 8px;text-align:left;vertical-align:top;font-size:13px;font-family:${F.deco};color:${C.ink};line-height:1.7;">${esc(row.value)}</td>
    </tr>`).join('')}
  </table>
</section>`
}

function renderFaq(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F } = p
  return `
<section data-section="faq" style="padding:60px 28px;background:${C.cream};">
  <p ${ce('faq.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;">XI.&nbsp;&nbsp;FAQ</p>
  <h2 ${ce('faq.title')} style="font-family:${F.serif};font-weight:300;font-size:28px;line-height:1.2;letter-spacing:-0.02em;margin:0 0 32px;color:${C.ink};">자주 묻는 질문</h2>
  ${d.faq.slice(0,4).map((f,i) => `
  <div style="border-bottom:1px solid ${C.line};padding:20px 0;">
    <div style="display:flex;gap:12px;align-items:start;margin-bottom:8px;">
      <span style="font-family:${F.serif};font-weight:900;color:${C.deep};font-size:15px;flex-shrink:0;">Q.</span>
      <h4 ${ce('faq.' + i + '.q')} style="font-family:${F.serif};font-weight:700;font-size:15px;margin:0;line-height:1.5;color:${C.ink};">${esc(f.q)}</h4>
    </div>
    <p ${ce('faq.' + i + '.a')} style="font-family:${F.deco};font-size:13px;line-height:1.85;color:${C.inkSoft};margin:0;padding-left:24px;">${esc(f.a)}</p>
  </div>`).join('')}
</section>`
}

function renderCta(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F } = p
  return `
<section data-section="cta" style="background:${C.heroGrad};color:${C.cream};padding:80px 28px;text-align:center;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, ${C.light}26, transparent 60%);"></div>
  <div style="position:relative;z-index:2;">
    <p ${ce('cta.label')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.light};margin:0 0 20px;text-transform:uppercase;">TODAY ONLY</p>
    <h2 ${ce('cta.title')} style="font-family:${F.serif};font-weight:300;font-size:32px;line-height:1.2;margin:0 0 36px;"><em style="font-style:normal;font-weight:700;color:${C.light};">오늘의 가격.</em></h2>
    <p style="font-family:${F.serif};font-size:clamp(36px,9vw,48px);font-weight:700;color:${C.light};letter-spacing:-0.02em;margin:0 0 10px;line-height:1;"><span ${ce('cta.price')}>${comma(d.price.retail)}</span><span style="font-size:18px;margin-left:4px;">원</span></p>
    <p ${ce('cta.unit')} style="font-family:${F.deco};font-size:13px;color:${C.light};opacity:0.7;margin:0 0 40px;">/ ${esc(d.price.unit)}</p>
    <button style="display:inline-block;background:${C.light};color:${C.ink};padding:18px 52px;font-family:${F.serif};font-weight:700;font-size:15px;letter-spacing:0.3em;border:none;cursor:pointer;">주&nbsp;&nbsp;문&nbsp;&nbsp;하&nbsp;&nbsp;기</button>
    <p style="margin-top:24px;font-size:11px;letter-spacing:0.1em;opacity:0.5;">무료 배송 · 당일 출고 · 7일 이내 교환</p>
  </div>
</section>`
}

function renderShip(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F } = p
  return `
<section data-section="ship" style="padding:56px 28px;background:${C.ink};color:${C.cream};text-align:center;">
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:28px 48px;max-width:560px;margin:0 auto;">
    ${d.delivery.slice(0,4).map((de,i) => `
    <div style="min-width:100px;">
      <p ${ce('delivery.' + i + '.label')} style="font-family:${F.serif};font-size:10px;letter-spacing:0.3em;color:${C.light};margin:0 0 8px;">${esc(de.label)}</p>
      <p ${ce('delivery.' + i + '.value')} style="font-family:${F.deco};font-size:13px;line-height:1.7;opacity:0.85;margin:0;white-space:pre-line;">${esc(de.value)}</p>
    </div>`).join('')}
  </div>
</section>`
}

function renderSeal(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F } = p
  return `
<section data-section="seal" style="padding:48px 28px;background:${C.paper};text-align:center;border-top:1px solid ${C.line};">
  <p ${ce('seal.brand')} style="font-family:${F.serif};font-size:20px;font-weight:700;color:${C.deep};letter-spacing:0.1em;margin:0 0 10px;">${esc(d.brandName)}</p>
  <p ${ce('seal.tagline')} style="font-family:${F.deco};font-size:11px;color:${C.inkSoft};opacity:0.7;letter-spacing:0.15em;margin:0;">${esc(d.subtitle)}</p>
</section>`
}

// ============================================================
// 섹션 디스패처
// ============================================================

// 섹션에 배치되고 남은 추가 사진들을 하단 갤러리로 (업로드 이미지 100% 활용)
function renderGallery(d: LandingData, p: Preset): string {
  const imgs = (d.unusedImages || []).filter(Boolean)
  if (imgs.length === 0) return ''
  const { colors: C } = p
  const cells = imgs.map(src => `<div class="gulbi-section-img" data-section-img="gallery" style="aspect-ratio:1/1;overflow:hidden;border-radius:12px;background:#f5f5f5;position:relative;"><img src="${src}" alt="${esc(d.productName)}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>`).join('')
  return `
<section data-section="gallery" style="padding:64px 28px;background:${C.paper};">
  <p style="text-align:center;font-size:12px;letter-spacing:0.2em;color:${C.primary};font-weight:700;margin:0 0 8px;">GALLERY</p>
  <h2 style="text-align:center;font-size:clamp(20px,5vw,28px);font-weight:900;margin:0 0 28px;color:${C.ink};">더 많은 사진</h2>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-width:640px;margin:0 auto;">${cells}</div>
</section>`
}

const SECTION_RENDERERS: Record<string, (d: LandingData, p: Preset) => string> = {
  intro: renderIntro,
  gallery: renderGallery,
  hero: renderHero,
  origin: renderOrigin,
  story: renderStory,
  features: renderFeatures,
  keynum: renderKeynum,
  compare: renderCompare,
  recipe: renderRecipe,
  storage: renderStorage,
  ingredients: renderIngredients,
  dosage: renderDosage,
  usage: renderUsage,
  specs: renderSpecs,
  warranty: renderWarranty,
  artist: renderArtist,
  materials: renderMaterials,
  care: renderCare,
  reviews: renderReviews,
  info: renderInfo,
  faq: renderFaq,
  cta: renderCta,
  ship: renderShip,
  seal: renderSeal,
}

// ============================================================
// 메인 렌더 함수
// ============================================================

export function renderLanding(data: LandingData, presetKey: PresetKey = 'gold', templateKey: TemplateKey = 'premium'): string {
  const preset = PRESETS[presetKey] || PRESETS.gold

  if (templateKey === 'modern')      return renderModernLanding(data, preset)
  if (templateKey === 'traditional') return renderTraditionalLanding(data, preset)
  if (templateKey === 'business')    return renderBusinessLanding(data, preset)
  if (templateKey === 'emotional')   return renderEmotionalLanding(data, preset)
  if (templateKey === 'magazine')    return renderMagazineLanding(data, preset)
  if (templateKey === 'luxury')      return renderLuxuryLanding(data, preset)
  if (templateKey === 'pop')         return renderPopLanding(data, preset)
  if (templateKey === 'clean')       return renderCleanLanding(data, preset)
  const { colors: C, fonts: F } = preset

  const fontImports = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;700;900&family=Gowun+Batang:wght@400;700&display=swap');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
[data-landing] [contenteditable="true"]:focus{outline:2px dashed ${C.primary};outline-offset:3px;background:${C.primary}14;border-radius:4px}
[data-landing] [contenteditable="true"]:hover{background:${C.primary}0D;cursor:text;border-radius:3px}
[data-landing] *{box-sizing:border-box}
</style>`

  const sections = preset.sections
    .map(key => {
      const fn = SECTION_RENDERERS[key]
      return fn ? fn(data, preset) : ''
    })
    .join('')

  return `${fontImports}
<div data-landing data-preset="${presetKey}" style="font-family:${F.sans};color:${C.ink};background:${C.paper};line-height:1.6;-webkit-font-smoothing:antialiased;word-break:keep-all;-webkit-text-size-adjust:100%;">
${sections}
</div>`
}

// ============================================================
// 팝 템플릿 (밝고 컬러풀 · 큰 라운드 · MZ 감성)
// ============================================================
function renderPopLanding(d: LandingData, p: Preset): string {
  const { colors: C } = p
  const acc = C.primary
  const acc2 = C.deep || C.primary
  const hero = d.sectionImages?.hero || d.mainImageUrl
  const gallery = (d.unusedImages || []).filter(Boolean)
  const chipColors = ['#FF5D8F', '#7C5CFF', '#00C2A8', '#FFB020', '#3B82F6']
  const css = `<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
[data-landing] [contenteditable="true"]:focus{outline:2px dashed ${acc};outline-offset:3px;border-radius:8px}
[data-landing] *{box-sizing:border-box;-webkit-text-size-adjust:100%}
@keyframes popfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
</style>`
  return `${css}
<div data-landing data-template="pop" style="font-family:'Pretendard Variable',sans-serif;color:#1a1a2e;background:#fff8f3;line-height:1.6;-webkit-font-smoothing:antialiased;word-break:keep-all;">

<section style="background:radial-gradient(120% 100% at 50% 0%, ${acc}22 0%, #fff8f3 60%);padding:48px 22px 40px;text-align:center;">
  <span style="display:inline-block;background:${acc};color:#fff;font-size:12px;font-weight:800;padding:7px 18px;border-radius:999px;margin-bottom:18px;box-shadow:0 6px 16px ${acc}55;">${esc(d.brandName || 'NEW')}</span>
  <h1 ${ce('hero.catch')} style="font-size:clamp(30px,9vw,54px);font-weight:900;line-height:1.12;margin:0 0 14px;letter-spacing:-0.03em;">${esc(d.catchphrase)}</h1>
  <p ${ce('hero.sub')} style="font-size:clamp(14px,4vw,17px);color:#6b6b80;margin:0 auto 28px;max-width:420px;line-height:1.7;">${esc(d.subtitle)}</p>
  ${hero ? `<div style="position:relative;max-width:min(460px,90vw);margin:0 auto;">
    <div style="position:absolute;inset:-14px;background:linear-gradient(135deg,${acc},${acc2});border-radius:36px;transform:rotate(-3deg);opacity:0.25;"></div>
    <img src="${hero}" alt="${esc(d.productName)}" style="position:relative;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:32px;box-shadow:0 20px 50px rgba(0,0,0,0.15);animation:popfloat 4s ease-in-out infinite;" />
  </div>` : ''}
</section>

<section style="padding:20px 22px 8px;">
  <div style="display:flex;flex-wrap:wrap;gap:9px;justify-content:center;">
    ${d.features.slice(0,4).map((f,i)=>`<span style="background:${chipColors[i%chipColors.length]}1a;color:${chipColors[i%chipColors.length]};font-size:13px;font-weight:800;padding:9px 16px;border-radius:999px;">#${esc(f.title)}</span>`).join('')}
  </div>
</section>

<section style="padding:44px 22px;text-align:center;">
  <p style="font-size:13px;font-weight:800;color:${acc};letter-spacing:0.1em;margin:0 0 8px;">WHY</p>
  <h2 style="font-size:clamp(22px,6vw,30px);font-weight:900;margin:0 0 28px;">이래서 사랑받아요 💕</h2>
  <div style="display:grid;gap:14px;max-width:520px;margin:0 auto;">
    ${d.features.slice(0,4).map((f,i)=>`
    <div style="background:#fff;border-radius:22px;padding:22px;text-align:left;box-shadow:0 6px 20px rgba(0,0,0,0.06);border:2px solid ${chipColors[i%chipColors.length]}22;">
      <div style="display:inline-flex;width:40px;height:40px;background:${chipColors[i%chipColors.length]};border-radius:14px;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:17px;margin-bottom:12px;">${i+1}</div>
      <h3 ${ce('features.'+i+'.title')} style="font-size:clamp(16px,4.4vw,19px);font-weight:900;margin:0 0 6px;">${esc(f.title)}</h3>
      <p ${ce('features.'+i+'.desc')} style="font-size:clamp(13px,3.5vw,14px);color:#6b6b80;line-height:1.75;margin:0;">${esc(f.desc)}</p>
    </div>`).join('')}
  </div>
</section>

${d.sectionImages?.origin ? `<section style="padding:12px 22px;"><img src="${d.sectionImages.origin}" alt="${esc(d.originLocation)}" style="width:100%;max-width:560px;aspect-ratio:16/9;object-fit:cover;border-radius:28px;display:block;margin:0 auto;box-shadow:0 14px 36px rgba(0,0,0,0.12);" /></section>` : ''}
${d.sectionImages?.story ? `<section style="padding:12px 22px 44px;"><img src="${d.sectionImages.story}" alt="${esc(d.productName)}" style="width:100%;max-width:560px;aspect-ratio:4/3;object-fit:cover;border-radius:28px;display:block;margin:0 auto;box-shadow:0 14px 36px rgba(0,0,0,0.12);" /></section>` : ''}

<section style="background:linear-gradient(135deg,${acc},${acc2});padding:52px 22px;text-align:center;color:#fff;border-radius:36px;margin:0 12px;">
  <p style="font-size:13px;font-weight:800;opacity:0.85;letter-spacing:0.1em;margin:0 0 6px;">${esc(d.keyNumber.label)}</p>
  <div style="font-size:clamp(58px,16vw,108px);font-weight:900;line-height:1;">${esc(d.keyNumber.value)}<span style="font-size:0.3em;">${esc(d.keyNumber.unit)}</span></div>
  <p ${ce('keynum.caption')} style="font-size:14px;opacity:0.9;max-width:400px;margin:14px auto 0;line-height:1.7;">${esc(d.keyNumber.caption)}</p>
</section>

<section style="padding:44px 22px;text-align:center;">
  <h2 style="font-size:clamp(20px,5.5vw,26px);font-weight:900;margin:0 0 22px;">이렇게 즐겨요 🙌</h2>
  <div style="max-width:520px;margin:0 auto;text-align:left;display:grid;gap:12px;">
    ${(d.recipe?.steps || []).slice(0,5).map((s,i)=>`<div style="display:flex;gap:14px;align-items:center;background:#fff;border-radius:18px;padding:16px 18px;box-shadow:0 4px 14px rgba(0,0,0,0.05);"><span style="flex-shrink:0;width:34px;height:34px;background:${acc}18;color:${acc};border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;">${i+1}</span><div><p style="font-weight:800;margin:0 0 2px;">${esc(s.name)}</p><p style="font-size:13px;color:#6b6b80;margin:0;line-height:1.6;">${esc(s.detail)}</p></div></div>`).join('')}
  </div>
</section>

${gallery.length ? `<section style="padding:8px 12px 40px;">
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-width:560px;margin:0 auto;">${gallery.map(src=>`<img src="${src}" alt="${esc(d.productName)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:20px;display:block;" />`).join('')}</div>
</section>` : ''}

<section style="padding:44px 22px;text-align:center;">
  <h2 style="font-size:clamp(20px,5.5vw,26px);font-weight:900;margin:0 0 6px;">리얼 후기 ⭐</h2>
  <p style="color:${acc};font-weight:900;font-size:28px;margin:4px 0 22px;">4.9 / 5.0</p>
  <div style="max-width:520px;margin:0 auto;display:grid;gap:12px;">
    ${d.reviews.slice(0,3).map((r,i)=>`<div style="background:${chipColors[i%chipColors.length]}12;border-radius:22px;padding:20px;text-align:left;"><p style="color:#FFB020;margin:0 0 8px;font-size:14px;">★★★★★</p><p style="font-size:14px;line-height:1.75;margin:0 0 10px;">${esc(r.text)}</p><p style="font-size:12px;color:#8a8aa0;margin:0;font-weight:700;">${esc(r.author)} · ${esc(r.date)}</p></div>`).join('')}
  </div>
</section>

<section style="padding:8px 22px 56px;text-align:center;">
  <div style="background:#1a1a2e;border-radius:32px;padding:44px 24px;color:#fff;">
    <div style="font-size:clamp(40px,11vw,68px);font-weight:900;line-height:1;">${comma(d.price.retail)}<span style="font-size:0.3em;margin-left:4px;">원</span></div>
    <p style="opacity:0.6;font-size:13px;margin:8px 0 24px;">/ ${esc(d.price.unit)}</p>
    <button style="width:100%;max-width:340px;background:linear-gradient(135deg,${acc},${acc2});color:#fff;border:none;border-radius:999px;padding:18px;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 10px 30px ${acc}66;">지금 담기 🛒</button>
    <p style="opacity:0.5;font-size:12px;margin:18px 0 0;">무료배송 · 당일출고 · 7일 교환</p>
  </div>
</section>

</div>`
}

// ============================================================
// 클린 템플릿 (화이트 미니멀 · 화장품/패션 · 넉넉한 여백)
// ============================================================
function renderCleanLanding(d: LandingData, p: Preset): string {
  const { colors: C } = p
  const acc = C.primary
  const hero = d.sectionImages?.hero || d.mainImageUrl
  const gallery = (d.unusedImages || []).filter(Boolean)
  const bleed = (img?: string) => img ? `<img src="${img}" alt="${esc(d.productName)}" style="width:100%;display:block;object-fit:cover;aspect-ratio:3/4;max-height:82vh;" />` : ''
  const css = `<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap');
[data-landing] [contenteditable="true"]:focus{outline:2px dashed ${acc};outline-offset:3px}
[data-landing] *{box-sizing:border-box;-webkit-text-size-adjust:100%}
</style>`
  return `${css}
<div data-landing data-template="clean" style="font-family:'Pretendard Variable',sans-serif;color:#222;background:#ffffff;line-height:1.7;-webkit-font-smoothing:antialiased;word-break:keep-all;">

<section style="padding:72px 28px 44px;text-align:center;">
  <p style="font-size:11px;letter-spacing:0.4em;color:${acc};margin:0 0 22px;text-transform:uppercase;font-weight:600;">${esc(d.brandName || 'COLLECTION')}</p>
  <h1 ${ce('hero.catch')} style="font-family:'Cormorant Garamond',serif;font-size:clamp(34px,10vw,60px);font-weight:500;line-height:1.15;margin:0 0 18px;letter-spacing:-0.01em;">${esc(d.catchphrase)}</h1>
  <p ${ce('hero.sub')} style="font-size:clamp(13px,3.6vw,15px);color:#888;max-width:400px;margin:0 auto;line-height:1.9;">${esc(d.subtitle)}</p>
</section>

${bleed(hero)}

<section style="padding:60px 28px;text-align:center;max-width:520px;margin:0 auto;">
  <p ${ce('intro.quote')} style="font-family:'Cormorant Garamond',serif;font-size:clamp(20px,5.5vw,28px);font-weight:500;line-height:1.7;margin:0 0 16px;font-style:italic;">“${esc(d.artisanQuote)}”</p>
  <p ${ce('intro.sig')} style="font-size:11px;letter-spacing:0.2em;color:${acc};margin:0;text-transform:uppercase;">${esc(d.artisanName)}</p>
</section>

<section style="padding:8px 28px 56px;max-width:720px;margin:0 auto;">
  ${d.features.slice(0,4).map((f,i)=>`
  <div style="border-top:1px solid #eee;padding:30px 0;display:grid;grid-template-columns:44px 1fr;gap:18px;">
    <span style="font-family:'Cormorant Garamond',serif;font-size:26px;color:${acc};">0${i+1}</span>
    <div><h3 ${ce('features.'+i+'.title')} style="font-size:clamp(16px,4.3vw,20px);font-weight:600;margin:0 0 8px;">${esc(f.title)}</h3>
    <p ${ce('features.'+i+'.desc')} style="font-size:clamp(13px,3.4vw,14px);color:#888;line-height:1.9;margin:0;">${esc(f.desc)}</p></div>
  </div>`).join('')}
</section>

${d.sectionImages?.origin ? bleed(d.sectionImages.origin) : ''}

<section style="padding:60px 28px;max-width:560px;margin:0 auto;text-align:center;">
  <p style="font-size:11px;letter-spacing:0.3em;color:${acc};margin:0 0 14px;text-transform:uppercase;">STORY</p>
  <div ${ce('story.body')} style="font-size:clamp(14px,3.7vw,16px);color:#555;line-height:2.05;text-align:left;">${esc(d.story).split('\n').filter(Boolean).map(x=>`<p style="margin:0 0 18px;">${x}</p>`).join('')}</div>
</section>

${d.sectionImages?.story ? bleed(d.sectionImages.story) : ''}

<section style="padding:64px 28px;text-align:center;background:#fafafa;">
  <div style="font-family:'Cormorant Garamond',serif;font-size:clamp(60px,16vw,120px);font-weight:500;line-height:1;color:${acc};">${esc(d.keyNumber.value)}<span style="font-size:0.26em;">${esc(d.keyNumber.unit)}</span></div>
  <p style="font-size:11px;letter-spacing:0.3em;color:#aaa;margin:12px 0 10px;text-transform:uppercase;">${esc(d.keyNumber.label)}</p>
  <p ${ce('keynum.caption')} style="font-size:14px;color:#888;max-width:400px;margin:0 auto;line-height:1.85;">${esc(d.keyNumber.caption)}</p>
</section>

${gallery.length ? `<section style="padding:2px 0;"><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:2px;">${gallery.map(src=>`<img src="${src}" alt="${esc(d.productName)}" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;" />`).join('')}</div></section>` : ''}

<section style="padding:60px 28px;max-width:560px;margin:0 auto;text-align:center;">
  <p style="font-size:11px;letter-spacing:0.3em;color:${acc};margin:0 0 24px;text-transform:uppercase;">REVIEWS</p>
  ${d.reviews.slice(0,3).map(r=>`<div style="padding:24px 0;border-top:1px solid #eee;text-align:left;"><p style="font-size:15px;line-height:1.9;color:#444;margin:0 0 10px;">“${esc(r.text)}”</p><p style="font-size:11px;letter-spacing:0.1em;color:#aaa;margin:0;">${esc(r.author)} · ${esc(r.date)}</p></div>`).join('')}
</section>

<section style="padding:72px 28px;text-align:center;border-top:1px solid #eee;">
  <div style="font-family:'Cormorant Garamond',serif;font-size:clamp(38px,10vw,64px);font-weight:500;line-height:1;margin:0 0 8px;">${comma(d.price.retail)}<span style="font-size:0.3em;margin-left:4px;">원</span></div>
  <p style="font-size:12px;color:#aaa;margin:0 0 28px;">/ ${esc(d.price.unit)}</p>
  <button style="background:#222;color:#fff;border:none;padding:17px 56px;font-size:13px;font-weight:600;letter-spacing:0.2em;cursor:pointer;">ADD TO CART</button>
  <p style="font-size:11px;color:#bbb;margin:22px 0 0;letter-spacing:0.05em;">FREE SHIPPING · SAME-DAY · 7-DAY RETURN</p>
</section>

</div>`
}

// ============================================================
// 매거진 템플릿 (에디토리얼 · 세리프 · 풀블리드 사진)
// ============================================================
function renderMagazineLanding(d: LandingData, p: Preset): string {
  const { colors: C } = p
  const hero = d.sectionImages?.hero || d.mainImageUrl
  const gallery = (d.unusedImages || []).filter(Boolean)
  const bleed = (img: string | undefined, cap: string) => img ? `
  <figure style="margin:0;position:relative;">
    <img src="${img}" alt="${esc(d.productName)}" style="width:100%;display:block;object-fit:cover;max-height:78vh;" />
    ${cap ? `<figcaption style="position:absolute;left:20px;bottom:16px;color:#fff;font-size:12px;letter-spacing:0.1em;background:rgba(0,0,0,0.45);padding:6px 12px;border-radius:2px;backdrop-filter:blur(4px);">${esc(cap)}</figcaption>` : ''}
  </figure>` : ''
  const css = `<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;700;900&display=swap');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
[data-landing] [contenteditable="true"]:focus{outline:2px dashed ${C.primary};outline-offset:3px;background:${C.primary}14;border-radius:4px}
[data-landing] *{box-sizing:border-box;-webkit-text-size-adjust:100%}
</style>`
  return `${css}
<div data-landing data-template="magazine" style="font-family:'Noto Serif KR',serif;color:#1a1a1a;background:#faf9f7;line-height:1.75;-webkit-font-smoothing:antialiased;word-break:keep-all;">

<section style="padding:64px 24px 40px;text-align:center;border-bottom:1px solid #e5e0d8;">
  <p style="font-family:'Pretendard Variable',sans-serif;font-size:11px;letter-spacing:0.4em;color:${C.primary};margin:0 0 20px;text-transform:uppercase;">${esc(d.brandName || 'STORY')}</p>
  <h1 ${ce('hero.catch')} style="font-size:clamp(30px,8vw,52px);font-weight:900;line-height:1.2;margin:0 0 18px;letter-spacing:-0.02em;">${esc(d.catchphrase)}</h1>
  <p ${ce('hero.sub')} style="font-size:clamp(14px,3.8vw,17px);color:#555;max-width:460px;margin:0 auto;line-height:1.85;">${esc(d.subtitle)}</p>
</section>

${bleed(hero, d.productName)}

<section style="padding:56px 24px;text-align:center;max-width:600px;margin:0 auto;">
  <p ${ce('intro.quote')} style="font-size:clamp(19px,5vw,26px);font-weight:500;line-height:1.75;margin:0 0 16px;font-style:italic;">“${esc(d.artisanQuote)}”</p>
  <p ${ce('intro.sig')} style="font-family:'Pretendard Variable',sans-serif;font-size:12px;letter-spacing:0.15em;color:${C.primary};margin:0;">— ${esc(d.artisanName)}</p>
</section>

${bleed(d.sectionImages?.origin, d.originLocation)}

<section style="padding:56px 24px;max-width:620px;margin:0 auto;">
  <p style="font-family:'Pretendard Variable',sans-serif;font-size:48px;font-weight:900;color:${C.primary};opacity:0.18;margin:0;line-height:1;">01</p>
  <h2 ${ce('origin.location')} style="font-size:clamp(22px,6vw,32px);font-weight:900;margin:4px 0 20px;">${esc(d.originLocation)}</h2>
  <p ${ce('origin.story')} style="font-size:clamp(14px,3.8vw,16px);color:#444;line-height:1.95;margin:0;">${esc(d.originStory)}</p>
</section>

${bleed(d.sectionImages?.story, '')}

<section style="padding:56px 24px;max-width:620px;margin:0 auto;">
  <p style="font-family:'Pretendard Variable',sans-serif;font-size:48px;font-weight:900;color:${C.primary};opacity:0.18;margin:0;line-height:1;">02</p>
  <h2 style="font-size:clamp(22px,6vw,32px);font-weight:900;margin:4px 0 20px;">${esc(d.productName)}의 이야기</h2>
  <div ${ce('story.body')} style="font-size:clamp(14px,3.8vw,16px);color:#444;line-height:2;">${esc(d.story).split('\n').filter(Boolean).map(x=>`<p style="margin:0 0 16px;">${x}</p>`).join('')}</div>
</section>

<section style="padding:8px 24px 56px;max-width:620px;margin:0 auto;">
  ${d.features.slice(0,4).map((f,i)=>`
  <div style="border-top:1px solid #e5e0d8;padding:24px 0;display:flex;gap:20px;">
    <span style="font-family:'Pretendard Variable',sans-serif;font-size:14px;font-weight:700;color:${C.primary};flex-shrink:0;">0${i+1}</span>
    <div><h3 ${ce('features.'+i+'.title')} style="font-size:clamp(16px,4.2vw,19px);font-weight:700;margin:0 0 8px;">${esc(f.title)}</h3>
    <p ${ce('features.'+i+'.desc')} style="font-size:clamp(13px,3.4vw,14px);color:#555;line-height:1.85;margin:0;">${esc(f.desc)}</p></div>
  </div>`).join('')}
</section>

<section style="padding:64px 24px;text-align:center;background:#1a1a1a;color:#faf9f7;">
  <p style="font-family:'Pretendard Variable',sans-serif;font-size:11px;letter-spacing:0.3em;opacity:0.6;margin:0 0 12px;">${esc(d.keyNumber.label)}</p>
  <div style="font-size:clamp(56px,15vw,110px);font-weight:900;line-height:1;color:${C.light};">${esc(d.keyNumber.value)}<span style="font-size:0.28em;margin-left:6px;">${esc(d.keyNumber.unit)}</span></div>
  <p ${ce('keynum.caption')} style="font-size:14px;opacity:0.7;max-width:420px;margin:16px auto 0;line-height:1.8;">${esc(d.keyNumber.caption)}</p>
</section>

${d.recipe ? `${bleed(d.sectionImages?.recipe, d.recipe.title)}
<section style="padding:56px 24px;max-width:600px;margin:0 auto;">
  <h2 style="font-size:clamp(20px,5.5vw,28px);font-weight:900;margin:0 0 8px;text-align:center;">${esc(d.recipe.title)}</h2>
  <p style="text-align:center;color:#666;font-size:14px;margin:0 0 28px;">${esc(d.recipe.intro)}</p>
  ${d.recipe.steps.map((s,i)=>`<div style="display:flex;gap:16px;padding:16px 0;border-bottom:1px solid #e5e0d8;"><span style="font-family:'Pretendard Variable',sans-serif;font-weight:700;color:${C.primary};">${i+1}</span><div><p style="font-weight:700;margin:0 0 4px;">${esc(s.name)}</p><p style="font-size:13px;color:#555;margin:0;line-height:1.75;">${esc(s.detail)}</p></div></div>`).join('')}
</section>` : ''}

${gallery.length > 0 ? `
<section style="padding:24px 12px;">
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">
    ${gallery.map(src=>`<img src="${src}" alt="${esc(d.productName)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />`).join('')}
  </div>
</section>` : ''}

<section style="padding:56px 24px;max-width:600px;margin:0 auto;text-align:center;">
  <h2 style="font-size:clamp(20px,5.5vw,26px);font-weight:900;margin:0 0 24px;">고객의 이야기</h2>
  ${d.reviews.slice(0,3).map(r=>`<div style="border-top:1px solid #e5e0d8;padding:22px 0;text-align:left;"><p style="font-size:15px;line-height:1.85;margin:0 0 10px;font-style:italic;">“${esc(r.text)}”</p><p style="font-family:'Pretendard Variable',sans-serif;font-size:12px;color:#888;margin:0;">${esc(r.author)} · ${esc(r.date)}</p></div>`).join('')}
</section>

<section style="padding:64px 24px;text-align:center;background:#1a1a1a;color:#faf9f7;">
  <div style="font-size:clamp(40px,11vw,72px);font-weight:900;line-height:1;color:${C.light};">${comma(d.price.retail)}<span style="font-size:0.26em;margin-left:4px;">원</span></div>
  <p style="font-size:12px;opacity:0.5;margin:8px 0 28px;">/ ${esc(d.price.unit)}</p>
  <button style="font-family:'Pretendard Variable',sans-serif;background:${C.light};color:#1a1a1a;padding:16px 48px;border:none;border-radius:2px;font-size:15px;font-weight:800;letter-spacing:0.2em;cursor:pointer;">주문하기</button>
  <p style="font-size:11px;opacity:0.4;margin:20px 0 0;">무료배송 · 당일출고 · 7일이내 교환</p>
</section>

</div>`
}

// ============================================================
// 럭셔리 템플릿 (다크 · 골드 · 넓은 여백)
// ============================================================
function renderLuxuryLanding(d: LandingData, p: Preset): string {
  const { colors: C } = p
  const gold = C.light || '#d4b56a'
  const hero = d.sectionImages?.hero || d.mainImageUrl
  const gallery = (d.unusedImages || []).filter(Boolean)
  const frame = (img: string | undefined) => img ? `
  <div style="padding:0 24px;margin:0 auto;max-width:560px;">
    <div style="border:1px solid ${gold}55;padding:10px;">
      <img src="${img}" alt="${esc(d.productName)}" style="width:100%;display:block;aspect-ratio:4/3;object-fit:cover;" />
    </div>
  </div>` : ''
  const rule = `<div style="width:44px;height:1px;background:${gold};margin:0 auto;"></div>`
  const css = `<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;700;900&display=swap');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
[data-landing] [contenteditable="true"]:focus{outline:2px dashed ${gold};outline-offset:3px;border-radius:4px}
[data-landing] *{box-sizing:border-box;-webkit-text-size-adjust:100%}
</style>`
  return `${css}
<div data-landing data-template="luxury" style="font-family:'Noto Serif KR',serif;color:#e8e2d5;background:#0b0b0d;line-height:1.8;-webkit-font-smoothing:antialiased;word-break:keep-all;">

<section style="padding:72px 24px 44px;text-align:center;">
  <p style="font-family:'Pretendard Variable',sans-serif;font-size:11px;letter-spacing:0.45em;color:${gold};margin:0 0 24px;text-transform:uppercase;">${esc(d.brandName || 'MAISON')}</p>
  <h1 ${ce('hero.catch')} style="font-size:clamp(30px,8vw,50px);font-weight:700;line-height:1.25;margin:0 0 20px;color:#fff;letter-spacing:-0.01em;">${esc(d.catchphrase)}</h1>
  ${rule}
  <p ${ce('hero.sub')} style="font-size:clamp(14px,3.8vw,16px);color:#b8b0a0;max-width:440px;margin:22px auto 0;line-height:1.9;">${esc(d.subtitle)}</p>
</section>

${frame(hero)}

<section style="padding:52px 24px;text-align:center;max-width:560px;margin:0 auto;">
  <p ${ce('intro.quote')} style="font-size:clamp(18px,4.8vw,24px);font-weight:400;line-height:1.85;margin:0 0 18px;color:#f0ebe0;font-style:italic;">“${esc(d.artisanQuote)}”</p>
  <p ${ce('intro.sig')} style="font-family:'Pretendard Variable',sans-serif;font-size:12px;letter-spacing:0.2em;color:${gold};margin:0;">— ${esc(d.artisanName)}</p>
</section>

<section style="padding:20px 24px 52px;text-align:center;max-width:600px;margin:0 auto;">
  <p style="font-family:'Pretendard Variable',sans-serif;font-size:11px;letter-spacing:0.35em;color:${gold};margin:0 0 14px;">ORIGIN</p>
  <h2 ${ce('origin.location')} style="font-size:clamp(22px,6vw,30px);font-weight:700;margin:0 0 20px;color:#fff;">${esc(d.originLocation)}</h2>
  <p ${ce('origin.story')} style="font-size:clamp(14px,3.7vw,15px);color:#b8b0a0;line-height:2;margin:0;">${esc(d.originStory)}</p>
</section>

${frame(d.sectionImages?.origin)}

<section style="padding:56px 24px;max-width:560px;margin:0 auto;">
  ${d.features.slice(0,4).map((f,i)=>`
  <div style="padding:22px 0;border-bottom:1px solid #26241f;text-align:center;">
    <p style="font-family:'Pretendard Variable',sans-serif;font-size:11px;letter-spacing:0.3em;color:${gold};margin:0 0 8px;">0${i+1}</p>
    <h3 ${ce('features.'+i+'.title')} style="font-size:clamp(16px,4.4vw,20px);font-weight:700;margin:0 0 10px;color:#fff;">${esc(f.title)}</h3>
    <p ${ce('features.'+i+'.desc')} style="font-size:clamp(13px,3.4vw,14px);color:#a89f8e;line-height:1.9;margin:0;">${esc(f.desc)}</p>
  </div>`).join('')}
</section>

${frame(d.sectionImages?.story)}

<section style="padding:60px 24px;text-align:center;">
  <p style="font-family:'Pretendard Variable',sans-serif;font-size:11px;letter-spacing:0.3em;color:${gold};opacity:0.8;margin:0 0 14px;">${esc(d.keyNumber.label)}</p>
  <div style="font-size:clamp(58px,15vw,112px);font-weight:700;line-height:1;color:${gold};">${esc(d.keyNumber.value)}<span style="font-size:0.26em;margin-left:6px;">${esc(d.keyNumber.unit)}</span></div>
  <p ${ce('keynum.caption')} style="font-size:14px;color:#b8b0a0;max-width:420px;margin:18px auto 0;line-height:1.85;">${esc(d.keyNumber.caption)}</p>
</section>

${gallery.length > 0 ? `
<section style="padding:16px 24px 40px;max-width:600px;margin:0 auto;">
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
    ${gallery.map(src=>`<div style="border:1px solid ${gold}44;padding:6px;"><img src="${src}" alt="${esc(d.productName)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" /></div>`).join('')}
  </div>
</section>` : ''}

<section style="padding:52px 24px;text-align:center;max-width:560px;margin:0 auto;">
  <p style="font-family:'Pretendard Variable',sans-serif;font-size:11px;letter-spacing:0.3em;color:${gold};margin:0 0 24px;">CLIENTS</p>
  ${d.reviews.slice(0,3).map(r=>`<div style="padding:20px 0;border-top:1px solid #26241f;text-align:left;"><p style="font-size:14px;line-height:1.9;color:#d8d0c0;margin:0 0 8px;font-style:italic;">“${esc(r.text)}”</p><p style="font-family:'Pretendard Variable',sans-serif;font-size:11px;letter-spacing:0.15em;color:${gold};margin:0;">${esc(r.author)} · ${esc(r.date)}</p></div>`).join('')}
</section>

<section style="padding:64px 24px;text-align:center;border-top:1px solid #26241f;">
  ${rule}
  <div style="font-size:clamp(40px,11vw,72px);font-weight:700;line-height:1;color:${gold};margin:24px 0 8px;">${comma(d.price.retail)}<span style="font-size:0.26em;margin-left:4px;">원</span></div>
  <p style="font-size:12px;color:#8a8272;margin:0 0 28px;">/ ${esc(d.price.unit)}</p>
  <button style="font-family:'Pretendard Variable',sans-serif;background:${gold};color:#0b0b0d;padding:16px 52px;border:none;font-size:14px;font-weight:800;letter-spacing:0.25em;cursor:pointer;">ORDER</button>
  <p style="font-size:11px;color:#6a6252;margin:22px 0 0;">무료배송 · 당일출고 · 7일이내 교환</p>
</section>

</div>`
}

// ============================================================
// 모던 템플릿
// ============================================================
function renderModernLanding(d: LandingData, p: Preset): string {
  const { colors: C } = p
  const img = d.mainImageUrl
  const css = `<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;700;900&display=swap');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
[data-landing] [contenteditable="true"]:focus{outline:2px dashed ${C.primary};outline-offset:3px;background:${C.primary}14;border-radius:4px}
[data-landing] *{box-sizing:border-box;-webkit-text-size-adjust:100%}
</style>`
  return `${css}
<div data-landing data-template="modern" style="font-family:'Pretendard Variable',sans-serif;color:#111;background:#FAFAFA;line-height:1.6;-webkit-font-smoothing:antialiased;word-break:keep-all;">

<section style="background:white;padding:52px 20px 40px;text-align:center;border-bottom:3px solid ${C.primary};">
  <span style="display:inline-block;background:${C.primary};color:white;font-size:10px;font-weight:700;letter-spacing:0.15em;padding:4px 14px;border-radius:20px;margin-bottom:16px;">${esc(d.brandName)}</span>
  <h1 ${ce('hero.catch')} style="font-size:clamp(24px,6.5vw,42px);font-weight:900;color:#111;line-height:1.15;margin:0 0 12px;letter-spacing:-0.02em;">${esc(d.catchphrase)}</h1>
  <p ${ce('hero.sub')} style="font-size:clamp(13px,3.5vw,15px);color:#666;margin:0 auto 24px;line-height:1.7;max-width:400px;">${esc(d.subtitle)}</p>
  ${img ? `<div style="border-radius:20px;overflow:hidden;margin:0 auto;max-width:min(480px,92vw);aspect-ratio:1/1;background:#F3F4F6;"><img src="${img}" alt="${esc(d.productName)}" style="width:100%;height:100%;object-fit:contain;" /></div>` : ''}
  <p ${ce('intro.quote')} style="font-size:clamp(14px,3.8vw,17px);color:#444;margin:28px auto 8px;line-height:1.85;max-width:440px;font-style:italic;">"${esc(d.artisanQuote)}"</p>
  <p ${ce('intro.sig')} style="font-size:12px;color:${C.primary};margin:0;">— ${esc(d.artisanName)}</p>
</section>

<section style="background:${C.cream};padding:48px 20px;text-align:center;">
  <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;">
    <div style="width:3px;height:18px;background:${C.primary};border-radius:2px;"></div>
    <h2 ${ce('origin.location')} style="font-size:clamp(18px,5vw,22px);font-weight:800;color:${C.ink};margin:0;">${esc(d.originLocation)}</h2>
    <div style="width:3px;height:18px;background:${C.primary};border-radius:2px;"></div>
  </div>
  <p ${ce('origin.story')} style="font-size:clamp(13px,3.5vw,14px);color:${C.inkSoft};line-height:1.85;max-width:480px;margin:0 auto 28px;">${esc(d.originStory)}</p>
  ${d.sectionImages?.origin ? `<img src="${d.sectionImages.origin}" alt="${esc(d.originLocation)}" style="width:100%;max-width:560px;aspect-ratio:16/9;object-fit:cover;border-radius:16px;display:block;margin:0 auto 28px;box-shadow:0 8px 24px rgba(0,0,0,0.1);" />` : ''}
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;">
    ${d.originStats.filter(s=>s.value?.trim()).slice(0,4).map((s,i)=>`
    <div style="background:white;border-radius:14px;padding:18px 20px;min-width:90px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <div style="font-size:clamp(22px,5.5vw,28px);font-weight:900;color:${C.deep};">${esc(s.value)}<span style="font-size:12px;color:${C.primary};">${esc(s.unit)}</span></div>
      <div style="font-size:10px;color:#888;margin-top:4px;">${esc(s.label)}</div>
      <div style="font-size:11px;color:#AAA;margin-top:3px;line-height:1.4;">${esc(s.desc)}</div>
    </div>`).join('')}
  </div>
</section>

<section style="background:${C.paper};padding:48px 20px;text-align:center;">
  <h2 style="font-size:12px;letter-spacing:0.3em;color:${C.primary};margin:0 0 10px;font-weight:700;">STORY</h2>
  <h3 ${ce('story.title')} style="font-size:clamp(20px,5vw,26px);font-weight:800;color:${C.ink};margin:0 0 24px;">${esc(d.productName)}의 이야기</h3>
  ${d.sectionImages?.story ? `<img src="${d.sectionImages.story}" alt="${esc(d.productName)}" style="width:100%;max-width:560px;aspect-ratio:4/3;object-fit:cover;border-radius:16px;display:block;margin:0 auto 24px;" />` : ''}
  <div ${ce('story.body')} style="font-size:clamp(13px,3.5vw,14px);color:${C.inkSoft};line-height:1.95;max-width:520px;margin:0 auto;text-align:left;">${esc(d.story).split('\n').filter(Boolean).map(x=>`<p style="margin:0 0 14px;">${x}</p>`).join('')}</div>
</section>

<section style="background:${C.paper};padding:48px 20px;text-align:center;">
  <h2 style="font-size:clamp(18px,5vw,22px);font-weight:800;color:${C.ink};margin:0 0 24px;">왜 선택해야 할까요</h2>
  <div style="display:grid;gap:12px;max-width:560px;margin:0 auto;">
    ${d.features.slice(0,4).map((f,i)=>`
    <div style="background:${C.cream};border-radius:14px;padding:18px 20px;display:flex;gap:14px;align-items:start;box-shadow:0 2px 6px rgba(0,0,0,0.05);text-align:left;">
      <div style="width:34px;height:34px;background:${C.primary};border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;flex-shrink:0;">${i+1}</div>
      <div><h3 ${ce('features.'+i+'.title')} style="font-size:clamp(13px,3.5vw,15px);font-weight:700;color:${C.ink};margin:0 0 4px;">${esc(f.title)}</h3>
      <p ${ce('features.'+i+'.desc')} style="font-size:clamp(12px,3.2vw,13px);color:${C.inkSoft};margin:0;line-height:1.65;">${esc(f.desc)}</p></div>
    </div>`).join('')}
  </div>
</section>

<section style="background:${C.heroGrad};padding:56px 20px;text-align:center;">
  <p ${ce('keynum.caption1')} style="font-size:11px;color:${C.cream};opacity:0.7;letter-spacing:0.2em;margin:0 0 8px;">${esc(d.keyNumber.label)}</p>
  <div style="font-size:clamp(52px,13vw,90px);font-weight:900;color:${C.cream};line-height:1;margin:12px 0 8px;"><span ${ce('keynum.value')}>${esc(d.keyNumber.value)}</span><span ${ce('keynum.unit')} style="font-size:0.26em;opacity:0.9;margin-left:4px;">${esc(d.keyNumber.unit)}</span></div>
  <p ${ce('keynum.caption')} style="font-size:clamp(13px,3.5vw,14px);color:${C.cream};opacity:0.75;margin:0;max-width:360px;margin-left:auto;margin-right:auto;">${esc(d.keyNumber.caption)}</p>
</section>

<section style="background:${C.cream};padding:48px 20px;text-align:center;">
  <h2 style="font-size:clamp(18px,5vw,22px);font-weight:800;color:${C.ink};margin:0 0 24px;">비교해 보세요</h2>
  <div style="border:1px solid ${C.line};border-radius:14px;overflow:hidden;max-width:560px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:${C.paper};">
      <div style="padding:12px 6px;font-size:10px;font-weight:600;color:${C.inkSoft};text-align:center;">항목</div>
      <div style="padding:12px 6px;font-size:10px;font-weight:600;color:${C.inkSoft};text-align:center;">일반 제품</div>
      <div style="padding:12px 6px;font-size:10px;font-weight:700;color:${C.primary};text-align:center;">저희 제품</div>
    </div>
    ${d.differences.slice(0,5).map((diff,i)=>`
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid ${C.line};">
      <div style="padding:12px 6px;font-size:clamp(11px,3vw,12px);color:${C.inkSoft};text-align:center;word-break:keep-all;">${esc(diff.label)}</div>
      <div style="padding:12px 6px;font-size:clamp(11px,3vw,12px);color:${C.inkSoft};opacity:0.5;text-decoration:line-through;text-align:center;">${esc(diff.theirs)}</div>
      <div style="padding:12px 6px;font-size:clamp(11px,3vw,12px);color:${C.primary};font-weight:700;text-align:center;background:${C.primary}08;">${esc(diff.ours)}</div>
    </div>`).join('')}
  </div>
</section>

${d.recipe ? `
<section style="background:${C.paper};padding:48px 20px;text-align:center;">
  <h2 style="font-size:clamp(18px,5vw,22px);font-weight:800;color:${C.ink};margin:0 0 8px;">${esc(d.recipe.title)}</h2>
  <p style="font-size:13px;color:${C.inkSoft};margin:0 0 28px;">${esc(d.recipe.intro)}</p>
  ${d.sectionImages?.recipe ? `<img src="${d.sectionImages.recipe}" alt="${esc(d.recipe.title)}" style="width:100%;max-width:520px;aspect-ratio:4/3;object-fit:cover;border-radius:16px;display:block;margin:0 auto 28px;" />` : ''}
  <div style="max-width:480px;margin:0 auto;text-align:left;">
    ${d.recipe.steps.map((s,i)=>`
    <div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid ${C.line};align-items:start;">
      <div style="width:32px;height:32px;background:${C.primary};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;flex-shrink:0;">${i+1}</div>
      <div><p style="font-weight:700;font-size:14px;color:${C.ink};margin:0 0 4px;">${esc(s.name)}</p>
      <p style="font-size:13px;color:${C.inkSoft};margin:0;line-height:1.6;">${esc(s.detail)}</p></div>
    </div>`).join('')}
    ${d.recipe.tip ? `<div style="margin-top:20px;padding:16px 18px;background:${C.primary}12;border-left:3px solid ${C.primary};border-radius:0 8px 8px 0;"><p style="font-size:10px;font-weight:700;color:${C.deep};margin:0 0 6px;letter-spacing:0.15em;">TIP</p><p style="font-size:13px;color:${C.ink};margin:0;line-height:1.7;">${esc(d.recipe.tip)}</p></div>` : ''}
  </div>
</section>` : ''}

${d.storage ? `
<section style="background:${C.cream};padding:48px 20px;text-align:center;">
  <h2 style="font-size:clamp(18px,5vw,22px);font-weight:800;color:${C.ink};margin:0 0 28px;">${esc(d.storage.title)}</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid ${C.line};border-radius:12px;overflow:hidden;max-width:400px;margin:0 auto 24px;">
    <div style="padding:20px 16px;border-right:1px solid ${C.line};text-align:center;">
      <p style="font-size:10px;color:${C.primary};letter-spacing:0.2em;margin:0 0 8px;font-weight:700;">권장 보관</p>
      <p style="font-size:16px;font-weight:700;color:${C.ink};margin:0;">${esc(d.storage.recommended)}</p>
    </div>
    <div style="padding:20px 16px;text-align:center;">
      <p style="font-size:10px;color:${C.primary};letter-spacing:0.2em;margin:0 0 8px;font-weight:700;">보관 기간</p>
      <p style="font-size:16px;font-weight:700;color:${C.ink};margin:0;">${esc(d.storage.duration)}</p>
    </div>
  </div>
  <div style="max-width:480px;margin:0 auto;text-align:left;">
    ${d.storage.tips.map((t,i)=>`<div style="display:flex;gap:10px;padding:12px 0;border-bottom:1px solid ${C.line};"><span style="color:${C.primary};font-weight:700;flex-shrink:0;">•</span><p style="font-size:13px;color:${C.inkSoft};margin:0;line-height:1.65;">${esc(t)}</p></div>`).join('')}
  </div>
</section>` : ''}

${(d.unusedImages && d.unusedImages.length) ? `<section style="background:${C.cream};padding:40px 20px;">
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-width:560px;margin:0 auto;">${d.unusedImages.map(src=>`<img src="${src}" alt="${esc(d.productName)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:12px;display:block;" />`).join('')}</div>
</section>` : ''}
<section style="background:${C.paper};padding:48px 20px;text-align:center;">
  <h2 style="font-size:clamp(18px,5vw,22px);font-weight:800;color:${C.ink};margin:0 0 8px;">고객 후기</h2>
  <div style="font-size:clamp(28px,7vw,36px);font-weight:900;color:${C.deep};margin:4px 0;">4.9</div>
  <div style="color:#F59E0B;letter-spacing:3px;font-size:14px;margin-bottom:24px;">★★★★★</div>
  <div style="max-width:560px;margin:0 auto;display:grid;gap:12px;">
    ${d.reviews.slice(0,3).map(r=>`
    <div style="background:${C.cream};border-radius:14px;padding:18px 20px;box-shadow:0 2px 6px rgba(0,0,0,0.05);text-align:left;">
      <div style="color:#F59E0B;font-size:12px;margin-bottom:8px;">★★★★★</div>
      <p style="font-size:clamp(13px,3.5vw,14px);color:${C.ink};line-height:1.7;margin:0 0 10px;">${esc(r.text)}</p>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:${C.inkSoft};"><span>${esc(r.author)}</span><span>${esc(r.date)}</span></div>
    </div>`).join('')}
  </div>
</section>

${d.faq && d.faq.length > 0 ? `
<section style="background:${C.cream};padding:48px 20px;text-align:center;">
  <h2 style="font-size:clamp(18px,5vw,22px);font-weight:800;color:${C.ink};margin:0 0 24px;">자주 묻는 질문</h2>
  <div style="max-width:560px;margin:0 auto;text-align:left;">
    ${d.faq.slice(0,4).map((f,i)=>`
    <div style="border-bottom:1px solid ${C.line};padding:18px 0;">
      <div style="display:flex;gap:10px;margin-bottom:8px;">
        <span style="color:${C.primary};font-weight:900;font-size:14px;flex-shrink:0;">Q.</span>
        <p style="font-size:clamp(13px,3.5vw,14px);font-weight:700;color:${C.ink};margin:0;line-height:1.5;">${esc(f.q)}</p>
      </div>
      <p style="font-size:clamp(12px,3.2vw,13px);color:${C.inkSoft};margin:0 0 0 24px;line-height:1.75;">${esc(f.a)}</p>
    </div>`).join('')}
  </div>
</section>` : ''}

<section style="background:${C.ink};color:${C.cream};padding:60px 20px;text-align:center;">
  <p style="font-size:11px;opacity:0.5;letter-spacing:0.15em;margin:0 0 8px;">TODAY ONLY</p>
  <div style="font-size:clamp(40px,10vw,68px);font-weight:900;line-height:1;margin:0 0 8px;color:${C.light};">${comma(d.price.retail)}<span style="font-size:0.26em;margin-left:4px;">원</span></div>
  <p style="font-size:12px;opacity:0.5;margin:0 0 28px;">/ ${esc(d.price.unit)}</p>
  <button style="display:block;width:100%;max-width:320px;margin:0 auto 16px;background:${C.light};color:${C.ink};padding:16px;border-radius:12px;font-size:15px;font-weight:900;border:none;cursor:pointer;letter-spacing:0.15em;">주 문 하 기</button>
  <p style="font-size:11px;opacity:0.4;margin:0;">무료배송 · 당일출고 · 7일이내교환</p>
</section>

<section style="background:${C.deep};color:${C.cream};padding:28px 20px;text-align:center;">
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:24px 40px;max-width:560px;margin:0 auto;">
    ${d.delivery.slice(0,4).map((de,i)=>`
    <div style="min-width:80px;">
      <p ${ce('delivery.'+i+'.label')} style="font-size:10px;opacity:0.5;letter-spacing:0.2em;margin:0 0 5px;">${esc(de.label)}</p>
      <p ${ce('delivery.'+i+'.value')} style="font-size:clamp(12px,3.2vw,13px);font-weight:600;margin:0;">${esc(de.value)}</p>
    </div>`).join('')}
  </div>
</section>

</div>`
}

// ============================================================
// 전통 템플릿
// ============================================================
function renderTraditionalLanding(d: LandingData, p: Preset): string {
  const { colors: C } = p
  const img = d.mainImageUrl
  const css = `<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;700;900&family=Gowun+Batang:wght@400;700&display=swap');
[data-landing] [contenteditable="true"]:focus{outline:2px dashed ${C.primary};outline-offset:3px;background:${C.primary}14;border-radius:4px}
[data-landing] *{box-sizing:border-box;-webkit-text-size-adjust:100%}
</style>`
  const T = { paper:'#F9F0DC', dark:'#2C1A0E', red:'#8B1A1A', gold:'#9A6E2F', line:'#C4A86A', mid:'#E8D9A8' }
  return `${css}
<div data-landing data-template="traditional" style="font-family:'Gowun Batang',serif;color:${T.dark};background:${T.paper};line-height:1.7;-webkit-font-smoothing:antialiased;word-break:keep-all;">

<section style="background:${T.dark};color:${T.paper};padding:56px 20px;text-align:center;position:relative;">
  <div style="border:1px solid ${T.gold}55;max-width:min(360px,90vw);margin:0 auto;padding:28px 20px;">
    <p style="font-size:10px;letter-spacing:0.4em;color:${T.gold};margin:0 0 14px;">${esc(d.brandName)}</p>
    <h1 ${ce('hero.catch')} style="font-family:'Noto Serif KR',serif;font-size:clamp(22px,5.5vw,38px);font-weight:700;line-height:1.3;margin:0 0 18px;letter-spacing:-0.01em;">${esc(d.catchphrase)}</h1>
    <div style="width:36px;height:1px;background:${T.gold};margin:0 auto 18px;"></div>
    <p ${ce('hero.sub')} style="font-size:clamp(13px,3.5vw,14px);line-height:2;opacity:0.85;">${esc(d.subtitle)}</p>
    ${img ? `<div style="margin:22px auto 0;max-width:min(300px,80vw);aspect-ratio:1/1;overflow:hidden;border:1px solid ${T.gold}44;"><img src="${img}" alt="${esc(d.productName)}" style="width:100%;height:100%;object-fit:cover;" /></div>` : ''}
  </div>
</section>

<section style="padding:52px 20px;background:${T.paper};text-align:center;border-bottom:2px solid ${T.line};">
  <p style="font-size:10px;letter-spacing:0.4em;color:${T.red};margin:0 0 10px;">인 사 말</p>
  <p ${ce('intro.quote')} style="font-family:'Noto Serif KR',serif;font-size:clamp(14px,4vw,18px);line-height:2;color:${T.dark};margin:0 auto 16px;max-width:420px;font-style:italic;">"${esc(d.artisanQuote)}"</p>
  <p style="font-size:12px;color:${T.gold};">— ${esc(d.artisanName)}</p>
</section>

<section style="padding:52px 20px;background:${T.paper};text-align:center;border-bottom:2px solid ${T.line};">
  <p style="font-size:10px;letter-spacing:0.4em;color:${T.red};margin:0 0 10px;">산 지</p>
  <h2 ${ce('origin.location')} style="font-family:'Noto Serif KR',serif;font-size:clamp(26px,6.5vw,34px);font-weight:700;color:${T.dark};margin:0 0 18px;">${esc(d.originLocation)}</h2>
  <div style="width:50px;height:2px;background:${T.gold};margin:0 auto 22px;"></div>
  <p ${ce('origin.story')} style="font-size:clamp(13px,3.5vw,14px);line-height:2;max-width:460px;margin:0 auto 32px;color:${T.dark};">${esc(d.originStory)}</p>
  ${d.sectionImages?.origin ? `<img src="${d.sectionImages.origin}" alt="${esc(d.originLocation)}" style="width:100%;max-width:560px;aspect-ratio:16/9;object-fit:cover;border-radius:14px;display:block;margin:0 auto 28px;" />` : ''}
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0;">
    ${d.originStats.filter(s=>s.value?.trim()).slice(0,4).map((s,i)=>`
    <div style="padding:20px 22px;border:1px solid ${T.line}55;${i>0?'border-left:none':''}">
      <div style="font-family:'Noto Serif KR',serif;font-size:clamp(24px,6vw,30px);font-weight:700;color:${T.red};">${esc(s.value)}<span style="font-size:13px;">${esc(s.unit)}</span></div>
      <div style="font-size:10px;letter-spacing:0.2em;color:${T.gold};margin-top:5px;">${esc(s.label)}</div>
      <div style="font-size:11px;color:${T.dark};opacity:0.6;margin-top:4px;line-height:1.4;">${esc(s.desc)}</div>
    </div>`).join('')}
  </div>
</section>

<section style="padding:52px 20px;background:#F2E8CC;text-align:center;">
  <p style="font-size:10px;letter-spacing:0.4em;color:${T.red};margin:0 0 10px;">이 야 기</p>
  <h2 ${ce('story.title')} style="font-family:'Noto Serif KR',serif;font-size:clamp(22px,5.5vw,28px);font-weight:700;color:${T.dark};margin:0 0 28px;">${esc(d.productName)}의 하루</h2>
  ${d.sectionImages?.story ? `<img src="${d.sectionImages.story}" alt="${esc(d.productName)}" style="width:100%;max-width:520px;aspect-ratio:4/3;object-fit:cover;border-radius:14px;display:block;margin:0 auto 24px;" />` : ''}
  <div ${ce('story.body')} style="font-size:clamp(13px,3.5vw,14px);line-height:2.1;max-width:480px;margin:0 auto;text-align:left;color:${T.dark};">${esc(d.story).split('\n').filter(Boolean).map(x=>`<p style="margin:0 0 16px;">${x}</p>`).join('')}</div>
</section>

<section style="padding:52px 20px;background:${T.paper};text-align:center;">
  <p style="font-size:10px;letter-spacing:0.4em;color:${T.red};margin:0 0 10px;">특 징</p>
  <h2 style="font-family:'Noto Serif KR',serif;font-size:clamp(22px,5.5vw,28px);font-weight:700;color:${T.dark};margin:0 0 32px;">무엇이 다른가</h2>
  ${d.features.slice(0,4).map((f,i)=>`
  <div style="max-width:480px;margin:0 auto 20px;padding:22px 24px;border:1px solid ${T.line}66;text-align:left;">
    <div style="display:flex;gap:14px;align-items:start;">
      <span style="font-family:'Noto Serif KR',serif;font-size:22px;font-weight:300;color:${T.red};line-height:1;flex-shrink:0;">${['一','二','三','四'][i]}</span>
      <div>
        <h3 ${ce('features.'+i+'.title')} style="font-size:clamp(14px,3.8vw,16px);font-weight:700;color:${T.dark};margin:0 0 6px;">${esc(f.title)}</h3>
        <p ${ce('features.'+i+'.desc')} style="font-size:clamp(12px,3.2vw,13px);color:${T.dark};opacity:0.8;margin:0;line-height:1.8;">${esc(f.desc)}</p>
      </div>
    </div>
  </div>`).join('')}
</section>

<section style="padding:52px 20px;background:#F2E8CC;text-align:center;">
  <p style="font-size:10px;letter-spacing:0.4em;color:${T.red};margin:0 0 10px;">비 교</p>
  <h2 style="font-family:'Noto Serif KR',serif;font-size:clamp(22px,5.5vw,28px);font-weight:700;color:${T.dark};margin:0 0 28px;">무엇이 다른가</h2>
  <div style="border:1px solid ${T.line}88;overflow:hidden;max-width:480px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:${T.line}33;">
      <div style="padding:10px 6px;font-size:10px;color:${T.gold};text-align:center;letter-spacing:0.1em;">항목</div>
      <div style="padding:10px 6px;font-size:10px;color:${T.gold};text-align:center;letter-spacing:0.1em;">일반</div>
      <div style="padding:10px 6px;font-size:10px;color:${T.red};text-align:center;letter-spacing:0.1em;font-weight:700;">당사</div>
    </div>
    ${d.differences.slice(0,5).map((diff,i)=>`
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid ${T.line}55;">
      <div style="padding:12px 6px;font-size:clamp(11px,3vw,12px);text-align:center;color:${T.dark};">${esc(diff.label)}</div>
      <div style="padding:12px 6px;font-size:clamp(11px,3vw,12px);text-align:center;color:${T.dark};opacity:0.4;text-decoration:line-through;">${esc(diff.theirs)}</div>
      <div style="padding:12px 6px;font-size:clamp(11px,3vw,12px);text-align:center;color:${T.red};font-weight:700;">${esc(diff.ours)}</div>
    </div>`).join('')}
  </div>
</section>

${d.recipe ? `
<section style="padding:52px 20px;background:${T.paper};text-align:center;">
  <p style="font-size:10px;letter-spacing:0.4em;color:${T.red};margin:0 0 10px;">조 리 법</p>
  <h2 style="font-family:'Noto Serif KR',serif;font-size:clamp(20px,5vw,26px);font-weight:700;color:${T.dark};margin:0 0 24px;">${esc(d.recipe.title)}</h2>
  <div style="max-width:480px;margin:0 auto;text-align:left;">
    ${d.recipe.steps.map((s,i)=>`
    <div style="padding:18px 0;border-bottom:1px solid ${T.line}44;">
      <p style="font-family:'Noto Serif KR',serif;font-size:10px;color:${T.red};margin:0 0 6px;letter-spacing:0.2em;">${['一','二','三','四','五'][i] || i+1}</p>
      <p style="font-weight:700;font-size:clamp(13px,3.5vw,15px);color:${T.dark};margin:0 0 6px;">${esc(s.name)}</p>
      <p style="font-size:clamp(12px,3.2vw,13px);color:${T.dark};opacity:0.75;margin:0;line-height:1.75;">${esc(s.detail)}</p>
    </div>`).join('')}
    ${d.recipe.tip ? `<div style="margin-top:20px;padding:16px 18px;background:${T.line}22;border-left:3px solid ${T.gold};"><p style="font-size:10px;letter-spacing:0.2em;color:${T.gold};margin:0 0 6px;">TIP</p><p style="font-size:13px;color:${T.dark};margin:0;line-height:1.75;">${esc(d.recipe.tip)}</p></div>` : ''}
  </div>
</section>` : ''}

${(d.unusedImages && d.unusedImages.length) ? `<section style="padding:44px 20px;background:${T.dark};">
  <p style="font-size:10px;letter-spacing:0.4em;color:${T.gold};margin:0 0 20px;text-align:center;">사 진</p>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-width:520px;margin:0 auto;">${d.unusedImages.map(src=>`<img src="${src}" alt="${esc(d.productName)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />`).join('')}</div>
</section>` : ''}
<section style="padding:52px 20px;background:#F2E8CC;text-align:center;">
  <p style="font-size:10px;letter-spacing:0.4em;color:${T.red};margin:0 0 10px;">후 기</p>
  <h2 style="font-family:'Noto Serif KR',serif;font-size:clamp(22px,5.5vw,28px);font-weight:700;color:${T.dark};margin:0 0 28px;">써보신 분들의 말</h2>
  ${d.reviews.slice(0,3).map(r=>`
  <div style="max-width:480px;margin:0 auto 20px;padding:24px;border:1px solid ${T.line}66;text-align:left;">
    <div style="color:${T.gold};letter-spacing:2px;font-size:13px;margin-bottom:12px;">★★★★★</div>
    <p style="font-size:clamp(13px,3.5vw,14px);color:${T.dark};line-height:1.9;margin:0 0 12px;">"${esc(r.text)}"</p>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:${T.gold};"><span>${esc(r.author)}</span><span>${esc(r.date)}</span></div>
  </div>`).join('')}
</section>

${d.faq && d.faq.length > 0 ? `
<section style="padding:52px 20px;background:${T.paper};text-align:center;">
  <p style="font-size:10px;letter-spacing:0.4em;color:${T.red};margin:0 0 10px;">문 답</p>
  <h2 style="font-family:'Noto Serif KR',serif;font-size:clamp(22px,5.5vw,28px);font-weight:700;color:${T.dark};margin:0 0 28px;">자주 묻는 질문</h2>
  <div style="max-width:480px;margin:0 auto;text-align:left;">
    ${d.faq.slice(0,4).map((f,i)=>`
    <div style="padding:18px 0;border-bottom:1px solid ${T.line}44;">
      <div style="display:flex;gap:10px;margin-bottom:8px;">
        <span style="color:${T.red};font-weight:700;font-size:14px;flex-shrink:0;">問</span>
        <p style="font-size:clamp(13px,3.5vw,14px);font-weight:700;color:${T.dark};margin:0;line-height:1.5;">${esc(f.q)}</p>
      </div>
      <div style="display:flex;gap:10px;">
        <span style="color:${T.gold};font-weight:700;font-size:14px;flex-shrink:0;">答</span>
        <p style="font-size:clamp(12px,3.2vw,13px);color:${T.dark};opacity:0.75;margin:0;line-height:1.75;">${esc(f.a)}</p>
      </div>
    </div>`).join('')}
  </div>
</section>` : ''}

<section style="background:${T.dark};color:${T.paper};padding:60px 20px;text-align:center;">
  <p style="font-size:10px;letter-spacing:0.5em;color:${T.gold};margin:0 0 18px;">가 격</p>
  <div style="font-family:'Noto Serif KR',serif;font-size:clamp(44px,11vw,72px);font-weight:300;line-height:1;margin:0 0 8px;color:${T.paper};">${comma(d.price.retail)}<span style="font-size:0.28em;color:${T.gold};margin-left:8px;">원</span></div>
  <p style="font-size:12px;color:${T.gold};opacity:0.8;margin:0 0 32px;">/ ${esc(d.price.unit)}</p>
  <div style="width:160px;height:1px;background:${T.gold}55;margin:0 auto 32px;"></div>
  <button style="display:inline-block;background:transparent;color:${T.paper};border:1px solid ${T.gold};padding:15px 48px;font-family:'Noto Serif KR',serif;font-size:14px;letter-spacing:0.4em;cursor:pointer;">주 문 하 기</button>
  <p style="font-size:11px;color:${T.gold};opacity:0.6;margin:18px 0 0;">무료 배송 · 당일 출고 · 7일 이내 교환</p>
</section>

<section style="background:${T.mid};padding:36px 20px;text-align:center;">
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:28px 44px;max-width:480px;margin:0 auto;">
    ${d.delivery.slice(0,4).map(de=>`
    <div>
      <p style="font-size:10px;letter-spacing:0.3em;color:${T.red};margin:0 0 6px;">${esc(de.label)}</p>
      <p style="font-size:clamp(13px,3.5vw,14px);font-weight:700;color:${T.dark};margin:0;">${esc(de.value)}</p>
    </div>`).join('')}
  </div>
</section>

</div>`
}

// ============================================================
// 비즈니스 템플릿
// ============================================================
function renderBusinessLanding(d: LandingData, p: Preset): string {
  const { colors: C } = p
  const img = d.mainImageUrl
  const css = `<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
[data-landing] [contenteditable="true"]:focus{outline:2px dashed ${C.primary};outline-offset:3px;}
[data-landing] *{box-sizing:border-box;-webkit-text-size-adjust:100%}
</style>`
  return `${css}
<div data-landing data-template="business" style="font-family:'Pretendard Variable',sans-serif;color:#1A202C;background:#F7F8FA;line-height:1.6;-webkit-font-smoothing:antialiased;word-break:keep-all;">

<section style="background:white;padding:0;border-bottom:3px solid ${C.primary};">
  <div style="background:${C.primary};padding:10px 20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
    <span style="font-size:12px;font-weight:700;color:white;letter-spacing:0.15em;">${esc(d.brandName)}</span>
    <span style="width:1px;height:12px;background:rgba(255,255,255,0.4);flex-shrink:0;"></span>
    <span style="font-size:11px;color:rgba(255,255,255,0.8);">공식 제품 안내서</span>
  </div>
  <div style="padding:32px 20px;display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:center;">
    ${img ? `<div style="width:min(200px,80vw);height:min(200px,80vw);border-radius:8px;overflow:hidden;border:1px solid #E2E8F0;flex-shrink:0;"><img src="${img}" alt="${esc(d.productName)}" style="width:100%;height:100%;object-fit:contain;" /></div>` : ''}
    <div style="flex:1;min-width:180px;">
      <p style="font-size:11px;font-weight:700;color:${C.primary};letter-spacing:0.15em;margin:0 0 6px;">PRODUCT</p>
      <h1 ${ce('hero.catch')} style="font-size:clamp(20px,5vw,30px);font-weight:900;color:#1A202C;margin:0 0 8px;line-height:1.2;">${esc(d.productName)}</h1>
      <p ${ce('hero.sub')} style="font-size:clamp(12px,3.2vw,13px);color:#718096;margin:0 0 16px;line-height:1.6;">${esc(d.subtitle)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${d.features.slice(0,3).map(f=>`<span style="background:${C.primary}15;color:${C.primary};padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;">${esc(f.title)}</span>`).join('')}
      </div>
    </div>
  </div>
</section>

<section style="background:white;padding:28px 20px;margin-top:12px;border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;">
  <h2 style="font-size:13px;font-weight:700;color:${C.primary};letter-spacing:0.1em;margin:0 0 14px;">📍 원산지 정보</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:14px;">
    <div style="padding:14px;background:#F7F8FA;border-radius:8px;border-left:3px solid ${C.primary};">
      <p style="font-size:10px;color:#718096;margin:0 0 4px;">원산지</p>
      <p ${ce('origin.location')} style="font-size:clamp(14px,3.8vw,16px);font-weight:700;color:#1A202C;margin:0;">${esc(d.originLocation)}</p>
    </div>
    ${d.originStats.filter(s=>s.value?.trim()).slice(0,3).map(s=>`
    <div style="padding:14px;background:#F7F8FA;border-radius:8px;border-left:3px solid ${C.primary};">
      <p style="font-size:10px;color:#718096;margin:0 0 4px;">${esc(s.label)}</p>
      <p style="font-size:clamp(14px,3.8vw,16px);font-weight:700;color:#1A202C;margin:0;">${esc(s.value)}${esc(s.unit)}</p>
    </div>`).join('')}
  </div>
  <p ${ce('origin.story')} style="font-size:clamp(12px,3.2vw,13px);color:#4A5568;line-height:1.8;margin:0 0 20px;">${esc(d.originStory)}</p>
  ${d.sectionImages?.origin ? `<img src="${d.sectionImages.origin}" alt="${esc(d.originLocation)}" style="width:100%;max-width:560px;aspect-ratio:16/9;object-fit:cover;border-radius:12px;display:block;margin:0 auto;" />` : ''}
</section>

<section style="background:white;padding:28px 20px;border-bottom:1px solid #E2E8F0;">
  <h2 style="font-size:13px;font-weight:700;color:${C.primary};letter-spacing:0.1em;margin:0 0 14px;">📖 상품 스토리</h2>
  ${d.sectionImages?.story ? `<img src="${d.sectionImages.story}" alt="${esc(d.productName)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;display:block;margin:0 0 18px;" />` : ''}
  <div style="font-size:clamp(12px,3.2vw,13px);color:#4A5568;line-height:1.85;">${esc(d.story).split('\n').filter(Boolean).map(x=>`<p style="margin:0 0 12px;">${x}</p>`).join('')}</div>
</section>

<section style="background:white;padding:28px 20px;border-bottom:1px solid #E2E8F0;">
  <h2 style="font-size:13px;font-weight:700;color:${C.primary};letter-spacing:0.1em;margin:0 0 14px;">✅ 주요 특징</h2>
  ${d.features.slice(0,5).map((f,i)=>`
  <div style="display:flex;align-items:start;gap:12px;padding:11px 0;border-bottom:1px solid #EDF2F7;">
    <div style="width:20px;height:20px;background:${C.primary};border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
      <span style="color:white;font-size:10px;font-weight:700;">✓</span>
    </div>
    <div>
      <p ${ce('features.'+i+'.title')} style="font-size:clamp(13px,3.5vw,14px);font-weight:700;color:#1A202C;margin:0 0 2px;">${esc(f.title)}</p>
      <p ${ce('features.'+i+'.desc')} style="font-size:clamp(11px,3vw,12px);color:#718096;margin:0;line-height:1.6;">${esc(f.desc)}</p>
    </div>
  </div>`).join('')}
</section>

<section style="background:white;padding:28px 20px;border-bottom:1px solid #E2E8F0;">
  <h2 style="font-size:13px;font-weight:700;color:${C.primary};letter-spacing:0.1em;margin:0 0 14px;">📊 비교 분석</h2>
  <div style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:#F7F8FA;">
      <div style="padding:10px 6px;text-align:left;font-size:11px;font-weight:600;color:#718096;border-bottom:1px solid #E2E8F0;">항목</div>
      <div style="padding:10px 6px;text-align:center;font-size:11px;font-weight:600;color:#718096;border-bottom:1px solid #E2E8F0;">일반 제품</div>
      <div style="padding:10px 6px;text-align:center;font-size:11px;font-weight:700;color:${C.primary};border-bottom:1px solid #E2E8F0;">당사 제품</div>
    </div>
    ${d.differences.slice(0,5).map((diff,i)=>`
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid #EDF2F7;">
      <div style="padding:11px 6px;font-size:clamp(11px,3vw,12px);color:#4A5568;">${esc(diff.label)}</div>
      <div style="padding:11px 6px;font-size:clamp(11px,3vw,12px);color:#A0AEC0;text-align:center;text-decoration:line-through;">${esc(diff.theirs)}</div>
      <div style="padding:11px 6px;font-size:clamp(11px,3vw,12px);color:${C.primary};font-weight:600;text-align:center;background:${C.primary}08;">${esc(diff.ours)}</div>
    </div>`).join('')}
  </div>
</section>

${d.specs ? `
<section style="background:white;padding:28px 20px;border-bottom:1px solid #E2E8F0;">
  <h2 style="font-size:13px;font-weight:700;color:${C.primary};letter-spacing:0.1em;margin:0 0 14px;">📋 제품 사양</h2>
  <table style="width:100%;border-collapse:collapse;border-top:2px solid #1A202C;">
    ${d.specs.items.map((it,i)=>`
    <tr style="border-bottom:1px solid #EDF2F7;">
      <td style="padding:12px 6px;font-size:clamp(11px,3vw,12px);color:#718096;width:110px;vertical-align:top;">${esc(it.key)}</td>
      <td style="padding:12px 0 12px 8px;font-size:clamp(11px,3vw,13px);color:#1A202C;font-weight:500;line-height:1.6;">${esc(it.value)}</td>
    </tr>`).join('')}
  </table>
</section>` : ''}

${(d.unusedImages && d.unusedImages.length) ? `<section style="background:#F7F8FA;padding:24px 20px;border-bottom:1px solid #E2E8F0;">
  <h2 style="font-size:13px;font-weight:700;color:${C.primary};letter-spacing:0.1em;margin:0 0 14px;">📷 제품 사진</h2>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">${d.unusedImages.map(src=>`<img src="${src}" alt="${esc(d.productName)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:8px;display:block;" />`).join('')}</div>
</section>` : ''}
<section style="background:white;padding:28px 20px;border-bottom:1px solid #E2E8F0;">
  <h2 style="font-size:13px;font-weight:700;color:${C.primary};letter-spacing:0.1em;margin:0 0 14px;">💬 구매 후기</h2>
  ${d.reviews.slice(0,3).map(r=>`
  <div style="padding:14px;background:#F7F8FA;border-radius:8px;margin-bottom:10px;border-left:3px solid ${C.primary};">
    <div style="color:#F59E0B;font-size:11px;margin-bottom:5px;">★★★★★</div>
    <p style="font-size:clamp(12px,3.2vw,13px);color:#4A5568;line-height:1.7;margin:0 0 6px;">"${esc(r.text)}"</p>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#A0AEC0;">
      <span>${esc(r.author)}</span><span>${esc(r.date)}</span>
    </div>
  </div>`).join('')}
</section>

${d.faq && d.faq.length > 0 ? `
<section style="background:white;padding:28px 20px;border-bottom:1px solid #E2E8F0;">
  <h2 style="font-size:13px;font-weight:700;color:${C.primary};letter-spacing:0.1em;margin:0 0 14px;">❓ 자주 묻는 질문</h2>
  ${d.faq.slice(0,4).map((f,i)=>`
  <div style="padding:14px;background:#F7F8FA;border-radius:8px;margin-bottom:8px;">
    <p style="font-size:clamp(12px,3.2vw,13px);font-weight:700;color:#1A202C;margin:0 0 6px;">Q. ${esc(f.q)}</p>
    <p style="font-size:clamp(11px,3vw,12px);color:#718096;margin:0;line-height:1.65;">A. ${esc(f.a)}</p>
  </div>`).join('')}
</section>` : ''}

<section style="background:${C.ink};color:${C.cream};padding:36px 20px;">
  <div style="max-width:480px;margin:0 auto;">
    <h2 style="font-size:13px;font-weight:700;letter-spacing:0.1em;color:${C.light};margin:0 0 18px;opacity:0.8;">💰 가격 안내</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
      <div style="padding:14px;background:rgba(255,255,255,0.06);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
        <p style="font-size:10px;opacity:0.6;margin:0 0 5px;letter-spacing:0.1em;">소매가</p>
        <p style="font-size:clamp(18px,4.5vw,22px);font-weight:900;color:${C.light};margin:0;">${comma(d.price.retail)}<span style="font-size:11px;">원</span></p>
      </div>
      <div style="padding:14px;background:rgba(255,255,255,0.06);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
        <p style="font-size:10px;opacity:0.6;margin:0 0 5px;letter-spacing:0.1em;">단위</p>
        <p style="font-size:clamp(18px,4.5vw,22px);font-weight:900;color:${C.light};margin:0;">${esc(d.price.unit)}</p>
      </div>
    </div>
    <button style="display:block;width:100%;background:${C.primary};color:white;padding:15px;border-radius:8px;font-size:14px;font-weight:700;border:none;cursor:pointer;letter-spacing:0.1em;">구매 문의하기</button>
  </div>
</section>

<section style="background:#1A202C;color:#718096;padding:22px 20px;">
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:18px 36px;">
    ${d.delivery.slice(0,4).map(de=>`
    <div style="text-align:center;">
      <p style="font-size:10px;letter-spacing:0.1em;margin:0 0 3px;opacity:0.7;">${esc(de.label)}</p>
      <p style="font-size:clamp(12px,3.2vw,13px);font-weight:600;color:#CBD5E0;margin:0;">${esc(de.value)}</p>
    </div>`).join('')}
  </div>
</section>

</div>`
}

// ============================================================
// 감성 템플릿
// ============================================================
function renderEmotionalLanding(d: LandingData, p: Preset): string {
  const { colors: C } = p
  const img = d.mainImageUrl
  const css = `<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;700;900&family=Gowun+Batang:wght@400;700&display=swap');
[data-landing] [contenteditable="true"]:focus{outline:2px dashed ${C.primary};outline-offset:3px;background:${C.primary}14;border-radius:4px}
[data-landing] *{box-sizing:border-box;-webkit-text-size-adjust:100%}
</style>`
  return `${css}
<div data-landing data-template="emotional" style="font-family:'Gowun Batang',serif;color:white;background:#0D0D0D;line-height:1.7;-webkit-font-smoothing:antialiased;word-break:keep-all;">

<section style="position:relative;min-height:80vh;display:flex;align-items:flex-end;background:#0D0D0D;overflow:hidden;">
  ${img ? `<div style="position:absolute;inset:0;background-size:cover;background-position:center;background-image:url('${img}');opacity:0.5;"></div>` : ''}
  <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.85) 40%, transparent 100%);"></div>
  <div style="position:relative;z-index:2;padding:40px 20px;width:100%;">
    <p ${ce('hero.brand')} style="font-family:'Noto Serif KR',serif;font-size:11px;letter-spacing:0.5em;color:${C.primary};margin:0 0 18px;">${esc(d.brandName)}</p>
    <h1 ${ce('hero.catch')} style="font-family:'Noto Serif KR',serif;font-size:clamp(28px,7vw,52px);font-weight:300;color:white;line-height:1.2;margin:0 0 20px;letter-spacing:-0.01em;">${esc(d.catchphrase)}</h1>
    <div style="width:44px;height:1px;background:${C.primary};margin:0 0 18px;"></div>
    <p ${ce('hero.sub')} style="font-size:clamp(13px,3.5vw,15px);color:rgba(255,255,255,0.8);line-height:1.9;max-width:360px;">${esc(d.subtitle)}</p>
  </div>
</section>

<section style="background:#111;padding:60px 20px;text-align:center;">
  <p ${ce('intro.quote')} style="font-family:'Gowun Batang',serif;font-size:clamp(15px,4vw,21px);line-height:2;color:rgba(255,255,255,0.9);max-width:420px;margin:0 auto 20px;font-style:italic;">"${esc(d.artisanQuote)}"</p>
  <p ${ce('intro.sig')} style="font-size:12px;color:${C.primary};letter-spacing:0.1em;">— ${esc(d.artisanName)}</p>
</section>

<section style="background:#0A0A0A;padding:60px 20px;">
  ${img ? `<div style="width:100%;aspect-ratio:16/9;overflow:hidden;margin-bottom:44px;"><img src="${img}" alt="${esc(d.productName)}" style="width:100%;height:100%;object-fit:cover;" /></div>` : ''}
  <p style="font-size:11px;letter-spacing:0.4em;color:${C.primary};margin:0 0 10px;">ORIGIN</p>
  <h2 ${ce('origin.location')} style="font-family:'Noto Serif KR',serif;font-size:clamp(26px,6.5vw,42px);font-weight:300;color:white;margin:0 0 20px;line-height:1.2;">${esc(d.originLocation)}</h2>
  <p ${ce('origin.story')} style="font-size:clamp(13px,3.5vw,15px);color:rgba(255,255,255,0.75);line-height:2;max-width:480px;">${esc(d.originStory)}</p>
  ${d.sectionImages?.origin ? `<img src="${d.sectionImages.origin}" alt="${esc(d.originLocation)}" style="width:100%;max-width:600px;aspect-ratio:16/9;object-fit:cover;border-radius:16px;display:block;margin:28px auto 0;box-shadow:0 16px 40px rgba(0,0,0,0.4);" />` : ''}
  <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:36px;">
    ${d.originStats.filter(s=>s.value?.trim()).slice(0,4).map((s,i)=>`
    <div style="flex:1;min-width:80px;padding:20px;border:1px solid rgba(255,255,255,0.12);">
      <div ${ce('origin.stat.'+i+'.value')} style="font-family:'Noto Serif KR',serif;font-size:clamp(22px,5.5vw,30px);font-weight:300;color:white;line-height:1;">${esc(s.value)}<span ${ce('origin.stat.'+i+'.unit')} style="font-size:13px;color:${C.primary};">${esc(s.unit)}</span></div>
      <div ${ce('origin.stat.'+i+'.label')} style="font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:0.2em;margin-top:6px;">${esc(s.label)}</div>
    </div>`).join('')}
  </div>
</section>

<section style="background:#111;padding:60px 20px;">
  <p style="font-size:11px;letter-spacing:0.4em;color:${C.primary};margin:0 0 36px;">STORY</p>
  ${d.sectionImages?.story ? `<img src="${d.sectionImages.story}" alt="${esc(d.productName)}" style="width:100%;max-width:560px;aspect-ratio:4/3;object-fit:cover;border-radius:16px;display:block;margin:0 auto 28px;box-shadow:0 16px 40px rgba(0,0,0,0.4);" />` : ''}
  <div ${ce('story.body')} style="font-size:clamp(15px,4vw,19px);color:rgba(255,255,255,0.85);line-height:2.1;font-weight:300;">${esc(d.story).split('\n').filter(Boolean).map(x=>`<p style="margin:0 0 22px;">${x}</p>`).join('')}</div>
</section>

<section style="background:#0A0A0A;padding:60px 20px;">
  <p style="font-size:11px;letter-spacing:0.4em;color:${C.primary};margin:0 0 44px;">WHY</p>
  ${d.features.slice(0,4).map((f,i)=>`
  <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
    <p style="font-family:'Noto Serif KR',serif;font-size:10px;letter-spacing:0.3em;color:${C.primary};margin:0 0 8px;">0${i+1}</p>
    <h3 ${ce('features.'+i+'.title')} style="font-family:'Noto Serif KR',serif;font-size:clamp(17px,4.5vw,20px);font-weight:400;color:white;margin:0 0 8px;">${esc(f.title)}</h3>
    <p ${ce('features.'+i+'.desc')} style="font-size:clamp(13px,3.5vw,14px);color:rgba(255,255,255,0.65);line-height:1.9;margin:0;">${esc(f.desc)}</p>
  </div>`).join('')}
</section>

<section style="background:#111;padding:60px 20px;">
  <p style="font-size:11px;letter-spacing:0.4em;color:${C.primary};margin:0 0 24px;">COMPARE</p>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.15);margin-bottom:4px;">
    <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:0.1em;">항목</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-align:center;">일반</div>
    <div style="font-size:10px;color:${C.primary};letter-spacing:0.1em;text-align:right;font-weight:700;">당사</div>
  </div>
  ${d.differences.slice(0,5).map((diff,i)=>`
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:1px solid rgba(255,255,255,0.06);padding:14px 0;">
    <div ${ce('diff.'+i+'.label')} style="font-size:clamp(11px,3vw,13px);color:rgba(255,255,255,0.75);">${esc(diff.label)}</div>
    <div ${ce('diff.'+i+'.theirs')} style="font-size:clamp(11px,3vw,13px);color:rgba(255,255,255,0.3);text-decoration:line-through;text-align:center;">${esc(diff.theirs)}</div>
    <div ${ce('diff.'+i+'.ours')} style="font-size:clamp(11px,3vw,13px);color:${C.primary};font-weight:700;text-align:right;">${esc(diff.ours)}</div>
  </div>`).join('')}
</section>

${d.recipe ? `
<section style="background:#0A0A0A;padding:60px 20px;">
  <p style="font-size:11px;letter-spacing:0.4em;color:${C.primary};margin:0 0 20px;">RECIPE</p>
  <h2 ${ce('recipe.title')} style="font-family:'Noto Serif KR',serif;font-size:clamp(22px,5.5vw,30px);font-weight:300;color:white;margin:0 0 36px;">${esc(d.recipe.title)}</h2>
  ${d.recipe.steps.map((s,i)=>`
  <div style="display:flex;gap:16px;padding:18px 0;border-bottom:1px solid rgba(255,255,255,0.07);">
    <div style="width:28px;height:28px;border:1px solid ${C.primary}88;border-radius:50%;display:flex;align-items:center;justify-content:center;color:${C.primary};font-size:12px;flex-shrink:0;">${i+1}</div>
    <div>
      <p ${ce('recipe.step.'+i+'.name')} style="font-size:clamp(13px,3.5vw,15px);font-weight:600;color:white;margin:0 0 4px;">${esc(s.name)}</p>
      <p ${ce('recipe.step.'+i+'.detail')} style="font-size:clamp(12px,3.2vw,13px);color:rgba(255,255,255,0.6);margin:0;line-height:1.7;">${esc(s.detail)}</p>
    </div>
  </div>`).join('')}
</section>` : ''}

${(d.unusedImages && d.unusedImages.length) ? `<section style="background:#0a0a0a;padding:8px 8px 0;">
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">${d.unusedImages.map(src=>`<img src="${src}" alt="${esc(d.productName)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;border-radius:4px;" />`).join('')}</div>
</section>` : ''}
<section style="background:#111;padding:60px 20px;">
  <p style="font-size:11px;letter-spacing:0.4em;color:${C.primary};margin:0 0 32px;">REVIEWS</p>
  ${d.reviews.slice(0,3).map((r,i)=>`
  <div style="padding:28px 0;border-bottom:1px solid rgba(255,255,255,0.07);">
    <div style="color:${C.primary};letter-spacing:3px;font-size:13px;margin-bottom:14px;">★★★★★</div>
    <p ${ce('review.'+i+'.text')} style="font-size:clamp(14px,3.8vw,16px);color:rgba(255,255,255,0.85);line-height:2;margin:0 0 14px;font-style:italic;">"${esc(r.text)}"</p>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.4);">
      <span ${ce('review.'+i+'.author')}>${esc(r.author)}</span>
      <span ${ce('review.'+i+'.date')}>${esc(r.date)}</span>
    </div>
  </div>`).join('')}
</section>

${d.faq && d.faq.length > 0 ? `
<section style="background:#0A0A0A;padding:60px 20px;">
  <p style="font-size:11px;letter-spacing:0.4em;color:${C.primary};margin:0 0 32px;">FAQ</p>
  ${d.faq.slice(0,4).map((f,i)=>`
  <div style="padding:20px 0;border-bottom:1px solid rgba(255,255,255,0.07);">
    <p ${ce('faq.'+i+'.q')} style="font-size:clamp(13px,3.5vw,14px);font-weight:600;color:rgba(255,255,255,0.85);margin:0 0 8px;">${esc(f.q)}</p>
    <p ${ce('faq.'+i+'.a')} style="font-size:clamp(12px,3.2vw,13px);color:rgba(255,255,255,0.55);margin:0;line-height:1.8;">${esc(f.a)}</p>
  </div>`).join('')}
</section>` : ''}

<section style="background:${C.heroGrad};padding:68px 20px;text-align:center;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%, rgba(255,255,255,0.08), transparent 70%);"></div>
  <div style="position:relative;z-index:2;">
    <p style="font-size:11px;letter-spacing:0.4em;color:rgba(255,255,255,0.6);margin:0 0 20px;">TODAY</p>
    <div ${ce('cta.price')} style="font-family:'Noto Serif KR',serif;font-size:clamp(48px,12vw,80px);font-weight:300;color:white;line-height:1;margin:0 0 8px;">${comma(d.price.retail)}<span style="font-size:0.24em;margin-left:8px;color:${C.primary};">원</span></div>
    <p ${ce('cta.unit')} style="font-size:12px;color:rgba(255,255,255,0.6);margin:0 0 36px;">/ ${esc(d.price.unit)}</p>
    <button style="display:inline-block;background:transparent;color:white;border:1px solid rgba(255,255,255,0.5);padding:16px 52px;font-family:'Noto Serif KR',serif;font-size:14px;letter-spacing:0.4em;cursor:pointer;">주 문 하 기</button>
    <p style="font-size:11px;color:rgba(255,255,255,0.4);margin:16px 0 0;">무료 배송 · 당일 출고 · 7일 이내 교환</p>
  </div>
</section>

<section style="background:#080808;padding:32px 20px;text-align:center;">
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:24px 44px;">
    ${d.delivery.slice(0,4).map((de,i)=>`
    <div>
      <p ${ce('delivery.'+i+'.label')} style="font-size:10px;letter-spacing:0.2em;color:rgba(255,255,255,0.5);margin:0 0 6px;">${esc(de.label)}</p>
      <p ${ce('delivery.'+i+'.value')} style="font-size:clamp(12px,3.2vw,14px);color:rgba(255,255,255,0.85);font-weight:600;margin:0;">${esc(de.value)}</p>
    </div>`).join('')}
  </div>
  <p ${ce('seal.brand')} style="font-size:11px;margin:24px 0 0;font-family:'Noto Serif KR',serif;letter-spacing:0.2em;color:rgba(255,255,255,0.35);">${esc(d.brandName)}</p>
</section>

</div>`
}

export function listPresets() {
  return (Object.keys(PRESETS) as PresetKey[]).map(key => ({
    key,
    name: PRESETS[key].name,
    description: PRESETS[key].description,
  }))
}
