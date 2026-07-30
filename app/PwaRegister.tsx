'use client'
import { useEffect, useState } from 'react'

// 온종일팜 PWA: 서비스워커 등록 + 새 배포 감지 시 "업데이트하세요" 배너
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
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaiting(reg.waiting); setShow(true)
      }
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing
        if (!nw) return
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(nw); setShow(true)
          }
        })
      })
    }).catch(() => {})
  }, [])

  if (!show) return null
  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 20, transform: 'translateX(-50%)',
      zIndex: 99999, display: 'flex', alignItems: 'center', gap: 14,
      padding: '11px 12px 11px 20px', background: '#0f2a17', color: '#fff',
      borderRadius: 999, fontWeight: 700, fontSize: 15,
      boxShadow: '0 12px 34px rgba(0,0,0,.45)', border: '1px solid rgba(34,197,94,.4)',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <span style={{ whiteSpace: 'nowrap' }}>🎉 새 버전이 나왔어요</span>
      <button
        onClick={() => { if (waiting) waiting.postMessage('skipWaiting'); else window.location.reload() }}
        style={{
          background: '#22c55e', color: '#052e12', border: 'none', borderRadius: 999,
          padding: '10px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer', flexShrink: 0,
        }}>
        업데이트하세요
      </button>
    </div>
  )
}
