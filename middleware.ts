import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // 현재 사용자가 관리자인지 (admin_users 허용목록 기반 is_admin() 함수)
  const checkAdmin = async () => {
    if (!user) return false
    const { data } = await supabase.rpc('is_admin')
    return data === true
  }
  // 현재 사용자가 승인된 공급사인지
  const supplierStatus = async () => {
    if (!user) return null
    const { data } = await supabase.from('suppliers').select('status').eq('id', user.id).maybeSingle()
    return data?.status ?? null
  }
  const isApprovedSupplier = (s: string | null) => !!s && s !== '대기중' && s !== '거절'

  // ── 어드민 라우트 ──────────────────────────────────────
  // 로그인 + 관리자 허용목록에 있어야만 통과. (예전엔 로그인만 하면 통과 → 손님도 접근됐음)
  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
    if (!(await checkAdmin())) return NextResponse.redirect(new URL('/shop', request.url))
  }

  if (pathname === '/auth/login' && user) {
    // 관리자만 대시보드로, 그 외 로그인 사용자는 쇼핑몰로
    if (await checkAdmin()) return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    return NextResponse.redirect(new URL('/shop', request.url))
  }

  // ── 공급업체 라우트 ────────────────────────────────────
  const isSupplierPublic =
    pathname === '/supplier/login' ||
    pathname === '/supplier/register'

  if (pathname.startsWith('/supplier') && !isSupplierPublic) {
    if (!user) return NextResponse.redirect(new URL('/supplier/login', request.url))
    // 승인된 공급사가 아니면(손님/미승인) 접근 차단
    if (!isApprovedSupplier(await supplierStatus())) {
      return NextResponse.redirect(new URL('/supplier/login', request.url))
    }
  }

  if (pathname === '/supplier/login' && user) {
    // 이미 로그인된 승인 공급사만 대시보드로
    if (isApprovedSupplier(await supplierStatus())) {
      return NextResponse.redirect(new URL('/supplier/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/auth/login', '/supplier/:path*'],
}
