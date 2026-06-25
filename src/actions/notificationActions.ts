'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ensureRole } from '@/lib/auth/ensureRole'

// NOTIFICATIONS

/** Manually retrigger a failed SMS or email notification */
export async function retriggerNotification(notificationId: number) {
  try {
    const auth = await ensureRole('superadmin')
    if (!auth.success) return { success: false, error: auth.error }

    // Mark as 'pending' so the sending worker/edge-function picks it up again
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ status: 'pending', error_message: '' })
      .eq('id', notificationId)
      .eq('status', 'failed')            // only allow retrigger on failed ones
      .select()
      .single()

    if (error || !notification) {
      throw new Error('Notification not found or not in a failed state')
    }

    revalidatePath('/superadmin-dashboard/notifications')
    return { success: true, notification }
  } catch (error) {
    console.error('Error in retriggerNotification:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

/** Fetch notifications across branches (superadmin), optionally scoped to one clinic and filterable by status and trigger type */
export async function fetchNotifications(
  clinicId?: number,
  status?: 'pending' | 'sent' | 'failed',
  triggerType?: string
) {
  try {
    const auth = await ensureRole('superadmin')
    if (!auth.success) return { success: false, error: auth.error, notifications: [] }

    let baseQuery = supabaseAdmin
      .from('notifications')
      .select(`
        *,
        patients ( id, first_name, last_name, phone ),
        appointments ( id, scheduled_at, clinic_id, clinics ( name ) )
      `)
      .order('created_at', { ascending: false })

    if (clinicId) baseQuery = baseQuery.not('appointment_id', 'is', null).eq('appointments.clinic_id', clinicId)
    if (status) baseQuery = baseQuery.eq('status', status)
    if (triggerType) baseQuery = baseQuery.eq('trigger_type', triggerType as never)

    const { data: notifications, error } = await baseQuery

    if (error) throw new Error(error.message)

    return { success: true, notifications: notifications ?? [] }
  } catch (error) {
    console.error('Error in fetchNotifications:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      notifications: [],
    }
  }
}
