export interface PatientSummary {
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

export type RecordTab = 'chart' | 'treatments' | 'prescriptions' | 'info' | 'periodontal' | 'followups' | 'photos'

export interface FullPatientDetail extends PatientSummary {
  address: string | null
  updated_at?: string
  previous_dentist?: string | null
  guardian_name?: string | null
  guardian_phone?: string | null
  guardian_address?: string | null
}

export interface DetailedInfo {
  profile_updated_by?: string | null
  profile_updated_at?: string | null
  profile_updated_by_branch?: string | null
  updated_by?: string | null
  updated_by_branch?: string | null
  physician_name?: string | null
  physician_specialty?: string | null
  physician_office_address?: string | null
  physician_office_phone?: string | null
  last_dental_visit?: string | null
  bleeding_time?: string | null
  is_nursing?: boolean
  is_birth_control?: boolean
  allergy_local_anesthetic?: boolean
  allergy_penicillin?: boolean
  allergy_sulfa?: boolean
  allergy_aspirin?: boolean
  allergy_latex?: boolean
  allergy_other?: string | null
  good_condition?: string | null
  under_medical_treatment?: string | null
  under_medical_treatment_desc?: string | null
  serious_illness_operation?: string | null
  serious_illness_operation_desc?: string | null
  hospitalized?: string | null
  hospitalized_desc?: string | null
  prescription_medication?: string | null
  prescription_medication_desc?: string | null
  drug_use?: string | null
}

export interface MedicalHistory {
  blood_type: string | null
  allergies: string[]
  current_medications: string[]
  medical_conditions: string[]
  previous_surgeries: string | null
  is_pregnant: boolean
  is_smoker: boolean
  blood_pressure: string | null
  medical_flags: string | null
  detailed_info?: DetailedInfo
  updated_at?: string
}

export interface ToothCondition {
  id: number
  tooth_number: number
  tooth_type: string
  condition: string
  surface: string | null
  notes: string | null
  recorded_at: string
}

export interface DentalChart {
  id: number
  tooth_conditions: ToothCondition[]
  created_at?: string
  updated_at?: string
  dentists?: { id: number; first_name: string; last_name: string } | { id: number; first_name: string; last_name: string }[] | null
  clinics?: { id: number; name: string } | { id: number; name: string }[] | null
}

export interface TreatmentHistory {
  id: number
  performed_at: string | null
  treatment: string
  notes: string | null
  tooth_number: number | null
  service_id: number | null
  services: { id: number; name: string } | { id: number; name: string }[] | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
  clinics?: { id: number; name: string } | { id: number; name: string }[] | null
}

export interface Assessment {
  id: number
  assessed_at: string
  chief_complaint: string
  diagnosis: string
  treatment_plan: string
  notes: string | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

export interface Prescription {
  id: number
  prescribed_at: string | null
  medication: string
  dosage: string
  frequency: string
  duration: string | null
  notes?: string | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
  clinics?: { id: number; name: string } | { id: number; name: string }[] | null
}

export interface PatientInfo {
  first_name: string
  last_name: string
  birthdate?: string
  gender?: string
}

export interface AppointmentRecord {
  id: number
  scheduled_at: string
  status: string
  notes: string | null
  services: { name: string } | { name: string }[] | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
  clinics?: { id: number; name: string } | { id: number; name: string }[] | null
  booked_at?: string
}

export interface PeriodontalScreening {
  id: number
  screened_at: string | null
  pocket_depths: Record<string, number>
  bleeding_points: Record<string, boolean>
  findings: string | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

export interface TmjAssessment {
  id: number
  assessed_at: string | null
  findings: string | null
  pain_scale: number | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

export interface PatientRecord {
  patient: FullPatientDetail
  medicalHistory: MedicalHistory | null
  dentalCharts: DentalChart[]
  treatmentHistory: TreatmentHistory[]
  assessments: Assessment[]
  prescriptions: Prescription[]
  periodontalScreenings: PeriodontalScreening[]
  tmjAssessments: TmjAssessment[]
  oralSurgeryRecords: unknown[]
  appointments: AppointmentRecord[]
}
