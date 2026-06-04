'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface RegisterPatientData {
  first_name: string
  last_name: string
  phone: string
  birthdate: string        // "YYYY-MM-DD"
  gender: string
  address: string
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
}

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

export interface ToothConditionData {
  tooth_number: number
  tooth_type: string
  condition: string
  surface?: string
  notes?: string
}

// ─────────────────────────────────────────────────────────────
// REGISTER PATIENT  (walk-in / guest / full user)
// ─────────────────────────────────────────────────────────────

export async function registerPatient(data: RegisterPatientData) {
  try {
    // 1. Insert into patients table
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert([{
        first_name: data.first_name,
        last_name:  data.last_name,
        phone:      data.phone,
        birthdate:  data.birthdate,
        gender:     data.gender,
        address:    data.address,
        is_guest:   data.is_guest ?? false,
        user_id:    data.user_id ?? null,
      }])
      .select()
      .single()

    if (patientError) throw new Error(patientError.message)

    // 2. Insert medical history if provided
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
          patient_id:          patient.id,
          blood_type:          data.blood_type          ?? null,
          allergies:           data.allergies           ?? [],
          current_medications: data.current_medications ?? [],
          medical_conditions:  data.medical_conditions  ?? [],
          previous_surgeries:  data.previous_surgeries  ?? null,
          is_pregnant:         data.is_pregnant         ?? false,
          is_smoker:           data.is_smoker           ?? false,
        }])

      if (medError) throw new Error(medError.message)
    }

    revalidatePath('/staff-dashboard/patients')
    return { success: true, patient }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register patient',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// FETCH FULL PATIENT RECORD
// Aggregates personal info, medical history, dental charts,
// treatment history, clinical assessments, prescriptions,
// and periodontal screenings.
// ─────────────────────────────────────────────────────────────

export async function fetchPatientRecord(patientId: number) {
  try {
    // Run all queries in parallel for performance
    const [
      patientRes,
      medHistoryRes,
      dentalChartsRes,
      treatmentHistoryRes,
      assessmentsRes,
      prescriptionsRes,
      periodontalRes,
      tmjRes,
      oralSurgeryRes,
      appointmentsRes,
    ] = await Promise.all([
      supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single(),

      supabaseAdmin
        .from('patient_medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle(),

      supabaseAdmin
        .from('dental_charts')
        .select(`
          *,
          tooth_conditions (
            id, tooth_number, tooth_type, condition, surface, notes, recorded_at
          ),
          dentists ( id, first_name, last_name )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),

      supabaseAdmin
        .from('treatment_history')
        .select(`
          *,
          services ( id, name ),
          dentists ( id, first_name, last_name )
        `)
        .eq('patient_id', patientId)
        .order('performed_at', { ascending: false }),

      supabaseAdmin
        .from('clinical_assessments')
        .select(`
          *,
          dentists ( id, first_name, last_name )
        `)
        .eq('patient_id', patientId)
        .order('assessed_at', { ascending: false }),

      supabaseAdmin
        .from('prescriptions')
        .select(`
          *,
          dentists ( id, first_name, last_name )
        `)
        .eq('patient_id', patientId)
        .order('prescribed_at', { ascending: false }),

      supabaseAdmin
        .from('periodontal_screenings')
        .select(`
          *,
          dentists ( id, first_name, last_name )
        `)
        .eq('patient_id', patientId)
        .order('screened_at', { ascending: false }),

      supabaseAdmin
        .from('tmj_assessments')
        .select(`
          *,
          dentists ( id, first_name, last_name )
        `)
        .eq('patient_id', patientId)
        .order('assessed_at', { ascending: false }),

      supabaseAdmin
        .from('oral_surgery_records')
        .select(`
          *,
          dentists ( id, first_name, last_name )
        `)
        .eq('patient_id', patientId)
        .order('performed_at', { ascending: false }),

      supabaseAdmin
        .from('appointments')
        .select(`
          id, scheduled_at, end_at, status, is_walk_in, downpayment, payment_status,
          services ( id, name, price ),
          dentists ( id, first_name, last_name )
        `)
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false }),
    ])

    if (patientRes.error) throw new Error(patientRes.error.message)

    return {
      success: true,
      record: {
        patient:            patientRes.data,
        medicalHistory:     medHistoryRes.data,
        dentalCharts:       dentalChartsRes.data   ?? [],
        treatmentHistory:   treatmentHistoryRes.data ?? [],
        assessments:        assessmentsRes.data     ?? [],
        prescriptions:      prescriptionsRes.data   ?? [],
        periodontalScreenings: periodontalRes.data  ?? [],
        tmjAssessments:     tmjRes.data             ?? [],
        oralSurgeryRecords: oralSurgeryRes.data     ?? [],
        appointments:       appointmentsRes.data    ?? [],
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch patient record',
      record: null,
    }
  }
}

// ─────────────────────────────────────────────────────────────
// FETCH PATIENTS BY CLINIC  (alphabetical, with search)
// ─────────────────────────────────────────────────────────────

export async function fetchPatientsByClinic(
  clinicId: number,
  search = '',
  includeGuests = true
) {
  try {
    // Find unique patient IDs who have had an appointment at this clinic
    const { data: apptPatients, error: apptError } = await supabaseAdmin
      .from('appointments')
      .select('patient_id')
      .eq('clinic_id', clinicId)

    if (apptError) throw new Error(apptError.message)

    const patientIds = [...new Set(apptPatients?.map(a => a.patient_id) ?? [])]

    if (patientIds.length === 0) return { success: true, patients: [] }

    let query = supabaseAdmin
      .from('patients')
      .select('id, first_name, last_name, phone, birthdate, gender, is_guest, created_at')
      .in('id', patientIds)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })

    if (!includeGuests) {
      query = query.eq('is_guest', false)
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`
      )
    }

    const { data: patients, error } = await query

    if (error) throw new Error(error.message)

    return { success: true, patients: patients ?? [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch patients',
      patients: [],
    }
  }
}

// ─────────────────────────────────────────────────────────────
// ADD CLINICAL ASSESSMENT
// ─────────────────────────────────────────────────────────────

export async function addClinicalAssessment(data: ClinicalAssessmentData) {
  try {
    const { data: assessment, error } = await supabaseAdmin
      .from('clinical_assessments')
      .insert([{
        patient_id:     data.patient_id,
        clinic_id:      data.clinic_id,
        dentist_id:     data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        chief_complaint: data.chief_complaint,
        diagnosis:      data.diagnosis,
        treatment_plan: data.treatment_plan,
        notes:          data.notes ?? null,
        assessed_at:    new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/patients')
    return { success: true, assessment }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add assessment',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE DENTAL CHART  (upsert tooth conditions)
// Creates a new chart if none exists for the patient/clinic/dentist,
// then upserts individual tooth conditions.
// ─────────────────────────────────────────────────────────────

export async function updateDentalChart(
  patientId: number,
  clinicId: number,
  dentistId: number,
  toothConditions: ToothConditionData[]
) {
  try {
    // Fetch or create a dental chart
    let chartId: number

    const { data: existing } = await supabaseAdmin
      .from('dental_charts')
      .select('id')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .maybeSingle()

    if (existing) {
      chartId = existing.id
      // Touch updated_at
      await supabaseAdmin
        .from('dental_charts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chartId)
    } else {
      const { data: newChart, error: chartError } = await supabaseAdmin
        .from('dental_charts')
        .insert([{
          patient_id:  patientId,
          clinic_id:   clinicId,
          dentist_id:  dentistId,
        }])
        .select()
        .single()

      if (chartError) throw new Error(chartError.message)
      chartId = newChart.id
    }

    // Insert tooth conditions (append — each visit may add conditions)
    const conditionsData = toothConditions.map(tc => ({
      dental_chart_id: chartId,
      tooth_number:    tc.tooth_number,
      tooth_type:      tc.tooth_type,
      condition:       tc.condition,
      surface:         tc.surface ?? null,
      notes:           tc.notes ?? null,
      recorded_at:     new Date().toISOString(),
    }))

    const { data: conditions, error: condError } = await supabaseAdmin
      .from('tooth_conditions')
      .insert(conditionsData)
      .select()

    if (condError) throw new Error(condError.message)

    revalidatePath('/staff-dashboard/patients')
    return { success: true, chartId, conditions }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update dental chart',
    }
  }
}
