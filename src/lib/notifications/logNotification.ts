import { supabaseAdmin } from '@/lib/supabase/server'

export async function logNotification({
  appointmentId,
  patientId,
  triggerType,
  channel = 'email',
  status,
  errorMessage,
}: {
  appointmentId?: number
  patientId?: number
  triggerType: string
  channel?: 'email' | 'sms'
  status: 'sent' | 'failed' | 'pending'
  errorMessage?: string
}): Promise<void> {
  try {
    await supabaseAdmin.from('notifications').insert({
      appointment_id: appointmentId ?? null,
      patient_id: patientId ?? null,
      trigger_type: triggerType as never,
      channel,
      status,
      error_message: errorMessage ?? null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })
  } catch (err) {
    console.error('logNotification insert failed:', err)
  }
}
