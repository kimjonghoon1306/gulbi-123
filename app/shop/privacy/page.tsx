import Link from 'next/link'
import { Biz } from '../_BizInfo'

export const metadata = { title: '개인정보처리방침 · 온종일팜' }

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <header style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', padding: '28px 20px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <Link href="/shop" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textDecoration: 'none' }}>← 온종일팜으로</Link>
          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 900, margin: '8px 0 0' }}>개인정보처리방침</h1>
        </div>
      </header>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 20px 80px', fontSize: '14px', lineHeight: 1.8 }}>
        <p style={{ color: '#334155', marginTop: 0 }}>
          주식회사 유안에프앤비(이하 “회사”)는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하고 권익을 보장하기 위해 다음과 같은 개인정보처리방침을 둡니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          ① 회원가입: 이름, 이메일, 연락처, 비밀번호<br />
          ② 사업자 회원(소매·도매): 상호, 사업자등록번호, 대표자명, 사업장 주소<br />
          ③ 주문·배송: 수령인, 배송지 주소, 연락처<br />
          ④ 결제: 결제수단 정보(카드 결제는 전자결제대행사가 처리)<br />
          ⑤ 자동 수집: 접속 로그, 쿠키, 서비스 이용 기록
        </Section>
        <Section title="2. 개인정보의 수집 및 이용 목적">
          ① 회원 관리 및 본인 확인<br />
          ② 상품 주문·결제·배송 및 정산<br />
          ③ 현금영수증·세금계산서 등 거래 증빙 발행<br />
          ④ 고객 문의 응대 및 분쟁 처리<br />
          ⑤ 서비스 개선 및 신규 서비스 안내
        </Section>
        <Section title="3. 개인정보의 보유 및 이용 기간">
          회사는 원칙적으로 개인정보 수집·이용 목적이 달성된 후 지체 없이 파기합니다. 다만 관련 법령에 따라 다음과 같이 보존합니다.<br />
          · 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)<br />
          · 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)<br />
          · 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)<br />
          · 표시·광고에 관한 기록: 6개월 (전자상거래법)
        </Section>
        <Section title="4. 개인정보의 제3자 제공">
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 배송(택배사), 결제(전자결제대행사), 거래 증빙(전자세금계산서·현금영수증 발행 대행사) 등 서비스 이행에 필요한 최소한의 범위에서 제공할 수 있으며, 법령에 근거가 있는 경우 제공할 수 있습니다.
        </Section>
        <Section title="5. 개인정보 처리의 위탁">
          회사는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리를 위탁할 수 있습니다.<br />
          · 결제 처리: KG이니시스(주)<br />
          · 배송: 계약 택배사<br />
          · 거래 증빙 발행: 전자세금계산서·현금영수증 발행 대행사
        </Section>
        <Section title="6. 이용자의 권리와 행사 방법">
          이용자는 언제든지 자신의 개인정보를 조회·수정할 수 있으며, 회원 탈퇴(동의 철회)를 통해 개인정보 이용에 대한 동의를 철회할 수 있습니다. 개인정보 열람·정정·삭제·처리정지 요청은 아래 개인정보 보호책임자에게 연락 주시면 지체 없이 조치합니다.
        </Section>
        <Section title="7. 개인정보의 안전성 확보 조치">
          회사는 개인정보의 안전성 확보를 위해 비밀번호 암호화, 접근 권한 관리, 접속 기록 보관 등 관리적·기술적 보호조치를 시행합니다.
        </Section>
        <Section title="8. 개인정보 보호책임자">
          성명: 오준영 (대표) &nbsp;|&nbsp; 연락처: 010-7432-3888 &nbsp;|&nbsp; 이메일: tarry9653@daum.net<br />
          개인정보 침해에 대한 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr / 국번없이 118) 등에 문의하실 수 있습니다.
        </Section>

        <Biz />
        <p style={{ marginTop: '24px', color: '#94a3b8', fontSize: '12px' }}>본 방침은 2026년 6월 13일부터 시행합니다.</p>
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
