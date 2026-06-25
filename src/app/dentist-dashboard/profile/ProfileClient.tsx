'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { updatePersonnel } from '@/actions/personnelActions'

interface ProfileClientProps {
  userId: string
  clinicId: number
  initialFirstName: string
  initialLastName: string
}

export default function ProfileClient({
  userId,
  clinicId,
  initialFirstName,
  initialLastName,
}: ProfileClientProps) {
  const router = useRouter()
  const [firstName, setFirstName] = useState(initialFirstName || '')
  const [lastName, setLastName] = useState(initialLastName || '')
  const [status, setStatus] = useState<{ success?: boolean; error?: string; loading?: boolean }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setStatus({ error: 'First name and Last name are required.' })
      return
    }

    setStatus({ loading: true })
    const res = await updatePersonnel(userId, 'dentist', {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      clinicId,
    })

    if (res.success) {
      setStatus({ success: true })
      router.refresh()
      setTimeout(() => setStatus({}), 3000)
    } else {
      setStatus({ error: res.error || 'Failed to update profile details.' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-gray-150/60 p-6">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            My Dentist Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-semibold flex items-center gap-2 border border-red-200">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                {status.error}
              </div>
            )}
            {status.success && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-2 border border-green-200">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                Profile updated successfully!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-550 block">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-550 block">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                type="submit"
                disabled={status.loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-6 py-2 transition"
              >
                {status.loading ? 'Saving Settings...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
