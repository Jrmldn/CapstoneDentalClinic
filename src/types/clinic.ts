export interface Clinic {
  id: number
  name: string
  email: string
  phone: string
  address: string
  max_appointments_per_day: number
  latitude?: number | null
  longitude?: number | null
  is_active: boolean
  created_at?: string
}

export interface AddClinicData {
  name: string
  email: string
  phone: string
  address: string
  dailyCapacity: number
  latitude?: number | null
  longitude?: number | null
}

export interface StaffData {
  firstName: string
  lastName: string
  email: string
  password: string
  clinicId: number
}

export interface DentistData extends StaffData {
  specialty: string
}

export interface FormattedStaff {
  id: number
  userId: string
  clinicId: number
  firstName: string
  lastName: string
  email: string
  clinicName: string
  isDisabled: boolean
}

export interface FormattedDentist extends FormattedStaff {
  specialty: string
}

export type UnifiedPersonnel =
  | (FormattedStaff & { role: 'staff' })
  | (FormattedDentist & { role: 'dentist' })
