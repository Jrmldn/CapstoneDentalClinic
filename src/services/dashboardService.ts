import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Fetches staff clinic assignment and name.
 */
export async function getStaffRecordByUserId(userId: string) {
  return supabaseAdmin
    .from('clinic_staff')
    .select('clinic_id, first_name, last_name')
    .eq('user_id', userId)
    .maybeSingle()
}

/**
 * Fetches data required for the staff dashboard in parallel.
 */
export async function getStaffDashboardData(clinicId: number, today: string) {
  return Promise.all([
    // Today's appointments
    supabaseAdmin
      .from('appointments')
      .select('id, scheduled_at, status, patients ( first_name, last_name ), services ( name )')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${today}T23:59:59`)
      .not('status', 'in', '(cancelled,no_show)')
      .order('scheduled_at', { ascending: true }),

    // Total patients (ever had an appointment at this clinic)
    supabaseAdmin
      .from('appointments')
      .select('patient_id')
      .eq('clinic_id', clinicId),

    // Low stock inventory items
    supabaseAdmin
      .from('inventory_items')
      .select('id, name, quantity, alert_threshold')
      .eq('clinic_id', clinicId),

    // Unpaid transactions this month
    supabaseAdmin
      .from('transactions')
      .select('id, total_amount')
      .eq('clinic_id', clinicId)
      .eq('payment_status', 'unpaid')
      .gte('created_at', `${today.slice(0, 7)}-01T00:00:00`),
  ])
}

/**
 * Fetches counts and recent clinics for the superadmin dashboard.
 */
export async function getSuperadminDashboardStatsData() {
  return Promise.all([
    supabaseAdmin.from('clinics').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('clinic_staff').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('dentists').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('patients').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('clinics')
      .select('id, name, created_at, is_active')
      .order('created_at', { ascending: false })
      .limit(5)
  ])
}
