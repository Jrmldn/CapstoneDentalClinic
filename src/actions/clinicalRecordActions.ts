'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole } from '@/lib/auth/ensureRole'

// TYPES

export interface ClinicalAssessmentData {
  patient_id: number
  clinic_id: number
  dentist_id: number
  appointment_id?: number
  chief_complaint: string
  diagnosis: string
  treatment_plan: string
  notes?: string
}

export interface TreatmentRecordData {
  patient_id: number
  clinic_id: number
  dentist_id: number
  appointment_id?: number | null
  service_id?: number | null
  tooth_number?: number | null
  treatment: string
  notes?: string
  performed_at?: string
}

export interface PrescriptionData {
  patient_id: number
  clinic_id: number
  dentist_id: number
  appointment_id?: number | null
  medication: string
  dosage: string
  frequency: string
  duration?: string | null
  notes?: string | null
}

export interface PeriodontalScreeningData {
  patient_id: number
  clinic_id: number
  dentist_id: number
  appointment_id?: number | null
  pocket_depths: Record<string, number>
  bleeding_points: Record<string, boolean>
  findings?: string | null
}

export interface TmjAssessmentData {
  patient_id: number
  clinic_id: number
  dentist_id: number
  appointment_id?: number | null
  findings?: string | null
  pain_scale?: number | null
}

// ADD CLINICAL ASSESSMENT

export async function addClinicalAssessment(data: ClinicalAssessmentData) {
  const auth = await ensureRole('dentist', 'superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: assessment, error } = await supabaseAdmin
      .from('clinical_assessments')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        chief_complaint: data.chief_complaint,
        diagnosis: data.diagnosis,
        treatment_plan: data.treatment_plan,
        notes: data.notes ?? null,
        assessed_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/patients')
    return { success: true, assessment }
  } catch (error) {
    console.error('Error in addClinicalAssessment:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

// ADD TREATMENT RECORD

export async function addTreatmentRecord(data: TreatmentRecordData) {
  const auth = await ensureRole('dentist', 'superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: record, error } = await supabaseAdmin
      .from('treatment_history')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        service_id: data.service_id ?? null,
        tooth_number: data.tooth_number ?? null,
        treatment: data.treatment,
        notes: data.notes ?? null,
        performed_at: data.performed_at ?? new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/dentist-dashboard/patients')
    return { success: true, record }
  } catch (error) {
    console.error('Error in addTreatmentRecord:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

// ADD MULTIPLE TREATMENT RECORDS (batch)
// Used by the dentist billing handoff to log every treated line at once.
// No ensureRole here — the caller (createDraftInvoice) is already role-gated.

export async function addTreatmentRecords(rows: TreatmentRecordData[]) {
  if (rows.length === 0) return { success: true, records: [] }

  try {
    const insertRows = rows.map((data) => ({
      patient_id: data.patient_id,
      clinic_id: data.clinic_id,
      dentist_id: data.dentist_id,
      appointment_id: data.appointment_id ?? null,
      service_id: data.service_id ?? null,
      tooth_number: data.tooth_number ?? null,
      treatment: data.treatment,
      notes: data.notes ?? null,
      performed_at: data.performed_at ?? new Date().toISOString(),
    }))

    const { data: records, error } = await supabaseAdmin
      .from('treatment_history')
      .insert(insertRows)
      .select()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/dentist-dashboard/patients')
    return { success: true, records }
  } catch (error) {
    console.error('Error in addTreatmentRecords:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

// ADD PRESCRIPTION

export async function addPrescription(data: PrescriptionData) {
  const auth = await ensureRole('dentist', 'superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        medication: data.medication,
        dosage:     data.dosage,
        frequency:  data.frequency,
        duration:   data.duration ?? null,
        notes:      data.notes ?? null,
        prescribed_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/dentist-dashboard/patients')
    return { success: true, prescription }
  } catch (error) {
    console.error('Error in addPrescription:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

// ADD MULTIPLE PRESCRIPTIONS (batch)
// Used by the dentist billing handoff to log every prescription at once.
// No ensureRole here — the caller is already role-gated.

export async function addPrescriptions(rows: PrescriptionData[]) {
  if (rows.length === 0) return { success: true, prescriptions: [] }

  try {
    const insertRows = rows.map((data) => ({
      patient_id: data.patient_id,
      clinic_id: data.clinic_id,
      dentist_id: data.dentist_id,
      appointment_id: data.appointment_id ?? null,
      medication: data.medication,
      dosage:     data.dosage,
      frequency:  data.frequency,
      duration:   data.duration ?? null,
      notes:      data.notes ?? null,
      prescribed_at: new Date().toISOString(),
    }))

    const { data: prescriptions, error } = await supabaseAdmin
      .from('prescriptions')
      .insert(insertRows)
      .select()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/dentist-dashboard/patients')
    return { success: true, prescriptions }
  } catch (error) {
    console.error('Error in addPrescriptions:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

// ADD PERIODONTAL SCREENING

export async function addPeriodontalScreening(data: PeriodontalScreeningData) {
  const auth = await ensureRole('dentist', 'superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: screening, error } = await supabaseAdmin
      .from('periodontal_screenings')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        pocket_depths: data.pocket_depths,
        bleeding_points: data.bleeding_points,
        findings: data.findings ?? null,
        screened_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/dentist-dashboard/patients')
    return { success: true, screening }
  } catch (error) {
    console.error('Error in addPeriodontalScreening:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

// ADD TMJ ASSESSMENT

export async function addTmjAssessment(data: TmjAssessmentData) {
  const auth = await ensureRole('dentist', 'superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: assessment, error } = await supabaseAdmin
      .from('tmj_assessments')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        findings: data.findings ?? null,
        pain_scale: data.pain_scale ?? null,
        assessed_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/dentist-dashboard/patients')
    return { success: true, assessment }
  } catch (error) {
    console.error('Error in addTmjAssessment:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}
