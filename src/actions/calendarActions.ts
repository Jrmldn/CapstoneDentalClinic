'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ensureRole } from '@/lib/auth/ensureRole'

// TYPES

export interface HolidayData {
  date: string          // "YYYY-MM-DD"
  description: string
  is_special_day: boolean  // false = closed, true = special (open but notable)
}

// CALENDAR & HOLIDAYS

/** Add or update a holiday / special day for a clinic */
export async function manageClinicHolidays(
  clinicId: number,
  action: 'add' | 'remove',
  holidayData?: HolidayData,
  holidayId?: number
) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error }

    if (action === 'remove' && holidayId) {
      const { error } = await supabaseAdmin
        .from('clinic_holidays')
        .delete()
        .eq('id', holidayId)
        .eq('clinic_id', clinicId)

      if (error) throw new Error(error.message)
    } else if (action === 'add' && holidayData) {
      // Check if a holiday on this date already exists for this clinic
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('clinic_holidays')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('date', holidayData.date)
        .maybeSingle()

      if (fetchError) throw new Error(fetchError.message)

      if (existing) {
        // Update the existing holiday description and type
        const { error: updateError } = await supabaseAdmin
          .from('clinic_holidays')
          .update({
            description:    holidayData.description,
            is_special_day: holidayData.is_special_day,
          })
          .eq('id', existing.id)

        if (updateError) throw new Error(updateError.message)
      } else {
        // Insert a new holiday record
        const { error: insertError } = await supabaseAdmin
          .from('clinic_holidays')
          .insert([{
            clinic_id:      clinicId,
            date:           holidayData.date,
            description:    holidayData.description,
            is_special_day: holidayData.is_special_day,
          }])

        if (insertError) throw new Error(insertError.message)
      }
    }

    revalidatePath('/staff-dashboard/calendar')
    return { success: true }
  } catch (error) {
    console.error('Error in manageClinicHolidays:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

/** Fetch all holidays + appointments for a calendar month view */
export async function fetchCalendarData(
  clinicId: number,
  year: number,
  month: number,    // 1-indexed
  dentistId?: number
) {
  try {
    const auth = await ensureRole('staff', 'dentist')
    if (!auth.success) return { success: false, error: auth.error, holidays: [], appointments: [] }

    const monthStr   = String(month).padStart(2, '0')
    const firstDay   = `${year}-${monthStr}-01`

    const lastDayDate = new Date(year, month, 0)
    const lastDay    = `${lastDayDate.getFullYear()}-${String(lastDayDate.getMonth() + 1).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`

    // Timezone safety: expand the DB query window by 1 day on both ends
    const startDate = new Date(year, month - 1, 1)
    startDate.setDate(startDate.getDate() - 1)
    const queryStart = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}T00:00:00`

    const endDate = new Date(year, month, 0)
    endDate.setDate(endDate.getDate() + 1)
    const queryEnd = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T23:59:59`

    let appointmentsQuery = supabaseAdmin
      .from('appointments')
      .select(`
        id, scheduled_at, end_at, status, dentist_id,
        patients ( id, first_name, last_name, phone ),
        services ( id, name, slot_duration_min ),
        dentists ( id, first_name, last_name )
      `)
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', queryStart)
      .lte('scheduled_at', queryEnd)
      .not('status', 'in', '(cancelled,no_show)')
      .order('scheduled_at', { ascending: true })

    if (dentistId) {
      appointmentsQuery = appointmentsQuery.eq('dentist_id', dentistId)
    }

    const [holidaysRes, appointmentsRes] = await Promise.all([
      supabaseAdmin
        .from('clinic_holidays')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('date', { ascending: true }),

      appointmentsQuery,
    ])

    if (holidaysRes.error)     throw new Error(holidaysRes.error.message)
    if (appointmentsRes.error) throw new Error(appointmentsRes.error.message)

    return {
      success: true,
      holidays:     holidaysRes.data     ?? [],
      appointments: appointmentsRes.data ?? [],
    }
  } catch (error) {
    console.error('Error in fetchCalendarData:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      holidays: [],
      appointments: [],
    }
  }
}
