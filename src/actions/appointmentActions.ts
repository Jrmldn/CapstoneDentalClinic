'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole } from '@/lib/auth/ensureRole'
import {
  getAppointmentsByDateRange,
  insertAppointment,
  insertAppointmentLog,
  getAppointmentStatus,
  updateAppointmentDetails,
  updateClinicMaxLimit
} from '@/services/appointmentService'
import { sendEmail } from '@/lib/email/resend'
import {
  bookingConfirmationEmail,
  rescheduleEmail,
  followUpEmail,
} from '@/lib/email/templates'
import { logNotification } from '@/lib/notifications/logNotification'

interface AppointmentCurrentData {
  status: string
  reschedule_count: number | null
  booked_at: string | null
  scheduled_at: string
  end_at: string
  patient_id: number | null
}

// TYPES

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

// FETCH APPOINTMENTS BY DATE (with related data)

export async function fetchAppointmentsByDate(clinicId: number, date: string) {
  const auth = await ensureRole('staff', 'dentist', 'superadmin')
  if (!auth.success) return { success: false, error: auth.error, appointments: [] }

  try {
    const dayStart = `${date}T00:00:00+00:00`
    const dayEnd = `${date}T23:59:59+00:00`

    const { data: appointments, error } = await getAppointmentsByDateRange(clinicId, dayStart, dayEnd)

    if (error) throw new Error(error.message)

    return { success: true, appointments: appointments || [] }
  } catch (error) {
    console.error('Error in fetchAppointmentsByDate:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      appointments: [],
    }
  }
}

// CREATE APPOINTMENT

export async function createAppointment(data: CreateAppointmentData) {
  const auth = await ensureRole('patient', 'staff', 'dentist', 'superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    // If patient, enforce that they can only book for themselves
    if (auth.role === 'patient') {
      const { data: patientRecord } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle()

      if (!patientRecord || patientRecord.id !== data.patient_id) {
        return { success: false, error: 'Patients can only book appointments for themselves' }
      }
    }

    const performedBy = auth.userId
    const performedByRole = auth.role

    const { data: appointment, error } = await insertAppointment({
      clinic_id: data.clinic_id,
      patient_id: data.patient_id,
      dentist_id: data.dentist_id,
      service_id: data.service_id,
      scheduled_at: data.scheduled_at,
      end_at: data.end_at,
      notes: data.notes ?? null,
      is_walk_in: data.is_walk_in ?? false,
      downpayment: data.downpayment ?? 0,
      payment_method: data.payment_method ?? null,
      payment_status: 'unpaid',
      status: 'pending',
    })

    if (error) throw new Error(error.message)

    // Log the creation
    await insertAppointmentLog({
      appointment_id: appointment.id,
      performed_by: performedBy,
      role: performedByRole,
      action: 'created',
      new_status: 'pending',
      notes: data.is_walk_in ? 'Walk-in appointment' : 'Online booking',
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
      error: sanitizeServerError(error),
    }
  }
}

// UPDATE APPOINTMENT STATUS (with audit log)

export async function updateAppointmentStatus(
  appointmentId: number,
  newStatus: AppointmentStatus,
  _performedBy: string,   // ignored — derived server-side
  _role: string,          // ignored — derived server-side
  notes?: string,
  rescheduledAt?: string,  // provide when rescheduling
  rescheduledEnd?: string
) {
  // patients can confirm/decline reschedules and cancel their own appointments
  const auth = await ensureRole('staff', 'dentist', 'patient', 'superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  // Use server-derived identity, ignoring client-supplied values
  const performedBy = auth.userId
  const role = auth.role

  try {
    // Fetch current status (and reschedule tracking fields) for the log
    const { data: rawCurrent, error: fetchError } = await getAppointmentStatus(appointmentId)

    if (fetchError || !rawCurrent) throw new Error('Appointment not found')
    const current = rawCurrent as AppointmentCurrentData

    // Patients may only update their own appointments
    if (role === 'patient') {
      const { data: patientRecord } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('user_id', performedBy)
        .maybeSingle()

      if (!patientRecord || current.patient_id !== patientRecord.id) {
        return { success: false, error: 'Insufficient permissions' }
      }
    }

    // A2: Enforce reschedule limits for patients
    const isPatientReschedule = role === 'patient' && rescheduledAt
    if (isPatientReschedule) {
      const rescheduleCount = current.reschedule_count ?? 0
      if (rescheduleCount >= 3) {
        return { success: false, error: 'Reschedule limit reached. You may only reschedule up to 3 times per appointment.' }
      }
      const bookedAt = current.booked_at
      if (bookedAt) {
        const hoursSinceBooking = (Date.now() - new Date(bookedAt).getTime()) / (1000 * 60 * 60)
        if (hoursSinceBooking < 1) {
          return { success: false, error: 'You cannot reschedule within 1 hour of booking. Please wait a moment.' }
        }
      }
    }

    const updateData: Record<string, unknown> = { status: newStatus }
    if (rescheduledAt) updateData.scheduled_at = rescheduledAt
    if (rescheduledEnd) updateData.end_at = rescheduledEnd
    // A2: Increment reschedule_count when patient reschedules
    if (isPatientReschedule) {
      updateData.reschedule_count = (current.reschedule_count ?? 0) + 1
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
      logNotes = `${notes ?? ''} [Original: ${current.scheduled_at} | ${current.end_at}]`
    }

    await insertAppointmentLog({
      appointment_id: appointmentId,
      performed_by: performedBy,
      role,
      action: logAction,
      old_status: current.status,
      new_status: newStatus,
      notes: logNotes,
    })

    if (newStatus === 'confirmed' || newStatus === 'rescheduled' || newStatus === 'follow_up') {
      const { data: apptData } = await supabaseAdmin
        .from('appointments')
        .select(`
          scheduled_at,
          end_at,
          patients ( id, first_name, email ),
          dentists ( first_name, last_name ),
          clinics ( name )
        `)
        .eq('id', appointmentId)
        .maybeSingle()

      if (apptData) {
        const patient = Array.isArray(apptData.patients) ? apptData.patients[0] : apptData.patients
        const dentist = Array.isArray(apptData.dentists) ? apptData.dentists[0] : apptData.dentists
        const clinic = Array.isArray(apptData.clinics) ? apptData.clinics[0] : apptData.clinics

        if (patient?.email && patient.first_name) {
          const apptDate = new Date(apptData.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
          const apptTime = new Date(apptData.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          const dentistName = dentist ? `Dr. ${dentist.first_name} ${dentist.last_name}` : 'Your Dentist'
          const branchName = clinic?.name ?? 'Your Clinic'

          let template: { subject: string; html: string } | null = null
          let triggerType: string

          if (newStatus === 'confirmed') {
            triggerType = 'confirmation'
            template = bookingConfirmationEmail({
              firstName: patient.first_name,
              appointmentDate: apptDate,
              appointmentTime: apptTime,
              branchName,
              dentistName,
            })
          } else if (newStatus === 'rescheduled') {
            triggerType = 'reschedule'
            const oldDate = new Date(current.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            const oldTime = new Date(current.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            template = rescheduleEmail({
              firstName: patient.first_name,
              oldDate,
              oldTime,
              newDate: apptDate,
              newTime: apptTime,
              branchName,
              dentistName,
            })
          } else {
            triggerType = 'follow_up'
            template = followUpEmail({
              firstName: patient.first_name,
              followUpDate: apptDate,
              followUpTime: apptTime,
              branchName,
              dentistName,
            })
          }

          const sent = await sendEmail({ to: patient.email, ...template })
          await logNotification({
            appointmentId,
            patientId: patient.id,
            triggerType,
            channel: 'email',
            status: sent.success ? 'sent' : 'failed',
            errorMessage: sent.error,
          })
        }
      }
    }

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
      error: sanitizeServerError(error),
    }
  }
}

// SET MAX APPOINTMENTS PER DAY

export async function updateMaxAppointments(clinicId: number, max: number) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { error } = await updateClinicMaxLimit(clinicId, max)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in updateMaxAppointments:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}
