import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getUserAIKeys, callAI, extractJson } from '@/lib/ai'

// ─────────────────────────────────────────────────────────────
//  GET /api/admin-brief
//  관리자 "AI 아침 브리핑" — 로그인한 관리자 본인 키로만 호출.
//  어제 매출·주문, 미출고, 재고부족, 공급사 승인대기를 모아 AI가 요약 + 할 일 제안.
// ─────────────────────────────────────────────────────────────
export async function GET() {
  // 1) 본인 키 확보 (관리자 본인 키)
  const auth = await getUserAIKeys()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // 2) 데이터 수집 (관리자 세션 권한으로)
  const supabase = await createServerSupabase()
  const today = new Date()
  const ymd = (d: Date) => d.toISOString().split('T')[0]
  const todayStr = ymd(today)
  const yest = new Date(today); yest.setDate(yest.getDate() - 1)
  const yestStr = ymd(yest)

  const [
    { data: gOrders }, { data: wOrders }, { data: rOrders },
    { data: products }, { data: suppliers },
    { data: members }, { data: supProducts }, { data: taxInvoices }, { data: cashReceipts },
  ] = await Promise.all([
    supabase.from('general_orders').select('status, total_amount, created_at, customer_name'),
    supabase.from('wholesale_orders').select('status, total_amount, created_at, company_name'),
    supabase.from('retail_orders').select('status, total_amount, created_at, customer_name'),
    supabase.from('products').select('name, stock, min_stock, unit'),
    supabase.from('suppliers').select('company_name, status, created_at'),
    supabase.from('shop_members').select('name, business_name, member_type, status'),
    supabase.from('products').select('name, approval_status, supplier_id').not('supplier_id', 'is', null),
    supabase.from('tax_invoices').select('company_name, status'),
    supabase.from('cash_receipts').select('customer_name, status'),
  ])

  const all = [...(gOrders || []), ...(wOrders || []), ...(rOrders || [])]
  const onDay = (str: string) => all.filter(o => o.created_at?.startsWith(str))
  const sum = (arr: any[]) => arr.reduce((s, o) => s + (o.total_amount || 0), 0)

  const yOrders = onDay(yestStr)
  const tOrders = onDay(todayStr)
  const unshipped = all.filter(o => o.status === '접수' || o.status === '준비중')
  const paymentPending = all.filter(o => o.status === '결제대기')
  const lowStock = (products || []).filter(p => (p.min_stock || 0) > 0 && (p.stock || 0) <= p.min_stock)
  const pendingSuppliers = (suppliers || []).filter(s => s.status && s.status !== '승인')
  const pendingMembers = (members || []).filter(m => m.status === '대기중')
  const pendingSupProducts = (supProducts || []).filter(p => p.approval_status === '대기중')
  const unissuedInvoices = (taxInvoices || []).filter(i => i.status === '미발행')
  const unissuedReceipts = (cashReceipts || []).filter(r => r.status === '미발행')

  const stats = {
    yesterdayOrders: yOrders.length,
    yesterdayRevenue: sum(yOrders),
    yesterdayDone: yOrders.filter(o => o.status === '완료').length,
    todayOrders: tOrders.length,
    unshipped: unshipped.length,
    paymentPending: paymentPending.length,
    lowStockCount: lowStock.length,
    lowStockNames: lowStock.slice(0, 8).map(p => `${p.name}(${p.stock}${p.unit || ''}/최소${p.min_stock})`),
    pendingSuppliers: pendingSuppliers.length,
    pendingSupplierNames: pendingSuppliers.slice(0, 8).map(s => s.company_name),
    pendingMembers: pendingMembers.length,
    pendingMemberNames: pendingMembers.slice(0, 8).map(m => `${m.business_name || m.name}(${m.member_type})`),
    pendingSupProducts: pendingSupProducts.length,
    pendingSupProductNames: pendingSupProducts.slice(0, 8).map(p => p.name),
    unissuedInvoices: unissuedInvoices.length,
    unissuedReceipts: unissuedReceipts.length,
  }

  // 3) AI 요약 (본인 키)
  const system = `당신은 농축수산물 직거래 플랫폼 '온종일팜'의 유능한 운영 비서입니다.
사장님이 아침에 출근해서 한눈에 상황을 파악하도록, 짧고 따뜻하면서도 핵심을 찌르는 브리핑을 작성합니다.
과장·거짓 수치 금지. 주어진 숫자만 사용합니다. 반드시 JSON 객체만 출력합니다.`

  const prompt = `오늘은 ${todayStr} 입니다. 아래는 우리 가게의 실제 데이터입니다.

[어제(${yestStr})]
- 주문 ${stats.yesterdayOrders}건, 매출 ${stats.yesterdayRevenue.toLocaleString()}원, 완료 ${stats.yesterdayDone}건
[오늘(${todayStr}) 현재까지]
- 주문 ${stats.todayOrders}건
[처리 대기 — 사장님이 오늘 챙겨야 할 것]
- 미출고(접수·준비중) ${stats.unshipped}건
- 결제대기(카드결제 미완료) 주문 ${stats.paymentPending}건
- 재고부족 ${stats.lowStockCount}개: ${stats.lowStockNames.join(', ') || '없음'}
- 회원 승인대기(소매·도매 가입심사) ${stats.pendingMembers}명: ${stats.pendingMemberNames.join(', ') || '없음'}
- 공급사 승인대기 ${stats.pendingSuppliers}건: ${stats.pendingSupplierNames.join(', ') || '없음'}
- 공급사 상품 승인대기 ${stats.pendingSupProducts}건: ${stats.pendingSupProductNames.join(', ') || '없음'}
- 미발행 세금계산서 ${stats.unissuedInvoices}건 / 미발행 현금영수증 ${stats.unissuedReceipts}건

위 데이터를 바탕으로 아래 JSON을 작성하세요. 모든 문장은 한국어, 사장님께 말하듯 정중하고 간결하게.
숫자는 위 데이터 그대로만 쓰고 새 숫자를 지어내지 마세요.

{
  "headline": "한 줄 인사+요약 (25자 이내, 이모지 1개 허용)",
  "summary": "어제 성과와 오늘 분위기를 2~3문장으로. 따뜻하지만 사실 기반.",
  "actions": [
    { "label": "오늘 먼저 할 일 (12자 이내)", "why": "왜 중요한지 한 문장" }
  ]
}
actions는 데이터에 근거해 1~4개. 위 '처리 대기' 항목 중 건수가 0인 것은 절대 넣지 말 것.
건수가 많거나 급한 것(미출고, 결제대기, 회원·공급사 승인대기, 미발행 증빙)을 우선순위로 제안할 것.
처리할 게 전혀 없으면 actions는 빈 배열, summary에서 "오늘은 급한 처리건이 없다"고 안내.`

  const ai = await callAI({ keys: auth.keys, system, prompt, maxTokens: 1024, jsonMode: true })
  if (!ai.ok) return NextResponse.json({ error: ai.error, stats }, { status: 502 })

  const parsed = extractJson(ai.text) || {}
  return NextResponse.json({
    headline: parsed.headline || '오늘의 브리핑',
    summary: parsed.summary || '',
    actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 4) : [],
    stats,
    provider: ai.provider,
    date: todayStr,
  })
}
