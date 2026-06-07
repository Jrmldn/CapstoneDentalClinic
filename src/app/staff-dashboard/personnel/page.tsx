import { createClient } from '@/lib/supabase/serverSSR'
import { enforceRole } from '@/lib/auth/protection'
import StaffPersonnelClient from './StaffPersonnelClient'

export const metadata = { title: 'Personnel Directory — AppoinDent' }

export default async function PersonnelPage() {
  const authUser = await enforceRole('staff')
  const supabase = await createClient()

  // Resolve clinicId
  const { data: staffRecord } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', authUser.id)
    .maybeSingle()

  const clinicId = staffRecord?.clinic_id as number | undefined
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
