import { enforceRole } from '@/lib/auth/protection'
import { getDentistRecordByUserId } from '@/services/dashboardService'
import { fetchBlockedSlots } from '@/actions/dentistScheduleActions'
import AvailabilityClient from './AvailabilityClient'

export const metadata = { title: 'Availability Management — Dentist Portal' }

export default async function AvailabilityPage() {
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

  // Fetch all schedule blocks
  const blockedSlotsRes = await fetchBlockedSlots(dentistId)
  const initialBlockedSlots = blockedSlotsRes.blockedSlots || []

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Availability Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Block dates and time slots to manage your clinic schedule.
        </p>
      </div>

      <AvailabilityClient
        dentistId={dentistId}
        initialBlockedSlots={initialBlockedSlots}
      />
    </div>
  )
}
