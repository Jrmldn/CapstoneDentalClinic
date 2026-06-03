'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { AUTH_ERRORS, AuthErrorCode } from '@/lib/errorMessages'

export function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const clinicId = searchParams.get('clinic')

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)

  // Grab the error object containing both a title and a message
  const errorCode = searchParams.get('error') as AuthErrorCode | null
  const errorData = errorCode ? (AUTH_ERRORS[errorCode] || AUTH_ERRORS.DEFAULT) : null

  useEffect(() => {
    if (errorData) {
      setIsErrorModalOpen(true)
    }
  }, [errorData])

  const redirectTo = clinicId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?clinic=${clinicId}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/update-password')
        return
      }

      if (event === 'SIGNED_IN') {
        if (typeof document !== 'undefined' && document.hidden) {
          return;
        }

        const callbackUrl = clinicId
          ? `/auth/callback?clinic=${clinicId}`
          : '/auth/callback'
        router.push(callbackUrl)
      }
    })

    return () => subscription.unsubscribe()
  }, [clinicId, router])

  return (
    <div className="w-full max-w-md mx-auto">
      
      {/* Reusable Modal (No Blur Backdrop) */}
      {isErrorModalOpen && errorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              
              {/* Warning Icon */}
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              {/* Dynamic Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{errorData.title}</h3>
              <p className="text-gray-600 text-sm">{errorData.message}</p>
              
              <button
                onClick={() => setIsErrorModalOpen(false)}
                className="mt-6 w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}