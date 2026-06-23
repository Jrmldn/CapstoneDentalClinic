'use client'

import { useState } from 'react'
import { requestPasswordReset } from '@/actions/passwordResetActions'

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void
}

export default function ForgotPasswordForm({ onBackToSignIn }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    setIsLoading(true)
    setError(null)

    const res = await requestPasswordReset(email.trim())
    if (!res.success) {
      setError(res.error ?? 'Failed to send reset email. Please try again.')
      setIsLoading(false)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
        <p className="text-gray-500 text-sm mb-6">
          We sent a password reset link to <span className="font-medium text-gray-700">{email}</span>.
          Click it to set a new password.
        </p>
        <button
          onClick={() => {
            setSuccess(false)
            setEmail('')
            onBackToSignIn()
          }}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Reset Password</h1>
      <p className="text-center text-gray-600 mb-8">
        Enter your email to receive a password reset link
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-normal text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(null)
            }}
            placeholder="name@example.com"
            className={`w-full px-3 py-2 text-sm border rounded bg-transparent outline-none transition-colors ${
              error
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-gray-400 focus:outline-none bg-white'
            }`}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
            text-white text-sm font-normal rounded transition-colors mt-2"
        >
          {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        <button
          onClick={onBackToSignIn}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Back to Sign In
        </button>
      </p>
    </div>
  )
}
