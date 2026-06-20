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

    revalidatePath('/staff-dashboard/notifications')
    return { success: true, notification }
  } catch (error) {
    console.error('Error in retriggerNotification:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

/** Fetch all notifications for a clinic's appointments, filterable by status */
export async function fetchNotifications(
  clinicId: number,
  status?: 'pending' | 'sent' | 'failed'
) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error, notifications: [] }

    // Single Query Join Filter (Class G/B/A optimization)
    const baseQuery = supabaseAdmin
      .from('notifications')
      .select(`
        *,
        patients ( id, first_name, last_name, phone ),
        appointments!inner ( id, scheduled_at, clinic_id )
      `)
      .eq('appointments.clinic_id', clinicId)
      .order('created_at', { ascending: false })

    const { data: notifications, error } = status
      ? await baseQuery.eq('status', status)
      : await baseQuery

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
