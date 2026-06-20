'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole } from '@/lib/auth/ensureRole'

// TYPES

export interface DentistAvailabilityInput {
  day_of_week: number
  start_time: string
  end_time: string
}

// DENTIST BLOCKED SLOTS ACTIONS

export async function addBlockedSlot(
  dentistId: number,
  blockedDate: string,
  startTime: string | null,
  endTime: string | null,
  reason: string | null
) {
  const auth = await ensureRole('dentist')
  if (!auth.success) return { success: false, error: auth.error }

  const { data: dentistRecord } = await supabaseAdmin
    .from('dentists')
    .select('id')
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!dentistRecord || dentistRecord.id !== dentistId) {
    return { success: false, error: 'Insufficient permissions' }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('dentist_blocked_slots')
      .insert([{
        dentist_id: dentistId,
        blocked_date: blockedDate,
        start_time: startTime || null,
        end_time: endTime || null,
        reason: reason || 'Blocked',
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/dentist-dashboard/availability')
    return { success: true, blockedSlot: data }
  } catch (error) {
    console.error('Error in addBlockedSlot:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function deleteBlockedSlot(blockedSlotId: number) {
  const auth = await ensureRole('dentist')
  if (!auth.success) return { success: false, error: auth.error }

  const { data: dentistRecord } = await supabaseAdmin
    .from('dentists')
    .select('id')
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!dentistRecord) return { success: false, error: 'Insufficient permissions' }

  // Verify the slot belongs to this dentist
  const { data: slot } = await supabaseAdmin
    .from('dentist_blocked_slots')
    .select('dentist_id')
    .eq('id', blockedSlotId)
    .maybeSingle()

  if (!slot || slot.dentist_id !== dentistRecord.id) {
    return { success: false, error: 'Insufficient permissions' }
  }

  try {
    const { error } = await supabaseAdmin
      .from('dentist_blocked_slots')
      .delete()
      .eq('id', blockedSlotId)

    if (error) throw new Error(error.message)

    revalidatePath('/dentist-dashboard/availability')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteBlockedSlot:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function fetchBlockedSlots(dentistId: number) {
  const auth = await ensureRole('dentist')
  if (!auth.success) return { success: false, error: auth.error, blockedSlots: [] }

  const { data: dentistRecord } = await supabaseAdmin
    .from('dentists')
    .select('id')
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!dentistRecord || dentistRecord.id !== dentistId) {
    return { success: false, error: 'Insufficient permissions', blockedSlots: [] }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('dentist_blocked_slots')
      .select('*')
      .eq('dentist_id', dentistId)

    if (error) throw new Error(error.message)

    return { success: true, blockedSlots: data || [] }
  } catch (error) {
    console.error('Error in fetchBlockedSlots:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      blockedSlots: [],
    }
  }
}

// DENTIST WORKING HOURS ACTIONS

export async function updateDentistWorkingHours(
  dentistId: number,
  availabilities: DentistAvailabilityInput[]
) {
  const auth = await ensureRole('dentist')
  if (!auth.success) return { success: false, error: auth.error }

  const { data: dentistRecord } = await supabaseAdmin
    .from('dentists')
    .select('id')
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!dentistRecord || dentistRecord.id !== dentistId) {
    return { success: false, error: 'Insufficient permissions' }
  }

  try {
    // Delete existing availability for dentist
    const { error: deleteErr } = await supabaseAdmin
      .from('dentist_availability')
      .delete()
      .eq('dentist_id', dentistId)

    if (deleteErr) throw new Error(deleteErr.message)

    // Insert new availability
    if (availabilities.length > 0) {
      const insertData = availabilities.map(av => ({
        dentist_id: dentistId,
        day_of_week: av.day_of_week,
        start_time: av.start_time,
        end_time: av.end_time,
      }))

      const { error: insertErr } = await supabaseAdmin
        .from('dentist_availability')
        .insert(insertData)

      if (insertErr) throw new Error(insertErr.message)
    }

    revalidatePath('/dentist-dashboard/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in updateDentistWorkingHours:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function fetchDentistWorkingHours(dentistId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from('dentist_availability')
      .select('*')
      .eq('dentist_id', dentistId)
      .order('day_of_week', { ascending: true })

    if (error) throw new Error(error.message)

    return { success: true, workingHours: data || [] }
  } catch (error) {
    console.error('Error in fetchDentistWorkingHours:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      workingHours: [],
    }
  }
}

export async function updateDentistProfile(
  dentistId: number,
  data: {
    first_name: string
    last_name: string
    specialty?: string | null
    license_no?: string | null
  }
) {
  const auth = await ensureRole('dentist')
  if (!auth.success) return { success: false, error: auth.error }

  const { data: dentistRecord } = await supabaseAdmin
    .from('dentists')
    .select('id')
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!dentistRecord || dentistRecord.id !== dentistId) {
    return { success: false, error: 'Insufficient permissions' }
  }

  try {
    const { error } = await supabaseAdmin
      .from('dentists')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        specialty: data.specialty,
        license_no: data.license_no,
      })
      .eq('id', dentistId)

    if (error) throw new Error(error.message)

    revalidatePath('/dentist-dashboard/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in updateDentistProfile:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}
