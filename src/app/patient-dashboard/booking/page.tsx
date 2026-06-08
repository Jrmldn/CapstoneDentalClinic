import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetchPatientRecord } from '@/actions/patientActions'
import { createClient } from '@/lib/supabase/serverSSR'
import { supabaseAdmin } from '@/lib/supabase/server'
import { BookingTab } from '../_components/BookingTab'

export default async function BookPage() {
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
  const patientDetails = await fetchPatientRecord(patientRecord.id, clinicIdNum, {})
  if (!patientDetails.success || !patientDetails.record) {
    redirect('/')
  }

  // Fetch dentists and services
  const { data: dentists } = await supabaseAdmin
    .from('dentists')
    .select('id, first_name, last_name, specialty')
    .eq('clinic_id', clinicIdNum)

  const { data: services } = await supabaseAdmin
    .from('services')
    .select('id, name, price, slot_duration_min')
    .eq('clinic_id', clinicIdNum)
    .eq('is_active', true)

  return (
    <BookingTab
      clinicId={clinicIdNum}
      record={patientDetails.record as any}
      dentists={(dentists || []) as any}
      services={(services || []) as any}
    />
  )
}
