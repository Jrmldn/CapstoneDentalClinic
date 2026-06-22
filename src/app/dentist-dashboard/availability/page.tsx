import { enforceRole } from '@/lib/auth/protection'

export const metadata = { title: 'Availability — Dentist Portal' }

export default async function AvailabilityPage() {
  await enforceRole('dentist')

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Availability Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dentist schedules are managed by the clinic administrator.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <p className="text-slate-500 text-sm">
          Contact your clinic superadmin to update your blocked dates or working hours.
        </p>
      </div>
    </div>
  )
}
