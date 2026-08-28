'use client'

import { useEffect, useRef } from 'react'

// 파일 → 리사이즈 dataURL(용량 억제)
function resizeToDataUrl(file: File, maxPx = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('image load failed'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          if (width >= height) { height = Math.round(height * (maxPx / width)); width = maxPx }
          else { width = Math.round(width * (maxPx / height)); height = maxPx }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(String(reader.result))
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

/**
 * STUDIO 미리보기의 각 <img>에 호버하면 "🔄 교체 / ✨AI채우기 / ✕ 삭제" 버튼을 띄운다.
 * - 삭제: 엉뚱한 자동 이미지를 바로 지울 수 있게.
 * - 교체: 내 사진으로 바꾸기.
 * - AI채우기: 그 이미지를 AI가 생성한 새 컷으로 교체(onAiFill 콜백).
 * htmlKey 바뀌면(재렌더) 다시 부착.
 */
export function useStudioImageTools(
  previewId: string, active: boolean, htmlKey: string,
  handlers?: {
    onAiFill?: (img: HTMLImageElement) => void
    onEnhance?: (img: HTMLImageElement) => void
    onCutout?: (img: HTMLImageElement) => void
  },
) {
  // 핸들러를 ref로 안정화(매 렌더 새 객체여도 useEffect 재실행 안 되게)
  const hRef = useRef(handlers)
  hRef.current = handlers
  const onAiFill = handlers?.onAiFill ? (img: HTMLImageElement) => hRef.current?.onAiFill?.(img) : undefined
  const onEnhance = handlers?.onEnhance ? (img: HTMLImageElement) => hRef.current?.onEnhance?.(img) : undefined
  const onCutout = handlers?.onCutout ? (img: HTMLImageElement) => hRef.current?.onCutout?.(img) : undefined
  useEffect(() => {
    if (!active) return
    const container = document.getElementById(previewId)
    if (!container) return

    // 파일 입력(교체용)
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; input.style.display = 'none'
    document.body.appendChild(input)
    let target: HTMLImageElement | null = null
    input.onchange = async () => {
      const file = input.files?.[0]; input.value = ''
      if (!file || !target) return
      const t = target; target = null
      t.style.opacity = '0.4'
      try { t.src = await resizeToDataUrl(file); t.removeAttribute('srcset') } catch {}
      finally { t.style.opacity = '' }
    }

    // 각 이미지를 래핑해 호버 툴바 부착
    const attach = (img: HTMLImageElement) => {
      if (img.dataset.stTooled) return
      img.dataset.stTooled = '1'
      const wrap = img.parentElement
      if (!wrap) return
      // 부모를 relative로(툴바 절대배치 기준)
      if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative'

      const bar = document.createElement('div')
      bar.contentEditable = 'false'
      bar.style.cssText = 'position:absolute;top:10px;right:10px;left:10px;z-index:20;display:none;flex-wrap:wrap;justify-content:flex-end;gap:7px'
      bar.className = 'st-imgtools'

      const mkBtn = (label: string, bg: string) => {
        const btn = document.createElement('button')
        btn.type = 'button'; btn.textContent = label
        btn.style.cssText = `display:inline-flex;align-items:center;gap:4px;padding:8px 11px;border:none;border-radius:8px;background:${bg};color:#fff;font-size:12.5px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4)`
        return btn
      }
      const swapBtn = mkBtn('🔄 교체', 'rgba(20,20,20,.85)')
      const enhBtn = mkBtn('🔍 선명하게', 'rgba(20,20,20,.85)')
      const cutBtn = mkBtn('✂️ 배경정리', 'rgba(20,20,20,.85)')
      const aiBtn = mkBtn('✨ AI 채우기', '#12b76a')
      const delBtn = mkBtn('✕ 삭제', '#e53935')
      swapBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); target = img; input.click() }
      enhBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); onEnhance?.(img) }
      cutBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); onCutout?.(img) }
      aiBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); onAiFill?.(img) }
      delBtn.onclick = (e) => {
        e.preventDefault(); e.stopPropagation()
        const sec = img.closest('section, figure') as HTMLElement | null
        ;(sec && container.contains(sec) ? sec : wrap).remove()
      }
      bar.appendChild(swapBtn)
      if (onEnhance) bar.appendChild(enhBtn)
      if (onCutout) bar.appendChild(cutBtn)
      if (onAiFill) bar.appendChild(aiBtn)
      bar.appendChild(delBtn)
      wrap.appendChild(bar)

      const show = () => { bar.style.display = 'flex' }
      const hide = () => { bar.style.display = 'none' }
      wrap.addEventListener('mouseenter', show)
      wrap.addEventListener('mouseleave', hide)
      // 터치(아이패드): 이미지 탭하면 툴바 토글
      img.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); bar.style.display = bar.style.display === 'flex' ? 'none' : 'flex' })
      img.style.cursor = 'pointer'
    }

    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
    imgs.forEach(attach)

    return () => { input.remove() }
  }, [previewId, active, htmlKey])
}
