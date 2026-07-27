'use client'
// KG이니시스 결제(INIStdPay, PC 웹표준) 클라이언트 로더.
// 서명(signature)·키(signKey)·mKey 생성은 전부 서버(/api/payments/inicis/prepare)에서만 처리한다.
// 클라이언트는 서버가 내려준 결제 필드로 히든 폼을 만들어 결제창만 띄운다(signKey 노출 방지).

let sdkPromise: Promise<void> | null = null

function loadSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if ((window as any).INIStdPay) return Promise.resolve()
  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://stdpay.inicis.com/stdjs/INIStdPay.js'
      s.charset = 'UTF-8'
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('이니시스 결제 모듈을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'))
      document.head.appendChild(s)
    })
  }
  return sdkPromise
}

// 주문을 만든 뒤 서버에 결제필드를 요청하고, 이니시스 결제창을 연다.
//   method: '카드' | '가상계좌'
export async function payWithInicis(params: {
  table: string
  orderId: string
  method: string
  goodname: string
  buyername: string
  buyertel: string
  buyeremail: string
}) {
  const res = await fetch('/api/payments/inicis/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.fields) {
    throw new Error(data.message || '결제 준비에 실패했어요. 잠시 후 다시 시도해 주세요.')
  }

  await loadSdk()

  const FORM_ID = 'inicis-pay-form'
  document.getElementById(FORM_ID)?.remove()
  const form = document.createElement('form')
  form.id = FORM_ID
  form.method = 'POST'
  form.acceptCharset = 'UTF-8'
  form.style.display = 'none'
  for (const [k, v] of Object.entries(data.fields as Record<string, string>)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = k
    input.value = v ?? ''
    form.appendChild(input)
  }
  document.body.appendChild(form)
  ;(window as any).INIStdPay.pay(FORM_ID)
}
