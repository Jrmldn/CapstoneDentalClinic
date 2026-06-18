import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { redirect } from 'next/navigation'
import { fetchPatientRecord } from '@/actions/patientActions'
import { createClient } from '@/lib/supabase/serverSSR'
import { AppointmentsTab } from '../_components/AppointmentsTab'

export default async function AppointmentsPage() {
  const authUser = await enforceRole('patient')

  const supabase = await createClient()

  // Verify patient exists and get their ID
  const { data: patientRecord, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (patientError || !patientRecord) {
    redirect('/')
  }

  const patientDetails = await fetchPatientRecord(patientRecord.id, undefined, {
    includeAppointments: true
  })
  if (!patientDetails.success || !patientDetails.record) {
    redirect('/')
  }

  return (
    <AppointmentsTab
      record={patientDetails.record as any}
      authUserId={authUser.id}
    />
  )
}
