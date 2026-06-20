import React, { Suspense } from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { redirect } from 'next/navigation'
import { fetchPatientRecord } from '@/actions/patientMedicalActions'
import { createClient } from '@/lib/supabase/serverSSR'
import { ProfileTab } from '../_components/ProfileTab'
import { PatientRecord } from '../_components/types'

export default async function ProfilePage() {
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
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading profile...</div>}>
      <ProfileTab 
        record={patientDetails.record as unknown as PatientRecord} 
      />
    </Suspense>
  )
}
