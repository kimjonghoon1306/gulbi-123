'use client'
import { useEffect, useState } from 'react'

// 온종일팜 PWA: 서비스워커 등록 + 새 배포 감지 시 하단 "업데이트" 버튼(하나)
export default function PwaRegister() {
  const [show, setShow] = useState(false)
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) { setWaiting(reg.waiting); setShow(true) }
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing
        if (!nw) return
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) { setWaiting(nw); setShow(true) }
        })
      })
    }).catch(() => {})
  }, [])

  if (!show) return null

  const doUpdate = () => {
    if (waiting) { waiting.postMessage('skipWaiting'); setTimeout(() => window.location.reload(), 1200) }
    else { window.location.reload() }
  }

  return (
    <button
      onClick={doUpdate}
      aria-label="새 버전 업데이트"
      style={{
        position: 'fixed', left: '50%', bottom: 'calc(84px + env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)', zIndex: 99999,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '13px 26px', background: '#16a34a', color: '#fff',
        border: 'none', borderRadius: 999, fontWeight: 800, fontSize: 15,
        boxShadow: '0 12px 34px rgba(0,0,0,.45)', cursor: 'pointer',
        maxWidth: 'calc(100vw - 28px)', whiteSpace: 'nowrap',
        userSelect: 'none', WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}
    >
      🎉 새 버전이 나왔어요 · 지금 업데이트
    </button>
  )
}
