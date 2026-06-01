'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export function LoginForm() {
  const searchParams = useSearchParams()
  const clinicId = searchParams.get('clinic')

  const redirectTo = clinicId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?clinic=${clinicId}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`

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
