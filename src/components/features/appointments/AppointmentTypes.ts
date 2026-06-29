export interface Patient {
  id: number
  first_name: string
  last_name: string
  phone: string
}

export interface Service {
  id: number
  name: string
  price: number
  slot_duration_min: number
}

export interface Dentist {
  id: number
  first_name: string
  last_name: string
}

export interface Appointment {
  id: number
  scheduled_at: string
  end_at: string
  status: string
  notes?: string | null
  is_walk_in: boolean | null
  downpayment: number | null
  payment_method?: string | null
  payment_status: string | null
  patients: Patient | null
  services: Service | null
  dentists: Dentist | null
}

export interface AppointmentsClientProps {
  clinicId: number
  userId: string
  initialAppointments: Appointment[]
  patients: Patient[]
  dentists: Dentist[]
}
