import { ChatBot } from './_ChatBot'
import Script from 'next/script'

// 페이지 캐시로 옛 온봇이 남지 않도록 /shop은 항상 최신으로 렌더
export const dynamic = 'force-dynamic'

// 모든 쇼핑몰(/shop) 페이지에 손님용 챗봇을 공통으로 띄움
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatBot />
      {/* 온파트너 제휴 추적 (파트너 링크 유입 op_ref 캡처 + 구매 전환) */}
      <Script src="https://partnering.vercel.app/tracker.js" strategy="afterInteractive" />
    </>
  )
}
