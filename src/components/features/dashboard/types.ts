export interface StaffRawAppointment {
  id: number
  scheduled_at: string
  status: string
  patients: { first_name: string; last_name: string } | Array<{ first_name: string; last_name: string }> | null
  services: { name: string } | Array<{ name: string }> | null
}

export interface DentistRawAppointment {
  id: number
  scheduled_at: string
  status: string
  patients: { id: number; first_name: string; last_name: string; phone: string; birthdate: string; gender: string } | Array<{ id: number; first_name: string; last_name: string; phone: string; birthdate: string; gender: string }> | null
  services: { name: string } | Array<{ name: string }> | null
}
