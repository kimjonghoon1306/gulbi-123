const ALLOWED_TAGS = new Set([
  'a', 'b', 'br', 'button', 'div', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4',
  'hr', 'i', 'iframe', 'img', 'li', 'ol', 'p', 'section', 'small', 'span', 'strong',
  'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
])

// 이 태그들은 자식(텍스트) 째로 통째 제거한다. 태그만 벗기면 CSS/JS 코드가 본문에 텍스트로 새어나온다.
const DROP_WITH_CONTENT = new Set([
  'style', 'script', 'head', 'title', 'meta', 'link', 'noscript', 'template', 'pre', 'code',
])

const GLOBAL_ATTRS = new Set(['class', 'id', 'style', 'title', 'aria-label', 'role', 'data-landing', 'data-template', 'data-base-price', 'data-showcase', 'data-style', 'data-layout', 'data-kind'])
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding']),
  iframe: new Set(['src', 'allow', 'allowfullscreen', 'frameborder', 'loading']),
}

function isSafeUrl(value: string, tag: string) {
  const trimmed = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, '')
  if (!trimmed) return false
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return true
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    if (tag !== 'iframe') return true
    return /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\//i.test(trimmed)
  }
  return tag === 'img' && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed)
}

function isSafeStyle(value: string) {
  return !/(expression|javascript:|vbscript:|data:text\/html|@import|behavior\s*:)/i.test(value)
}

function isSafeShowcaseCss(value: string) {
  return value.length <= 80_000
    && !/(expression|javascript:|vbscript:|data:text\/html|@import|behavior\s*:|<\/style)/i.test(value)
}

function unwrapCodeFences(html: string) {
  return html.replace(/```(?:html|css|javascript|js)?\s*([\s\S]*?)```/gi, (_, body) => String(body).trim())
}

function stripEscapedDroppedBlocks(html: string) {
  return html
    .replace(/&lt;(style|script)[^&]*?&gt;[\s\S]*?&lt;\/\1&gt;/gi, '')
    .replace(/&lt;\/?(style|script)[^&]*?&gt;/gi, '')
}

function isLikelyRawCodeText(value: string) {
  const text = value.trim()
  if (!text) return false
  if (/^```/.test(text)) return true
  if (/^<\/?(style|script|html|head|body)\b/i.test(text)) return true
  if (/@import\s+url\(|<\/?script\b|<\/?style\b/i.test(text)) return true
  if (/(^|\n)\s*(body|html|\[[^\]]+\]|[#.][A-Za-z0-9_-]+)[^{\n]*\{[^}]*:[^}]*}/.test(text)) return true
  if (/(console\.|function\s*\(|=>\s*\{|document\.|window\.)/.test(text) && /[{};]/.test(text)) return true
  return false
}

export function sanitizeHtml(html: string) {
  if (typeof window === 'undefined' || !html) return ''

  const template = document.createElement('template')
  template.innerHTML = stripEscapedDroppedBlocks(unwrapCodeFences(html))

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove()
        continue
      }
      if (child.nodeType === Node.TEXT_NODE) {
        if (isLikelyRawCodeText(child.textContent || '')) child.remove()
        continue
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue

      const el = child as HTMLElement
      const tag = el.tagName.toLowerCase()
      // AI STUDIO가 생성한 쇼케이스 루트 안의 자체 CSS만 제한적으로 보존한다.
      // 일반 상품 HTML의 임의 style 태그는 아래 DROP_WITH_CONTENT 규칙으로 계속 차단한다.
      if (tag === 'style') {
        const inShowcase = !!el.parentElement?.closest('[data-showcase]')
        if (!inShowcase || !isSafeShowcaseCss(el.textContent || '')) el.remove()
        continue
      }
      if (DROP_WITH_CONTENT.has(tag)) {
        el.remove()
        continue
      }
      if (!ALLOWED_TAGS.has(tag)) {
        el.replaceWith(...Array.from(el.childNodes))
        continue
      }

      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase()
        const allowed = GLOBAL_ATTRS.has(name) || TAG_ATTRS[tag]?.has(name)
        if (!allowed || name.startsWith('on')) {
          el.removeAttribute(attr.name)
          continue
        }
        if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value, tag)) {
          el.removeAttribute(attr.name)
          continue
        }
        if (name === 'style' && !isSafeStyle(attr.value)) {
          el.removeAttribute(attr.name)
        }
      }

      if (tag === 'a' && el.getAttribute('target') === '_blank') {
        el.setAttribute('rel', 'noopener noreferrer')
      }
      // 화면 아래의 상세 이미지·영상은 진입 렌더링과 네트워크를 막지 않는다.
      if (tag === 'img') {
        if (!el.hasAttribute('loading')) el.setAttribute('loading', 'lazy')
        el.setAttribute('decoding', 'async')
      }
      if (tag === 'iframe' && !el.hasAttribute('loading')) el.setAttribute('loading', 'lazy')
      walk(el)
    }
  }

  walk(template.content)
  return template.innerHTML
}
