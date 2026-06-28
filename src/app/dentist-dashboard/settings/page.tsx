import { enforceRole } from '@/lib/auth/protection'
import { getDentistRecordByUserId } from '@/services/dashboardService'
import { createClient } from '@/lib/supabase/serverSSR'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'My Profile — Dentist Portal' }

export default async function SettingsPage() {
  const authUser = await enforceRole('dentist')

  // Resolve dentist record
  const { data: dentistRecord } = await getDentistRecordByUserId(authUser.id)
  if (!dentistRecord?.id || !dentistRecord?.clinic_id) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact an administrator.
      </div>
    )
  }

  const dentistId = dentistRecord.id
  const clinicId = dentistRecord.clinic_id

  // Fetch clinic details for clinic name display
  const supabase = await createClient()
  let clinicName = 'Cruz Dental Clinic'
  const { data: clinicData } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', clinicId)
    .maybeSingle()

  if (clinicData?.name) {
    clinicName = clinicData.name
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your profile details.
        </p>
      </div>

      <SettingsClient
        dentistId={dentistId}
        clinicName={clinicName}
        dentistEmail={authUser.email || ''}
        initialFirstName={dentistRecord.first_name}
        initialLastName={dentistRecord.last_name}
        initialLicenseNo={dentistRecord.license_no || ''}
      />
    </div>
  )
}
