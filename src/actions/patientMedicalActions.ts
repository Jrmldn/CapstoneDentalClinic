'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validatePatientAccess } from '@/lib/auth/validatePatientAccess'
import { encryptMedicalData, decryptMedicalData } from '@/lib/encryption/medicalEncryption'
import { resolveUpdaterInfo } from './patientCoreActions'

// TYPES

export interface FetchPatientRecordOptions {
  includeMedicalHistory?: boolean
  includeDentalCharts?: boolean
  includeTreatmentHistory?: boolean
  includeAssessments?: boolean
  includePrescriptions?: boolean
  includePeriodontalScreenings?: boolean
  includeTmjAssessments?: boolean
  includeOralSurgeryRecords?: boolean
  includeAppointments?: boolean
}

export interface PatientMedicalHistoryData {
  blood_type?: string | null
  blood_pressure?: string | null
  medical_flags?: string | null
  allergies?: string[]
  current_medications?: string[]
  medical_conditions?: string[]
  previous_surgeries?: string | null
  is_pregnant?: boolean
  is_smoker?: boolean
  detailed_info?: Record<string, unknown>
}

// FETCH PATIENT RECORD

export async function fetchPatientRecord(
  patientId: number,
  clinicId?: number,
  options?: FetchPatientRecordOptions
) {
  const access = await validatePatientAccess(patientId)
  if (!access.allowed) return { success: false, error: access.reason, record: null }

  try {
    let dentalChartsQuery = supabaseAdmin
      .from('dental_charts')
      .select(`
        *,
        tooth_conditions (
          id, tooth_number, tooth_type, condition, surface, notes, recorded_at
        ),
        dentists ( id, first_name, last_name ),
        clinics ( id, name )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    let treatmentHistoryQuery = supabaseAdmin
      .from('treatment_history')
      .select(`
        *,
        services ( id, name ),
        dentists ( id, first_name, last_name ),
        clinics ( id, name )
      `)
      .eq('patient_id', patientId)
      .order('performed_at', { ascending: false })

    let assessmentsQuery = supabaseAdmin
      .from('clinical_assessments')
      .select(`
        *,
        dentists ( id, first_name, last_name )
      `)
      .eq('patient_id', patientId)
      .order('assessed_at', { ascending: false })

    let prescriptionsQuery = supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        dentists ( id, first_name, last_name ),
        clinics ( id, name )
      `)
      .eq('patient_id', patientId)
      .order('prescribed_at', { ascending: false })

    let periodontalQuery = supabaseAdmin
      .from('periodontal_screenings')
      .select(`
        *,
        dentists ( id, first_name, last_name )
      `)
      .eq('patient_id', patientId)
      .order('screened_at', { ascending: false })

    let tmjQuery = supabaseAdmin
      .from('tmj_assessments')
      .select(`
        *,
        dentists ( id, first_name, last_name )
      `)
      .eq('patient_id', patientId)
      .order('assessed_at', { ascending: false })

    let oralSurgeryQuery = supabaseAdmin
      .from('oral_surgery_records')
      .select(`
        *,
        dentists ( id, first_name, last_name )
      `)
      .eq('patient_id', patientId)
      .order('performed_at', { ascending: false })

    let appointmentsQuery = supabaseAdmin
      .from('appointments')
      .select(`
        id, clinic_id, scheduled_at, end_at, status, is_walk_in, downpayment, payment_status, notes, booked_at,
        services ( id, name, price ),
        dentists ( id, first_name, last_name ),
        clinics ( id, name )
      `)
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false })

    if (clinicId !== undefined) {
      dentalChartsQuery = dentalChartsQuery.eq('clinic_id', clinicId)
      treatmentHistoryQuery = treatmentHistoryQuery.eq('clinic_id', clinicId)
      assessmentsQuery = assessmentsQuery.eq('clinic_id', clinicId)
      prescriptionsQuery = prescriptionsQuery.eq('clinic_id', clinicId)
      periodontalQuery = periodontalQuery.eq('clinic_id', clinicId)
      tmjQuery = tmjQuery.eq('clinic_id', clinicId)
      oralSurgeryQuery = oralSurgeryQuery.eq('clinic_id', clinicId)
      appointmentsQuery = appointmentsQuery.eq('clinic_id', clinicId)
    }

    const fetchAll = !options
    const includeMedicalHistory = fetchAll || options?.includeMedicalHistory
    const includeDentalCharts = fetchAll || options?.includeDentalCharts
    const includeTreatmentHistory = fetchAll || options?.includeTreatmentHistory
    const includeAssessments = fetchAll || options?.includeAssessments
    const includePrescriptions = fetchAll || options?.includePrescriptions
    const includePeriodontalScreenings = fetchAll || options?.includePeriodontalScreenings
    const includeTmjAssessments = fetchAll || options?.includeTmjAssessments
    const includeOralSurgeryRecords = fetchAll || options?.includeOralSurgeryRecords
    const includeAppointments = fetchAll || options?.includeAppointments

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

      includeMedicalHistory
        ? supabaseAdmin
            .from('patient_medical_history')
            .select('*')
            .eq('patient_id', patientId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      includeDentalCharts
        ? dentalChartsQuery
        : Promise.resolve({ data: [], error: null }),

      includeTreatmentHistory
        ? treatmentHistoryQuery
        : Promise.resolve({ data: [], error: null }),

      includeAssessments
        ? assessmentsQuery
        : Promise.resolve({ data: [], error: null }),

      includePrescriptions
        ? prescriptionsQuery
        : Promise.resolve({ data: [], error: null }),

      includePeriodontalScreenings
        ? periodontalQuery
        : Promise.resolve({ data: [], error: null }),

      includeTmjAssessments
        ? tmjQuery
        : Promise.resolve({ data: [], error: null }),

      includeOralSurgeryRecords
        ? oralSurgeryQuery
        : Promise.resolve({ data: [], error: null }),

      includeAppointments
        ? appointmentsQuery
        : Promise.resolve({ data: [], error: null }),
    ])

    if (patientRes.error) throw new Error(patientRes.error.message)

    // Decrypt medical history fields
    const rawMed = medHistoryRes.data as unknown as Record<string, string | null | boolean | string[]>
    const medicalHistory = rawMed ? {
      ...rawMed,
      blood_type:           rawMed.blood_type           ? await decryptMedicalData(rawMed.blood_type as string)           : null,
      blood_pressure:       rawMed.blood_pressure       ? await decryptMedicalData(rawMed.blood_pressure as string)       : null,
      medical_flags:        rawMed.medical_flags        ? await decryptMedicalData(rawMed.medical_flags as string)        : null,
      previous_surgeries:   rawMed.previous_surgeries   ? await decryptMedicalData(rawMed.previous_surgeries as string)   : null,
      allergies:            rawMed.allergies            ? JSON.parse(await decryptMedicalData(rawMed.allergies as string))            : [],
      current_medications:  rawMed.current_medications  ? JSON.parse(await decryptMedicalData(rawMed.current_medications as string))  : [],
      medical_conditions:   rawMed.medical_conditions   ? JSON.parse(await decryptMedicalData(rawMed.medical_conditions as string))   : [],
    } : null

    // Decrypt prescriptions
    const prescriptions = await Promise.all(
      (prescriptionsRes.data ?? []).map(async (rx) => ({
        ...rx,
        medication: rx.medication ? await decryptMedicalData(rx.medication) : rx.medication,
        dosage:     rx.dosage     ? await decryptMedicalData(rx.dosage)     : rx.dosage,
        frequency:  rx.frequency  ? await decryptMedicalData(rx.frequency)  : rx.frequency,
        duration:   rx.duration   ? await decryptMedicalData(rx.duration)   : rx.duration,
        notes:      rx.notes      ? await decryptMedicalData(rx.notes)      : rx.notes,
      }))
    )

    // Decrypt clinical assessments
    const assessments = await Promise.all(
      (assessmentsRes.data ?? []).map(async (a) => ({
        ...a,
        diagnosis:      a.diagnosis      ? await decryptMedicalData(a.diagnosis)      : a.diagnosis,
        treatment_plan: a.treatment_plan ? await decryptMedicalData(a.treatment_plan) : a.treatment_plan,
        notes:          a.notes          ? await decryptMedicalData(a.notes)          : a.notes,
      }))
    )

    // Decrypt treatment history
    const treatmentHistory = await Promise.all(
      (treatmentHistoryRes.data ?? []).map(async (t) => ({
        ...t,
        treatment: t.treatment ? await decryptMedicalData(t.treatment) : t.treatment,
        notes:     t.notes     ? await decryptMedicalData(t.notes)     : t.notes,
      }))
    )

    // Decrypt periodontal screenings
    const periodontalScreenings = await Promise.all(
      (periodontalRes.data ?? []).map(async (p) => ({
        ...p,
        findings: p.findings ? await decryptMedicalData(p.findings) : p.findings,
      }))
    )

    return {
      success: true,
      record: {
        patient: patientRes.data,
        medicalHistory,
        dentalCharts: dentalChartsRes.data ?? [],
        treatmentHistory,
        assessments,
        prescriptions,
        periodontalScreenings,
        tmjAssessments: tmjRes.data ?? [],
        oralSurgeryRecords: oralSurgeryRes.data ?? [],
        appointments: appointmentsRes.data ?? [],
      },
    }
  } catch (error) {
    console.error('Error in fetchPatientRecord:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      record: null,
    }
  }
}

// UPDATE PATIENT MEDICAL HISTORY

export async function updatePatientMedicalHistory(
  patientId: number,
  data: PatientMedicalHistoryData
) {
  const access = await validatePatientAccess(patientId)
  if (!access.allowed) return { success: false, error: access.reason }
  if (access.role !== 'dentist' && access.role !== 'superadmin') {
    return { success: false, error: 'Insufficient permissions' }
  }

  try {
    const { updatedBy, branchName } = await resolveUpdaterInfo()

    const [
      enc_blood_type,
      enc_blood_pressure,
      enc_medical_flags,
      enc_allergies,
      enc_medications,
      enc_conditions,
      enc_surgeries,
    ] = await Promise.all([
      data.blood_type       ? encryptMedicalData(data.blood_type)       : Promise.resolve(null),
      data.blood_pressure   ? encryptMedicalData(data.blood_pressure)   : Promise.resolve(null),
      data.medical_flags    ? encryptMedicalData(data.medical_flags)    : Promise.resolve(null),
      encryptMedicalData(JSON.stringify(data.allergies ?? [])),
      encryptMedicalData(JSON.stringify(data.current_medications ?? [])),
      encryptMedicalData(JSON.stringify(data.medical_conditions ?? [])),
      data.previous_surgeries ? encryptMedicalData(data.previous_surgeries) : Promise.resolve(null),
    ])

    const { data: updated, error } = await supabaseAdmin
      .from('patient_medical_history')
      .upsert(
        {
          patient_id: patientId,
          blood_type: enc_blood_type,
          blood_pressure: enc_blood_pressure,
          medical_flags: enc_medical_flags,
          allergies: enc_allergies,
          current_medications: enc_medications,
          medical_conditions: enc_conditions,
          previous_surgeries: enc_surgeries,
          is_pregnant: data.is_pregnant ?? false,
          is_smoker: data.is_smoker ?? false,
          updated_at: new Date().toISOString(),
          detailed_info: {
            ...(data.detailed_info || {}),
            updated_by: updatedBy,
            updated_by_branch: branchName,
            last_updated_at: new Date().toISOString()
          },
        },
        { onConflict: 'patient_id' }
      )
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/patient-dashboard')
    revalidatePath('/patient-dashboard/profile')
    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/dentist-dashboard/patients')
    return { success: true, medicalHistory: updated }
  } catch (error) {
    console.error('Error in updatePatientMedicalHistory:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}
