'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

function UpdatePasswordForm() {
  const searchParams = useSearchParams()
  const clinic = searchParams.get('clinic')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // This page is only reachable with the session the /auth/callback established
  // from a valid reset/invite link. Guard against direct navigation (no session)
  // so the user gets a clear message instead of a cryptic updateUser error.
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthorized(!!data.session)
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)

      // Graceful delay allowing the user to view the confirmation state
      setTimeout(() => {
        //  Path Realignment: Routes directly to our verified server actions path (/auth/callback)
        const callbackPath = clinic ? `/auth/callback?clinic=${clinic}` : '/auth/callback'
        window.location.href = callbackPath
      }, 1500)

    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl p-8 text-center">
        <p className="text-gray-500 text-sm">Verifying your reset link...</p>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Link expired or invalid</h2>
        <p className="text-gray-500 text-sm mb-6">
          This password reset link has expired or was already used. Please request a new one.
        </p>
        <a
          href="/login"
          className="inline-block py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Back to login
        </a>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
      <div className="text-center mb-6">
        {/* Secure Lock Shield Icon */}
        <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">AppointDent</h2>
        <p className="text-gray-500 text-sm mt-1">Set your new account password</p>
      </div>

      {success ? (
        <div className="text-center py-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-600 font-semibold">Password updated successfully!</p>
          <p className="text-gray-500 text-xs mt-1">Redirecting to your secured dashboard...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2 text-red-600 text-sm animate-in shake duration-200">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center p-8 text-gray-500 text-sm">Loading...</div>}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  )
}