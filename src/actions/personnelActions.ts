'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { StaffData, DentistData, FormattedStaff, FormattedDentist } from '@/types'

interface PersonnelRaw {
  id: number
  user_id: string
  clinic_id: number
  first_name: string
  last_name: string
  users: { email: string } | null
  clinics: { name: string } | null
  specialty?: string
}

async function getMatchingUserIds(searchQuery: string): Promise<string[]> {
  if (!searchQuery) return []

  const { data: matchingUsers } = await supabaseAdmin
    .from('users')
    .select('id')
    .ilike('email', `%${searchQuery}%`)

  return matchingUsers?.map(u => u.id) || []
}

export async function addStaff(data: StaffData) {
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: `${data.firstName} ${data.lastName}`,
        role: 'staff',
      },
    })

    if (authError) throw new Error(`Auth error: ${authError.message}`)
    if (!authData.user) throw new Error('Failed to create user account')

    const { error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .insert({
        user_id: authData.user.id,
        clinic_id: data.clinicId,
        first_name: data.firstName,
        last_name: data.lastName,
      })

    if (staffError) {
      console.error('Staff insert error:', staffError)
      await supabaseAdmin.from('users').delete().eq('id', authData.user.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Database error: ${staffError.message}`)
    }

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('addStaff error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add staff' }
  }
}

export async function addDentist(data: DentistData) {
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: `${data.firstName} ${data.lastName}`,
        role: 'dentist',
      },
    })

    if (authError) throw new Error(`Auth error: ${authError.message}`)
    if (!authData.user) throw new Error('Failed to create dentist account')

    const { error: dentistError } = await supabaseAdmin
      .from('dentists')
      .insert({
        user_id: authData.user.id,
        clinic_id: data.clinicId,
        first_name: data.firstName,
        last_name: data.lastName,
        specialty: data.specialty,
      })

    if (dentistError) {
      console.error('Dentist insert error:', dentistError)
      await supabaseAdmin.from('users').delete().eq('id', authData.user.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Database error: ${dentistError.message}`)
    }

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('addDentist error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add dentist' }
  }
}

export async function deletePersonnel(userId: string) {
  try {
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) throw new Error(dbError.message)

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) throw new Error(authError.message)

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' }
  }
}

export async function fetchPersonnel() {
  try {
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .select(`
        id,
        user_id,
        clinic_id,
        first_name,
        last_name,
        users ( email ),
        clinics ( name )
      `)
      .order('first_name', { ascending: true })

    if (staffError) throw new Error(staffError.message)

    const { data: dentistData, error: dentistError } = await supabaseAdmin
      .from('dentists')
      .select(`
        id,
        user_id,
        clinic_id,
        first_name,
        last_name,
        specialty,
        users ( email ),
        clinics ( name )
      `)
      .order('first_name', { ascending: true })

    if (dentistError) throw new Error(dentistError.message)

    const formattedStaff: FormattedStaff[] = (staffData as unknown as PersonnelRaw[]).map((staff) => ({ // FIX: Removed any
      id: staff.id,
      userId: staff.user_id,
      clinicId: staff.clinic_id,
      firstName: staff.first_name,
      lastName: staff.last_name,
      email: staff.users?.email || 'No email',
      clinicName: staff.clinics?.name || 'Unassigned',
    }))

    const formattedDentists: FormattedDentist[] = (dentistData as unknown as PersonnelRaw[]).map((dentist) => ({ // FIX: Removed any
      id: dentist.id,
      userId: dentist.user_id,
      clinicId: dentist.clinic_id,
      firstName: dentist.first_name,
      lastName: dentist.last_name,
      specialty: dentist.specialty || '',
      email: dentist.users?.email || 'No email',
      clinicName: dentist.clinics?.name || 'Unassigned',
    }))

    return {
      success: true,
      staff: formattedStaff,
      dentists: formattedDentists
    }
  } catch (error) {
    console.error('Fetch personnel error:', error)
    return { success: false, error: 'Failed to fetch personnel data.' }
  }
}

export async function fetchStaff(
  searchQuery = '',
  clinicFilter = 'all',
  page = 1,
  limit = 10
) {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('clinic_staff')
      .select(`
        id,
        user_id,
        clinic_id,
        first_name,
        last_name,
        users ( email ),
        clinics ( name )
      `, { count: 'exact' })
      .order('first_name', { ascending: false })

    if (searchQuery) {
      const matchingUserIds = await getMatchingUserIds(searchQuery)

      if (matchingUserIds.length > 0) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,user_id.in.(${matchingUserIds.join(',')})`
        )
      } else {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
      }
    }

    if (clinicFilter && clinicFilter !== 'all') {
      query = query.eq('clinic_id', parseInt(clinicFilter))
    }

    query = query.range(from, to)

    const { data: staffData, count, error } = await query

    if (error) throw new Error(error.message)

    const formattedStaff: FormattedStaff[] = (staffData as unknown as PersonnelRaw[] || []).map((staff) => ({ // FIX: Removed any
      id: staff.id,
      userId: staff.user_id,
      clinicId: staff.clinic_id,
      firstName: staff.first_name,
      lastName: staff.last_name,
      email: staff.users?.email || 'No email',
      clinicName: staff.clinics?.name || 'Unassigned',
    }))

    return {
      success: true,
      staff: formattedStaff,
      totalCount: count || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch staff',
      staff: [],
      totalCount: 0,
    }
  }
}

export async function fetchDentists(
  searchQuery = '',
  clinicFilter = 'all',
  page = 1,
  limit = 10
) {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('dentists')
      .select(`
        id,
        user_id,
        clinic_id,
        first_name,
        last_name,
        specialty,
        users ( email ),
        clinics ( name )
      `, { count: 'exact' })
      .order('first_name', { ascending: false })

    if (searchQuery) {
      const matchingUserIds = await getMatchingUserIds(searchQuery)

      if (matchingUserIds.length > 0) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,user_id.in.(${matchingUserIds.join(',')})`
        )
      } else {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
      }
    }

    if (clinicFilter && clinicFilter !== 'all') {
      query = query.eq('clinic_id', parseInt(clinicFilter))
    }

    query = query.range(from, to)

    const { data: dentistData, count, error } = await query

    if (error) throw new Error(error.message)

    const formattedDentists: FormattedDentist[] = (dentistData as unknown as PersonnelRaw[] || []).map((dentist) => ({ // FIX: Removed any
      id: dentist.id,
      userId: dentist.user_id,
      clinicId: dentist.clinic_id,
      firstName: dentist.first_name,
      lastName: dentist.last_name,
      specialty: dentist.specialty || '',
      email: dentist.users?.email || 'No email',
      clinicName: dentist.clinics?.name || 'Unassigned',
    }))

    return {
      success: true,
      dentists: formattedDentists,
      totalCount: count || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dentists',
      dentists: [],
      totalCount: 0,
    }
  }
}

export async function updatePersonnel(
  userId: string,
  type: 'staff' | 'dentists',
  data: {
    firstName: string;
    lastName: string;
    clinicId: number;
    specialty?: string
  }
) {
  try {
    const table = type === 'staff' ? 'clinic_staff' : 'dentists'

    interface UpdatePayload {
      first_name: string
      last_name: string
      clinic_id: number
      specialty?: string
    }

    const updatePayload: UpdatePayload = { // FIX: Defined UpdatePayload interface
      first_name: data.firstName,
      last_name: data.lastName,
      clinic_id: data.clinicId,
    }

    if (type === 'dentists' && data.specialty) {
      updatePayload.specialty = data.specialty
    }

    const { error } = await supabaseAdmin
      .from(table)
      .update(updatePayload)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update personnel'
    }
  }
}
