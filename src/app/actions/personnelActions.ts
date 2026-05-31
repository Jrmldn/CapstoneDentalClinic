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
        role: 'staff', // Tells the DB trigger NOT to make them a patient
      },
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Failed to create user account')

    // 2. Insert into the clinic_staff table
    const { error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .insert({
        user_id: authData.user.id,
        clinic_id: data.clinicId,
        first_name: data.firstName,
        last_name: data.lastName,
      })

    if (staffError) {
      // Rollback auth user if staff insertion fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(staffError.message)
    }

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add staff' }
  }
}

export async function addDentist(data: DentistData) {
  try {
    // 1. Create the user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: `${data.firstName} ${data.lastName}`,
        role: 'dentist', 
      },
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Failed to create dentist account')

    // 2. Insert into the dentists table
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
      // Rollback auth user if dentist insertion fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(dentistError.message)
    }

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
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