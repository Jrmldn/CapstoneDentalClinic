import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash') // ◄ Catch native email token hashes
  const type = searchParams.get('type')
  const next = searchParams.get('next')
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

  let sessionUser = null
  let isRecoveryFlow = false

  // 1. Core Authentication Layer (Supports PKCE Codes and Email Token Hashes)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session) {
      sessionUser = data.user

      // Decode JWT payload to check for native 'recovery' claims
      try {
        const base64Payload = data.session.access_token.split('.')[1]
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString())

        if (payload.amr?.includes('recovery')) {
          isRecoveryFlow = true
        }
      } catch (jwtError) {
        console.error('JWT AMR Parse Error:', jwtError)
      }
    }
  } else if (tokenHash && type) {
    // 🏆 Fallback: Handle direct email link hash confirmations securely
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    })

    if (!error && data?.user) {
      sessionUser = data.user
      if (type === 'recovery') {
        isRecoveryFlow = true
      }
    }
  } else {
    // Fallback context validation for active browser sessions
    const { data } = await supabase.auth.getUser()
    sessionUser = data.user
  }

  // 2. Intercept and Route Password Resets Immediately
  if (sessionUser && (next === '/update-password' || type === 'recovery' || isRecoveryFlow)) {
    const updateUrl = new URL('/update-password', request.url)
    const clinic = searchParams.get('clinic')

    if (clinic) {
      updateUrl.searchParams.set('clinic', clinic)
    }

    return NextResponse.redirect(updateUrl)
  }

  // 3. Gatekeeper Routing (Roles & Clinic Access Isolation)
  if (sessionUser) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', sessionUser.id)
      .maybeSingle()

    const role = userData?.role
    const attemptedClinicId = searchParams.get('clinic')

    if (role === 'superadmin') {
      return NextResponse.redirect(new URL('/superadmin-dashboard', request.url))
    }

    if (role === 'staff' || role === 'dentist') {
      const targetTable = role === 'staff' ? 'clinic_staff' : 'dentists'

      const { data: personnelData } = await supabase
        .from(targetTable)
        .select('clinic_id')
        .eq('user_id', sessionUser.id)
        .maybeSingle()

      if (personnelData && attemptedClinicId && personnelData.clinic_id.toString() !== attemptedClinicId) {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL(`/login?error=UNAUTHORIZED_CLINIC`, request.url))
      }

      const nextPath = role === 'staff' ? '/staff-dashboard' : '/dentist-dashboard'
      return NextResponse.redirect(new URL(nextPath, request.url))
    }

    if (role === 'patient') {
      try {
        if (attemptedClinicId) {
          cookieStore.set('clinic_id', attemptedClinicId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
        }

        const { data: patientData } = await supabase
          .from('patients')
          .select('id, phone')
          .eq('user_id', sessionUser.id)
          .maybeSingle()

        // If the patient has no phone (newly registered), send to profile to complete details
        const isNewPatient =
          !patientData ||
          !patientData.phone ||
          patientData.phone.trim() === '' ||
          // Guard against UUIDs accidentally stored in phone field
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientData.phone)

        const targetUrl = isNewPatient
          ? `/patient-dashboard/profile?onboarding=true`
          : attemptedClinicId
          ? `/patient-dashboard?clinic=${attemptedClinicId}`
          : `/patient-dashboard`

        return NextResponse.redirect(new URL(targetUrl, request.url))
      } catch {
        return NextResponse.redirect(new URL('/login?error=PATIENT_ROUTING_FAILED', request.url))
      }
    }
  }

  // Fallback Catchall for Unauthenticated/Mismatched Actions
  return NextResponse.redirect(new URL('/login?error=NO_SESSION', request.url))
}