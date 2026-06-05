'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type DiscountType = 'none' | 'senior' | 'pwd' | 'hmo' | 'philhealth'
export type PaymentMethod = 'cash' | 'gcash' | 'credit_card' | 'paymaya' | 'hmo'
export type PaymentStatus  = 'unpaid' | 'partial' | 'paid'

export interface TransactionItem {
  service_id?:  number
  product_id?:  number
  description:  string
  quantity:     number
  unit_price:   number
}

export interface CreateTransactionData {
  appointment_id: number
  patient_id:     number
  clinic_id:      number
  items:          TransactionItem[]
  discount_type:  DiscountType
  hmo_coverage?:       number   // amount covered by HMO
  philhealth_coverage?: number  // amount covered by PhilHealth
  payment_method: PaymentMethod
  payment_status: PaymentStatus
}

// Discount rates (PWD/Senior = 20% on subtotal by PH law)
const DISCOUNT_RATES: Record<DiscountType, number> = {
  none:       0,
  senior:     0.20,
  pwd:        0.20,
  hmo:        0,     // HMO uses coverage amount directly
  philhealth: 0,     // PhilHealth uses coverage amount directly
}

// ─────────────────────────────────────────────────────────────
// CREATE TRANSACTION
// Compiles line items → calculates subtotal → applies discounts
// → inserts transaction + transaction_items atomically
// ─────────────────────────────────────────────────────────────

export async function createTransaction(data: CreateTransactionData) {
  try {
    // 1. Calculate subtotal from items
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    )

    // 2. Calculate discount amount
    const discountRate   = DISCOUNT_RATES[data.discount_type]
    const discount_amount = parseFloat((subtotal * discountRate).toFixed(2))
    const hmo_coverage      = data.hmo_coverage      ?? 0
    const philhealth_coverage = data.philhealth_coverage ?? 0

    // 3. Compute total
    const total_amount = parseFloat(
      Math.max(0, subtotal - discount_amount - hmo_coverage - philhealth_coverage).toFixed(2)
    )

    // 4. Insert the transaction header
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert([{
        appointment_id:       data.appointment_id,
        patient_id:           data.patient_id,
        clinic_id:            data.clinic_id,
        subtotal,
        discount_type:        data.discount_type,
        discount_amount,
        hmo_coverage,
        philhealth_coverage,
        total_amount,
        payment_method:       data.payment_method,
        payment_status:       data.payment_status,
      }])
      .select()
      .single()

    if (txError) throw new Error(txError.message)

    // 5. Insert line items
    const itemsData = data.items.map(item => ({
      transaction_id: transaction.id,
      service_id:     item.service_id  ?? null,
      product_id:     item.product_id  ?? null,
      description:    item.description,
      quantity:       item.quantity,
      unit_price:     item.unit_price,
      total_price:    parseFloat((item.unit_price * item.quantity).toFixed(2)),
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('transaction_items')
      .insert(itemsData)

    if (itemsError) throw new Error(itemsError.message)

    // 6. Sync payment_status on the linked appointment
    await supabaseAdmin
      .from('appointments')
      .update({ payment_status: data.payment_status })
      .eq('id', data.appointment_id)

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
// Returns all transactions for a patient with their line items
// and linked appointment/treatment info.
// ─────────────────────────────────────────────────────────────

export async function fetchPatientBillingHistory(
  patientId: number,
  clinicId?: number   // optional: scope to a specific clinic
) {
  try {
    let query = supabaseAdmin
      .from('transactions')
      .select(`
        *,
        transaction_items (
          id, description, quantity, unit_price, total_price,
          services ( id, name ),
          products ( id, name )
        ),
        appointments (
          id, scheduled_at, status,
          dentists ( id, first_name, last_name )
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (clinicId) {
      query = query.eq('clinic_id', clinicId)
    }

    const { data: transactions, error } = await query
    if (error) throw new Error(error.message)

    // Also pull treatment history for full billing context
    let treatmentQuery = supabaseAdmin
      .from('treatment_history')
      .select(`
        id, treatment, tooth_number, notes, performed_at,
        services ( id, name, price ),
        dentists ( id, first_name, last_name )
      `)
      .eq('patient_id', patientId)
      .order('performed_at', { ascending: false })

    if (clinicId) {
      treatmentQuery = treatmentQuery.eq('clinic_id', clinicId)
    }

    const { data: treatmentHistory, error: treatError } = await treatmentQuery
    if (treatError) throw new Error(treatError.message)

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
// PROCESS PAYMENT  (settle / partially update a transaction)
// ─────────────────────────────────────────────────────────────

export async function processPayment(
  transactionId: number,
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus
) {
  try {
    // Update the transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .update({
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      })
      .eq('id', transactionId)
      .select('appointment_id')
      .single()

    if (txError) throw new Error(txError.message)

    // Keep appointment payment_status in sync
    if (transaction.appointment_id) {
      await supabaseAdmin
        .from('appointments')
        .update({ payment_status: paymentStatus, payment_method: paymentMethod })
        .eq('id', transaction.appointment_id)
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
// FETCH CLINIC TRANSACTIONS (for sales analytics)
// ─────────────────────────────────────────────────────────────

export async function fetchClinicTransactions(
  clinicId: number,
  from?: string,   // "YYYY-MM-DD"
  to?:   string    // "YYYY-MM-DD"
) {
  try {
    let query = supabaseAdmin
      .from('transactions')
      .select(`
        *,
        transaction_items (
          id, description, quantity, unit_price, total_price,
          services ( id, name ),
          products ( id, name )
        ),
        patients ( id, first_name, last_name )
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })

    if (from) query = query.gte('created_at', `${from}T00:00:00`)
    if (to)   query = query.lte('created_at', `${to}T23:59:59`)

    const { data: transactions, error } = await query
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
