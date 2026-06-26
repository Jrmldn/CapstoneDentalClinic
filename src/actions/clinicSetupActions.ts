'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ensureRole } from '@/lib/auth/ensureRole'

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
    name?: string
    phone?: string
    email?: string
    address?: string
    latitude?: number | null
    longitude?: number | null
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

    revalidatePath('/')
    revalidatePath(`/superadmin-dashboard/clinic/${clinicId}/profile`)
    return { success: true, clinic: clinic?.[0] }
  } catch (error) {
    console.error('Error in updateClinicProfile:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function updateOperatingHours(clinicId: number, hours: OperatingHourData[]) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

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

    revalidatePath('/')
    revalidatePath(`/superadmin-dashboard/clinic/${clinicId}/profile`)
    return { success: true, hours: data }
  } catch (error) {
    console.error('Error in updateOperatingHours:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
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

    revalidatePath('/')
    revalidatePath(`/superadmin-dashboard/clinic/${clinicId}/profile`)
    return { success: true }
  } catch (error) {
    console.error('Error in manageClinicGallery:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function uploadClinicGalleryImage(clinicId: number, formData: FormData) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const file = formData.get('file') as File | null
    if (!file) throw new Error('No file provided.')

    const path = `${clinicId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('clinic-gallery')
      .upload(path, file, { upsert: false })

    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('clinic-gallery')
      .getPublicUrl(path)

    const { data: maxRow } = await supabaseAdmin
      .from('clinic_gallery')
      .select('sort_order')
      .eq('clinic_id', clinicId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = maxRow ? (maxRow.sort_order as number) + 1 : 0

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('clinic_gallery')
      .insert({ clinic_id: clinicId, image_url: publicUrl, sort_order: nextOrder })
      .select()
      .single()

    if (insertError) throw new Error(insertError.message)

    revalidatePath(`/superadmin-dashboard/clinic/${clinicId}/profile`)
    return { success: true, row: inserted }
  } catch (error) {
    console.error('Error in uploadClinicGalleryImage:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function deleteClinicGalleryImage(imageId: number, imagePath: string) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { error: dbError } = await supabaseAdmin
      .from('clinic_gallery')
      .delete()
      .eq('id', imageId)

    if (dbError) throw new Error(dbError.message)

    const storagePathMatch = imagePath.match(/clinic-gallery\/(.+)$/)
    if (storagePathMatch) {
      await supabaseAdmin.storage.from('clinic-gallery').remove([storagePathMatch[1]])
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteClinicGalleryImage:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function reorderClinicGalleryImages(rows: { id: number; sort_order: number }[]) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    await Promise.all(
      rows.map(({ id, sort_order }) =>
        supabaseAdmin.from('clinic_gallery').update({ sort_order }).eq('id', id)
      )
    )

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error in reorderClinicGalleryImages:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

