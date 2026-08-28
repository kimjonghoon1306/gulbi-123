// ─────────────────────────────────────────────────────────────
// AI 상세페이지 이미지 파이프라인 (서버 전용)
//
//  · searchPexels / searchPixabay : 무료 스톡 배경·분위기 사진 검색
//  · upscaleImage                 : 저화질 사진 → 고화질 (Replicate)
//  · removeBackground             : 상품 누끼 (Replicate)
//  · generateFluxBackground       : 딱 맞는 배경이 없을 때 새로 생성 (Replicate/Flux)
//
// 모든 함수는 route handler에서만 호출. 키는 getImageSourceKeys()로 받아 넘긴다.
// ─────────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'

export type StockImage = {
  url: string          // 큰 이미지 URL
  thumb: string        // 썸네일 URL
  width: number
  height: number
  source: 'pexels' | 'pixabay'
  author?: string
  pageUrl?: string
}

export type Orientation = 'landscape' | 'portrait' | 'square'

// ── Pexels 검색 ────────────────────────────────────────────────
export async function searchPexels(
  key: string,
  query: string,
  opts: { perPage?: number; orientation?: Orientation } = {},
): Promise<StockImage[]> {
  const params = new URLSearchParams({
    query,
    per_page: String(opts.perPage ?? 10),
    ...(opts.orientation ? { orientation: opts.orientation } : {}),
  })
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: key, 'User-Agent': UA },
  })
  if (!res.ok) throw new Error(`Pexels ${res.status}`)
  const data = await res.json()
  return (data.photos || []).map((p: any): StockImage => ({
    url: p.src?.large2x || p.src?.large || p.src?.original,
    thumb: p.src?.medium || p.src?.small,
    width: p.width, height: p.height,
    source: 'pexels', author: p.photographer, pageUrl: p.url,
  }))
}

// ── Pixabay 검색 ───────────────────────────────────────────────
export async function searchPixabay(
  key: string,
  query: string,
  opts: { perPage?: number; orientation?: Orientation } = {},
): Promise<StockImage[]> {
  const params = new URLSearchParams({
    key,
    q: query,
    image_type: 'photo',
    per_page: String(opts.perPage ?? 10),
    safesearch: 'true',
    order: 'popular',
    ...(opts.orientation === 'landscape' ? { orientation: 'horizontal' }
      : opts.orientation === 'portrait' ? { orientation: 'vertical' } : {}),
  })
  const res = await fetch(`https://pixabay.com/api/?${params}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Pixabay ${res.status}`)
  const data = await res.json()
  return (data.hits || []).map((h: any): StockImage => ({
    url: h.largeImageURL || h.webformatURL,
    thumb: h.webformatURL || h.previewURL,
    width: h.imageWidth, height: h.imageHeight,
    source: 'pixabay', author: h.user, pageUrl: h.pageURL,
  }))
}

// ── Replicate 공통 실행 (동기 대기) ────────────────────────────
async function runReplicate(token: string, version: string, input: any, timeoutMs = 90000): Promise<any> {
  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: JSON.stringify({ version, input }),
  })
  const data = await res.json()
  if (data?.status === 'succeeded') return data.output
  // Prefer:wait 이 안 걸리면 폴링
  if (data?.urls?.get) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 1500))
      const p = await fetch(data.urls.get, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      if (p.status === 'succeeded') return p.output
      if (p.status === 'failed' || p.status === 'canceled') throw new Error(`Replicate ${p.status}: ${p.error || ''}`)
    }
    throw new Error('Replicate timeout')
  }
  throw new Error(`Replicate error: ${data?.error || data?.status || 'unknown'}`)
}

// Flux 는 model endpoint(버전 불필요)를 쓰므로 별도 함수
async function runReplicateModel(token: string, model: string, input: any, timeoutMs = 90000): Promise<any> {
  const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: JSON.stringify({ input }),
  })
  const data = await res.json()
  if (data?.status === 'succeeded') return data.output
  if (data?.urls?.get) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 1500))
      const p = await fetch(data.urls.get, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      if (p.status === 'succeeded') return p.output
      if (p.status === 'failed' || p.status === 'canceled') throw new Error(`Replicate ${p.status}: ${p.error || ''}`)
    }
    throw new Error('Replicate timeout')
  }
  throw new Error(`Replicate error: ${data?.error || data?.status || 'unknown'}`)
}

function firstUrl(out: any): string {
  if (typeof out === 'string') return out
  if (Array.isArray(out)) return out[0]
  if (out?.url) return out.url
  return String(out)
}

// ── 업스케일 (recraft-crisp-upscale) ───────────────────────────
// recraft-ai/recraft-crisp-upscale: official 모델, 항상 워밍(~2초), 저화질→선명. 약 8원/장.
// ※ real-esrgan은 콜드부팅이 3분+ 걸려 폐기함.
export async function upscaleImage(token: string, imageUrl: string): Promise<string> {
  const out = await runReplicateModel(token, 'recraft-ai/recraft-crisp-upscale', { image: imageUrl })
  return firstUrl(out)
}

// ── 배경 제거 (rembg) ──────────────────────────────────────────
const REMBG =
  'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003'
export async function removeBackground(token: string, imageUrl: string): Promise<string> {
  const out = await runReplicate(token, REMBG, { image: imageUrl })
  return firstUrl(out)
}

// ── Flux 배경 생성 ─────────────────────────────────────────────
export async function generateFluxBackground(
  token: string,
  prompt: string,
  aspectRatio: '9:16' | '3:4' | '1:1' | '16:9' | '4:3' = '3:4',
): Promise<string> {
  const safePrompt = `${prompt}, absolutely no text, no letters, no words, no watermark`
  const out = await runReplicateModel(token, 'black-forest-labs/flux-1.1-pro', {
    prompt: safePrompt, aspect_ratio: aspectRatio, output_format: 'jpg', safety_tolerance: 2,
  })
  return firstUrl(out)
}

// 저화질 판단 헬퍼: 가로·세로 어느 쪽이든 기준 미만이면 업스케일 대상
export function isLowRes(width?: number, height?: number, min = 1200): boolean {
  if (!width || !height) return false
  return Math.max(width, height) < min
}
