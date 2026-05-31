'use server'

import { supabaseAdmin } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

// --- INTERFACES ---
interface StaffData {
  firstName: string
  lastName: string
  email: string
  password: string
  clinicId: number
}

interface DentistData extends StaffData {
  specialty: string
}

// --- CREATE ACTIONS ---

export async function addStaff(data: StaffData) {
  try {
    // 1. Create the user in Supabase Auth via Admin API
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

    // 💥 STEP 2 HAS BEEN REMOVED! The SQL trigger handles this automatically now.

    // 3. Insert into the clinic_staff table
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
      // Rollback: delete from users table and auth
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
    // 1. Create the user in Supabase Auth
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


    // 3. Insert into the dentists table
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
      // Rollback
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

// --- DELETE ACTION ---

export async function deletePersonnel(userId: string) {
  try {
    // Delete from public.users (which cascades to clinic_staff/dentists)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) throw new Error(dbError.message)

    // Delete from Auth Admin
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) throw new Error(authError.message)

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' }
  }
}

// --- READ ACTION ---

export async function fetchPersonnel() {
  try {
    // 1. Fetch Staff (Joining with users for email, and clinics for clinic name)
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

    // 2. Fetch Dentists (Joining with users and clinics)
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

    // 3. Format the data to match the UI tables
    const formattedStaff = staffData.map((staff: any) => ({
      id: staff.id,
      userId: staff.user_id,
      clinicId: staff.clinic_id,   // ← ADD THIS
      firstName: staff.first_name,
      lastName: staff.last_name,
      email: staff.users?.email || 'No email',
      clinicName: staff.clinics?.name || 'Unassigned',
    }))

    const formattedDentists = dentistData.map((dentist: any) => ({
      id: dentist.id,
      userId: dentist.user_id,
      clinicId: dentist.clinic_id, // ← ADD THIS
      firstName: dentist.first_name,
      lastName: dentist.last_name,
      specialty: dentist.specialty,
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
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,users.email.ilike.%${searchQuery}%`)
    }

    if (clinicFilter && clinicFilter !== 'all') {
      query = query.eq('clinic_id', parseInt(clinicFilter))
    }

    query = query.range(from, to)

    const { data: staffData, count, error } = await query

    if (error) throw new Error(error.message)

    const formattedStaff = (staffData || []).map((staff: any) => ({
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
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,users.email.ilike.%${searchQuery}%`)
    }

    if (clinicFilter && clinicFilter !== 'all') {
      query = query.eq('clinic_id', parseInt(clinicFilter))
    }

    query = query.range(from, to)

    const { data: dentistData, count, error } = await query

    if (error) throw new Error(error.message)

    const formattedDentists = (dentistData || []).map((dentist: any) => ({
      id: dentist.id,
      userId: dentist.user_id,
      clinicId: dentist.clinic_id,
      firstName: dentist.first_name,
      lastName: dentist.last_name,
      specialty: dentist.specialty,
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
    // 1. Determine which table to update
    const table = type === 'staff' ? 'clinic_staff' : 'dentists'

    // 2. Build the update object
    const updatePayload: any = {
      first_name: data.firstName,
      last_name: data.lastName,
      clinic_id: data.clinicId,
    }

    // 3. Only add specialty if it's a dentist
    if (type === 'dentists' && data.specialty) {
      updatePayload.specialty = data.specialty
    }

    // 4. Perform the update
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

export async function getClinics() {
  try {
    const { data, error } = await supabaseAdmin
      .from('clinics')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    return { success: true, data }
  } catch (error) {
    console.error('Fetch clinics error:', error)
    return { success: false, data: [] }
  }
}