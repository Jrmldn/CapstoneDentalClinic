import { enforceRole } from '@/lib/auth/protection'
import { handleLogout } from '@/actions/handleLogout'
import { createClient } from '@/lib/supabase/serverSSR'
import StaffSidebar from './_components/Sidebar'
import StaffTopBar from './_components/TopBar'

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <StaffSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <StaffTopBar user={user} clinicName={clinicName} logoutAction={logoutAction} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
