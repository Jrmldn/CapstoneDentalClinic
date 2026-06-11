import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { handleLogout } from '@/actions/handleLogout'
import { createClient } from '@/lib/supabase/serverSSR'
import { getDentistRecordByUserId } from '@/services/dashboardService'
import DentistSidebar from './_components/Sidebar'
import DentistTopBar from './_components/TopBar'
import { AlertCircle } from 'lucide-react'

interface DentistLayoutProps {
  children: React.ReactNode
}

export default async function DentistLayout({ children }: DentistLayoutProps) {
  const authUser = await enforceRole('dentist')
  const { data: dentistRecord } = await getDentistRecordByUserId(authUser.id)

  if (!dentistRecord?.clinic_id) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-2xl border border-gray-150 shadow-md text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900">No Clinic Assigned</h2>
          <p className="text-sm text-gray-500 mt-2">
            Your dentist account has not been assigned to a clinic yet. Contact a clinic administrator or superadmin.
          </p>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Resolve clinic name for the top bar
  let clinicName = 'Your Clinic'
  const { data: clinicData } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', dentistRecord.clinic_id)
    .maybeSingle()

  if (clinicData?.name) {
    clinicName = clinicData.name
  }

  const user = { email: authUser.email || '' }
  const logoutAction = handleLogout.bind(null, '/login')

  const dentistName = `${dentistRecord.first_name} ${dentistRecord.last_name}`
  const specialty = dentistRecord.specialty

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <DentistSidebar dentistName={dentistName} specialty={specialty} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <DentistTopBar user={user} clinicName={clinicName} logoutAction={logoutAction} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
