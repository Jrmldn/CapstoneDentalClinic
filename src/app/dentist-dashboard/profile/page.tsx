import { enforceRole } from '@/lib/auth/protection'
import { getDentistRecordByUserId } from '@/services/dashboardService'
import ProfileClient from './ProfileClient'

export const metadata = { title: 'My Profile — Dentist Portal' }

export default async function ProfilePage() {
  const authUser = await enforceRole('dentist')

  // Resolve dentist profile
  const { data: dentistRecord } = await getDentistRecordByUserId(authUser.id)
  if (!dentistRecord?.id || !dentistRecord?.clinic_id) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact an administrator.
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Portal Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal details and clinical credentials.
        </p>
      </div>

      <ProfileClient
        userId={authUser.id}
        clinicId={dentistRecord.clinic_id}
        initialFirstName={dentistRecord.first_name}
        initialLastName={dentistRecord.last_name}
      />
    </div>
  )
}
