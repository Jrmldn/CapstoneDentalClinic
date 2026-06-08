import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import { fetchCalendarData } from '@/actions/managementActions'
import CalendarClient from '@/components/features/calendar/CalendarClient'

export const metadata = { title: 'Calendar — AppoinDent' }

export default async function CalendarPage() {
  const authUser = await enforceRole('staff')

  // Resolve clinicId
  const clinicId = await getStaffClinicId(authUser.id)
  if (!clinicId) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact a superadmin.
      </div>
    )
  }

  // Fetch initial calendar data for the current month
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-indexed

  const calendarRes = await fetchCalendarData(clinicId, year, month)
  const initialHolidays = calendarRes.holidays || []
  const initialAppointments = calendarRes.appointments || []

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clinic Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">
          View all scheduled appointments at a glance and manage clinic holidays and closures.
        </p>
      </div>

      <CalendarClient
        clinicId={clinicId}
        initialHolidays={initialHolidays}
        initialAppointments={initialAppointments}
        currentYear={year}
        currentMonth={month}
      />
    </div>
  )
}
