import { Suspense } from 'react'
import { LoginForm } from './LoginForm'
import { PageShell } from '@/app/components/PageShell'

export default function LoginPage() {
  return (
    <PageShell>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            AppointDent
          </h1>
          <p className="text-center text-gray-600 mb-8">Patient Portal Login</p>

          <Suspense fallback={<div className="text-center py-4 text-gray-600">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </PageShell>
  )
}
