import { enforceRole } from '@/lib/auth/protection'
import { getClinics } from '@/lib/queries/clinics'
import { fetchNotifications } from '@/actions/notificationActions'
import NotificationsClient from '@/components/features/notifications/NotificationsClient'

export const metadata = { title: 'Notification Dispatcher Logs — AppointDent' }
export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  await enforceRole('superadmin')

  const clinicsRes = await getClinics()
  const clinics = clinicsRes.data || []

  const res = await fetchNotifications()
  const initialNotifications = res.notifications || []

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notification Dispatcher Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor SMS &amp; Email dispatches across all branches, view failure reasons, and manually retrigger failed notifications.
        </p>
      </div>

      <NotificationsClient
        initialNotifications={initialNotifications}
        clinics={clinics}
      />
    </div>
  )
}
