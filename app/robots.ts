import type { MetadataRoute } from 'next'

const BASE = 'https://app.yuanfnb.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 관리자·공급사·인증·API는 검색엔진 수집에서 제외
        disallow: ['/admin', '/supplier', '/auth', '/api'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
