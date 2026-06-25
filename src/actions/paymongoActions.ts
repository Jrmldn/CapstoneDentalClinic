'use server'

import { revalidatePath } from 'next/cache'
import { sanitizeServerError } from '@/lib/errors/sanitizeError'
import { validatePatientAccess } from '@/lib/auth/validatePatientAccess'
import { supabaseAdmin } from '@/lib/supabase/server'
import { updateInstallmentPaymentStatus, updateInstallmentPlanStatus } from '@/services/installmentService'

export type PaymentContextType = 'transaction' | 'installment_payment' | 'appointment'
export type OnlinePaymentMethod = 'gcash' | 'paymaya' | 'credit_card'

export interface InitiatePaymentData {
  contextType: PaymentContextType
  contextId: number
  patientId: number
  amount: number
  paymentMethod: OnlinePaymentMethod
  description: string
}

// Applies the payment outcome to the correct table based on contextType.
// Used by both the stub path (no PayMongo yet) and the webhook handler.
async function applyPaymentToContext(contextType: PaymentContextType, contextId: number, paymentMethod: string) {
  if (contextType === 'installment_payment') {
    const { data: payment } = await supabaseAdmin
      .from('installment_payments')
      .select('plan_id')
      .eq('id', contextId)
      .single()

    if (!payment) throw new Error('Installment payment not found')

    const { error: updateError } = await updateInstallmentPaymentStatus(contextId, 'paid')
    if (updateError) throw new Error(updateError.message)

    const { data: remaining } = await supabaseAdmin
      .from('installment_payments')
      .select('id')
      .eq('plan_id', payment.plan_id)
      .neq('status', 'paid')

    if (!remaining?.length) {
      await updateInstallmentPlanStatus(payment.plan_id, 'completed')
    }

    revalidatePath('/staff-dashboard/billing')
    revalidatePath('/patient-dashboard/payments')
  }

  if (contextType === 'transaction') {
    await supabaseAdmin
      .from('transactions')
      .update({ payment_status: 'paid', payment_method: paymentMethod })
      .eq('id', contextId)

    revalidatePath('/staff-dashboard/billing')
  }

  if (contextType === 'appointment') {
    const { data: appt } = await supabaseAdmin
      .from('appointments')
      .update({ payment_method: paymentMethod, payment_status: 'downpaid' })
      .eq('id', contextId)
      .select('patient_id, clinic_id, downpayment')
      .single()

    // Create an issued transaction for the downpayment so it appears in Transactions tabs
    if (appt && appt.downpayment > 0) {
      const { data: txRow } = await supabaseAdmin
        .from('transactions')
        .insert({
          appointment_id:     contextId,
          patient_id:         appt.patient_id,
          clinic_id:          appt.clinic_id,
          billing_status:     'issued',
          payment_status:     'paid',
          payment_method:     paymentMethod,
          discount_type:      'none',
          discount_amount:    0,
          hmo_coverage:       0,
          philhealth_coverage: 0,
          subtotal:           appt.downpayment,
          total_amount:       appt.downpayment,
        })
        .select('id')
        .single()

      if (txRow) {
        await supabaseAdmin
          .from('transaction_items')
          .insert({
            transaction_id: txRow.id,
            description:    'Booking Downpayment',
            quantity:       1,
            unit_price:     appt.downpayment,
            total_price:    appt.downpayment,
          })
      }
    }

    revalidatePath('/staff-dashboard/appointments')
    revalidatePath('/staff-dashboard/transactions')
    revalidatePath('/patient-dashboard/appointments')
    revalidatePath('/patient-dashboard/transactions')
    revalidatePath('/dentist-dashboard')
  }
}

// Creates a pending paymongo_payments record and (in stub mode) immediately
// applies the payment to the context. Replace the TODO block with real
// PayMongo API calls when keys are available — the stub lines below will be removed.
export async function initiatePayment(data: InitiatePaymentData): Promise<
  { success: false; error: string } | { success: true; paymentId: number; checkoutUrl: string | null }
> {
  const access = await validatePatientAccess(data.patientId)
  if (!access.allowed) return { success: false, error: access.reason }

  try {
    // TODO: call PayMongo API to create a payment link
    // const link = await createPayMongoLink({ amount: data.amount * 100, description: data.description })
    // const checkoutUrl = link.attributes.checkout_url
    // const paymongoLinkId = link.id
    const checkoutUrl: string | null = null

    const { data: record, error } = await supabaseAdmin
      .from('paymongo_payments')
      .insert({
        amount: data.amount,
        context_type: data.contextType,
        context_id: data.contextId,
        patient_id: data.patientId,
        payment_method: data.paymentMethod,
        status: 'pending',
        // paymongo_link_id: paymongoLinkId,
        // checkout_url: checkoutUrl,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Stub path: no PayMongo yet — apply payment immediately so staff sees it
    if (!checkoutUrl) {
      await applyPaymentToContext(data.contextType, data.contextId, data.paymentMethod)
      await supabaseAdmin
        .from('paymongo_payments')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', record.id)
    }

    return { success: true, paymentId: record.id, checkoutUrl }
  } catch (error) {
    console.error('Error in initiatePayment:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

// Called by the PayMongo webhook handler once a payment.paid event is confirmed.
export async function confirmPaymongoPayment(paymongoLinkId: string) {
  try {
    const { data: record, error: fetchError } = await supabaseAdmin
      .from('paymongo_payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('paymongo_link_id', paymongoLinkId)
      .select()
      .single()

    if (fetchError || !record) throw new Error('paymongo_payments record not found')

    await applyPaymentToContext(record.context_type, record.context_id, record.payment_method)

    return { success: true }
  } catch (error) {
    console.error('Error in confirmPaymongoPayment:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}
