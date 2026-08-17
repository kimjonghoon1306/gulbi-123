'use client'

import { useEffect } from 'react'

// 파일을 최대 maxPx로 리사이즈해 dataURL(jpeg)로 변환 — 상세페이지 용량 억제.
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
 * 생성된 상세페이지 프리뷰(contentEditable div) 안의 <img>를 클릭하면 새 사진으로 교체.
 * - previewId: 프리뷰 컨테이너 id
 * - active: 지금 이 프리뷰가 보이고 편집 가능한 상태인지
 * - htmlKey: 상세 HTML(재생성 시 바뀜) — 바뀌면 이미지에 다시 힌트/핸들러 부착
 */
export function useLandingImageSwap(previewId: string, active: boolean, htmlKey: string) {
  useEffect(() => {
    if (!active) return
    const container = document.getElementById(previewId)
    if (!container) return

    let currentImg: HTMLImageElement | null = null
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    document.body.appendChild(input)

    input.onchange = async () => {
      const file = input.files?.[0]
      input.value = ''
      if (!file || !currentImg) return
      const target = currentImg
      currentImg = null
      target.style.opacity = '0.4'
      try {
        target.src = await resizeToDataUrl(file)
        target.removeAttribute('srcset')
      } catch {
        // 실패 시 원본 유지
      } finally {
        target.style.opacity = ''
      }
    }

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t && t.tagName === 'IMG') {
        e.preventDefault()
        e.stopPropagation()
        currentImg = t as HTMLImageElement
        input.click()
      }
    }

    // 이미지에 '교체 가능' 시각 힌트
    const imgs = Array.from(container.querySelectorAll('img'))
    imgs.forEach((img) => {
      img.style.cursor = 'pointer'
      img.setAttribute('title', '클릭하면 이 사진을 다른 사진으로 바꿀 수 있어요')
    })

    container.addEventListener('click', onClick, true)
    return () => {
      container.removeEventListener('click', onClick, true)
      input.remove()
    }
  }, [previewId, active, htmlKey])
}
