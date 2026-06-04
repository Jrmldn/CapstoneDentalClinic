'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Define types locally if they are not in @/types yet
interface OperatingHourData {
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

export async function updateClinicProfile(
  clinicId: number,
  data: {
    phone?: string
    email?: string
    address?: string
    manual_status?: string
    max_appointments_per_day?: number
    default_downpayment_amount?: number
  }
) {
  try {
    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .update(data)
      .eq('id', clinicId)
      .select()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/profile')
    return { success: true, clinic: clinic?.[0] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update clinic profile',
    }
  }
}

export async function updateOperatingHours(clinicId: number, hours: OperatingHourData[]) {
  try {
    // Delete existing hours for the clinic to replace them
    await supabaseAdmin
      .from('clinic_operating_hours')
      .delete()
      .eq('clinic_id', clinicId)

    const hoursData = hours.map(h => ({
      clinic_id:   clinicId,
      day_of_week: h.day_of_week,
      // open_time/close_time are NOT NULL in the DB schema.
      // When the day is closed we store midnight as a neutral placeholder.
      open_time:   h.is_closed ? '00:00:00' : (h.open_time  ?? '08:00:00'),
      close_time:  h.is_closed ? '00:00:00' : (h.close_time ?? '17:00:00'),
      is_closed:   h.is_closed,
    }))

    const { data, error } = await supabaseAdmin
      .from('clinic_operating_hours')
      .insert(hoursData)
      .select()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/profile')
    return { success: true, hours: data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update operating hours',
    }
  }
}

export async function manageClinicHMOs(clinicId: number, hmoNames: string[]) {
  try {
    await supabaseAdmin
      .from('clinic_hmo')
      .delete()
      .eq('clinic_id', clinicId)

    if (hmoNames.length > 0) {
      const hmoData = hmoNames.map(name => ({
        clinic_id: clinicId,
        hmo_name: name
      }))

      const { error } = await supabaseAdmin
        .from('clinic_hmo')
        .insert(hmoData)

      if (error) throw new Error(error.message)
    }

    revalidatePath('/staff-dashboard/profile')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to manage HMOs',
    }
  }
}

export async function manageClinicSpecialties(clinicId: number, specialties: string[]) {
  try {
    await supabaseAdmin
      .from('clinic_specialties')
      .delete()
      .eq('clinic_id', clinicId)

    if (specialties.length > 0) {
      const specialtyData = specialties.map(name => ({
        clinic_id: clinicId,
        specialty_name: name
      }))

      const { error } = await supabaseAdmin
        .from('clinic_specialties')
        .insert(specialtyData)

      if (error) throw new Error(error.message)
    }

    revalidatePath('/staff-dashboard/profile')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to manage specialties',
    }
  }
}

export async function manageClinicGallery(clinicId: number, imageUrls: { url: string, sort_order: number }[]) {
  try {
    await supabaseAdmin
      .from('clinic_gallery')
      .delete()
      .eq('clinic_id', clinicId)

    if (imageUrls.length > 0) {
      const galleryData = imageUrls.map(img => ({
        clinic_id: clinicId,
        image_url: img.url,
        sort_order: img.sort_order
      }))

      const { error } = await supabaseAdmin
        .from('clinic_gallery')
        .insert(galleryData)

      if (error) throw new Error(error.message)
    }

    revalidatePath('/staff-dashboard/profile')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to manage gallery',
    }
  }
}
