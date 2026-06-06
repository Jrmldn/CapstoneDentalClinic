import { supabaseAdmin } from '@/lib/supabase/server'

export interface TransactionHeaderInsertData {
  clinic_id: number
  patient_id: number
  appointment_id?: number | null
  subtotal: number
  discount_type: string
  discount_amount: number
  hmo_coverage: number
  philhealth_coverage: number
  total_amount: number
  payment_method: string
  payment_status: string
}

export interface TransactionLineItemInsertData {
  transaction_id: number
  service_id?: number | null
  product_id?: number | null
  description: string
  quantity: number
  unit_price: number
  total_price: number
}

/**
 * Inserts a new transaction header.
 */
export async function insertTransactionHeader(txData: TransactionHeaderInsertData) {
  return supabaseAdmin
    .from('transactions')
    .insert([txData])
    .select()
    .single()
}

/**
 * Inserts transaction line items.
 */
export async function insertTransactionItems(items: TransactionLineItemInsertData[]) {
  return supabaseAdmin
    .from('transaction_items')
    .insert(items)
}


/**
 * Syncs payment status on a linked appointment.
 */
export async function syncAppointmentPayment(appointmentId: number, paymentStatus: string) {
  return supabaseAdmin
    .from('appointments')
    .update({ payment_status: paymentStatus })
    .eq('id', appointmentId)
}

/**
 * Syncs both payment status and payment method on a linked appointment.
 */
export async function syncAppointmentPaymentDetails(
  appointmentId: number,
  paymentStatus: string,
  paymentMethod: string
) {
  return supabaseAdmin
    .from('appointments')
    .update({ payment_status: paymentStatus, payment_method: paymentMethod })
    .eq('id', appointmentId)
}

/**
 * Fetches transactions and associated items for a patient.
 */
export async function getTransactionsByPatient(patientId: number, clinicId?: number) {
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

  return query
}

/**
 * Fetches treatment history for a patient.
 */
export async function getTreatmentHistoryByPatient(patientId: number, clinicId?: number) {
  let query = supabaseAdmin
    .from('treatment_history')
    .select(`
      id, treatment, tooth_number, notes, performed_at,
      services ( id, name, price ),
      dentists ( id, first_name, last_name )
    `)
    .eq('patient_id', patientId)
    .order('performed_at', { ascending: false })

  if (clinicId) {
    query = query.eq('clinic_id', clinicId)
  }

  return query
}

/**
 * Updates payment details on a transaction.
 */
export async function updateTransactionPayment(
  transactionId: number,
  paymentMethod: string,
  paymentStatus: string
) {
  return supabaseAdmin
    .from('transactions')
    .update({
      payment_method: paymentMethod,
      payment_status: paymentStatus,
    })
    .eq('id', transactionId)
    .select('appointment_id')
    .single()
}

/**
 * Fetches transactions for a clinic, optionally filtered by date.
 */
export async function getTransactionsByClinic(
  clinicId: number,
  from?: string,
  to?: string
) {
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

  return query
}
