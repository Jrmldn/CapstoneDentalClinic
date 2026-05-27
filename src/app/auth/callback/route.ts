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
      const user = data.user

      // Check role for superadmin redirect
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role === 'superadmin') {
        return NextResponse.redirect(new URL('/superadmin-portal', request.url))
      }

      // For Google OAuth users, auto-create a patients row if one doesn't exist
      if (user.app_metadata.provider === 'google') {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('user_id')
          .eq('user_id', user.id)
          .single()

        if (!existingPatient) {
          const fullName = user.user_metadata.full_name ?? ''
          const nameParts = fullName.trim().split(' ')
          const firstName = nameParts[0] ?? ''
          const lastName = nameParts.slice(1).join(' ') ?? ''

          await supabase.from('patients').insert({
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            email: user.email,
          })
        }
      }

      return NextResponse.redirect(new URL('/patient-dashboard', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}