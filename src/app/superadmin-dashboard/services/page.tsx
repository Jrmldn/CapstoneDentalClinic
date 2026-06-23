import { enforceRole } from '@/lib/auth/protection'
import { getClinics } from '@/lib/queries/clinics'
import SuperadminServicesView from '@/components/features/clinic-services/SuperadminServicesView'

export const metadata = { title: 'Services — Superadmin Portal' }

export default async function SuperadminServicesPage() {
  await enforceRole('superadmin')

  // Load all clinics/branches
  const clinicsRes = await getClinics()
  const clinics = clinicsRes.success ? clinicsRes.data : []

  return (
    <SuperadminServicesView clinics={clinics} mode="services" />
  )
}
