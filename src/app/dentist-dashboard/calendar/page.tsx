import { enforceRole } from '@/lib/auth/protection'
import { getDentistRecordByUserId } from '@/services/dashboardService'
import { fetchCalendarData } from '@/actions/managementActions'
import CalendarClient from '@/components/features/calendar/CalendarClient'

export const metadata = { title: 'Calendar — Dentist Portal' }

export default async function CalendarPage() {
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

  const dentistId = dentistRecord.id
  const clinicId = dentistRecord.clinic_id

  // Fetch initial calendar data for the current month, filtered by this dentist ID
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-indexed

  // Call the extended fetchCalendarData (with dentistId)
  const calendarRes = await fetchCalendarData(clinicId, year, month, dentistId)
  const initialHolidays = calendarRes.holidays || []
  const initialAppointments = calendarRes.appointments || []

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Schedule Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">
          View all your scheduled appointments at a glance and track clinic holiday closures.
        </p>
      </div>

      <CalendarClient
        clinicId={clinicId}
        initialHolidays={initialHolidays}
        initialAppointments={initialAppointments}
        currentYear={year}
        currentMonth={month}
        canManageHolidays={false}
      />
    </div>
  )
}
