import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import StaffPersonnelClient from './StaffPersonnelClient'

export const metadata = { title: 'Personnel Directory — AppoinDent' }

export default async function PersonnelPage() {
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

  return (
    <div className="p-6 md:p-8">
      <StaffPersonnelClient clinicId={clinicId} />
    </div>
  )
}
