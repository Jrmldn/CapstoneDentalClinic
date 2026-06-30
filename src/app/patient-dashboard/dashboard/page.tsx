import React from 'react'
import { enforceRole } from '@/lib/auth/protection'
import { redirect } from 'next/navigation'
import { fetchPatientRecord } from '@/actions/patientMedicalActions'
import { createClient } from '@/lib/supabase/serverSSR'
import { supabaseAdmin } from '@/lib/supabase/server'
import { OverviewTab } from '../_components/OverviewTab'
import { PatientRecord } from '../_components/types'
import { Clinic } from '@/components/features/landing-page/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
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

  const [patientDetails, clinicsRes, activePlansRes] = await Promise.all([
    fetchPatientRecord(patientRecord.id, undefined, {
      includeAppointments: true,
      includePrescriptions: true
    }),
    supabase
      .from('clinics')
      .select(`
        id, name, address, phone, manual_status, latitude, longitude,
        clinic_operating_hours(day_of_week, open_time, close_time, is_closed),
        clinic_gallery(image_url, sort_order),
        feedback(rating)
      `)
      .eq('is_active', true),
    supabaseAdmin
      .from('installment_plans')
      .select('id, total_amount')
      .eq('patient_id', patientRecord.id)
      .eq('status', 'active'),
  ])

  if (!patientDetails.success || !patientDetails.record) {
    redirect('/')
  }

  const clinics = (clinicsRes.data ?? []) as Clinic[]

  const activePlans = activePlansRes.data ?? []
  const planIds = activePlans.map(p => p.id)
  let outstandingBalance = activePlans.reduce((sum, p) => sum + p.total_amount, 0)

  if (planIds.length > 0) {
    const { data: paidPayments } = await supabaseAdmin
      .from('installment_payments')
      .select('amount')
      .in('plan_id', planIds)
      .eq('status', 'paid')
    const paidTotal = (paidPayments ?? []).reduce((sum, p) => sum + p.amount, 0)
    outstandingBalance -= paidTotal
  }

  return (
    <OverviewTab
      record={patientDetails.record as unknown as PatientRecord}
      authUserId={authUser.id}
      clinics={clinics}
      outstandingBalance={outstandingBalance}
    />
  )
}
