export interface Notification {
  id: number
  appointment_id: number
  patient_id: number
  type: string
  status: string
  message_body: string
  error_message?: string | null
  created_at: string
  patients: { id: number; first_name: string; last_name: string; phone: string } | null
  appointments: { id: number; scheduled_at: string; clinic_id: number; clinics: { name: string } | null } | null
}

export interface NotificationsClientProps {
  initialNotifications: Notification[]
  clinics: { id: number; name: string }[]
}
