import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { handleLogout } from '@/actions/handleLogout'
import { createClient } from '@/lib/supabase/serverSSR'
import PatientLayoutClient from './_components/PatientLayoutClient'

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
    <PatientLayoutClient
      patientName={patientName}
      user={user}
      logoutAction={logoutAction}
    >
      {children}
    </PatientLayoutClient>
  )
}
