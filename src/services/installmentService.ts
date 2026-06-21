import { supabaseAdmin } from '@/lib/supabase/server'
import { cache } from 'react'

export interface InstallmentPlanInsertData {
  transaction_id?: number | null
  clinic_id: number
  patient_id: number
  total_amount: number
  num_installments: number
  penalty_type: 'flat' | 'percentage'
  penalty_value: number
  notes?: string | null
}

export interface InstallmentPaymentInsertData {
  plan_id: number
  installment_number: number
  due_date: string
  amount: number
}

export async function insertInstallmentPlan(data: InstallmentPlanInsertData) {
  return supabaseAdmin
    .from('installment_plans')
    .insert([data])
    .select()
    .single()
}

export async function insertInstallmentPayments(items: InstallmentPaymentInsertData[]) {
  return supabaseAdmin
    .from('installment_payments')
    .insert(items)
    .select()
}

export const getInstallmentsByPatient = cache(async (patientId: number) => {
  return supabaseAdmin
    .from('installment_plans')
    .select(`
      id, transaction_id, clinic_id, patient_id, total_amount, num_installments,
      penalty_type, penalty_value, notes, status, created_at,
      transactions ( id, created_at, transaction_items ( description ) ),
      installment_payments (
        id, plan_id, installment_number, due_date, amount, penalty_amount, status, paid_at, created_at
      )
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
})

export const getInstallmentsByClinic = cache(async (clinicId: number) => {
  return supabaseAdmin
    .from('installment_plans')
    .select(`
      id, transaction_id, clinic_id, patient_id, total_amount, num_installments,
      penalty_type, penalty_value, notes, status, created_at,
      patients ( id, first_name, last_name ),
      installment_payments (
        id, plan_id, installment_number, due_date, amount, penalty_amount, status, paid_at, created_at
      )
    `)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
})

export async function updateInstallmentPaymentStatus(
  paymentId: number,
  status: 'paid' | 'overdue',
  penaltyAmount?: number
) {
  const updateData: Record<string, unknown> = { status }
  if (status === 'paid') updateData.paid_at = new Date().toISOString()
  if (penaltyAmount !== undefined) updateData.penalty_amount = penaltyAmount
  return supabaseAdmin
    .from('installment_payments')
    .update(updateData)
    .eq('id', paymentId)
    .select()
    .single()
}

export async function updateInstallmentPlanStatus(
  planId: number,
  status: 'active' | 'completed' | 'cancelled'
) {
  return supabaseAdmin
    .from('installment_plans')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', planId)
}
