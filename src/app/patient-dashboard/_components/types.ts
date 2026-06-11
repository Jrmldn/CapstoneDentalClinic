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
  } | null
  dentalCharts: any[]
  treatmentHistory: any[]
  assessments: any[]
  prescriptions: any[]
  appointments: any[]
}
