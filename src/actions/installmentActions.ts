'use server'

import { revalidatePath } from 'next/cache'
import { sanitizeServerError } from '@/lib/errors/sanitizeError'
import { ensureRole } from '@/lib/auth/ensureRole'
import { validatePatientAccess } from '@/lib/auth/validatePatientAccess'
import { supabaseAdmin } from '@/lib/supabase/server'
import { normalizeRelation } from '@/lib/utils'
import {
  insertInstallmentPlan,
  insertInstallmentPayments,
  getInstallmentsByPatient,
  getInstallmentsByClinic,
  updateInstallmentPaymentStatus,
  updateInstallmentPlanStatus,
} from '@/services/installmentService'

export type PenaltyType = 'flat' | 'percentage'

export interface InstallmentDue {
  due_date: string
  amount: number
}

export interface CreateInstallmentPlanData {
  transaction_id?: number | null
  clinic_id: number
  patient_id: number
  total_amount: number
  installments: InstallmentDue[]
  penalty_type: PenaltyType
  penalty_value: number
  notes?: string
}

export async function createInstallmentPlan(data: CreateInstallmentPlanData) {
  const auth = await ensureRole('staff')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: plan, error: planError } = await insertInstallmentPlan({
      transaction_id: data.transaction_id ?? null,
      clinic_id: data.clinic_id,
      patient_id: data.patient_id,
      total_amount: data.total_amount,
      num_installments: data.installments.length,
      penalty_type: data.penalty_type,
      penalty_value: data.penalty_value,
      notes: data.notes ?? null,
    })

    if (planError) throw new Error(planError.message)

    const payments = data.installments.map((inst, i) => ({
      plan_id: plan.id,
      installment_number: i + 1,
      due_date: inst.due_date,
      amount: inst.amount,
    }))

    const { error: paymentsError } = await insertInstallmentPayments(payments)
    if (paymentsError) throw new Error(paymentsError.message)

    revalidatePath('/staff-dashboard/billing')
    revalidatePath('/patient-dashboard/payments')
    return { success: true, plan }
  } catch (error) {
    console.error('Error in createInstallmentPlan:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function markInstallmentPaid(installmentPaymentId: number, planId: number) {
  const auth = await ensureRole('staff')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { error: updateError } = await updateInstallmentPaymentStatus(installmentPaymentId, 'paid')
    if (updateError) throw new Error(updateError.message)

    // Recompute collected status from every installment in the plan.
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('installment_payments')
      .select('status')
      .eq('plan_id', planId)
    if (paymentsError) throw new Error(paymentsError.message)

    const allPayments = (payments ?? []) as { status: string }[]
    const paidCount = allPayments.filter(p => p.status === 'paid').length
    const allPaid = allPayments.length > 0 && paidCount === allPayments.length

    if (allPaid) {
      await updateInstallmentPlanStatus(planId, 'completed')
    }

    // Sync the parent transaction's payment status to reflect collected installments.
    const { data: plan, error: planError } = await supabaseAdmin
      .from('installment_plans')
      .select('transaction_id')
      .eq('id', planId)
      .single()
    if (planError) throw new Error(planError.message)

    if (plan?.transaction_id) {
      const txPaymentStatus = allPaid ? 'paid' : paidCount > 0 ? 'partial' : 'unpaid'
      await supabaseAdmin
        .from('transactions')
        .update({ payment_status: txPaymentStatus })
        .eq('id', plan.transaction_id)
    }

    revalidatePath('/staff-dashboard/billing')
    revalidatePath('/staff-dashboard/transactions')
    revalidatePath('/patient-dashboard/transactions')
    revalidatePath('/patient-dashboard/payments')
    return { success: true }
  } catch (error) {
    console.error('Error in markInstallmentPaid:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function applyInstallmentPenalty(installmentPaymentId: number) {
  const auth = await ensureRole('staff')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: payment, error: fetchError } = await supabaseAdmin
      .from('installment_payments')
      .select(`
        id, amount,
        installment_plans ( id, penalty_type, penalty_value )
      `)
      .eq('id', installmentPaymentId)
      .single()

    if (fetchError || !payment) throw new Error('Installment payment not found')

    const planData = normalizeRelation(
      payment.installment_plans as { id: number; penalty_type: string; penalty_value: number } | { id: number; penalty_type: string; penalty_value: number }[] | null
    )
    if (!planData) throw new Error('Installment plan not found')

    const penaltyAmount =
      planData.penalty_type === 'flat'
        ? planData.penalty_value
        : parseFloat(((payment.amount * planData.penalty_value) / 100).toFixed(2))

    const { error } = await updateInstallmentPaymentStatus(installmentPaymentId, 'overdue', penaltyAmount)
    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/billing')
    revalidatePath('/patient-dashboard/payments')
    return { success: true, penaltyAmount }
  } catch (error) {
    console.error('Error in applyInstallmentPenalty:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function fetchPatientInstallments(patientId: number) {
  const access = await validatePatientAccess(patientId)
  if (!access.allowed) return { success: false, error: access.reason, plans: [] }

  try {
    const { data, error } = await getInstallmentsByPatient(patientId)
    if (error) throw new Error(error.message)
    return { success: true, plans: data ?? [] }
  } catch (error) {
    console.error('Error in fetchPatientInstallments:', error)
    return { success: false, error: sanitizeServerError(error), plans: [] }
  }
}

export async function fetchClinicInstallments(clinicId: number) {
  const auth = await ensureRole('staff')
  if (!auth.success) return { success: false, error: auth.error, plans: [] }

  try {
    const { data, error } = await getInstallmentsByClinic(clinicId)
    if (error) throw new Error(error.message)
    return { success: true, plans: data ?? [] }
  } catch (error) {
    console.error('Error in fetchClinicInstallments:', error)
    return { success: false, error: sanitizeServerError(error), plans: [] }
  }
}
