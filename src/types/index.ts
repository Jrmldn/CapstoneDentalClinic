export interface Clinic {
  id: number
  name: string
  email: string
  phone: string
  address: string
  max_appointments_per_day: number
  latitude: number | null
  longitude: number | null
  is_active: boolean
  created_at: string
}

export interface AddClinicData {
  name: string
  email: string
  phone: string
  address: string
  dailyCapacity: number
  latitude?: number
  longitude?: number
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
}

export interface FormattedDentist extends FormattedStaff {
  specialty: string
}

export interface SuperadminStats {
  totalClinics: number
  totalStaff: number
  totalDentists: number
  totalPatients: number
  recentClinics: Pick<Clinic, 'id' | 'name' | 'created_at' | 'is_active'>[]
}
