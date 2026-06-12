// 다음(카카오) 우편번호 서비스 — 주소 검색 팝업
// 사용: const r = await openPostcode(); if (r) setAddress(r.address)
declare global {
  interface Window { daum?: any }
}

let loadingPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.daum?.Postcode) return Promise.resolve()
  if (loadingPromise) return loadingPromise
  loadingPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => { loadingPromise = null; reject(new Error('우편번호 서비스를 불러오지 못했어요.')) }
    document.head.appendChild(s)
  })
  return loadingPromise
}

// 주소 검색 팝업을 열고, 선택 결과를 반환. 취소 시 null.
export async function openPostcode(): Promise<{ zonecode: string; address: string } | null> {
  await loadScript()
  return new Promise((resolve) => {
    let done = false
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        done = true
        const address = data.roadAddress || data.jibunAddress || ''
        resolve({ zonecode: data.zonecode || '', address })
      },
      onclose: () => { if (!done) resolve(null) },
    }).open()
  })
}
