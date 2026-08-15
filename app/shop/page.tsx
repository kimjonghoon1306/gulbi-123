import { createClient } from '@supabase/supabase-js'
import ShopClient from './ShopClient'
import { optimizedImageUrl, responsiveImageSrcSet } from './_imageUrl'
import type { Category, Product } from './_shopConstants'

export const revalidate = 60

type ReviewStats = Record<string, { sum: number; count: number }>

export default async function ShopPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const [productsResult, categoriesResult, reviewsResult, bannersResult] = await Promise.all([
    // 목록에는 상세페이지용 대용량 HTML(description)을 절대 포함하지 않는다.
    // 상세 콘텐츠에 이미지/영상이 많으면 첫 화면 RSC가 수 MB로 커져
    // 상품 클릭과 페이지 전환까지 함께 느려진다.
    supabase.from('products').select('id,name,image_url,origin,wholesale_price,retail_price,member_price,stock,unit,weight,category_id,is_active,shipping_type,shipping_fee,free_shipping_threshold,created_at').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('reviews').select('product_id, rating'),
    supabase.from('ad_banners').select('*').eq('is_active', true).order('sort_order'),
  ])

  // 운영 안전장치: DB 연결/권한 오류를 "상품 0개"로 오인해 캐시하거나
  // 배포하지 않는다. 렌더링을 실패시키면 기존 ISR 페이지가 그대로 유지되고,
  // 빌드 중이라면 배포 자체가 중단된다.
  if (productsResult.error) {
    throw new Error(`상품 조회 실패: ${productsResult.error.message}`)
  }
  if (!productsResult.data || productsResult.data.length === 0) {
    throw new Error('상품 안전장치 작동: 활성 상품이 0개라 화면 갱신을 중단합니다.')
  }

  const reviewStats: ReviewStats = {}
  for (const review of reviewsResult.data || []) {
    if (!review.product_id) continue
    const stat = reviewStats[review.product_id] || { sum: 0, count: 0 }
    stat.sum += review.rating || 0
    stat.count += 1
    reviewStats[review.product_id] = stat
  }

  const now = Date.now()
  const banners = (bannersResult.data || []).filter((banner: any) => {
    const startsAt = banner.starts_at ? new Date(banner.starts_at).getTime() : -Infinity
    const endsAt = banner.ends_at ? new Date(banner.ends_at).getTime() : Infinity
    return now >= startsAt && now <= endsAt
  })

  return (
    <>
      <link rel="preload" as="image" href="/onjongil-food-poster.jpg" />
      {banners[0]?.image_url && (
        <link rel="preload" as="image"
          href={optimizedImageUrl(banners[0].image_url, 1200, 76)}
          imageSrcSet={responsiveImageSrcSet(banners[0].image_url, [640, 960, 1200, 1600], 76)}
          imageSizes="(max-width: 1140px) calc(100vw - 40px), 1100px" />
      )}
      <ShopClient
        initialProducts={productsResult.data as Product[]}
        initialCategories={(categoriesResult.data || []) as Category[]}
        initialBanners={banners}
        initialReviewStats={reviewStats}
      />
    </>
  )
}
