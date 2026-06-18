import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { redirect } from 'next/navigation'
import { fetchPatientRecord } from '@/actions/patientActions'
import { createClient } from '@/lib/supabase/serverSSR'
import { CalendarTab } from '../_components/CalendarTab'
import { PatientRecord } from '../_components/types'

export default async function CalendarPage() {
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
    <CalendarTab record={patientDetails.record as unknown as PatientRecord} />
  )
}
