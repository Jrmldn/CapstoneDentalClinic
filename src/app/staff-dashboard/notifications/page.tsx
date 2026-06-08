import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import { fetchNotifications } from '@/actions/managementActions'
import NotificationsClient from '@/components/features/notifications/NotificationsClient'

export const metadata = { title: 'Notifications — AppoinDent' }

export default async function NotificationsPage() {
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

  // Fetch initial notifications
  const res = await fetchNotifications(clinicId)
  const initialNotifications = res.notifications || []

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notification Dispatcher Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor SMS &amp; Email dispatches, view failure reasons, and manually retrigger failed notifications.
        </p>
      </div>

      <NotificationsClient
        clinicId={clinicId}
        initialNotifications={initialNotifications}
      />
    </div>
  )
}
