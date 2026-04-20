// 상세페이지 템플릿 엔진 v2
// 1개 엔진 + 5개 프리셋(food/health/goods/craft/misc) + 섹션 블록 조합
// 모든 텍스트는 contenteditable="true" 로 편집 가능

// ============================================================
// 타입 정의
// ============================================================

export type PresetKey = 'gold' | 'dark' | 'blue' | 'red' | 'pink' | 'white'

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
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','reviews','info','faq','cta','ship','seal'],
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
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','reviews','info','faq','cta','ship','seal'],
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
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','reviews','info','faq','cta','ship','seal'],
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
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','reviews','info','faq','cta','ship','seal'],
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
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','reviews','info','faq','cta','ship','seal'],
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
    sections: ['intro','hero','origin','story','features','keynum','compare','recipe','storage','reviews','info','faq','cta','ship','seal'],
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
    <h1 ${ce('hero.catch')} style="font-family:${F.serif};color:${C.cream};font-weight:300;font-size:52px;line-height:1.05;letter-spacing:-0.02em;margin:0 0 28px;">${esc(d.catchphrase)}</h1>
    <div style="width:40px;height:1px;background:${C.light};margin:0 auto 28px;opacity:0.6;"></div>
    <p ${ce('hero.sub')} style="font-family:${F.deco};color:${C.cream};font-size:15px;line-height:2;opacity:0.9;max-width:300px;margin:0 auto 40px;">${esc(d.subtitle)}</p>
    ${img ? `<div class="gulbi-section-img" data-section-img="hero" style="margin:32px auto 0;max-width:320px;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);border-radius:8px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);position:relative;">${imgTag(img, d.productName, 'width:90%;height:90%;object-fit:contain;')}</div>` : ''}
  </div>
</section>`
}

function renderOrigin(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F, labels: L } = p
  const img = d.sectionImages?.origin
  return `
<section data-section="origin" style="background:${C.ink};color:${C.cream};padding:80px 28px 0;text-align:center;">
  <p ${ce('origin.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.light};margin:0 0 16px;">II.&nbsp;&nbsp;${esc(L.origin)}</p>
  <h2 ${ce('origin.location')} style="font-family:${F.serif};font-weight:700;font-size:40px;line-height:1.1;letter-spacing:-0.02em;margin:0 0 24px;color:${C.light};">${esc(d.originLocation)}</h2>
  <p ${ce('origin.story')} style="font-family:${F.deco};font-size:15px;line-height:1.95;opacity:0.85;margin:0 0 40px;">${esc(d.originStory)}</p>
  ${img ? `<div class="gulbi-section-img" data-section-img="origin" style="margin:0 -28px 0;aspect-ratio:16/9;background:#000;overflow:hidden;position:relative;"><img src="${img}" alt="${esc(d.productName)}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>` : ''}
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1px;background:${C.light}33;margin:0 -28px;border-top:1px solid ${C.light}33;">
    ${d.originStats.filter(s => s.value && s.value.trim()).slice(0,4).map((s,i) => `
    <div style="background:${C.ink};padding:28px 20px;">
      <div style="font-family:${F.serif};font-size:36px;font-weight:300;color:${C.light};line-height:1;margin-bottom:8px;letter-spacing:-0.02em;">
        <span ${ce('origin.stat.' + i + '.value')}>${esc(s.value)}</span><span ${ce('origin.stat.' + i + '.unit')} style="font-size:14px;margin-left:4px;">${esc(s.unit)}</span>
      </div>
      <div ${ce('origin.stat.' + i + '.label')} style="font-size:10px;letter-spacing:0.25em;opacity:0.6;text-transform:uppercase;color:${C.cream};">${esc(s.label)}</div>
      <div ${ce('origin.stat.' + i + '.desc')} style="font-family:${F.deco};font-size:12px;line-height:1.7;margin-top:10px;opacity:0.85;color:${C.cream};">${esc(s.desc)}</div>
    </div>`).join('')}
  </div>
</section>`
}

function renderStory(d: LandingData, p: Preset): string {
  const { colors: C, fonts: F, labels: L } = p
  const img = d.sectionImages?.story
  const paragraphs = esc(d.story).split('\n').filter(Boolean).map(x => `<p style="margin:0 0 18px;">${x}</p>`).join('')
  return `
<section data-section="story" style="padding:80px 28px;background:${C.cream};text-align:center;">
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
  <div style="font-family:${F.serif};font-size:130px;line-height:0.9;font-weight:700;color:${C.deep};letter-spacing:-0.05em;margin:32px 0 24px;">
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
<section data-section="specs" style="padding:80px 28px;background:${C.paper};text-align:center;">
  <p ${ce('specs.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;text-align:center;">SPECIFICATIONS · 사양</p>
  <h2 ${ce('specs.title')} style="font-family:${F.serif};font-weight:300;font-size:30px;line-height:1.2;margin:0 0 32px;color:${C.ink};text-align:center;">${esc(d.specs.title)}</h2>
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
<section data-section="materials" style="padding:80px 28px;background:${C.cream};text-align:center;">
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
    <div style="font-family:${F.serif};font-size:48px;font-weight:700;color:${C.deep};line-height:1;">4.9<span style="font-size:15px;color:${C.inkSoft};font-weight:400;"> / 5.0</span></div>
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
<section data-section="info" style="padding:80px 28px 60px;background:${C.paper};text-align:center;">
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
<section data-section="faq" style="padding:60px 28px;background:${C.cream};text-align:center;">
  <p ${ce('faq.num')} style="font-family:${F.serif};font-size:11px;letter-spacing:0.4em;color:${C.deep};margin:0 0 16px;">XI.&nbsp;&nbsp;FAQ</p>
  <h2 ${ce('faq.title')} style="font-family:${F.serif};font-weight:300;font-size:28px;line-height:1.2;letter-spacing:-0.02em;margin:0 0 32px;color:${C.ink};">자주 묻는 질문</h2>
  ${d.faq.slice(0,4).map((f,i) => `
  <div style="border-bottom:1px solid ${C.line};padding:20px 0;max-width:560px;margin:0 auto;text-align:left;">
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
    <p style="font-family:${F.serif};font-size:48px;font-weight:700;color:${C.light};letter-spacing:-0.02em;margin:0 0 10px;line-height:1;"><span ${ce('cta.price')}>${comma(d.price.retail)}</span><span style="font-size:18px;margin-left:4px;">원</span></p>
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
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;">
    ${d.delivery.slice(0,4).map((de,i) => `
    <div>
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

const SECTION_RENDERERS: Record<string, (d: LandingData, p: Preset) => string> = {
  intro: renderIntro,
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

export function renderLanding(data: LandingData, presetKey: PresetKey = 'gold'): string {
  const preset = PRESETS[presetKey] || PRESETS.gold
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
<div data-landing data-preset="${presetKey}" style="font-family:${F.sans};color:${C.ink};background:${C.paper};line-height:1.6;-webkit-font-smoothing:antialiased;">
${sections}
</div>`
}

// ============================================================
// 프리셋 목록 (UI용)
// ============================================================

export function listPresets() {
  return (Object.keys(PRESETS) as PresetKey[]).map(key => ({
    key,
    name: PRESETS[key].name,
    description: PRESETS[key].description,
  }))
}
