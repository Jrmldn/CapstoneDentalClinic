'use server'

import { revalidatePath } from 'next/cache'
import { StaffData, DentistData } from '@/types/clinic'

import {
  getMatchingUserIds,
  createAuthUser,
  deleteAuthUser,
  insertStaff,
  insertDentist,
  deleteUserRecord,
  getAllStaff,
  getAllDentists,
  getStaffList,
  getDentistsList,
  updatePersonnelRecord
} from '@/services/personnelService'
import {
  getPaginationRange,
  formatStaff,
  formatDentists
} from '@/utils/personnel-helpers'

interface PersonnelUpdatePayload {
  first_name: string
  last_name: string
  clinic_id: number
  specialty?: string
}

export async function addStaff(data: StaffData) {
  try {
    const { data: authData, error: authError } = await createAuthUser({
      email: data.email,
      password: data.password,
      fullName: `${data.firstName} ${data.lastName}`,
      role: 'staff',
    })

    if (authError) throw new Error(`Auth error: ${authError.message}`)
    if (!authData.user) throw new Error('Failed to create user account')

    const { error: staffError } = await insertStaff({
      userId: authData.user.id,
      clinicId: data.clinicId,
      firstName: data.firstName,
      lastName: data.lastName,
    })

    if (staffError) {
      console.error('Staff insert error:', staffError)
      await deleteUserRecord(authData.user.id)
      await deleteAuthUser(authData.user.id)
      throw new Error(`Database error: ${staffError.message}`)
    }

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('Error in addStaff:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add staff' }
  }
}

export async function addDentist(data: DentistData) {
  try {
    const { data: authData, error: authError } = await createAuthUser({
      email: data.email,
      password: data.password,
      fullName: `${data.firstName} ${data.lastName}`,
      role: 'dentist',
    })

    if (authError) throw new Error(`Auth error: ${authError.message}`)
    if (!authData.user) throw new Error('Failed to create dentist account')

    const { error: dentistError } = await insertDentist({
      userId: authData.user.id,
      clinicId: data.clinicId,
      firstName: data.firstName,
      lastName: data.lastName,
      specialty: data.specialty,
    })

    if (dentistError) {
      console.error('Dentist insert error:', dentistError)
      await deleteUserRecord(authData.user.id)
      await deleteAuthUser(authData.user.id)
      throw new Error(`Database error: ${dentistError.message}`)
    }

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('Error in addDentist:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add dentist' }
  }
}

export async function deletePersonnel(userId: string) {
  try {
    const { error: dbError } = await deleteUserRecord(userId)

    if (dbError) throw new Error(dbError.message)

    const { error: authError } = await deleteAuthUser(userId)
    if (authError) throw new Error(authError.message)

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('Error in deletePersonnel:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' }
  }
}

export async function fetchPersonnel() {
  try {
    const { data: rawStaff, error: staffError } = await getAllStaff()

    if (staffError) throw new Error(staffError.message)

    const { data: rawDentists, error: dentistError } = await getAllDentists()

    if (dentistError) throw new Error(dentistError.message)

    const formattedStaff = formatStaff(rawStaff || [])
    const formattedDentists = formatDentists(rawDentists || [])

    return {
      success: true,
      staff: formattedStaff,
      dentists: formattedDentists
    }
  } catch (error) {
    console.error('Error in fetchPersonnel:', error)
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
    const { from, to } = getPaginationRange(page, limit)
    const matchingUserIds = searchQuery ? await getMatchingUserIds(searchQuery) : []

    const clinicId = clinicFilter && clinicFilter !== 'all' ? parseInt(clinicFilter) : undefined

    const { data: staffData, count, error } = await getStaffList({
      matchingUserIds,
      searchQuery,
      clinicFilter: clinicId,
      from,
      to
    })

    if (error) {
      console.error('Database error in fetchStaff:', error)
      throw new Error(error.message)
    }

    const formattedStaff = formatStaff(staffData || [])

    return {
      success: true,
      staff: formattedStaff,
      totalCount: count || 0,
    }
  } catch (error) {
    console.error('Error in fetchStaff:', error)
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
    const { from, to } = getPaginationRange(page, limit)
    const matchingUserIds = searchQuery ? await getMatchingUserIds(searchQuery) : []

    const clinicId = clinicFilter && clinicFilter !== 'all' ? parseInt(clinicFilter) : undefined

    const { data: dentistData, count, error } = await getDentistsList({
      matchingUserIds,
      searchQuery,
      clinicFilter: clinicId,
      from,
      to
    })

    if (error) {
      console.error('Database error in fetchDentists:', error)
      throw new Error(error.message)
    }

    const formattedDentists = formatDentists(dentistData || [])

    return {
      success: true,
      dentists: formattedDentists,
      totalCount: count || 0,
    }
  } catch (error) {
    console.error('Error in fetchDentists:', error)
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

    const updatePayload: PersonnelUpdatePayload = {
      first_name: data.firstName,
      last_name: data.lastName,
      clinic_id: data.clinicId,
    }

    if (type === 'dentists' && data.specialty) {
      updatePayload.specialty = data.specialty
    }

    const { error } = await updatePersonnelRecord(table, userId, updatePayload)

    if (error) throw new Error(error.message)

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('Error in updatePersonnel:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update personnel'
    }
  }
}
