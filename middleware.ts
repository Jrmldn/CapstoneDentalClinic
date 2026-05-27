import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // REQUIRED: refreshes the session so server components can read it
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /patient-dashboard
  if (!user && request.nextUrl.pathname.startsWith('/patient-dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect /superadmin-portal
  if (!user && request.nextUrl.pathname.startsWith('/superadmin-portal')) {
    return NextResponse.redirect(new URL('/admin-login', request.url))
  }

  // Redirect already-logged-in users away from login pages
  if (user) {
    if (request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/patient-dashboard', request.url))
    }
    if (request.nextUrl.pathname === '/admin-login') {
      return NextResponse.redirect(new URL('/superadmin-portal', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}