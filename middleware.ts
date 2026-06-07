import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const userRole = user?.user_metadata?.role

  // 1. PROTECTION: If not logged in
  if (!user) {
    if (pathname.startsWith('/patient-dashboard') || pathname.startsWith('/staff-dashboard') || pathname.startsWith('/dentist-dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (pathname.startsWith('/superadmin-dashboard')) {
      return NextResponse.redirect(new URL('/superadmin-login', request.url))
    }
  }

  // 2. ROLE ENFORCEMENT (Logged in)
  if (user) {
    // A. Stop non-superadmins from entering superadmin-dashboard
    if (pathname.startsWith('/superadmin-dashboard') && userRole !== 'superadmin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // B. Allow Patients, Staff, and Dentists to access their dashboards.
    // We remove the strict "only patient" check here so staff/dentists don't get bounced.
    const isStaffOrDentistOrPatient = ['patient', 'staff', 'dentist'].includes(userRole || '')
    
    if (pathname.startsWith('/patient-dashboard') && !isStaffOrDentistOrPatient) {
       return NextResponse.redirect(new URL('/login', request.url))
    }

    // 3. REDIRECTS AWAY FROM AUTH PAGES
    if (pathname === '/login' || pathname === '/superadmin-login') {
      const destination = userRole === 'superadmin' 
        ? '/superadmin-dashboard' 
        : (userRole === 'staff' ? '/staff-dashboard' : '/patient-dashboard')
      
      const redirectUrl = new URL(destination, request.url)
      
      // Preserve search parameters (e.g. ?clinic=1)
      const clinicId = request.nextUrl.searchParams.get('clinic')
      if (clinicId) {
        redirectUrl.searchParams.set('clinic', clinicId)
      }

      const response = NextResponse.redirect(redirectUrl)

      // Automatically sync the clinic_id cookie for patient redirects
      if (clinicId && (userRole === 'patient' || !userRole)) {
        response.cookies.set('clinic_id', clinicId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })
      }

      return response
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/patient-dashboard/:path*',
    '/staff-dashboard/:path*',
    '/dentist-dashboard/:path*',
    '/superadmin-dashboard/:path*',
  ],
}