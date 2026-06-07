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

  // ── 어드민 라우트 ──────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (pathname.startsWith('/auth/login') && user) {
    // 어드민이 로그인 페이지 접근 시 대시보드로
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // ── 공급업체 라우트 ────────────────────────────────────
  const isSupplierPublic =
    pathname === '/supplier/login' ||
    pathname === '/supplier/register'

  if (pathname.startsWith('/supplier') && !isSupplierPublic) {
    if (!user) {
      return NextResponse.redirect(new URL('/supplier/login', request.url))
    }
  }

  if (pathname === '/supplier/login' && user) {
    // 이미 로그인된 공급업체가 로그인 페이지 접근 시 대시보드로
    return NextResponse.redirect(new URL('/supplier/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/auth/login', '/supplier/:path*'],
}
