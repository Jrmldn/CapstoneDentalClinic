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
  appointments: { id: number; scheduled_at: string } | null
}

export interface NotificationsClientProps {
  clinicId: number
  initialNotifications: Notification[]
}
