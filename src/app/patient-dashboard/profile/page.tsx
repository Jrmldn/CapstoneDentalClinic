import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetchPatientRecord } from '@/actions/patientActions'
import { createClient } from '@/lib/supabase/serverSSR'
import { ProfileTab } from '../_components/ProfileTab'
import { PatientRecord } from '../_components/types'

export default async function ProfilePage() {
  const authUser = await enforceRole('patient')
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('clinic_id')?.value
  if (!clinicId) redirect('/')

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

  const clinicIdNum = parseInt(clinicId, 10)
  const patientDetails = await fetchPatientRecord(patientRecord.id, clinicIdNum, {
    includeMedicalHistory: true
  })
  if (!patientDetails.success || !patientDetails.record) {
    redirect('/')
  }

  // Auto-sync email from Auth if the patient record email is empty
  if (!patientDetails.record.patient.email && authUser.email) {
    await supabase
      .from('patients')
      .update({ email: authUser.email })
      .eq('id', patientRecord.id)
    patientDetails.record.patient.email = authUser.email
  }

  return (
    <ProfileTab record={patientDetails.record as unknown as PatientRecord} />
  )
}
