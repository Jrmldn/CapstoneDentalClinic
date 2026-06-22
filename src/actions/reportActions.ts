'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole } from '@/lib/auth/ensureRole'
import type { SalesReport, ApptReport, ServiceFrequencyReport } from '@/components/features/reports/types'

// REPORTS (data layer — PDF rendering on frontend)

/** Sales & revenue summary for a date range */
export async function generateSalesReport(
  clinicId: number,
  from: string,   // "YYYY-MM-DD"
  to:   string
): Promise<SalesReport | { success: false; error: string }> {
  try {
    const auth = await ensureRole('staff', 'superadmin')
    if (!auth.success) return { success: false, error: auth.error }

    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id, subtotal, discount_type, discount_amount,
        philhealth_coverage, total_amount,
        payment_method, payment_status, created_at,
        patients ( id, first_name, last_name ),
        transaction_items (
          id, description, quantity, unit_price, total_price,
          services ( id, name ),
          products ( id, name )
        )
      `)
      .eq('clinic_id', clinicId)
      .gte('created_at', `${from}T00:00:00`)
      .lte('created_at', `${to}T23:59:59`)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    const txList = (transactions ?? []) as unknown as SalesReport['transactions']

    // Aggregate totals
    const totalRevenue    = txList.reduce((s, t) => s + Number(t.total_amount), 0)
    const totalSubtotal   = txList.reduce((s, t) => s + Number(t.subtotal), 0)
    const totalDiscounts  = txList.reduce((s, t) => s + Number(t.discount_amount), 0)
    const totalPhilHealth = txList.reduce((s, t) => s + Number((t as unknown as { philhealth_coverage?: number }).philhealth_coverage ?? 0), 0)

    return {
      success: true,
      summary: {
        totalTransactions: txList.length,
        totalRevenue,
        totalSubtotal,
        totalDiscounts,
        totalPhilHealth,
      },
      transactions: txList,
    }
  } catch (error) {
    console.error('Error in generateSalesReport:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

/** Appointment summary: counts by status for a date range */
export async function generateAppointmentSummary(
  clinicId: number,
  from: string,
  to: string
): Promise<ApptReport | { success: false; error: string }> {
  try {
    const auth = await ensureRole('staff', 'superadmin')
    if (!auth.success) return { success: false, error: auth.error }

    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id, status, scheduled_at, is_walk_in,
        services ( id, name ),
        patients ( id, first_name, last_name )
      `)
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', `${from}T00:00:00`)
      .lte('scheduled_at', `${to}T23:59:59`)
      .order('scheduled_at', { ascending: true })

    if (error) throw new Error(error.message)

    interface ApptRow { status: string; is_walk_in: boolean }
    const apptList = (appointments ?? []) as unknown as ApptRow[]

    // Count by status
    const countByStatus = apptList.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1
      return acc
    }, {})

    const walkIns = apptList.filter(a => a.is_walk_in).length

    return {
      success: true,
      summary: {
        total: apptList.length,
        walkIns,
        countByStatus,
      },
    }
  } catch (error) {
    console.error('Error in generateAppointmentSummary:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

/** Service frequency: how often each service was booked in a date range */
export async function generateServiceFrequency(
  clinicId: number,
  from: string,
  to: string
): Promise<ServiceFrequencyReport | { success: false; error: string }> {
  try {
    const auth = await ensureRole('staff', 'superadmin')
    if (!auth.success) return { success: false, error: auth.error }

    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('service_id, services ( id, name, price )')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', `${from}T00:00:00`)
      .lte('scheduled_at', `${to}T23:59:59`)
      .not('status', 'in', '(cancelled,no_show)')

    if (error) throw new Error(error.message)

    // Aggregate frequency per service
    const freq = new Map<number, { name: string; price: number; count: number }>()

    for (const appt of appointments ?? []) {
      // Supabase returns joined relations as an array — take the first element
      const rawSvc = appt.services
      const svc = Array.isArray(rawSvc) ? rawSvc[0] : rawSvc
      if (!svc) continue
      const existing = freq.get(svc.id)
      if (existing) {
        existing.count += 1
      } else {
        freq.set(svc.id, { name: svc.name, price: Number(svc.price), count: 1 })
      }
    }

    const serviceFrequency = Array.from(freq.entries())
      .map(([id, serviceStats]) => ({ id, ...serviceStats }))
      .sort((a, b) => b.count - a.count)   // most popular first

    return { success: true, serviceFrequency }
  } catch (error) {
    console.error('Error in generateServiceFrequency:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}
