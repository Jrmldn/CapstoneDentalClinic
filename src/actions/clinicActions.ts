'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AddClinicData } from '@/types'

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

    if (error) throw new Error(error.message)

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
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('clinics')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    if (statusFilter && statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      query = query.eq('is_active', isActive)
    }

    query = query.range(from, to)

    const { data: clinics, count, error } = await query

    if (error) throw new Error(error.message)

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

    if (error) throw new Error(error.message)

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

    if (error) throw new Error(error.message)

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

    if (error) throw new Error(error.message)

    revalidatePath('/superadmin-dashboard/clinic')
    return { success: true, clinic: clinic?.[0] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update clinic',
    }
  }
}