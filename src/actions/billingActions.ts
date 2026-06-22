'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole } from '@/lib/auth/ensureRole'
import { validatePatientAccess } from '@/lib/auth/validatePatientAccess'
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
import { calculateTransactionAmounts, DISCOUNT_RATES } from '@/utils/billing-helpers'
import { addTreatmentRecords } from '@/actions/clinicalRecordActions'

// TYPES

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

// CREATE TRANSACTION

export async function createTransaction(data: CreateTransactionData) {
  const auth = await ensureRole('staff', 'dentist')
  if (!auth.success) return { success: false, error: auth.error }

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
      error: sanitizeServerError(error),
    }
  }
}

// CREATE DRAFT INVOICE (dentist handoff)

export interface DraftLineItem extends TransactionItem {
  tooth_number?: number | null
  treatment_notes?: string | null
}

export interface CreateDraftInvoiceData {
  appointment_id: number
  patient_id: number
  clinic_id: number
  dentist_id: number
  items: DraftLineItem[]
}

export async function createDraftInvoice(data: CreateDraftInvoiceData) {
  const auth = await ensureRole('dentist', 'staff')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    // Validate price range for installment-eligible services
    const serviceIds = data.items.map(i => i.service_id).filter((id): id is number => id != null)
    if (serviceIds.length > 0) {
      type SvcRow = { id: number; name: string; allows_installment: boolean | null; price_min: number | null; price_max: number | null }
      const { data: svcs } = await supabaseAdmin
        .from('services')
        .select('id, name, allows_installment, price_min, price_max')
        .in('id', serviceIds)
      for (const item of data.items) {
        if (!item.service_id) continue
        const svc = (svcs as SvcRow[] ?? []).find(s => s.id === item.service_id)
        if (!svc?.allows_installment) continue
        const min = Number(svc.price_min ?? 0)
        const max = Number(svc.price_max ?? Infinity)
        if (item.unit_price < min || item.unit_price > max) {
          return {
            success: false,
            error: `Price for "${svc.name}" must be between ₱${min.toLocaleString()} and ₱${max.toLocaleString()}.`,
          }
        }
      }
    }

    let downpayment = 0
    const { data: appt } = await supabaseAdmin
      .from('appointments')
      .select('downpayment')
      .eq('id', data.appointment_id)
      .maybeSingle()
    if (appt?.downpayment) downpayment = appt.downpayment

    const { subtotal, discount_amount, total_amount } = calculateTransactionAmounts(
      data.items,
      'none',
      0,
      downpayment
    )

    const { data: transaction, error: txError } = await insertTransactionHeader({
      appointment_id: data.appointment_id,
      patient_id: data.patient_id,
      clinic_id: data.clinic_id,
      billing_status: 'draft',
      subtotal,
      discount_type: 'none',
      discount_amount,
      hmo_coverage: 0,
      philhealth_coverage: 0,
      total_amount,
      payment_method: 'cash',
      payment_status: 'unpaid',
    })
    if (txError) throw new Error(txError.message)

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

    // Populate the clinical record for every treated line (encrypted writer).
    // Non-fatal: the draft invoice is the critical artifact.
    const treatmentRows = data.items
      .filter(line => line.service_id != null)
      .map(line => ({
        appointment_id: data.appointment_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        patient_id: data.patient_id,
        service_id: line.service_id ?? null,
        tooth_number: line.tooth_number ?? null,
        treatment: line.description,
        notes: line.treatment_notes ?? undefined,
      }))
    if (treatmentRows.length > 0) {
      const treatmentResult = await addTreatmentRecords(treatmentRows)
      if (!treatmentResult.success) {
        console.error('createDraftInvoice: treatment_history write failed:', treatmentResult.error)
      }
    }

    revalidatePath('/staff-dashboard/billing')
    revalidatePath('/patient-dashboard/clinicrecord')
    return { success: true, transaction: { ...transaction, items: itemsData } }
  } catch (error) {
    console.error('Error in createDraftInvoice:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

// FINALIZE DRAFT INVOICE (staff checkout)

export interface FinalizeDraftData {
  discount_type: DiscountType
  philhealth_coverage?: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
}

export async function finalizeDraftInvoice(transactionId: number, data: FinalizeDraftData) {
  const auth = await ensureRole('staff')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: tx } = await supabaseAdmin
      .from('transactions')
      .select('appointment_id, subtotal')
      .eq('id', transactionId)
      .single()
    if (!tx) throw new Error('Transaction not found')

    let downpayment = 0
    if (tx.appointment_id) {
      const { data: appt } = await supabaseAdmin
        .from('appointments')
        .select('downpayment')
        .eq('id', tx.appointment_id)
        .maybeSingle()
      if (appt?.downpayment) downpayment = appt.downpayment
    }

    const discountRate = DISCOUNT_RATES[data.discount_type]
    const discount_amount = parseFloat((tx.subtotal * discountRate).toFixed(2))
    const philhealth = data.philhealth_coverage ?? 0
    const total_amount = parseFloat(
      Math.max(0, tx.subtotal - discount_amount - philhealth - downpayment).toFixed(2)
    )

    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        billing_status:      'issued',
        discount_type:       data.discount_type,
        discount_amount,
        philhealth_coverage: philhealth,
        total_amount,
        payment_method:      data.payment_method,
        payment_status:      data.payment_status,
      })
      .eq('id', transactionId)
    if (updateError) throw new Error(updateError.message)

    if (tx.appointment_id) {
      await syncAppointmentPaymentDetails(tx.appointment_id, data.payment_status, data.payment_method)
    }

    revalidatePath('/staff-dashboard/billing')
    revalidatePath('/staff-dashboard/transactions')
    revalidatePath('/patient-dashboard/transactions')
    return { success: true }
  } catch (error) {
    console.error('Error in finalizeDraftInvoice:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

// FETCH PATIENT BILLING HISTORY

export async function fetchPatientBillingHistory(
  patientId: number,
  clinicId?: number   // optional: scope to a specific clinic
) {
  const access = await validatePatientAccess(patientId)
  if (!access.allowed) return { success: false, error: access.reason, transactions: [], treatmentHistory: [] }

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
      error: sanitizeServerError(error),
      transactions: [],
      treatmentHistory: [],
    }
  }
}

// PROCESS PAYMENT

export async function processPayment(
  transactionId: number,
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus
) {
  const auth = await ensureRole('staff', 'dentist')
  if (!auth.success) return { success: false, error: auth.error }

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
      error: sanitizeServerError(error),
    }
  }
}

// FETCH CLINIC TRANSACTIONS

export async function fetchClinicTransactions(
  clinicId: number,
  from?: string,   // "YYYY-MM-DD"
  to?:   string    // "YYYY-MM-DD"
) {
  const auth = await ensureRole('staff', 'dentist')
  if (!auth.success) return { success: false, error: auth.error, transactions: [] }

  try {
    const { data: transactions, error } = await getTransactionsByClinic(clinicId, from, to)
    if (error) throw new Error(error.message)

    return { success: true, transactions: transactions ?? [] }
  } catch (error) {
    console.error('Error in fetchClinicTransactions:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      transactions: [],
    }
  }
}

