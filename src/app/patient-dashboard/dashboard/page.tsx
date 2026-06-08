import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetchPatientRecord } from '@/actions/patientActions'
import { createClient } from '@/lib/supabase/serverSSR'
import { OverviewTab } from '../_components/OverviewTab'

export default async function DashboardPage() {
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
    includeAppointments: true,
    includePrescriptions: true
  })
  if (!patientDetails.success || !patientDetails.record) {
    redirect('/')
  }

  return (
    <OverviewTab
      record={patientDetails.record as any}
      authUserId={authUser.id}
    />
  )
}
