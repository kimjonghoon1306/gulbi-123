import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaRegister from './PwaRegister'

export const metadata: Metadata = {
  title: '온종일팜 관리시스템 — 농축수산물 도매를 스마트하게',
  description: '주문·재고·정산·세금계산서까지. 도매에 필요한 모든 것을 한 곳에서.',
  metadataBase: new URL('https://app.yuanfnb.com'),
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: '온종일팜', statusBarStyle: 'default' },
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
  openGraph: {
    title: '온종일팜 관리시스템 — 농축수산물 도매를 스마트하게',
    description: '주문·재고·정산·세금계산서까지. 도매에 필요한 모든 것을 한 곳에서.',
    url: 'https://app.yuanfnb.com',
    siteName: '온종일팜 관리시스템',
    images: [
      {
        url: 'https://app.yuanfnb.com/og-image.png?v=20260821',
        width: 1200,
        height: 630,
        alt: '온종일팜 — 산지직송 농축수산물',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '온종일팜 관리시스템 — 농축수산물 도매를 스마트하게',
    description: '주문·재고·정산·세금계산서까지. 도매에 필요한 모든 것을 한 곳에서.',
    images: ['https://app.yuanfnb.com/og-image.png?v=20260821'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#16a34a',
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
      <body>{children}<PwaRegister /></body>
    </html>
  )
}
