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
    // This listens for the silent password login and forces the redirect!
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        const callbackUrl = clinicId ? `/auth/callback?clinic=${clinicId}` : '/auth/callback'
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
