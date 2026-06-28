import { supabaseAdmin } from '@/lib/supabase/server'
import { cache } from 'react'

/**
 * Retrieves appointments for a given clinic and date range.
 */
export const getAppointmentsByDateRange = cache(async (clinicId: number, start: string, end: string) => {
  return supabaseAdmin
    .from('appointments')
    .select(`
      *,
      patients ( id, first_name, last_name, phone, is_guest ),
      services ( id, name, price, slot_duration_min ),
      dentists ( id, first_name, last_name )
    `)
    .eq('clinic_id', clinicId)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .order('scheduled_at', { ascending: true })
})

/**
 * Fetches holiday configuration for a clinic on a specific date.
 */
export const getClinicHoliday = cache(async (clinicId: number, date: string) => {
  return supabaseAdmin
    .from('clinic_holidays')
    .select('id, is_special_day')
    .eq('clinic_id', clinicId)
    .eq('date', date)
    .maybeSingle()
})

/**
 * Fetches operating hours for a clinic on a specific weekday.
 */
export const getClinicOperatingHours = cache(async (clinicId: number, dayOfWeek: number) => {
  return supabaseAdmin
    .from('clinic_operating_hours')
    .select('open_time, close_time, is_closed')
    .eq('clinic_id', clinicId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()
})

/**
 * Fetches dentist shift times for a specific weekday.
 */
export const getDentistAvailability = cache(async (dentistId: number, dayOfWeek: number) => {
  return supabaseAdmin
    .from('dentist_availability')
    .select('start_time, end_time')
    .eq('dentist_id', dentistId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()
})

/**
 * Retrieves blocked slots for a dentist on a specific date.
 */
export const getDentistBlockedSlots = cache(async (dentistId: number, date: string) => {
  return supabaseAdmin
    .from('dentist_blocked_slots')
    .select('start_time, end_time')
    .eq('dentist_id', dentistId)
    .eq('blocked_date', date)
})

/**
 * Fetches service details by ID.
 */
export const getServiceById = cache(async (serviceId: number) => {
  return supabaseAdmin
    .from('services')
    .select('slot_duration_min')
    .eq('id', serviceId)
    .single()
})

/**
 * Retrieves active booked appointments for a dentist/clinic on a specific date.
 */
export const getActiveAppointmentsForSlots = cache(async (
  clinicId: number,
  dentistId: number,
  start: string,
  end: string
) => {
  return supabaseAdmin
    .from('appointments')
    .select('scheduled_at, end_at')
    .eq('dentist_id', dentistId)
    .eq('clinic_id', clinicId)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .not('status', 'in', '("cancelled","no_show")')
})

/**
 * Fetches clinic capacity configuration.
 */
export const getClinicCapacity = cache(async (clinicId: number) => {
  return supabaseAdmin
    .from('clinics')
    .select('max_appointments_per_day')
    .eq('id', clinicId)
    .single()
})

export interface CreateAppointmentInsertData {
  clinic_id: number
  patient_id: number
  dentist_id: number
  service_id: number
  scheduled_at: string
  end_at: string
  notes?: string | null
  is_walk_in?: boolean
  downpayment?: number
  payment_method?: string | null
  payment_status?: string
  status?: string
}

export interface AppointmentLogInsertData {
  appointment_id: number
  performed_by?: string | null
  role?: string | null
  action?: string | null
  old_status?: string | null
  new_status?: string | null
  notes?: string | null
}

/**
 * Inserts a new appointment record.
 */
export async function insertAppointment(insertData: CreateAppointmentInsertData) {
  return supabaseAdmin
    .from('appointments')
    .insert([insertData as never])
    .select()
    .single()
}

/**
 * Inserts an audit log record into appointment_logs.
 */
export async function insertAppointmentLog(logData: AppointmentLogInsertData) {
  return supabaseAdmin
    .from('appointment_logs')
    .insert([logData as never])
}

/**
 * Fetches an appointment's current status.
 */
export const getAppointmentStatus = cache(async (appointmentId: number) => {
  return supabaseAdmin
    .from('appointments')
    .select('status, reschedule_count, booked_at, scheduled_at, end_at, patient_id')
    .eq('id', appointmentId)
    .single()
})

/**
 * Updates status and rescheduling details for an appointment.
 */
export async function updateAppointmentDetails(
  appointmentId: number,
  updateData: Record<string, unknown>
) {
  return supabaseAdmin
    .from('appointments')
    .update(updateData as never)
    .eq('id', appointmentId)
}

/**
 * Updates max appointments per day for a clinic.
 */
export async function updateClinicMaxLimit(clinicId: number, max: number) {
  return supabaseAdmin
    .from('clinics')
    .update({ max_appointments_per_day: max })
    .eq('id', clinicId)
}

