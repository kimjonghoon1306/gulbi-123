const SUPABASE_PUBLIC_MARKER = '/storage/v1/object/public/'

export function optimizedImageUrl(src: string, width: number, quality = 72): string {
  if (!src || !src.includes(SUPABASE_PUBLIC_MARKER)) return src

  try {
    const url = new URL(src)
    url.pathname = url.pathname.replace(SUPABASE_PUBLIC_MARKER, '/storage/v1/render/image/public/')
    url.searchParams.set('width', String(width))
    url.searchParams.set('quality', String(quality))
    url.searchParams.set('resize', 'cover')
    return url.toString()
  } catch {
    return src
  }
}

export function responsiveImageSrcSet(src: string, widths: number[], quality = 72): string | undefined {
  if (!src.includes(SUPABASE_PUBLIC_MARKER)) return undefined
  return widths.map(width => `${optimizedImageUrl(src, width, quality)} ${width}w`).join(', ')
}
