import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { handleLogout } from '@/actions/handleLogout'
import { createClient } from '@/lib/supabase/serverSSR'
import PatientSidebar from './_components/Sidebar'
import PatientTopBar from './_components/TopBar'
import MobileTabs from './_components/MobileTabs'

interface PatientLayoutProps {
  children: React.ReactNode
}

export default async function PatientLayout({ children }: PatientLayoutProps) {
  const authUser = await enforceRole('patient')

  const supabase = await createClient()

  // Verify patient exists and get their first name
  const { data: patientData } = await supabase
    .from('patients')
    .select('first_name')
    .eq('user_id', authUser.id)
    .maybeSingle()

  const patientName = patientData?.first_name || 'Patient'
  const user = { email: authUser.email || '' }
  const logoutAction = async () => {
    'use server'
    await handleLogout('/')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <PatientSidebar patientName={patientName} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <PatientTopBar user={user} clinicName="AppointDent" logoutAction={logoutAction} />

        {/* Page content */}
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6 overflow-y-auto">
          {/* Mobile responsive navigation link bar */}
          <MobileTabs />

          {children}
        </main>
      </div>
    </div>
  )
}
