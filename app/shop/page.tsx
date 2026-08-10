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
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('reviews').select('product_id, rating'),
    supabase.from('ad_banners').select('*').eq('is_active', true).order('sort_order'),
  ])

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
        initialProducts={(productsResult.data || []) as Product[]}
        initialCategories={(categoriesResult.data || []) as Category[]}
        initialBanners={banners}
        initialReviewStats={reviewStats}
      />
    </>
  )
}
