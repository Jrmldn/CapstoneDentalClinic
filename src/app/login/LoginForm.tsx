'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { AUTH_ERRORS, AuthErrorCode } from '@/lib/errorMessages'
import SignUpForm from './SignUpForm'
import ForgotPasswordForm from './ForgotPasswordForm'

type View = 'sign_in' | 'sign_up' | 'forgotten_password'

export function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const clinicId = searchParams.get('clinic')

  const errorCode = searchParams.get('error') as AuthErrorCode | null
  const errorData = errorCode ? (AUTH_ERRORS[errorCode] || AUTH_ERRORS.DEFAULT) : null

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(!!errorData)
  const [view, setView] = useState<View>('sign_in')

  const redirectTo = clinicId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?clinic=${clinicId}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        const recoveryUrl = clinicId ? `/update-password?clinic=${clinicId}` : '/update-password'
        router.push(recoveryUrl)
        return
      }

      if (event === 'SIGNED_IN') {
        if (typeof document !== 'undefined' && document.hidden) return
        const callbackUrl = clinicId ? `/auth/callback?clinic=${clinicId}` : '/auth/callback'
        window.location.href = callbackUrl
      }
    })

    return () => subscription.unsubscribe()
  }, [clinicId, router])

  return (
    <div className="w-full max-w-md mx-auto">

      {/* Error Modal */}
      {isErrorModalOpen && errorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{errorData.title}</h3>
              <p className="text-gray-600 text-sm">{errorData.message}</p>
              {errorCode === 'LINK_EXPIRED' ? (
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => { setIsErrorModalOpen(false); setView('forgotten_password') }}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Request a new link
                  </button>
                  <button
                    onClick={() => setIsErrorModalOpen(false)}
                    className="w-full py-2.5 px-4 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsErrorModalOpen(false)}
                  className="mt-6 w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Understood
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'sign_in' ? (
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            AppointDent
          </h1>
          <p className="text-center text-gray-600 mb-8">Patient Portal Login</p>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563EB',
                    brandAccent: '#1D4ED8',
                  },
                },
              },
            }}
            providers={['google']}
            redirectTo={redirectTo}
            view="sign_in"
            showLinks={false}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  email_input_placeholder: 'name@example.com',
                  password_label: 'Password',
                  password_input_placeholder: '•••••••••••',
                  button_label: 'Sign In',
                },
              },
            }}
          />
          <div className="text-center text-sm text-gray-500 mt-4 space-y-2">
            <p>
              <button
                onClick={() => setView('forgotten_password')}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Forgot your password?
              </button>
            </p>
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => setView('sign_up')}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      ) : view === 'forgotten_password' ? (
        <ForgotPasswordForm onBackToSignIn={() => setView('sign_in')} />
      ) : (
        <SignUpForm
          redirectTo={redirectTo}
          onSwitchToSignIn={() => setView('sign_in')}
        />
      )}
    </div>
  )
}
