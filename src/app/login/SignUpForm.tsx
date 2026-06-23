'use client'

import { useState } from 'react'
import { signUpPatient } from '@/actions/authActions'
import { toDateKey } from '@/lib/date'
import TermsModal from './TermsModal'

interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  phone: string
  first_name: string
  last_name: string
  birthdate: string
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  phone?: string
  first_name?: string
  last_name?: string
  birthdate?: string
  terms?: string
  general?: string
}

interface SignUpFormProps {
  redirectTo: string
  onSwitchToSignIn: () => void
}

export default function SignUpForm({ redirectTo, onSwitchToSignIn }: SignUpFormProps) {
  const [form, setForm] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    first_name: '',
    last_name: '',
    birthdate: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  function validate(): boolean {
    const e: FormErrors = {}

    if (!form.first_name.trim()) e.first_name = 'First name is required'
    if (!form.last_name.trim()) e.last_name = 'Last name is required'

    if (!form.email.trim()) {
      e.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Enter a valid email address'
    }

    if (!form.phone.trim()) {
      e.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) {
      e.phone = 'Enter a valid phone number'
    }

    if (!form.birthdate) {
      e.birthdate = 'Date of birth is required'
    } else {
      const dob = new Date(form.birthdate)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      if (dob > today) e.birthdate = 'Date of birth cannot be in the future'
      else if (age > 120) e.birthdate = 'Enter a valid date of birth'
    }

    if (!form.password) {
      e.password = 'Password is required'
    } else if (form.password.length < 8) {
      e.password = 'Password must be at least 8 characters'
    }

    if (!form.confirmPassword) {
      e.confirmPassword = 'Please confirm your password'
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
    }

    if (!termsAccepted) e.terms = 'You must agree to the Terms and Conditions'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSignUp() {
    if (!validate()) return
    setIsLoading(true)
    setErrors({})

    try {
      const res = await signUpPatient({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        birthdate: form.birthdate,
        redirectTo,
      })

      if (!res.success) {
        setErrors({ general: res.error ?? 'Something went wrong. Please try again.' })
        return
      }

      setSignUpSuccess(true)
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (signUpSuccess) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
        <p className="text-gray-500 text-sm mb-6">
          We sent a confirmation link to <span className="font-medium text-gray-700">{form.email}</span>.
          Click it to activate your account.
        </p>
        <button
          onClick={() => { setSignUpSuccess(false); onSwitchToSignIn() }}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Create an account</h2>
      <p className="text-center text-gray-600 mb-8">Fill in your details to get started</p>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {errors.general}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-normal text-gray-600 mb-1">First Name</label>
            <input
              name="first_name"
              type="text"
              value={form.first_name}
              onChange={handleChange}
              placeholder="Juan"
              className={`w-full px-3 py-2 text-sm border rounded bg-transparent outline-none transition-colors
                ${errors.first_name
                  ? 'border-red-400 focus:border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-gray-400 focus:outline-none bg-white'
                }`}
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-600 mb-1">Last Name</label>
            <input
              name="last_name"
              type="text"
              value={form.last_name}
              onChange={handleChange}
              placeholder="dela Cruz"
              className={`w-full px-3 py-2 text-sm border rounded bg-transparent outline-none transition-colors
                ${errors.last_name
                  ? 'border-red-400 focus:border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-gray-400 focus:outline-none bg-white'
                }`}
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-normal text-gray-600 mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
            className={`w-full px-3 py-2 text-sm border rounded bg-transparent outline-none transition-colors
              ${errors.email
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-gray-400 focus:outline-none bg-white'
              }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-normal text-gray-600 mb-1">Phone Number</label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="0912 345 6789"
            className={`w-full px-3 py-2 text-sm border rounded bg-transparent outline-none transition-colors
              ${errors.phone
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-gray-400 focus:outline-none bg-white'
              }`}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-normal text-gray-600 mb-1">Date of Birth</label>
          <input
            name="birthdate"
            type="date"
            value={form.birthdate}
            onChange={handleChange}
            max={toDateKey()}
            className={`w-full px-3 py-2 text-sm border rounded bg-transparent outline-none transition-colors
              ${errors.birthdate
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-gray-400 focus:outline-none bg-white'
              }`}
          />
          {errors.birthdate && (
            <p className="mt-1 text-xs text-red-500">{errors.birthdate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-normal text-gray-600 mb-1">Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-3 py-2 text-sm border rounded bg-transparent outline-none transition-colors
              ${errors.password
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-gray-400 focus:outline-none bg-white'
              }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-normal text-gray-600 mb-1">Confirm Password</label>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-3 py-2 text-sm border rounded bg-transparent outline-none transition-colors
              ${errors.confirmPassword
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-gray-400 focus:outline-none bg-white'
              }`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => {
                setTermsAccepted(e.target.checked)
                if (errors.terms) setErrors(prev => ({ ...prev, terms: undefined }))
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Terms and Conditions
              </button>
            </span>
          </label>
          {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms}</p>}
        </div>

        <button
          onClick={handleSignUp}
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
            text-white text-sm font-normal rounded transition-colors mt-2"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </div>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />

      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{' '}
        <button
          onClick={() => { onSwitchToSignIn(); setErrors({}) }}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Sign In
        </button>
      </p>
    </div>
  )
}
