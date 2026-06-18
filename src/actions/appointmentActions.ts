'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/serverSSR'
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
  | 'follow_up'
  | 'pending_patient_confirm'

export type PaymentMethod = 'gcash' | 'credit_card' | 'paymaya' | 'cash'
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
    // Resolve authenticated user and their role
    let performedBy: string | null = null
    let performedByRole: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        performedBy = user.id
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (userData) {
          performedByRole = userData.role
        }
      }
    } catch (authErr) {
      console.warn('Could not resolve auth user details in createAppointment:', authErr)
    }

    if (!performedByRole) {
      performedByRole = data.is_walk_in ? 'staff' : 'patient'
    }

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
      performed_by:   performedBy,
      role:           performedByRole,
      action:         'created',
      new_status:     'pending',
      notes:          data.is_walk_in ? 'Walk-in appointment' : 'Online booking',
    })

    revalidatePath('/staff-dashboard/appointments')
    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/patient-dashboard/appointments')
    revalidatePath('/patient-dashboard/booking')
    revalidatePath('/patient-dashboard/dashboard')
    revalidatePath('/patient-dashboard/calendar')
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
    // Fetch current status (and reschedule tracking fields) for the log
    const { data: current, error: fetchError } = await getAppointmentStatus(appointmentId)

    if (fetchError || !current) throw new Error('Appointment not found')

    // A2: Enforce reschedule limits for patients
    const isPatientReschedule = role === 'patient' && rescheduledAt
    if (isPatientReschedule) {
      const rescheduleCount = (current as any).reschedule_count ?? 0
      if (rescheduleCount >= 3) {
        return { success: false, error: 'Reschedule limit reached. You may only reschedule up to 3 times per appointment.' }
      }
      const bookedAt = (current as any).booked_at
      if (bookedAt) {
        const hoursSinceBooking = (Date.now() - new Date(bookedAt).getTime()) / (1000 * 60 * 60)
        if (hoursSinceBooking < 1) {
          return { success: false, error: 'You cannot reschedule within 1 hour of booking. Please wait a moment.' }
        }
      }
    }

    const updateData: Record<string, unknown> = { status: newStatus }
    if (rescheduledAt) updateData.scheduled_at = rescheduledAt
    if (rescheduledEnd)  updateData.end_at      = rescheduledEnd
    // A2: Increment reschedule_count when patient reschedules
    if (isPatientReschedule) {
      updateData.reschedule_count = ((current as any).reschedule_count ?? 0) + 1
    }

    // If declining a reschedule (moving from pending_patient_confirm to pending),
    // find the original scheduled times in the log notes and revert to them.
    if (current.status === 'pending_patient_confirm' && newStatus === 'pending') {
      try {
        const { data: latestLog } = await supabaseAdmin
          .from('appointment_logs')
          .select('notes')
          .eq('appointment_id', appointmentId)
          .eq('new_status', 'pending_patient_confirm')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (latestLog && latestLog.notes) {
          const match = latestLog.notes.match(/\[Original: ([^|]+) \| ([^\]]+)\]/)
          if (match) {
            updateData.scheduled_at = match[1].trim()
            updateData.end_at = match[2].trim()
          }
        }
      } catch (logErr) {
        console.warn('Failed to retrieve original schedule time from logs in updateAppointmentStatus:', logErr)
      }
    }

    const { error: updateError } = await updateAppointmentDetails(appointmentId, updateData)

    if (updateError) throw new Error(updateError.message)

    // Write audit log
    let logAction: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show' | 'follow_up_set' | 'status_updated'
    if (newStatus === 'rescheduled' || newStatus === 'pending_patient_confirm') {
      logAction = 'rescheduled'
    } else if (newStatus === 'confirmed') {
      logAction = 'confirmed'
    } else if (newStatus === 'completed') {
      logAction = 'completed'
    } else if (newStatus === 'cancelled') {
      logAction = 'cancelled'
    } else if (newStatus === 'no_show') {
      logAction = 'no_show'
    } else if (newStatus === 'follow_up') {
      logAction = 'follow_up_set'
    } else {
      logAction = 'status_updated'
    }

    let logNotes = notes ?? null
    if (newStatus === 'pending_patient_confirm') {
      logNotes = `${notes ?? ''} [Original: ${(current as any).scheduled_at} | ${(current as any).end_at}]`
    }

    await insertAppointmentLog({
      appointment_id: appointmentId,
      performed_by:   performedBy,
      role,
      action:         logAction,
      old_status:     current.status,
      new_status:     newStatus,
      notes:          logNotes,
    })

    revalidatePath('/staff-dashboard/appointments')
    revalidatePath('/patient-dashboard/appointments')
    revalidatePath('/patient-dashboard/dashboard')
    revalidatePath('/patient-dashboard/calendar')
    revalidatePath('/dentist-dashboard')
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

// ─────────────────────────────────────────────────────────────
// DENTIST BLOCKED SLOTS ACTIONS
// ─────────────────────────────────────────────────────────────

export async function addBlockedSlot(
  dentistId: number,
  blockedDate: string,
  startTime: string | null,
  endTime: string | null,
  reason: string | null
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('dentist_blocked_slots')
      .insert([{
        dentist_id: dentistId,
        blocked_date: blockedDate,
        start_time: startTime || null,
        end_time: endTime || null,
        reason: reason || 'Blocked',
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/dentist-dashboard/availability')
    return { success: true, blockedSlot: data }
  } catch (error) {
    console.error('Error in addBlockedSlot:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add blocked slot',
    }
  }
}

export async function deleteBlockedSlot(blockedSlotId: number) {
  try {
    const { error } = await supabaseAdmin
      .from('dentist_blocked_slots')
      .delete()
      .eq('id', blockedSlotId)

    if (error) throw new Error(error.message)

    revalidatePath('/dentist-dashboard/availability')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteBlockedSlot:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete blocked slot',
    }
  }
}

export async function fetchBlockedSlots(dentistId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from('dentist_blocked_slots')
      .select('*')
      .eq('dentist_id', dentistId)

    if (error) throw new Error(error.message)

    return { success: true, blockedSlots: data || [] }
  } catch (error) {
    console.error('Error in fetchBlockedSlots:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch blocked slots',
      blockedSlots: [],
    }
  }
}

// ─────────────────────────────────────────────────────────────
// DENTIST WORKING HOURS ACTIONS
// ─────────────────────────────────────────────────────────────

export interface DentistAvailabilityInput {
  day_of_week: number
  start_time: string
  end_time: string
}

export async function updateDentistWorkingHours(
  dentistId: number,
  availabilities: DentistAvailabilityInput[]
) {
  try {
    // Delete existing availability for dentist
    const { error: deleteErr } = await supabaseAdmin
      .from('dentist_availability')
      .delete()
      .eq('dentist_id', dentistId)

    if (deleteErr) throw new Error(deleteErr.message)

    // Insert new availability
    if (availabilities.length > 0) {
      const insertData = availabilities.map(av => ({
        dentist_id: dentistId,
        day_of_week: av.day_of_week,
        start_time: av.start_time,
        end_time: av.end_time,
      }))

      const { error: insertErr } = await supabaseAdmin
        .from('dentist_availability')
        .insert(insertData)

      if (insertErr) throw new Error(insertErr.message)
    }

    revalidatePath('/dentist-dashboard/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in updateDentistWorkingHours:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update working hours',
    }
  }
}

export async function fetchDentistWorkingHours(dentistId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from('dentist_availability')
      .select('*')
      .eq('dentist_id', dentistId)
      .order('day_of_week', { ascending: true })

    if (error) throw new Error(error.message)

    return { success: true, workingHours: data || [] }
  } catch (error) {
    console.error('Error in fetchDentistWorkingHours:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch working hours',
      workingHours: [],
    }
  }
}

export async function updateDentistProfile(
  dentistId: number,
  data: {
    first_name: string
    last_name: string
    specialty?: string | null
    license_no?: string | null
  }
) {
  try {
    const { error } = await supabaseAdmin
      .from('dentists')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        specialty: data.specialty,
        license_no: data.license_no,
      })
      .eq('id', dentistId)

    if (error) throw new Error(error.message)

    revalidatePath('/dentist-dashboard/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in updateDentistProfile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    }
  }
}
