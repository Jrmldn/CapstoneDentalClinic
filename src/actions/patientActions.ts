'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/serverSSR'
import { revalidatePath } from 'next/cache'

export async function resolveUpdaterInfo() {
  let updatedBy = 'System'
  let branchName = 'Central'

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (profile.role === 'dentist') {
          const { data: dentist } = await supabaseAdmin
            .from('dentists')
            .select('first_name, last_name, clinics ( name )')
            .eq('user_id', user.id)
            .single()
          if (dentist) {
            updatedBy = `Dr. ${dentist.first_name} ${dentist.last_name}`
            branchName = (dentist.clinics as any)?.name || 'Central'
          }
        } else if (profile.role === 'staff') {
          const { data: staff } = await supabaseAdmin
            .from('clinic_staff')
            .select('first_name, last_name, clinics ( name )')
            .eq('user_id', user.id)
            .single()
          if (staff) {
            updatedBy = `${staff.first_name} ${staff.last_name}`
            branchName = (staff.clinics as any)?.name || 'Central'
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
      }
    }
  } catch (err) {
    console.error('Error resolving updater info:', err)
  }

  return { updatedBy, branchName }
}

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

type PatientSummary = {
  id: number
  first_name: string
  last_name: string
  phone: string
  email: string | null
  birthdate: string
  gender: string
  is_guest: boolean
  created_at: string
}

type ClinicPatientRow = {
  is_active: boolean
  patients: PatientSummary | PatientSummary[] | null
}

// ─────────────────────────────────────────────────────────────
// REGISTER PATIENT  (walk-in / guest / full user)
// ─────────────────────────────────────────────────────────────

export async function registerPatient(data: RegisterPatientData) {
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
          allergies: data.allergies ?? [],
          current_medications: data.current_medications ?? [],
          medical_conditions: data.medical_conditions ?? [],
          previous_surgeries: data.previous_surgeries ?? null,
          is_pregnant: data.is_pregnant ?? false,
          is_smoker: data.is_smoker ?? false,
        }])

      if (medError) throw new Error(medError.message)
    }

    // Uses onConflict to safely handle re-registration of an existing patient
    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/staff-dashboard/appointments')
    return { success: true, patient }
  } catch (error) {
    console.error('Error in registerPatient:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register patient',
    }
  }
}

// ─────────────────────────────────────────────────────────────
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

export async function fetchPatientRecord(
  patientId: number,
  clinicId?: number,
  options?: FetchPatientRecordOptions
) {
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

    return {
      success: true,
      record: {
        patient: patientRes.data,
        medicalHistory: medHistoryRes.data,
        dentalCharts: dentalChartsRes.data ?? [],
        treatmentHistory: treatmentHistoryRes.data ?? [],
        assessments: assessmentsRes.data ?? [],
        prescriptions: prescriptionsRes.data ?? [],
        periodontalScreenings: periodontalRes.data ?? [],
        tmjAssessments: tmjRes.data ?? [],
        oralSurgeryRecords: oralSurgeryRes.data ?? [],
        appointments: appointmentsRes.data ?? [],
      },
    }
  } catch (error) {
    console.error('Error in fetchPatientRecord:', error)
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

    const patients = (patientsData || []).map((p: any) => ({
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

    patients.sort((a: PatientSummary, b: PatientSummary) => {
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
      error: error instanceof Error ? error.message : 'Failed to add assessment',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE DENTAL CHART  (upsert tooth conditions)
// ─────────────────────────────────────────────────────────────

export async function updateDentalChart(
  patientId: number,
  clinicId: number,
  dentistId: number,
  toothConditions: ToothConditionData[]
) {
  try {
    let chartId: number

    const { data: existing } = await supabaseAdmin
      .from('dental_charts')
      .select('id')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .maybeSingle()

    if (existing) {
      chartId = existing.id
      await supabaseAdmin
        .from('dental_charts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chartId)
    } else {
      const { data: newChart, error: chartError } = await supabaseAdmin
        .from('dental_charts')
        .insert([{
          patient_id: patientId,
          clinic_id: clinicId,
          dentist_id: dentistId,
        }])
        .select()
        .single()

      if (chartError) throw new Error(chartError.message)
      chartId = newChart.id
    }

    const conditionsData = toothConditions.map(tc => ({
      dental_chart_id: chartId,
      tooth_number: tc.tooth_number,
      tooth_type: tc.tooth_type,
      condition: tc.condition,
      surface: tc.surface ?? null,
      notes: tc.notes ?? null,
      recorded_at: new Date().toISOString(),
    }))

    const { data: conditions, error: condError } = await supabaseAdmin
      .from('tooth_conditions')
      .insert(conditionsData)
      .select()

    if (condError) throw new Error(condError.message)

    revalidatePath('/staff-dashboard/patients')
    return { success: true, chartId, conditions }
  } catch (error) {
    console.error('Error in updateDentalChart:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update dental chart',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE PATIENT PROFILE (personal info)
// ─────────────────────────────────────────────────────────────

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
        ...(existingHist?.detailed_info || {}),
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
      error: error instanceof Error ? error.message : 'Failed to update profile',
    }
  }
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
  detailed_info?: any
}

export async function updatePatientMedicalHistory(
  patientId: number,
  data: PatientMedicalHistoryData
) {
  try {
    const { updatedBy, branchName } = await resolveUpdaterInfo()

    const { data: updated, error } = await supabaseAdmin
      .from('patient_medical_history')
      .upsert(
        {
          patient_id: patientId,
          blood_type: data.blood_type ?? null,
          blood_pressure: data.blood_pressure ?? null,
          medical_flags: data.medical_flags ?? null,
          allergies: data.allergies ?? [],
          current_medications: data.current_medications ?? [],
          medical_conditions: data.medical_conditions ?? [],
          previous_surgeries: data.previous_surgeries ?? null,
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
      error: error instanceof Error ? error.message : 'Failed to update medical history',
    }
  }
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
export async function addTreatmentRecord(data: TreatmentRecordData) {
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
      error: error instanceof Error ? error.message : 'Failed to add treatment record',
    }
  }
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

export async function addPrescription(data: PrescriptionData) {
  try {
    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        medication: data.medication,
        dosage: data.dosage,
        frequency: data.frequency,
        duration: data.duration ?? null,
        notes: data.notes ?? null,
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
      error: error instanceof Error ? error.message : 'Failed to add prescription',
    }
  }
}

export interface PeriodontalScreeningData {
  patient_id: number
  clinic_id: number
  dentist_id: number
  appointment_id?: number | null
  pocket_depths: any
  bleeding_points: any
  findings?: string | null
}

export async function addPeriodontalScreening(data: PeriodontalScreeningData) {
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
      error: error instanceof Error ? error.message : 'Failed to add periodontal screening',
    }
  }
}

export interface TmjAssessmentData {
  patient_id: number
  clinic_id: number
  dentist_id: number
  appointment_id?: number | null
  findings?: string | null
  pain_scale?: number | null
}

export async function addTmjAssessment(data: TmjAssessmentData) {
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
      error: error instanceof Error ? error.message : 'Failed to add TMJ assessment',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// SUBMIT APPOINTMENT FEEDBACK (G1)
// ─────────────────────────────────────────────────────────────

export async function submitFeedback(
  appointmentId: number,
  patientId: number,
  clinicId: number,
  rating: number,
  comment?: string
) {
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
      error: error instanceof Error ? error.message : 'Failed to submit feedback',
    }
  }
}