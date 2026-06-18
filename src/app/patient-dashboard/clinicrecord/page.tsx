import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { redirect } from 'next/navigation'
import { fetchPatientRecord } from '@/actions/patientActions'
import { createClient } from '@/lib/supabase/serverSSR'
import { MedicalTab } from '../_components/MedicalTab'
import { PatientRecord } from '../_components/types'

export default async function MedicalPage() {
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
    includeMedicalHistory: true,
    includeDentalCharts: true,
    includeTreatmentHistory: true,
    includePrescriptions: true
  })
  if (!patientDetails.success || !patientDetails.record) {
    redirect('/')
  }

  return (
    <MedicalTab record={patientDetails.record as unknown as PatientRecord} />
  )
}
