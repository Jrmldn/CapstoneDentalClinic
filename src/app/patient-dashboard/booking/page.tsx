import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { redirect } from 'next/navigation'
import { fetchPatientRecord } from '@/actions/patientActions'
import { createClient } from '@/lib/supabase/serverSSR'
import { supabaseAdmin } from '@/lib/supabase/server'
import { BookingTab } from '../_components/BookingTab'

export default async function BookPage() {
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

  // Fetch patient record and all active branches in parallel.
  // Branch selection now happens inside the booking flow — the patient
  // picks a branch, then dentists/services are loaded client-side.
  const [patientDetails, branchesRes] = await Promise.all([
    fetchPatientRecord(patientRecord.id, undefined, { includeAppointments: true }),
    supabaseAdmin
      .from('clinics')
      .select('id, name, address')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ])

  if (!patientDetails.success || !patientDetails.record) {
    redirect('/')
  }

  const branches = branchesRes.data ?? []

  return (
    <BookingTab
      branches={branches}
      record={patientDetails.record as any}
      authUserId={authUser.id}
    />
  )
}
