// 온종일팜 카테고리 캐릭터 아이콘 생성 (Replicate Flux) — 쿠팡 모바일풍 3D 아이콘
// 실행: REPLICATE_API_TOKEN=xxx node scripts/gen-category-icons.mjs [sample|all]
// 결과: public/category-icons/<key>.webp
import fs from 'node:fs'
import path from 'node:path'

const TOKEN = process.env.REPLICATE_API_TOKEN
if (!TOKEN) { console.error('REPLICATE_API_TOKEN 환경변수가 필요합니다.'); process.exit(1) }

const MODE = process.argv[2] || 'sample'
const OUT = path.resolve('public/category-icons/raw')
fs.mkdirSync(OUT, { recursive: true })

// 통일된 스타일 문장 — 카테고리가 달라도 한 세트처럼 보이게
const STYLE = 'cute 3D claymorphism app icon, glossy soft-rendered clay style, plump rounded friendly shapes, vibrant fresh colors, soft studio lighting, subtle soft shadow underneath, centered composition, plain solid very light warm gray background (#f4f4f2), clean modern mobile e-commerce category icon, high detail, sharp, no text, no letters, no words, no numbers'

const ALL = [
  { key: 'fish',     subject: 'a single fresh whole silvery-blue fish (mackerel), plump and cute' },
  { key: 'produce',  subject: 'a small bundle of fresh green vegetables, a napa cabbage and crisp lettuce leaves' },
  { key: 'fruit',    subject: 'a shiny red apple with a small green leaf and a ripe strawberry beside it' },
  { key: 'crab',     subject: 'a cute fresh orange prawn/shrimp and a small crab' },
  { key: 'shellfish',subject: 'a fresh oyster on the half shell and a couple of clams' },
  { key: 'seaweed',  subject: 'a tidy stack of glossy dark-green dried seaweed sheets with a sprig of green sea kelp' },
  { key: 'dried',    subject: 'a small bundle of dried fish and dried shrimp, warm amber tones' },
  { key: 'meat',     subject: 'a fresh marbled beef steak cut on a tiny wooden board' },
  { key: 'etc',      subject: 'a friendly woven market basket filled with assorted fresh groceries' },
]

const items = MODE === 'all' ? ALL : ALL.slice(0, 3)

async function gen({ key, subject }) {
  const file = path.join(OUT, `${key}.webp`)
  if (fs.existsSync(file)) { console.log(`[${key}] 이미 있음 → 건너뜀`); return }
  const prompt = `${subject}. ${STYLE}`
  const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({ input: { prompt, aspect_ratio: '1:1', output_format: 'webp', output_quality: 90, safety_tolerance: 2 } }),
  })
  const data = await res.json()
  if (!res.ok) { console.error(`[${key}] 실패:`, data?.detail || JSON.stringify(data)); return }
  const url = Array.isArray(data.output) ? data.output[0] : data.output
  if (!url) { console.error(`[${key}] 출력 없음:`, JSON.stringify(data).slice(0, 300)); return }
  const img = await fetch(url)
  const buf = Buffer.from(await img.arrayBuffer())
  fs.writeFileSync(file, buf)
  console.log(`[${key}] 저장 완료 → public/category-icons/${key}.webp (${(buf.length/1024).toFixed(0)}KB)`)
}

for (const it of items) {
  try { await gen(it) } catch (e) { console.error(`[${it.key}] 오류:`, e.message) }
}
console.log('끝.')
