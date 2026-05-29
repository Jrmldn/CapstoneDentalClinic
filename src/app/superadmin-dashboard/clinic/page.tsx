import { enforceRole } from '@/lib/authProtection'
import ClientClinicPage from '../ClientClinicPage'

export default async function ClinicPage() {
  await enforceRole('superadmin')
  return <ClientClinicPage />
}
