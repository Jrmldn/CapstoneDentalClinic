'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'
import { normalizeRelation } from '@/lib/utils'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/serverSSR'
import { ensureRole } from '@/lib/auth/ensureRole'
import { validatePatientAccess } from '@/lib/auth/validatePatientAccess'
import { insertAppointment, insertAppointmentLog } from '@/services/appointmentService'
import type { PaymentMethod } from '@/actions/appointmentActions'

interface ClinicName { name: string }

export async function resolveUpdaterInfo() {
  let updatedBy = 'System'
  let branchName = 'Central'

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { updatedBy, branchName }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile) return { updatedBy, branchName }

    if (profile.role === 'dentist') {
      const { data: dentist } = await supabaseAdmin
        .from('dentists')
        .select('first_name, last_name, clinics ( name )')
        .eq('user_id', user.id)
        .single()
      if (dentist) {
        updatedBy = `Dr. ${dentist.first_name} ${dentist.last_name}`
        branchName = normalizeRelation(dentist.clinics as ClinicName | ClinicName[] | null)?.name || 'Central'
      }
    } else if (profile.role === 'staff') {
      const { data: staff } = await supabaseAdmin
        .from('clinic_staff')
        .select('first_name, last_name, clinics ( name )')
        .eq('user_id', user.id)
        .single()
      if (staff) {
        updatedBy = `${staff.first_name} ${staff.last_name}`
        branchName = normalizeRelation(staff.clinics as ClinicName | ClinicName[] | null)?.name || 'Central'
      }
    } else if (profile.role === 'superadmin') {
      updatedBy = 'Superadmin'
      branchName = 'Central Business'
    } else if (profile.role === 'patient') {
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single()
      if (patient) {
        updatedBy = `${patient.first_name} ${patient.last_name} (Patient)`
        branchName = 'Patient Portal'
      }
    }
  } catch (err) {
    console.error('Error resolving updater info:', err)
  }

  return { updatedBy, branchName }
}

// TYPES

export interface RegisterPatientData {
  first_name: string
  last_name: string
  phone: string
  birthdate: string        // "YYYY-MM-DD"
  gender: string
  address: string
  email?: string           // optional — used for merge pipeline matching
  is_guest?: boolean
  user_id?: string         // null for walk-in/guest patients
  // Medical history
  blood_type?: string
  allergies?: string[]
  current_medications?: string[]
  medical_conditions?: string[]
  previous_surgeries?: string
  is_pregnant?: boolean
  is_smoker?: boolean
  // Junction mapping fields
  clinic_id?: number
  enrolled_by?: string
}

// REGISTER PATIENT (walk-in / guest / full user)

export async function registerPatient(data: RegisterPatientData) {
  const auth = await ensureRole('staff', 'dentist')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert([{
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        birthdate: data.birthdate,
        gender: data.gender,
        address: data.address,
        email: data.email ?? null,
        is_guest: data.is_guest ?? false,
        user_id: data.user_id ?? null,
      }])
      .select()
      .single()

    if (patientError) throw new Error(patientError.message)

    const hasMedicalData =
      data.blood_type ||
      data.allergies?.length ||
      data.current_medications?.length ||
      data.medical_conditions?.length ||
      data.previous_surgeries ||
      data.is_pregnant !== undefined ||
      data.is_smoker !== undefined

    if (hasMedicalData) {
      const { error: medError } = await supabaseAdmin
        .from('patient_medical_history')
        .insert([{
          patient_id: patient.id,
          blood_type: data.blood_type ?? null,
          allergies: JSON.stringify(data.allergies ?? []),
          current_medications: JSON.stringify(data.current_medications ?? []),
          medical_conditions: JSON.stringify(data.medical_conditions ?? []),
          previous_surgeries: data.previous_surgeries ?? null,
          is_pregnant: data.is_pregnant ?? false,
          is_smoker: data.is_smoker ?? false,
        }])

      if (medError) throw new Error(medError.message)
    }

    if (data.clinic_id) {
      const { error: junctionError } = await supabaseAdmin
        .from('clinic_patients')
        .upsert(
          [{
            clinic_id: data.clinic_id,
            patient_id: patient.id,
            enrolled_by: data.enrolled_by ?? auth.userId,
            is_active: true,
          }],
          { onConflict: 'clinic_id,patient_id' }
        )
      if (junctionError) throw new Error(junctionError.message)
    }

    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/staff-dashboard/appointments')
    return { success: true, patient }
  } catch (error) {
    console.error('Error in registerPatient:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

// FETCH PATIENTS BY CLINIC (alphabetical, with search)

export async function fetchPatientsByClinic(
  clinicId: number,
  search = '',
  includeGuests = true
) {
  const auth = await ensureRole('staff', 'dentist')
  if (!auth.success) return { success: false, error: auth.error, patients: [] }

  try {
    let query = supabaseAdmin
      .from('patients')
      .select('*')

    if (!includeGuests) {
      query = query.eq('is_guest', false)
    }

    if (search) {
      const cleanSearch = `%${search.trim()}%`
      query = query.or(
        `first_name.ilike.${cleanSearch},last_name.ilike.${cleanSearch},phone.ilike.${cleanSearch}`
      )
    }

    const { data: patientsData, error } = await query

    if (error) throw new Error(error.message)

    const patients = (patientsData || []).map((p) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      phone: p.phone,
      email: p.email,
      birthdate: p.birthdate,
      gender: p.gender,
      is_guest: p.is_guest,
      created_at: p.created_at
    }))

    patients.sort((a, b) => {
      const lastA = (a.last_name || '').toLowerCase()
      const lastB = (b.last_name || '').toLowerCase()
      if (lastA !== lastB) return lastA.localeCompare(lastB)
      return (a.first_name || '').toLowerCase().localeCompare((b.first_name || '').toLowerCase())
    })

    return { success: true, patients }
  } catch (error) {
    console.error('Error in fetchPatientsByClinic:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      patients: [],
    }
  }
}

// UPDATE PATIENT PROFILE (personal info)

export async function updatePatientProfile(
  patientId: number,
  data: {
    first_name: string
    last_name: string
    phone: string
    birthdate: string
    gender: string
    address: string
    previous_dentist?: string | null
    guardian_name?: string | null
    guardian_address?: string | null
    guardian_phone?: string | null
  }
) {
  const access = await validatePatientAccess(patientId)
  if (!access.allowed) return { success: false, error: access.reason }
  if (access.role !== 'patient' && access.role !== 'staff' && access.role !== 'superadmin') {
    return { success: false, error: 'Insufficient permissions' }
  }

  try {
    const { updatedBy, branchName } = await resolveUpdaterInfo()

    const { data: updatedPatient, error } = await supabaseAdmin
      .from('patients')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        birthdate: data.birthdate,
        gender: data.gender,
        address: data.address,
        previous_dentist: data.previous_dentist ?? null,
        guardian_name: data.guardian_name ?? null,
        guardian_address: data.guardian_address ?? null,
        guardian_phone: data.guardian_phone ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patientId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Store patient profile audit details inside patient_medical_history detailed_info
    try {
      const { data: existingHist } = await supabaseAdmin
        .from('patient_medical_history')
        .select('detailed_info')
        .eq('patient_id', patientId)
        .maybeSingle()

      const detailedInfo = {
        ...(existingHist?.detailed_info as Record<string, unknown> || {}),
        profile_updated_by: updatedBy,
        profile_updated_by_branch: branchName,
        profile_updated_at: new Date().toISOString()
      }

      await supabaseAdmin
        .from('patient_medical_history')
        .upsert(
          {
            patient_id: patientId,
            detailed_info: detailedInfo,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'patient_id' }
        )
    } catch (histErr) {
      console.warn('Failed to write profile update audit to medical history:', histErr)
    }

    revalidatePath('/patient-dashboard')
    return { success: true, patient: updatedPatient }
  } catch (error) {
    console.error('Error in updatePatientProfile:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

// WALK-IN: register patient + book appointment in one action

export interface WalkInBookingData {
  first_name: string
  last_name: string
  phone: string
  gender?: string
  address?: string
  birthdate?: string
  clinic_id: number
  dentist_id: number
  service_id?: number
  scheduled_at: string
  end_at: string
  notes?: string
  downpayment?: number
  payment_method?: PaymentMethod
}

export async function registerWalkInPatientAndBook(data: WalkInBookingData) {
  const auth = await ensureRole('staff')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert([{
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        gender: data.gender ?? null,
        address: data.address ?? null,
        birthdate: data.birthdate ?? null,
        is_guest: true,
        user_id: null,
      }])
      .select()
      .single()

    if (patientError) throw new Error(patientError.message)

    const { error: junctionError } = await supabaseAdmin
      .from('clinic_patients')
      .upsert(
        [{ clinic_id: data.clinic_id, patient_id: patient.id, is_active: true }],
        { onConflict: 'clinic_id,patient_id' }
      )
    if (junctionError) throw new Error(junctionError.message)

    const { data: appointment, error: apptError } = await insertAppointment({
      clinic_id: data.clinic_id,
      patient_id: patient.id,
      dentist_id: data.dentist_id,
      service_id: data.service_id ?? null,
      scheduled_at: data.scheduled_at,
      end_at: data.end_at,
      notes: data.notes ?? null,
      is_walk_in: true,
      downpayment: data.downpayment ?? 0,
      payment_method: data.payment_method ?? 'cash',
      payment_status: (data.downpayment ?? 0) > 0 ? 'partial' : 'unpaid',
      status: 'pending',
    })
    if (apptError) throw new Error(apptError.message)

    await insertAppointmentLog({
      appointment_id: appointment.id,
      performed_by: auth.userId,
      role: 'staff',
      action: 'created',
      new_status: 'pending',
      notes: 'Walk-in appointment created by staff',
    })

    revalidatePath('/staff-dashboard/appointments')
    revalidatePath('/staff-dashboard/patients')
    return { success: true, appointment }
  } catch (error) {
    console.error('Error in registerWalkInPatientAndBook:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

// SUBMIT APPOINTMENT FEEDBACK

export async function submitFeedback(
  appointmentId: number,
  patientId: number,
  clinicId: number,
  rating: number,
  comment?: string
) {
  const access = await validatePatientAccess(patientId)
  if (!access.allowed) return { success: false, error: access.reason }
  if (access.role !== 'patient') return { success: false, error: 'Insufficient permissions' }

  // Verify the appointment belongs to this patient
  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('id', appointmentId)
    .eq('patient_id', patientId)
    .maybeSingle()
  if (!appt) return { success: false, error: 'Appointment not found or does not belong to you' }

  try {
    const { error } = await supabaseAdmin
      .from('feedback')
      .insert([{
        appointment_id: appointmentId,
        patient_id: patientId,
        clinic_id: clinicId,
        rating,
        comment: comment ?? null,
      }])

    if (error) {
      // Unique constraint violation: already submitted
      if (error.code === '23505') {
        return { success: false, error: 'You have already submitted feedback for this appointment.' }
      }
      throw new Error(error.message)
    }

    revalidatePath('/patient-dashboard/appointments')
    return { success: true }
  } catch (error) {
    console.error('Error in submitFeedback:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}
