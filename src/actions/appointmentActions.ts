'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients ( id, first_name, last_name, phone, is_guest ),
        services ( id, name, price, slot_duration_min ),
        dentists ( id, first_name, last_name, specialty )
      `)
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .order('scheduled_at', { ascending: true })

    if (error) throw new Error(error.message)

    return { success: true, appointments: appointments || [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch appointments',
      appointments: [],
    }
  }
}

// ─────────────────────────────────────────────────────────────
// GET AVAILABLE SLOTS
// Logic:
//  1. Check clinic operating hours for that weekday
//  2. Check clinic_holidays (if closed that day)
//  3. Check dentist_availability and dentist_blocked_slots
//  4. Check max_appointments_per_day against existing confirmed/pending count
//  5. Subtract already-booked appointment windows
//  6. Generate slots based on service slot_duration_min
// ─────────────────────────────────────────────────────────────

export async function getAvailableSlots(
  clinicId: number,
  dentistId: number,
  serviceId: number,
  date: string   // "YYYY-MM-DD"
): Promise<{ success: boolean; slots?: TimeSlot[]; error?: string }> {
  try {
    const dayOfWeek = new Date(date).getDay() // 0=Sun … 6=Sat

    // 1. Check for clinic holiday / closure
    const { data: holiday } = await supabaseAdmin
      .from('clinic_holidays')
      .select('id, is_special_day')
      .eq('clinic_id', clinicId)
      .eq('date', date)
      .maybeSingle()

    if (holiday && !holiday.is_special_day) {
      return { success: true, slots: [] } // clinic is closed that day
    }

    // 2. Clinic operating hours for the weekday
    const { data: opHours, error: opError } = await supabaseAdmin
      .from('clinic_operating_hours')
      .select('open_time, close_time, is_closed')
      .eq('clinic_id', clinicId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle()

    if (opError) throw new Error(opError.message)
    if (!opHours || opHours.is_closed) return { success: true, slots: [] }

    // 3. Dentist availability for the weekday
    const { data: dentistHours } = await supabaseAdmin
      .from('dentist_availability')
      .select('start_time, end_time')
      .eq('dentist_id', dentistId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle()

    // Use dentist hours if defined, otherwise fall back to clinic hours
    const windowStart = dentistHours?.start_time ?? opHours.open_time
    const windowEnd   = dentistHours?.end_time   ?? opHours.close_time

    // 4. Dentist blocked slots for that specific date
    const { data: blockedSlots } = await supabaseAdmin
      .from('dentist_blocked_slots')
      .select('start_time, end_time')
      .eq('dentist_id', dentistId)
      .eq('blocked_date', date)

    // 5. Service duration
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('slot_duration_min')
      .eq('id', serviceId)
      .single()

    if (serviceError || !service) throw new Error('Service not found')
    const duration = service.slot_duration_min

    // 6. Existing appointments for that dentist on that date (not cancelled/no-show)
    const dayStart = `${date}T00:00:00`
    const dayEnd   = `${date}T23:59:59`

    const { data: existingAppts } = await supabaseAdmin
      .from('appointments')
      .select('scheduled_at, end_at')
      .eq('dentist_id', dentistId)
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .not('status', 'in', '("cancelled","no_show")')

    // 7. Check max appointments per day
    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('max_appointments_per_day')
      .eq('id', clinicId)
      .single()

    const maxPerDay = clinic?.max_appointments_per_day ?? Infinity
    const bookedCount = existingAppts?.length ?? 0

    if (bookedCount >= maxPerDay) return { success: true, slots: [] }

    // 8. Generate slots
    const slots = generateTimeSlots(
      windowStart,
      windowEnd,
      duration,
      existingAppts ?? [],
      blockedSlots ?? []
    )

    return { success: true, slots }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available slots',
    }
  }
}

// Helper: convert "HH:mm:ss" → minutes from midnight
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Helper: minutes → "HH:mm"
function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function generateTimeSlots(
  openTime: string,
  closeTime: string,
  durationMins: number,
  bookedAppts: { scheduled_at: string; end_at: string }[],
  blockedSlots: { start_time: string; end_time: string }[]
): TimeSlot[] {
  const start  = toMinutes(openTime)
  const end    = toMinutes(closeTime)
  const slots: TimeSlot[] = []

  // Build blocked windows in minutes
  const blockedWindows = [
    ...bookedAppts.map(a => ({
      from: toMinutes(new Date(a.scheduled_at).toTimeString().slice(0, 5)),
      to:   toMinutes(new Date(a.end_at).toTimeString().slice(0, 5)),
    })),
    ...blockedSlots.map(b => ({
      from: toMinutes(b.start_time),
      to:   toMinutes(b.end_time),
    })),
  ]

  for (let cursor = start; cursor + durationMins <= end; cursor += durationMins) {
    const slotEnd = cursor + durationMins
    const overlaps = blockedWindows.some(w => cursor < w.to && slotEnd > w.from)

    slots.push({
      start: fromMinutes(cursor),
      end:   fromMinutes(slotEnd),
      available: !overlaps,
    })
  }

  return slots
}

// ─────────────────────────────────────────────────────────────
// CREATE APPOINTMENT
// ─────────────────────────────────────────────────────────────

export async function createAppointment(data: CreateAppointmentData) {
  try {
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert([{
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
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Log the creation
    await supabaseAdmin.from('appointment_logs').insert([{
      appointment_id: appointment.id,
      action:         'created',
      new_status:     'pending',
      notes:          data.is_walk_in ? 'Walk-in appointment' : 'Online booking',
    }])

    revalidatePath('/staff-dashboard/appointments')
    return { success: true, appointment }
  } catch (error) {
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
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('status')
      .eq('id', appointmentId)
      .single()

    if (fetchError || !current) throw new Error('Appointment not found')

    const updateData: Record<string, unknown> = { status: newStatus }
    if (rescheduledAt) updateData.scheduled_at = rescheduledAt
    if (rescheduledEnd)  updateData.end_at      = rescheduledEnd

    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)

    if (updateError) throw new Error(updateError.message)

    // Write audit log
    await supabaseAdmin.from('appointment_logs').insert([{
      appointment_id: appointmentId,
      performed_by:   performedBy,
      role,
      action:         newStatus === 'rescheduled' ? 'rescheduled' : 'status_change',
      old_status:     current.status,
      new_status:     newStatus,
      notes:          notes ?? null,
    }])

    revalidatePath('/staff-dashboard/appointments')
    return { success: true }
  } catch (error) {
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
    const { error } = await supabaseAdmin
      .from('clinics')
      .update({ max_appointments_per_day: max })
      .eq('id', clinicId)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/settings')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update max appointments',
    }
  }
}
