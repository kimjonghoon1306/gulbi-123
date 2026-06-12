import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://app.yuanfnb.com'

// 1시간마다 사이트맵 갱신 (새 상품이 재배포 없이도 반영됨)
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    '', '/shop', '/shop/cart', '/shop/terms', '/shop/privacy', '/landing',
  ].map((p) => ({ url: `${BASE}${p}`, lastModified: new Date(), changeFrequency: 'daily', priority: p === '/shop' ? 1 : 0.6 }))

  let productPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase.from('products').select('id, created_at').eq('is_active', true)
    productPages = (data || []).map((p: any) => ({
      url: `${BASE}/shop/product/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch {
    // DB 조회 실패 시 정적 페이지만 반환 (빌드/배포 안전)
  }

  return [...staticPages, ...productPages]
}
