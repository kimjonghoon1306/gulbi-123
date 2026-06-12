// 팝빌(링크허브) 전자세금계산서 · 현금영수증 연동
// 환경변수(Vercel)에 아래 값을 설정해야 동작합니다. 미설정 시 /api/tax/issue가 안내 에러를 반환합니다.
//   POPBILL_LINK_ID, POPBILL_SECRET_KEY  : 팝빌 콘솔 > 연동정보에서 발급
//   POPBILL_CORP_NUM                     : 공급자(판매자) 사업자번호 ('-' 제외 10자리)
//   POPBILL_IS_TEST                      : 'true'(테스트베드) / 'false'(운영). 기본 true
//   POPBILL_SELLER_NAME/CEO/ADDR/BIZTYPE/BIZCLASS/TEL/EMAIL : 공급자 정보(세금계산서 공급자란)

/* eslint-disable @typescript-eslint/no-var-requires */
const popbill = require('popbill')

let configured = false
function ensureConfig() {
  if (configured) return
  popbill.config({
    LinkID: process.env.POPBILL_LINK_ID || '',
    SecretKey: process.env.POPBILL_SECRET_KEY || '',
    IsTest: (process.env.POPBILL_IS_TEST ?? 'true') !== 'false',
    IPRestrictOnOff: true,
    UseStaticIP: false,
    UseLocalTimeYN: true,
    defaultErrorHandler: (err: any) => console.error('[popbill]', err?.code, err?.message),
  })
  configured = true
}

export const SELLER = {
  corpNum: (process.env.POPBILL_CORP_NUM || '').replace(/-/g, ''),
  corpName: process.env.POPBILL_SELLER_NAME || '',
  ceoName: process.env.POPBILL_SELLER_CEO || '',
  addr: process.env.POPBILL_SELLER_ADDR || '',
  bizType: process.env.POPBILL_SELLER_BIZTYPE || '',   // 업태
  bizClass: process.env.POPBILL_SELLER_BIZCLASS || '', // 종목
  tel: process.env.POPBILL_SELLER_TEL || '',
  email: process.env.POPBILL_SELLER_EMAIL || '',
}

export function popbillReady() {
  return !!(process.env.POPBILL_LINK_ID && process.env.POPBILL_SECRET_KEY && SELLER.corpNum)
}

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}
const onlyNum = (s: any) => String(s || '').replace(/[^0-9]/g, '')

// 전자세금계산서 즉시발행 (과세 가공식품). tax_amount가 0이면 면세 계산서로 발행.
export function issueTaxinvoice(inv: any): Promise<{ mgtKey: string; result: any }> {
  ensureConfig()
  const svc = popbill.TaxinvoiceService()
  const mgtKey = 'TI' + Date.now()
  const writeDate = today()
  const supplyCost = Number(inv.amount || 0)
  const tax = Number(inv.tax_amount || 0)
  const total = Number(inv.total_amount || supplyCost + tax)
  const taxType = tax > 0 ? '과세' : '면세'

  const taxinvoice = {
    writeDate, chargeDirection: '정과금', issueType: '정발행', purposeType: '영수', taxType,
    invoicerCorpNum: SELLER.corpNum, invoicerMgtKey: mgtKey,
    invoicerCorpName: SELLER.corpName, invoicerCEOName: SELLER.ceoName, invoicerAddr: SELLER.addr,
    invoicerBizType: SELLER.bizType, invoicerBizClass: SELLER.bizClass,
    invoicerContactName: SELLER.corpName, invoicerTEL: SELLER.tel, invoicerEmail: SELLER.email,
    invoiceeType: '사업자',
    invoiceeCorpNum: onlyNum(inv.business_number),
    invoiceeCorpName: inv.company_name || '',
    invoiceeCEOName: inv.invoicee_ceo_name || inv.manager_name || inv.company_name || '',
    invoiceeAddr: inv.invoicee_addr || '',
    invoiceeContactName1: inv.manager_name || '',
    invoiceeTEL1: inv.contact || '',
    invoiceeEmail1: inv.invoicee_email || inv.email || '',
    supplyCostTotal: String(supplyCost), taxTotal: String(tax), totalAmount: String(total),
    detailList: [{
      serialNum: 1, purchaseDT: writeDate, itemName: '농수산물 외',
      qty: '1', unitCost: String(supplyCost), supplyCost: String(supplyCost), tax: String(tax),
      remark: inv.note || '',
    }],
  }

  return new Promise((resolve, reject) => {
    svc.registIssue(SELLER.corpNum, taxinvoice,
      (result: any) => resolve({ mgtKey, result }),
      (err: any) => reject(err))
  })
}

// 현금영수증 즉시발행. 소비자용=소득공제용, 사업자용=지출증빙용. 기본 과세(부가세 포함가 역산).
export function issueCashbill(rec: any): Promise<{ mgtKey: string; result: any }> {
  ensureConfig()
  const svc = popbill.CashbillService()
  const mgtKey = 'CB' + Date.now()
  const total = Number(rec.amount || 0)
  const supplyCost = Math.round(total / 1.1)
  const tax = total - supplyCost

  const cashbill = {
    mgtKey, tradeType: '승인거래',
    tradeUsage: rec.receipt_type === '사업자용' ? '지출증빙용' : '소득공제용',
    tradeOpt: '일반', taxationType: '과세',
    totalAmount: String(total), supplyCost: String(supplyCost), tax: String(tax), serviceFee: '0',
    franchiseCorpNum: SELLER.corpNum, franchiseCorpName: SELLER.corpName,
    franchiseCEOName: SELLER.ceoName, franchiseAddr: SELLER.addr, franchiseTEL: SELLER.tel,
    identityNum: onlyNum(rec.contact), customerName: rec.customer_name || '',
    itemName: '농수산물 외', orderNumber: '', email: '', hp: onlyNum(rec.contact), smssendYN: false,
  }

  return new Promise((resolve, reject) => {
    svc.registIssue(SELLER.corpNum, cashbill,
      (result: any) => resolve({ mgtKey, result }),
      (err: any) => reject(err))
  })
}
