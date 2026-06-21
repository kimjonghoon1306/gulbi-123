const ALLOWED_TAGS = new Set([
  'a', 'b', 'br', 'button', 'div', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4',
  'hr', 'i', 'iframe', 'img', 'li', 'ol', 'p', 'section', 'small', 'span', 'strong',
  'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
])

const GLOBAL_ATTRS = new Set(['class', 'id', 'style', 'title', 'aria-label', 'role'])
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  iframe: new Set(['src', 'allow', 'allowfullscreen', 'frameborder']),
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

export function sanitizeHtml(html: string) {
  if (typeof window === 'undefined' || !html) return ''

  const template = document.createElement('template')
  template.innerHTML = html

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove()
        continue
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue

      const el = child as HTMLElement
      const tag = el.tagName.toLowerCase()
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
      walk(el)
    }
  }

  walk(template.content)
  return template.innerHTML
}
