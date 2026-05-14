import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '굴비가게 관리시스템 — 수산물 도매를 스마트하게',
  description: '주문·재고·정산·세금계산서까지. 도매에 필요한 모든 것을 한 곳에서.',
  metadataBase: new URL('https://app.yuanfnb.com'),
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
