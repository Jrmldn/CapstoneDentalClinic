import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // 1. Fetch user role from database
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      // 2. Route them based on their verified role
      const role = userData?.role

      if (role === 'superadmin') {
        return NextResponse.redirect(new URL('/superadmin-dashboard', request.url))
      } 
      
      if (role === 'staff') {
        return NextResponse.redirect(new URL('/staff-dashboard', request.url))
      }
      
      if (role === 'dentist') {
        return NextResponse.redirect(new URL('/dentist-dashboard', request.url))
      }

      // 3. Fallback route for patients with clinic verification
      try {
        const clinicId = searchParams.get('clinic')

        if (!clinicId) {
          return NextResponse.redirect(new URL('/', request.url))
        }

        // Verify patient exists
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (patientError || !patientData) {
          return NextResponse.redirect(new URL('/', request.url))
        }

        cookieStore.set('clinic_id', clinicId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })
        return NextResponse.redirect(new URL(`/patient-dashboard?clinic=${clinicId}`, request.url))
      } catch {
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
      }
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}