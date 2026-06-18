'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  insertTransactionHeader,
  insertTransactionItems,
  syncAppointmentPayment,
  syncAppointmentPaymentDetails,
  getTransactionsByPatient,
  getTreatmentHistoryByPatient,
  updateTransactionPayment,
  getTransactionsByClinic
} from '@/services/billingService'
import { calculateTransactionAmounts } from '@/utils/billing-helpers'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type DiscountType = 'none' | 'senior' | 'pwd' | 'philhealth'
export type PaymentMethod = 'cash' | 'gcash' | 'credit_card' | 'paymaya'
export type PaymentStatus  = 'unpaid' | 'partial' | 'paid'

export interface TransactionItem {
  service_id?:  number
  product_id?:  number
  description:  string
  quantity:     number
  unit_price:   number
}

export interface CreateTransactionData {
  appointment_id?: number | null
  patient_id:     number
  clinic_id:      number
  items:          TransactionItem[]
  discount_type:  DiscountType
  philhealth_coverage?: number  // amount covered by PhilHealth
  payment_method: PaymentMethod
  payment_status: PaymentStatus
}

// ─────────────────────────────────────────────────────────────
// CREATE TRANSACTION
// ─────────────────────────────────────────────────────────────

export async function createTransaction(data: CreateTransactionData) {
  try {
    // Fetch downpayment if appointment_id is linked to deduct consultation fee
    let downpayment = 0
    if (data.appointment_id) {
      const { data: appt } = await supabaseAdmin
        .from('appointments')
        .select('downpayment')
        .eq('id', data.appointment_id)
        .maybeSingle()
      if (appt?.downpayment) {
        downpayment = appt.downpayment
      }
    }

    const { subtotal, discount_amount, total_amount } = calculateTransactionAmounts(
      data.items,
      data.discount_type,
      data.philhealth_coverage,
      downpayment
    )

    // Insert the transaction header
    const { data: transaction, error: txError } = await insertTransactionHeader({
      appointment_id:       data.appointment_id,
      patient_id:           data.patient_id,
      clinic_id:            data.clinic_id,
      subtotal,
      discount_type:        data.discount_type,
      discount_amount,
      hmo_coverage:         0, // Set to 0 since HMO is removed
      philhealth_coverage:  data.philhealth_coverage ?? 0,
      total_amount,
      payment_method:       data.payment_method,
      payment_status:       data.payment_status,
    })

    if (txError) throw new Error(txError.message)

    // Insert line items
    const itemsData = data.items.map(lineItem => ({
      transaction_id: transaction.id,
      service_id:     lineItem.service_id  ?? null,
      product_id:     lineItem.product_id  ?? null,
      description:    lineItem.description,
      quantity:       lineItem.quantity,
      unit_price:     lineItem.unit_price,
      total_price:    parseFloat((lineItem.unit_price * lineItem.quantity).toFixed(2)),
    }))

    const { error: itemsError } = await insertTransactionItems(itemsData)

    if (itemsError) throw new Error(itemsError.message)

    // Sync payment_status on the linked appointment
    if (data.appointment_id) {
      await syncAppointmentPayment(data.appointment_id, data.payment_status)
    }

    revalidatePath('/staff-dashboard/transactions')
    return {
      success: true,
      transaction: {
        ...transaction,
        items: itemsData,
      },
    }
  } catch (error) {
    console.error('Error in createTransaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create transaction',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// FETCH PATIENT BILLING HISTORY
// ─────────────────────────────────────────────────────────────

export async function fetchPatientBillingHistory(
  patientId: number,
  clinicId?: number   // optional: scope to a specific clinic
) {
  try {
    const [transactionsResult, treatmentHistoryResult] = await Promise.all([
      getTransactionsByPatient(patientId, clinicId),
      getTreatmentHistoryByPatient(patientId, clinicId)
    ])

    const { data: transactions, error: transactionsError } = transactionsResult
    if (transactionsError) throw new Error(transactionsError.message)

    const { data: treatmentHistory, error: treatmentError } = treatmentHistoryResult
    if (treatmentError) throw new Error(treatmentError.message)

    return {
      success: true,
      transactions:     transactions    ?? [],
      treatmentHistory: treatmentHistory ?? [],
    }
  } catch (error) {
    console.error('Error in fetchPatientBillingHistory:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch billing history',
      transactions: [],
      treatmentHistory: [],
    }
  }
}

// ─────────────────────────────────────────────────────────────
// PROCESS PAYMENT
// ─────────────────────────────────────────────────────────────

export async function processPayment(
  transactionId: number,
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus
) {
  try {
    // Update the transaction
    const { data: transaction, error: txError } = await updateTransactionPayment(
      transactionId,
      paymentMethod,
      paymentStatus
    )

    if (txError) throw new Error(txError.message)

    // Keep appointment payment_status in sync
    if (transaction.appointment_id) {
      await syncAppointmentPaymentDetails(
        transaction.appointment_id,
        paymentStatus,
        paymentMethod
      )
    }

    revalidatePath('/staff-dashboard/transactions')
    return { success: true }
  } catch (error) {
    console.error('Error in processPayment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// FETCH CLINIC TRANSACTIONS
// ─────────────────────────────────────────────────────────────

export async function fetchClinicTransactions(
  clinicId: number,
  from?: string,   // "YYYY-MM-DD"
  to?:   string    // "YYYY-MM-DD"
) {
  try {
    const { data: transactions, error } = await getTransactionsByClinic(clinicId, from, to)
    if (error) throw new Error(error.message)

    return { success: true, transactions: transactions ?? [] }
  } catch (error) {
    console.error('Error in fetchClinicTransactions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
      transactions: [],
    }
  }
}
