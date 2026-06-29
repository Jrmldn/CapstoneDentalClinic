'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole } from '@/lib/auth/ensureRole'
import { encryptMedicalData } from '@/lib/encryption/medicalEncryption'

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
    const [enc_diagnosis, enc_treatment_plan, enc_notes] = await Promise.all([
      encryptMedicalData(data.diagnosis),
      encryptMedicalData(data.treatment_plan),
      data.notes ? encryptMedicalData(data.notes) : Promise.resolve(null),
    ])

    const { data: assessment, error } = await supabaseAdmin
      .from('clinical_assessments')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        chief_complaint: data.chief_complaint,
        diagnosis: enc_diagnosis,
        treatment_plan: enc_treatment_plan,
        notes: enc_notes,
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
    const [enc_treatment, enc_treat_notes] = await Promise.all([
      encryptMedicalData(data.treatment),
      data.notes ? encryptMedicalData(data.notes) : Promise.resolve(null),
    ])

    const { data: record, error } = await supabaseAdmin
      .from('treatment_history')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        service_id: data.service_id ?? null,
        tooth_number: data.tooth_number ?? null,
        treatment: enc_treatment,
        notes: enc_treat_notes,
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

// ADD MULTIPLE TREATMENT RECORDS (batch, encrypted)
// Used by the dentist billing handoff to log every treated line at once.
// No ensureRole here — the caller (createDraftInvoice) is already role-gated.

export async function addTreatmentRecords(rows: TreatmentRecordData[]) {
  if (rows.length === 0) return { success: true, records: [] }

  try {
    const encryptedRows = await Promise.all(
      rows.map(async (data) => {
        const [enc_treatment, enc_treat_notes] = await Promise.all([
          encryptMedicalData(data.treatment),
          data.notes ? encryptMedicalData(data.notes) : Promise.resolve(null),
        ])
        return {
          patient_id: data.patient_id,
          clinic_id: data.clinic_id,
          dentist_id: data.dentist_id,
          appointment_id: data.appointment_id ?? null,
          service_id: data.service_id ?? null,
          tooth_number: data.tooth_number ?? null,
          treatment: enc_treatment,
          notes: enc_treat_notes,
          performed_at: data.performed_at ?? new Date().toISOString(),
        }
      })
    )

    const { data: records, error } = await supabaseAdmin
      .from('treatment_history')
      .insert(encryptedRows)
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
    const [enc_medication, enc_dosage, enc_frequency, enc_duration, enc_rx_notes] = await Promise.all([
      encryptMedicalData(data.medication),
      encryptMedicalData(data.dosage),
      encryptMedicalData(data.frequency),
      data.duration ? encryptMedicalData(data.duration) : Promise.resolve(null),
      data.notes    ? encryptMedicalData(data.notes)    : Promise.resolve(null),
    ])

    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        medication: enc_medication,
        dosage:     enc_dosage,
        frequency:  enc_frequency,
        duration:   enc_duration,
        notes:      enc_rx_notes,
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

// ADD MULTIPLE PRESCRIPTIONS (batch, encrypted)
// Used by the dentist billing handoff to log every prescription at once.
// No ensureRole here — the caller is already role-gated.

export async function addPrescriptions(rows: PrescriptionData[]) {
  if (rows.length === 0) return { success: true, prescriptions: [] }

  try {
    const encryptedRows = await Promise.all(
      rows.map(async (data) => {
        const [enc_medication, enc_dosage, enc_frequency, enc_duration, enc_rx_notes] = await Promise.all([
          encryptMedicalData(data.medication),
          encryptMedicalData(data.dosage),
          encryptMedicalData(data.frequency),
          data.duration ? encryptMedicalData(data.duration) : Promise.resolve(null),
          data.notes    ? encryptMedicalData(data.notes)    : Promise.resolve(null),
        ])
        return {
          patient_id: data.patient_id,
          clinic_id: data.clinic_id,
          dentist_id: data.dentist_id,
          appointment_id: data.appointment_id ?? null,
          medication: enc_medication,
          dosage:     enc_dosage,
          frequency:  enc_frequency,
          duration:   enc_duration,
          notes:      enc_rx_notes,
          prescribed_at: new Date().toISOString(),
        }
      })
    )

    const { data: prescriptions, error } = await supabaseAdmin
      .from('prescriptions')
      .insert(encryptedRows)
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
    const enc_findings = data.findings ? await encryptMedicalData(data.findings) : null

    const { data: screening, error } = await supabaseAdmin
      .from('periodontal_screenings')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        pocket_depths: data.pocket_depths,
        bleeding_points: data.bleeding_points,
        findings: enc_findings,
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
