export interface Dentist {
  id: number
  first_name: string
  last_name: string
  specialty: string | null
}

export interface Service {
  id: number
  name: string
  price: number
  slot_duration_min: number
}

export interface PatientRecord {
  patient: {
    id: number
    first_name: string
    last_name: string
    phone: string
    birthdate: string
    gender: string
    address: string
    email: string | null
    updated_at?: string
  }
  medicalHistory: {
    blood_type: string | null
    blood_pressure: string | null
    medical_flags: string | null
    allergies: string[]
    current_medications: string[]
    medical_conditions: string[]
    previous_surgeries: string | null
    is_pregnant: boolean
    is_smoker: boolean
    updated_at?: string
    detailed_info: {
      last_dental_visit?: string
      physician_name?: string
      physician_specialty?: string
      physician_office_address?: string
      physician_office_phone?: string
      good_condition?: 'yes' | 'no' | ''
      under_medical_treatment?: 'yes' | 'no' | ''
      under_medical_treatment_desc?: string
      serious_illness_operation?: 'yes' | 'no' | ''
      serious_illness_operation_desc?: string
      hospitalized?: 'yes' | 'no' | ''
      hospitalized_desc?: string
      prescription_medication?: 'yes' | 'no' | ''
      prescription_medication_desc?: string
      drug_use?: 'yes' | 'no' | ''
      allergy_local_anesthetic?: boolean
      allergy_penicillin?: boolean
      allergy_sulfa?: boolean
      allergy_aspirin?: boolean
      allergy_latex?: boolean
      allergy_other?: string
      bleeding_time?: string
      is_nursing?: boolean
      is_birth_control?: boolean
      updated_by?: string
      updated_by_branch?: string
    } | null
  } | null
  dentalCharts: any[]
  treatmentHistory: any[]
  assessments: any[]
  prescriptions: any[]
  appointments: any[]
}
