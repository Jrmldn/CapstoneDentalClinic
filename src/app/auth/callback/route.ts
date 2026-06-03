import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') // Catches the secure PKCE redirect

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Safe to ignore in Server Component
          }
        },
      },
    }
  )

  let sessionUser = null;

  // 1. Standard Code Exchange (Handles BOTH Logins and Password Resets securely)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      sessionUser = data.user

      // Intercept the Password Reset Flow
      if (next === '/update-password') {
        return NextResponse.redirect(new URL('/update-password', request.url))
      }
    } else {
      // Clean Error Code 1
      return NextResponse.redirect(new URL('/login?error=INVALID_LINK', request.url))
    }
  } 
  // 2. Already logged in (e.g., coming from the Update Password page)
  else {
    const { data } = await supabase.auth.getUser()
    sessionUser = data.user
  }

  // Gatekeeper Routing (Roles & Clinics)
  if (sessionUser) {
    // Fetch user role from database
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', sessionUser.id)
      .maybeSingle()

    const role = userData?.role
    const attemptedClinicId = searchParams.get('clinic')

    // Superadmin Routing
    if (role === 'superadmin') {
      return NextResponse.redirect(new URL('/superadmin-dashboard', request.url))
    } 
    
    // Staff and Dentist Routing with Cross-Clinic Check
    if (role === 'staff' || role === 'dentist') {
      const targetTable = role === 'staff' ? 'clinic_staff' : 'dentists'
      
      const { data: personnelData } = await supabase
        .from(targetTable)
        .select('clinic_id')
        .eq('user_id', sessionUser.id)
        .maybeSingle()

      if (personnelData && attemptedClinicId && personnelData.clinic_id.toString() !== attemptedClinicId) {
        await supabase.auth.signOut()
        // Clean Error Code 2
        return NextResponse.redirect(new URL(`/login?error=UNAUTHORIZED_CLINIC`, request.url))
      }

      const nextPath = role === 'staff' ? '/staff-dashboard' : '/dentist-dashboard'
      return NextResponse.redirect(new URL(nextPath, request.url))
    }

    // Patient Routing
    if (role === 'patient') {
      try {
        const targetUrl = attemptedClinicId 
          ? `/patient-dashboard?clinic=${attemptedClinicId}`
          : `/patient-dashboard`

        // Verify patient exists
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', sessionUser.id)
          .maybeSingle()

        if (patientError || !patientData) {
            await new Promise(resolve => setTimeout(resolve, 500)) 
        }

        if (attemptedClinicId) {
          cookieStore.set('clinic_id', attemptedClinicId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
        }
        
        return NextResponse.redirect(new URL(targetUrl, request.url))
      } catch {
        // Clean Error Code 3
        return NextResponse.redirect(new URL('/login?error=PATIENT_ROUTING_FAILED', request.url))
      }
    }
  }

  // Clean Error Code 4 (Fallback if NO code and NO session are found)
  return NextResponse.redirect(new URL('/login?error=NO_SESSION', request.url))
}