'use client'

import { useState, useEffect, useRef } from 'react'

export default function FloatingToolbar({ previewId }: { previewId: string }) {
  const [pos, setPos] = useState<{ x: number; y: number; placeBelow: boolean } | null>(null)
  const savedRange = useRef<Range | null>(null)

  useEffect(() => {
    const container = document.getElementById(previewId)
    if (!container) return

    const onSelect = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { setPos(null); return }
      const range = sel.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) { setPos(null); return }
      savedRange.current = range.cloneRange()
      const rect = range.getBoundingClientRect()
      const mobileToolbarWidth = Math.min(320, window.innerWidth - 16)
      const halfWidth = mobileToolbarWidth / 2
      const x = Math.min(window.innerWidth - halfWidth - 8, Math.max(halfWidth + 8, rect.left + rect.width / 2))
      const visibleTop = Math.max(8, container.getBoundingClientRect().top)
      const placeBelow = rect.top - 56 < visibleTop
      setPos({ x, y: placeBelow ? rect.bottom + 8 : rect.top - 8, placeBelow })
    }

    document.addEventListener('selectionchange', onSelect)
    return () => document.removeEventListener('selectionchange', onSelect)
  }, [previewId])

  const restore = () => {
    if (!savedRange.current) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    sel.addRange(savedRange.current)
  }

  const exec = (cmd: string, val?: string) => {
    restore()
    document.execCommand(cmd, false, val)
  }

  const applyColor = (color: string) => {
    restore()
    document.execCommand('foreColor', false, color)
  }

  if (!pos) return null

  const Sep = () => (
    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />
  )

  return (
    <div
      onPointerDown={e => e.preventDefault()}
      style={{
        position: 'fixed',
        left: pos.x, top: pos.y,
        transform: pos.placeBelow ? 'translateX(-50%)' : 'translate(-50%, -100%)',
        zIndex: 200000,
        display: 'flex', alignItems: 'center', gap: '2px',
        background: '#111', border: '1px solid rgba(200,169,110,0.4)',
        borderRadius: '10px', padding: '5px 6px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        flexWrap: 'wrap', width: 'max-content', maxWidth: 'calc(100vw - 16px)',
      }}
    >
      {[
        { cmd: 'bold',      label: <strong style={{ fontSize: '13px' }}>B</strong> },
        { cmd: 'italic',    label: <em style={{ fontSize: '13px' }}>I</em> },
        { cmd: 'underline', label: <u style={{ fontSize: '12px' }}>U</u> },
      ].map(({ cmd, label }) => (
        <button key={cmd} onClick={() => exec(cmd)}
          style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {label}
        </button>
      ))}

      <Sep />

      {[
        { color: '#1C1610', label: '먹' },
        { color: '#C8842D', label: '골드' },
        { color: '#DC2626', label: '빨강' },
        { color: '#1D4ED8', label: '파랑' },
        { color: '#FFFFFF', label: '흰색', border: true },
        { color: '#DB2777', label: '핑크' },
      ].map(({ color, label, border }) => (
        <button key={color} onClick={() => applyColor(color)} title={label}
          style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: color, cursor: 'pointer', border: 'none',
            outline: border ? '1.5px solid rgba(255,255,255,0.5)' : 'none',
            outlineOffset: '1px',
          }} />
      ))}

      <Sep />

      {[
        { size: '3', label: '작게' },
        { size: '5', label: '크게' },
        { size: '7', label: '매우크게' },
      ].map(({ size, label }) => (
        <button key={size} onClick={() => exec('fontSize', size)} title={label}
          style={{ padding: '0 5px', height: '26px', borderRadius: '5px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: `${9 + Number(size) * 1.5}px`, cursor: 'pointer', fontWeight: 700 }}>
          가
        </button>
      ))}

      <Sep />

      {[
        { cmd: 'justifyLeft',   label: '≡' },
        { cmd: 'justifyCenter', label: '☰' },
        { cmd: 'justifyRight',  label: '≣' },
      ].map(({ cmd, label }) => (
        <button key={cmd} onClick={() => exec(cmd)}
          style={{ width: '26px', height: '26px', borderRadius: '5px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.8)', fontSize: '14px', cursor: 'pointer' }}>
          {label}
        </button>
      ))}
    </div>
  )
}
