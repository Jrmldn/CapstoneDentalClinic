import { enforceRole } from '@/lib/auth/protection'
import { handleLogout } from '@/actions/handleLogout'
import { createClient } from '@/lib/supabase/serverSSR'
import StaffLayoutClient from './_components/StaffLayoutClient'

interface StaffLayoutProps {
  children: React.ReactNode
}

export default async function StaffLayout({ children }: StaffLayoutProps) {
  const authUser = await enforceRole('staff')

  const supabase = await createClient()

  // Resolve clinic name for the top bar
  let clinicName = 'Your Clinic'
  const { data: staffRecord } = await supabase
    .from('clinic_staff')
    .select('clinic_id, clinics ( name )')
    .eq('user_id', authUser.id)
    .maybeSingle()

  const rawClinic = staffRecord?.clinics
  if (rawClinic) {
    const clinic = Array.isArray(rawClinic) ? rawClinic[0] : rawClinic
    if (clinic?.name) clinicName = clinic.name
  }

  const user = { email: authUser.email || '' }
  const logoutAction = handleLogout.bind(null, '/login')

  return (
    <StaffLayoutClient
      user={user}
      clinicName={clinicName}
      logoutAction={logoutAction}
    >
      {children}
    </StaffLayoutClient>
  )
}
