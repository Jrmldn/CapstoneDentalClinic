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

  // Fetch patient details, dentists, services, and clinic settings in parallel (Class A Optimization)
  const [patientDetails, dentistsRes, servicesRes, clinicRes] = await Promise.all([
    fetchPatientRecord(patientRecord.id, clinicIdNum, {}),
    supabaseAdmin
      .from('dentists')
      .select('id, first_name, last_name, specialty')
      .eq('clinic_id', clinicIdNum),
    supabaseAdmin
      .from('services')
      .select('id, name, price, slot_duration_min')
      .eq('clinic_id', clinicIdNum)
      .eq('is_active', true),
    supabaseAdmin
      .from('clinics')
      .select('default_downpayment_amount')
      .eq('id', clinicIdNum)
      .single()
  ])

  if (!patientDetails.success || !patientDetails.record) {
    redirect('/')
  }

  const dentists = dentistsRes.data
  const services = servicesRes.data
  const defaultDownpaymentAmount = clinicRes.data?.default_downpayment_amount ?? 0

  return (
    <BookingTab
      clinicId={clinicIdNum}
      record={patientDetails.record as any}
      dentists={(dentists || []) as any}
      services={(services || []) as any}
      defaultDownpaymentAmount={defaultDownpaymentAmount}
    />
  )
}
