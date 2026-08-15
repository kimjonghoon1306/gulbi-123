import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ProductDetailClient from './_ProductDetailClient'

export const revalidate = 60

type Props = { params: { id: string } }

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

// 현재 판매 중인 상세 경로를 빌드 때 CDN에 미리 생성해 첫 클릭의
// 서버 콜드 스타트와 DB 왕복을 없앤다. 신규 상품은 dynamicParams로 대응한다.
export async function generateStaticParams() {
  const { data, error } = await getSupabase()
    .from('products')
    .select('id')
    .eq('is_active', true)

  if (error) throw new Error(`상품 상세 경로 생성 실패: ${error.message}`)
  return (data || []).map(({ id }) => ({ id: String(id) }))
}

export default async function ProductDetailPage({ params }: Props) {
  const supabase = getSupabase()

  const { data: product, error } = await supabase
    .from('products')
    // 첫 화면에 필요한 필드만 전송한다. 수 MB짜리 상세 HTML은 클라이언트에서
    // 별도로 병렬 로드해 상품명·가격·대표 이미지 표시를 막지 않게 한다.
    .select('id,name,image_url,origin,wholesale_price,retail_price,member_price,stock,unit,weight,category_id,is_active,shipping_type,shipping_fee,free_shipping_threshold,subscribable')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (error || !product) notFound()

  return (
    <>
      {product.image_url ? <link rel="preload" as="image" href={product.image_url} /> : null}
      <ProductDetailClient initialProduct={product} />
    </>
  )
}
