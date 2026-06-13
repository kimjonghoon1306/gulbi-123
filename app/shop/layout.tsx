import { ChatBot } from './_ChatBot'

// 모든 쇼핑몰(/shop) 페이지에 손님용 챗봇을 공통으로 띄움
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatBot />
    </>
  )
}
