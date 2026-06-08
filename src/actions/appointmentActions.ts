'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  getAppointmentsByDateRange,
  getClinicHoliday,
  getClinicOperatingHours,
  getDentistAvailability,
  getDentistBlockedSlots,
  getServiceById,
  getActiveAppointmentsForSlots,
  getClinicCapacity,
  insertAppointment,
  insertAppointmentLog,
  getAppointmentStatus,
  updateAppointmentDetails,
  updateClinicMaxLimit
} from '@/services/appointmentService'
import { generateTimeSlots } from '@/utils/appointment-helpers'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rescheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type PaymentMethod = 'gcash' | 'credit_card' | 'paymaya' | 'cash' | 'hmo'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface CreateAppointmentData {
  clinic_id: number
  patient_id: number
  dentist_id: number
  service_id: number
  scheduled_at: string      // ISO string
  end_at: string            // ISO string
  notes?: string
  is_walk_in?: boolean
  downpayment?: number
  payment_method?: PaymentMethod
}

export interface TimeSlot {
  start: string   // "HH:mm"
  end: string     // "HH:mm"
  available: boolean
}

// ─────────────────────────────────────────────────────────────
// FETCH APPOINTMENTS BY DATE (with related data)
// ─────────────────────────────────────────────────────────────

export async function fetchAppointmentsByDate(clinicId: number, date: string) {
  try {
    const dayStart = `${date}T00:00:00+00:00`
    const dayEnd   = `${date}T23:59:59+00:00`

    const { data: appointments, error } = await getAppointmentsByDateRange(clinicId, dayStart, dayEnd)

    if (error) throw new Error(error.message)

    return { success: true, appointments: appointments || [] }
  } catch (error) {
    console.error('Error in fetchAppointmentsByDate:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch appointments',
      appointments: [],
    }
  }
}

// ─────────────────────────────────────────────────────────────
// GET AVAILABLE SLOTS
// ─────────────────────────────────────────────────────────────

export async function getAvailableSlots(
  clinicId: number,
  dentistId: number,
  serviceId: number,
  date: string   // "YYYY-MM-DD"
): Promise<{ success: boolean; slots?: TimeSlot[]; error?: string }> {
  try {
    const dayOfWeek = new Date(date).getDay() // 0=Sun … 6=Sat
    const dayStart = `${date}T00:00:00`
    const dayEnd   = `${date}T23:59:59`

    // Run all database fetches in parallel (Class A Optimization)
    const [
      holidayRes,
      opHoursRes,
      dentistHoursRes,
      blockedSlotsRes,
      serviceRes,
      existingApptsRes,
      clinicRes,
    ] = await Promise.all([
      getClinicHoliday(clinicId, date),
      getClinicOperatingHours(clinicId, dayOfWeek),
      getDentistAvailability(dentistId, dayOfWeek),
      getDentistBlockedSlots(dentistId, date),
      getServiceById(serviceId),
      getActiveAppointmentsForSlots(clinicId, dentistId, dayStart, dayEnd),
      getClinicCapacity(clinicId),
    ])

    const holiday = holidayRes.data
    const opHours = opHoursRes.data
    const opError = opHoursRes.error
    const dentistHours = dentistHoursRes.data
    const blockedSlots = blockedSlotsRes.data
    const service = serviceRes.data
    const serviceError = serviceRes.error
    const existingAppts = existingApptsRes.data
    const clinic = clinicRes.data

    // 1. Check for clinic holiday / closure
    if (holiday && !holiday.is_special_day) {
      return { success: true, slots: [] } // clinic is closed that day
    }

    // 2. Clinic operating hours for the weekday
    if (opError) throw new Error(opError.message)
    if (!opHours || opHours.is_closed) return { success: true, slots: [] }

    // 3. Dentist availability for the weekday
    // Use dentist hours if defined, otherwise fall back to clinic hours
    const windowStart = dentistHours?.start_time ?? opHours.open_time
    const windowEnd   = dentistHours?.end_time   ?? opHours.close_time

    // 4. Dentist blocked slots for that specific date (already fetched)

    // 5. Service duration
    if (serviceError || !service) throw new Error('Service not found')
    const duration = service.slot_duration_min

    // 6. Existing appointments for that dentist on that date (not cancelled/no-show) (already fetched)

    // 7. Check max appointments per day
    const maxPerDay = clinic?.max_appointments_per_day ?? Infinity
    const bookedCount = existingAppts?.length ?? 0

    if (bookedCount >= maxPerDay) return { success: true, slots: [] }

    // 8. Generate slots using helpers
    const slots = generateTimeSlots(
      windowStart,
      windowEnd,
      duration,
      existingAppts ?? [],
      blockedSlots ?? []
    )

    return { success: true, slots }
  } catch (error) {
    console.error('Error in getAvailableSlots:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available slots',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// CREATE APPOINTMENT
// ─────────────────────────────────────────────────────────────

export async function createAppointment(data: CreateAppointmentData) {
  try {
    const { data: appointment, error } = await insertAppointment({
      clinic_id:      data.clinic_id,
      patient_id:     data.patient_id,
      dentist_id:     data.dentist_id,
      service_id:     data.service_id,
      scheduled_at:   data.scheduled_at,
      end_at:         data.end_at,
      notes:          data.notes ?? null,
      is_walk_in:     data.is_walk_in ?? false,
      downpayment:    data.downpayment ?? 0,
      payment_method: data.payment_method ?? null,
      payment_status: data.downpayment && data.downpayment > 0 ? 'partial' : 'unpaid',
      status:         'pending',
    })

    if (error) throw new Error(error.message)

    // Log the creation
    await insertAppointmentLog({
      appointment_id: appointment.id,
      action:         'created',
      new_status:     'pending',
      notes:          data.is_walk_in ? 'Walk-in appointment' : 'Online booking',
    })

    // Link patient to clinic via clinic_patients junction table if they aren't already linked
    const { error: junctionError } = await supabaseAdmin
      .from('clinic_patients')
      .upsert(
        [{
          clinic_id: data.clinic_id,
          patient_id: data.patient_id,
          is_active: true,
        }],
        { onConflict: 'clinic_id,patient_id', ignoreDuplicates: true }
      )

    if (junctionError) {
      console.warn('Failed to link patient to clinic on appointment creation:', junctionError.message)
    }

    revalidatePath('/staff-dashboard/appointments')
    revalidatePath('/staff-dashboard/patients')
    return { success: true, appointment }
  } catch (error) {
    console.error('Error in createAppointment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create appointment',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE APPOINTMENT STATUS  (with audit log)
// ─────────────────────────────────────────────────────────────

export async function updateAppointmentStatus(
  appointmentId: number,
  newStatus: AppointmentStatus,
  performedBy: string,   // user UUID
  role: string,
  notes?: string,
  rescheduledAt?: string,  // provide when rescheduling
  rescheduledEnd?: string
) {
  try {
    // Fetch current status for the log
    const { data: current, error: fetchError } = await getAppointmentStatus(appointmentId)

    if (fetchError || !current) throw new Error('Appointment not found')

    const updateData: Record<string, unknown> = { status: newStatus }
    if (rescheduledAt) updateData.scheduled_at = rescheduledAt
    if (rescheduledEnd)  updateData.end_at      = rescheduledEnd

    const { error: updateError } = await updateAppointmentDetails(appointmentId, updateData)

    if (updateError) throw new Error(updateError.message)

    // Write audit log
    await insertAppointmentLog({
      appointment_id: appointmentId,
      performed_by:   performedBy,
      role,
      action:         newStatus === 'rescheduled' ? 'rescheduled' : 'status_change',
      old_status:     current.status,
      new_status:     newStatus,
      notes:          notes ?? null,
    })

    revalidatePath('/staff-dashboard/appointments')
    return { success: true }
  } catch (error) {
    console.error('Error in updateAppointmentStatus:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update appointment status',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// SET MAX APPOINTMENTS PER DAY
// ─────────────────────────────────────────────────────────────

export async function updateMaxAppointments(clinicId: number, max: number) {
  try {
    const { error } = await updateClinicMaxLimit(clinicId, max)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in updateMaxAppointments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update max appointments',
    }
  }
}
