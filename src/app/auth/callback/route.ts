import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

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

  // 1. Determine how they logged in
  if (code) {
    // A: They clicked an email link or used Google (we exchange the code)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) sessionUser = data.user
  } else {
    // B: They used standard Email/Password in the widget (session is already set)
    const { data } = await supabase.auth.getUser()
    sessionUser = data.user
  }

  // 2. If we successfully found the user, run the Gatekeeper routing
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
        return NextResponse.redirect(new URL(`/login?error=Unauthorized: You do not work at this clinic.`, request.url))
      }

      const nextPath = role === 'staff' ? '/staff-dashboard' : '/dentist-dashboard'
      return NextResponse.redirect(new URL(nextPath, request.url))
    }

    // Patient Routing
    if (role === 'patient') {
      try {
        // IMPORTANT: If they don't have a clinic ID, we send them to a clinic selector page, 
        // OR default them to the dashboard without a clinic. 
        // For now, let's just send them to the patient dashboard.
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
        return NextResponse.redirect(new URL('/login?error=patient_routing_failed', request.url))
      }
    }
  }

  // Fallback if NO code and NO session are found
  return NextResponse.redirect(new URL('/login?error=auth_failed_no_session', request.url))
}
