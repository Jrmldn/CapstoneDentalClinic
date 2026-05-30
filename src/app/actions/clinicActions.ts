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

export async function fetchClinics(
  searchQuery = '', 
  statusFilter = 'all', 
  page = 1, 
  limit = 10
) {
  try {
    // 1. Calculate the pagination range for Supabase
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 2. Request the exact count along with the data
    let query = supabaseAdmin
      .from('clinics')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 3. Add search filter (searches both name and email)
    if (searchQuery) {
      // Using ilike for case-insensitive matching
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    // 4. Add status filter
    if (statusFilter && statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      query = query.eq('is_active', isActive)
    }

    // 5. Apply the pagination range
    query = query.range(from, to)

    const { data: clinics, count, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      clinics: clinics || [],
      totalCount: count || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch clinics',
      clinics: [],
      totalCount: 0,
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

export async function updateClinic(clinicId: number, data: AddClinicData) {
  try {
    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .update({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        max_appointments_per_day: data.dailyCapacity,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      })
      .eq('id', clinicId)
      .select()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/superadmin-dashboard/clinic')
    return { success: true, clinic: clinic?.[0] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update clinic',
    }
  }
}