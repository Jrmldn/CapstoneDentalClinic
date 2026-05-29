'use server'

import { supabaseAdmin } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

interface AddClinicData {
  name: string
  email: string
  phone: string
  address: string
  dailyCapacity: number
  latitude?: number
  longitude?: number
}

export async function addClinic(data: AddClinicData) {
  try {
    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          max_appointments_per_day: data.dailyCapacity,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          is_active: true,
        },
      ])
      .select()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/superadmin-dashboard/clinic')
    return { success: true, clinic: clinic?.[0] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add clinic',
    }
  }
}

export async function fetchClinics() {
  try {
    const { data: clinics, error } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      clinics: clinics || [],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch clinics',
      clinics: [],
    }
  }
}

export async function deleteClinic(clinicId: number) {
  try {
    const { error } = await supabaseAdmin
      .from('clinics')
      .delete()
      .eq('id', clinicId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/superadmin-dashboard/clinic')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete clinic',
    }
  }
}

export async function updateClinicStatus(clinicId: number, isActive: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('clinics')
      .update({ is_active: isActive })
      .eq('id', clinicId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/superadmin-dashboard/clinic')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update clinic status',
    }
  }
}
