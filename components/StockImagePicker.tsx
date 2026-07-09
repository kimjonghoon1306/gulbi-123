'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { STOCK_IMAGES, STOCK_GROUPS } from '@/lib/stockImages'

// 대표 이미지가 없는 판매자를 위한 "무료 이미지 라이브러리" 선택 버튼 + 모달.
// 기존 업로드 기능은 그대로 두고, 이 버튼만 추가로 붙인다. 고르면 onPick(정적 URL) 호출.
export default function StockImagePicker({ onPick, dark = false }: { onPick: (url: string) => void; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const [group, setGroup] = useState<(typeof STOCK_GROUPS)[number]>('전체')
  const [picked, setPicked] = useState('')
  const [pressed, setPressed] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const list = useMemo(
    () => (group === '전체' ? STOCK_IMAGES : STOCK_IMAGES.filter((i) => i.group === group)),
    [group]
  )

  function choose(src: string) {
    setPicked(src)
    onPick(src)
    setTimeout(() => setOpen(false), 400) // 체크 확인 후 닫기
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
          fontSize: 14, fontWeight: 700, color: '#fff', border: 'none',
          background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
        }}
      >
        🖼 대표 이미지가 없나요? 무료 이미지에서 고르기
      </button>

      {open && mounted && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 720, maxHeight: '88vh',
              overflow: 'hidden', borderRadius: 16, boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
              background: dark ? '#102a1d' : '#fff', color: dark ? '#eaf5ee' : '#111',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', flex: '0 0 auto', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
              <b style={{ fontSize: 15 }}>🖼 무료 이미지 라이브러리</b>
              <span style={{ fontSize: 12, color: dark ? '#86a394' : '#999' }}>탭하면 바로 적용돼요</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="닫기"
                style={{ marginLeft: 'auto', fontSize: 24, lineHeight: 1, cursor: 'pointer', padding: '2px 8px', background: 'none', border: 'none', color: dark ? '#86a394' : '#666' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px 0', flex: '0 0 auto' }}>
              {STOCK_GROUPS.map((g) => (
                <button key={g} type="button" onClick={() => setGroup(g)}
                  style={{
                    borderRadius: 999, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                    color: group === g ? '#fff' : (dark ? '#cfe6d8' : '#555'),
                    background: group === g ? '#16a34a' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  }}>
                  {g}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10, overflowY: 'auto', padding: 16, flex: 1, minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
              {list.map((img) => {
                const isPicked = picked === img.src
                const isPressed = pressed === img.src
                return (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => choose(img.src)}
                    onPointerDown={() => setPressed(img.src)}
                    onPointerUp={() => setPressed('')}
                    onPointerLeave={() => setPressed('')}
                    title={img.cat}
                    style={{
                      position: 'relative', width: '100%', height: 0, paddingBottom: '100%', overflow: 'hidden', borderRadius: 12,
                      border: isPicked ? '3px solid #16a34a' : '1px solid rgba(0,0,0,0.1)', background: '#f1f1f4', cursor: 'pointer', display: 'block',
                      transform: isPressed ? 'scale(0.92)' : 'scale(1)', transition: 'transform .12s ease, border-color .12s ease, box-shadow .12s ease',
                      boxShadow: isPicked ? '0 0 0 4px rgba(22,163,74,0.25)' : 'none',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.cat} loading="lazy" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '3px 7px', fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'left', background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)', pointerEvents: 'none' }}>{img.cat}</span>
                    {isPicked && (
                      <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(22,163,74,0.32)', pointerEvents: 'none' }}>
                        <span style={{ width: 34, height: 34, borderRadius: 999, background: '#16a34a', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 19, fontWeight: 900, boxShadow: '0 3px 8px rgba(0,0,0,0.3)' }}>✓</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
