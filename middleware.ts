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

  // 1. Refresh session and get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const userRole = user?.user_metadata?.role // Adjust this key based on how you store user roles (e.g., 'patient' or 'superadmin')

  // --- 2. PROTECTION LOOKUPS (Not logged in) ---
  if (!user) {
    if (pathname.startsWith('/patient-dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (pathname.startsWith('/superadmin-dashboard')) {
      return NextResponse.redirect(new URL('/superadmin-login', request.url))
    }
  }

  // --- 3. ROLE ENFORCEMENT (Logged in, but trying to cross boundaries) ---
  if (user) {
    // Stop patients from accessing superadmin files
    if (pathname.startsWith('/superadmin-dashboard') && userRole !== 'superadmin') {
      return NextResponse.redirect(new URL('/superadmin-login', request.url))
    }
    
    // Stop superadmins from accessing patient files
    if (pathname.startsWith('/patient-dashboard') && userRole !== 'patient') {
      return NextResponse.redirect(new URL('/superadmin-login', request.url))
    }

    // --- 4. REDIRECTS AWAY FROM AUTH PAGES ---
    // Safely route authenticated users back to their respective dashboards
    if (pathname === '/login' || pathname === '/superadmin-login') {
      const destination = userRole === 'superadmin' ? '/superadmin-dashboard' : '/patient-dashboard'
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  // Explicitly list routes that MUST run through the middleware
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/patient-dashboard/:path*',
    '/superadmin-dashboard/:path*',
  ],
}