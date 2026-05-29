import { redirect } from 'next/navigation'
import { enforceRole } from '@/lib/authProtection'

export default async function SuperadminDashboardPage() {
  await enforceRole('superadmin')
  redirect('/superadmin-dashboard/clinic')
}