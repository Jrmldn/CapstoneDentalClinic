import { enforceRole } from '@/lib/auth/protection'
import { getClinics } from '@/lib/queries/clinics'
import SuperadminReportsView from '@/components/features/reports/SuperadminReportsView'

export const metadata = { title: 'Reports & Analytics — Superadmin Portal' }

export default async function SuperadminReportsPage() {
  await enforceRole('superadmin')

  // Load all clinics/branches
  const clinicsRes = await getClinics()
  const clinics = clinicsRes.success ? clinicsRes.data : []

  return (
    <SuperadminReportsView clinics={clinics} />
  )
}
