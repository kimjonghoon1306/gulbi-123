// 토스페이먼츠 결제 (일반결제)
// 클라이언트 키는 공개값이라 안전. 실 결제 시 환경변수로 교체하세요.
//   NEXT_PUBLIC_TOSS_CLIENT_KEY (클라이언트) / TOSS_SECRET_KEY (서버, api/payments/confirm)
export const TOSS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_Z1aOwX7K8m4zBKZLZXpmryQxzvNP'

let sdkPromise: Promise<void> | null = null

function loadSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if ((window as any).TossPayments) return Promise.resolve()
  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://js.tosspayments.com/v1/payment'
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('토스 SDK 로드 실패'))
      document.head.appendChild(s)
    })
  }
  return sdkPromise
}

export async function loadToss() {
  await loadSdk()
  return (window as any).TossPayments(TOSS_CLIENT_KEY)
}
