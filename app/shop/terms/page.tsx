import Link from 'next/link'
import { Biz } from '../_BizInfo'
import { SellerNotice } from '../_SellerNotice'

export const metadata = { title: '이용약관 · 온종일팜' }

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <header style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', padding: '28px 20px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <Link href="/shop" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textDecoration: 'none' }}>← 온종일팜으로</Link>
          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 900, margin: '8px 0 0' }}>이용약관</h1>
        </div>
      </header>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 20px 80px', fontSize: '14px', lineHeight: 1.8 }}>
        <Section title="제1조 (목적)">
          본 약관은 주식회사 유안에프앤비(이하 “회사”)가 운영하는 온종일팜(이하 “몰”)에서 제공하는 농·축·수산물 등 전자상거래 관련 서비스(이하 “서비스”)를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </Section>
        <Section title="제2조 (정의)">
          ① “몰”이란 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 거래할 수 있도록 설정한 가상의 영업장을 말합니다.<br />
          ② “이용자”란 몰에 접속하여 본 약관에 따라 몰이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.<br />
          ③ “회원”이란 몰에 회원등록을 한 자로서, 계속적으로 몰이 제공하는 서비스를 이용할 수 있는 자를 말합니다.
        </Section>
        <Section title="제3조 (약관의 명시와 개정)">
          ① 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 몰의 초기 서비스화면에 게시합니다.<br />
          ② 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 시행일 7일 전부터 공지합니다.
        </Section>
        <Section title="제4조 (서비스의 제공 및 변경)">
          ① 회사는 농·축·수산물 등 재화의 판매 및 그에 부수하는 정보 제공 서비스를 제공합니다.<br />
          ② 신선식품의 특성상 재고·산지 사정에 따라 제공 상품이 변경될 수 있으며, 이 경우 회사는 변경 내용을 몰에 공지합니다.
        </Section>
        <Section title="제5조 (회원가입 및 회원유형)">
          ① 이용자는 회사가 정한 양식에 따라 회원정보를 기입한 후 본 약관에 동의함으로써 회원가입을 신청합니다.<br />
          ② 회원유형은 일반 구매자, 소매 유통, 도매 유통으로 구분되며, 유형에 따라 적용 가격 및 증빙(현금영수증·세금계산서) 발행 방식이 달라질 수 있습니다.
        </Section>
        <Section title="제6조 (주문 및 결제)">
          ① 이용자는 몰에서 상품을 선택하여 주문하며, 회사는 가상계좌·신용카드 등 회사가 제공하는 결제수단을 통해 대금을 수납합니다.<br />
          ② 신용카드 결제는 KG이니시스 등 전자결제대행사를 통해 처리되며, 카드 결제분은 카드매출전표로 증빙이 갈음됩니다.
        </Section>
        <Section title="제7조 (청약철회 및 반품·교환)">
          ① 이용자는 상품을 수령한 날부터 7일 이내에 청약철회(반품)를 할 수 있습니다.<br />
          ② 다만 농·축·수산물 등 신선·냉장·냉동 식품은 부패·변질의 우려가 있어, 포장 개봉·사용 또는 시간 경과 등으로 재판매가 곤란한 경우 「전자상거래법」 제17조제2항에 따라 청약철회가 제한될 수 있습니다.<br />
          ③ 상품에 하자가 있거나 표시·광고와 다른 경우에는 수령 후 3개월 이내 또는 그 사실을 안 날부터 30일 이내에 교환·반품·환불을 요청할 수 있습니다.<br />
          ④ 단순 변심에 의한 반품의 왕복 배송비는 이용자가 부담합니다.
        </Section>
        <Section title="제8조 (배송)">
          ① 회사는 주문 상품을 신선도 유지를 위해 냉장·냉동 포장하여 배송합니다.<br />
          ② 천재지변, 산지 사정, 택배사 사정 등 부득이한 경우 배송이 지연될 수 있으며, 이 경우 회사는 이용자에게 안내합니다.
        </Section>
        <Section title="제9조 (회사의 의무)">
          회사는 관련 법령과 본 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며, 이용자가 안전하게 서비스를 이용할 수 있도록 노력합니다.
        </Section>
        <Section title="제10조 (이용자의 의무)">
          이용자는 회원정보를 사실에 근거하여 작성하여야 하며, 타인의 정보 도용, 회사 업무 방해 등의 행위를 하여서는 안 됩니다.
        </Section>
        <Section title="제11조 (분쟁의 해결)">
          본 약관과 관련한 분쟁에 대하여는 대한민국 법을 적용하며, 분쟁으로 인한 소송은 회사의 본점 소재지를 관할하는 법원을 전속관할로 합니다.
        </Section>

        <div style={{ marginTop: '32px' }}>
          <SellerNotice />
        </div>
        <Biz />
        <p style={{ marginTop: '24px', color: '#94a3b8', fontSize: '12px' }}>본 약관은 2026년 6월 13일부터 시행합니다.</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '26px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>{title}</h2>
      <p style={{ margin: 0, color: '#334155' }}>{children}</p>
    </div>
  )
}
