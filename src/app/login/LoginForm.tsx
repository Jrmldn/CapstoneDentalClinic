'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const clinicId = searchParams.get('clinic')

  const redirectTo = clinicId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?clinic=${clinicId}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery flow: go straight to the update-password page.
        // Do NOT let the SIGNED_IN handler below run for this session.
        router.push('/update-password')
        return
      }

      if (event === 'SIGNED_IN') {
        // Normal login only — recovery sessions are handled above.
        const callbackUrl = clinicId
          ? `/auth/callback?clinic=${clinicId}`
          : '/auth/callback'
        router.push(callbackUrl)
      }
    })

    return () => subscription.unsubscribe()
  }, [clinicId, router])

  return (
    <Auth
      supabaseClient={supabase}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#4F46E5',
              brandAccent: '#4338CA',
            },
          },
        },
      }}
      providers={['google']}
      redirectTo={redirectTo}
      localization={{
        variables: {
          sign_up: {
            email_label: 'Email',
            password_label: 'Password',
            button_label: 'Sign Up',
          },
          sign_in: {
            email_label: 'Email',
            password_label: 'Password',
            button_label: 'Sign In',
          },
        },
      }}
    />
  )
}
