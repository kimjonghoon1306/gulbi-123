export function optimizedImageUrl(src: string, _width: number, _quality = 72): string {
  // 이 프로젝트의 Supabase Image Transformation은 403을 반환한다.
  // 공개 원본 주소를 그대로 사용해 상품·광고 이미지가 깨지지 않도록 한다.
  return src
}

export function responsiveImageSrcSet(_src: string, _widths: number[], _quality = 72): string | undefined {
  return undefined
}
