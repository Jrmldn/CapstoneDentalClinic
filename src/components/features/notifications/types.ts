export interface Notification {
  id: number
  appointment_id: number | null
  patient_id: number | null
  trigger_type: string
  channel: string
  status: string | null
  error_message?: string | null
  sent_at?: string | null
  created_at: string | null
  patients: { id: number; first_name: string; last_name: string; phone: string } | null
  appointments: { id: number; scheduled_at: string; clinic_id: number; clinics: { name: string } | null } | null
}

export interface NotificationsClientProps {
  initialNotifications: Notification[]
  clinics: { id: number; name: string }[]
}
