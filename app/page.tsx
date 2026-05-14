import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '굴비가게 관리시스템 — 수산물 도매를 스마트하게',
  description: '주문·재고·정산·세금계산서까지. 도매에 필요한 모든 것을 한 곳에서.',
  openGraph: {
    title: '굴비가게 관리시스템 — 수산물 도매를 스마트하게',
    description: '주문·재고·정산·세금계산서까지. 도매에 필요한 모든 것을 한 곳에서.',
    url: 'https://app.yuanfnb.com',
    siteName: '굴비가게 관리시스템',
    images: [
      {
        url: 'https://app.yuanfnb.com/og-image.png',
        width: 1200,
        height: 630,
        alt: '굴비가게 관리시스템 — 수산물 도매 전용 솔루션',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '굴비가게 관리시스템 — 수산물 도매를 스마트하게',
    description: '주문·재고·정산·세금계산서까지. 도매에 필요한 모든 것을 한 곳에서.',
    images: ['https://app.yuanfnb.com/og-image.png'],
  },
}

export default function Home() {
  redirect('/landing')
}
