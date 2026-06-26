'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { revalidatePath } from 'next/cache'
import { StaffData, DentistData } from '@/types/clinic'
import { ensureRole } from '@/lib/auth/ensureRole'

import { supabaseAdmin } from '@/lib/supabase/server'
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
  updatePersonnelRecord,
  generateRecoveryLink,
} from '@/services/personnelService'
import { sendEmail } from '@/lib/email/resend'
import { staffVerificationEmail } from '@/lib/email/templates'
import { logNotification } from '@/lib/notifications/logNotification'
import {
  getPaginationRange,
  formatStaff,
  formatDentists
} from '@/utils/personnel-helpers'

interface PersonnelUpdatePayload {
  first_name: string
  last_name: string
  clinic_id: number
}

export async function addStaff(data: StaffData) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
    const { data: linkData, error: linkError } = await generateRecoveryLink(data.email, `${siteUrl}/auth/callback`)

    if (linkError || !linkData?.properties?.hashed_token) {
      await deleteUserRecord(authData.user.id)
      await deleteAuthUser(authData.user.id)
      throw new Error('Failed to generate verification link.')
    }

    const callbackUrl = new URL(`${siteUrl}/auth/callback`)
    callbackUrl.searchParams.set('token_hash', linkData.properties.hashed_token)
    callbackUrl.searchParams.set('type', 'recovery')
    callbackUrl.searchParams.set('clinic', String(data.clinicId))
    callbackUrl.searchParams.set('next', '/update-password')

    const template = staffVerificationEmail(callbackUrl.toString(), `${data.firstName} ${data.lastName}`)
    const sent = await sendEmail({ to: data.email, ...template })

    await logNotification({
      triggerType: 'account_created',
      channel: 'email',
      status: sent.success ? 'sent' : 'failed',
      errorMessage: sent.error,
    })

    if (!sent.success) {
      await deleteUserRecord(authData.user.id)
      await deleteAuthUser(authData.user.id)
      throw new Error('Failed to send staff invitation email.')
    }

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('Error in addStaff:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function addDentist(data: DentistData) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

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
    })

    if (dentistError) {
      console.error('Dentist insert error:', dentistError)
      await deleteUserRecord(authData.user.id)
      await deleteAuthUser(authData.user.id)
      throw new Error(`Database error: ${dentistError.message}`)
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
    const { data: linkData, error: linkError } = await generateRecoveryLink(data.email, `${siteUrl}/auth/callback`)

    if (linkError || !linkData?.properties?.hashed_token) {
      await deleteUserRecord(authData.user.id)
      await deleteAuthUser(authData.user.id)
      throw new Error('Failed to generate verification link.')
    }

    const callbackUrl = new URL(`${siteUrl}/auth/callback`)
    callbackUrl.searchParams.set('token_hash', linkData.properties.hashed_token)
    callbackUrl.searchParams.set('type', 'recovery')
    callbackUrl.searchParams.set('clinic', String(data.clinicId))
    callbackUrl.searchParams.set('next', '/update-password')

    const template = staffVerificationEmail(callbackUrl.toString(), `${data.firstName} ${data.lastName}`)
    const sent = await sendEmail({ to: data.email, ...template })

    await logNotification({
      triggerType: 'account_created',
      channel: 'email',
      status: sent.success ? 'sent' : 'failed',
      errorMessage: sent.error,
    })

    if (!sent.success) {
      await deleteUserRecord(authData.user.id)
      await deleteAuthUser(authData.user.id)
      throw new Error('Failed to send dentist invitation email.')
    }

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('Error in addDentist:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function disableUserAccount(userId: string) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ is_disabled: true })
      .eq('id', userId)

    if (dbError) throw new Error(dbError.message)

    await supabaseAdmin.auth.admin.signOut(userId)

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('Error in disableUserAccount:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function enableUserAccount(userId: string) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ is_disabled: false })
      .eq('id', userId)

    if (dbError) throw new Error(dbError.message)

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('Error in enableUserAccount:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function fetchPersonnel() {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

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
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error, staff: [], totalCount: 0 }

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
      error: sanitizeServerError(error),
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
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error, dentists: [], totalCount: 0 }

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
      error: sanitizeServerError(error),
      dentists: [],
      totalCount: 0,
    }
  }
}

export async function updatePersonnel(
  userId: string,
  type: 'staff' | 'dentist',
  data: {
    firstName: string;
    lastName: string;
    clinicId: number;
  }
) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const table = type === 'staff' ? 'clinic_staff' : 'dentists'

    const updatePayload: PersonnelUpdatePayload = {
      first_name: data.firstName,
      last_name: data.lastName,
      clinic_id: data.clinicId,
    }

    const { error } = await updatePersonnelRecord(table, userId, updatePayload)

    if (error) throw new Error(error.message)

    revalidatePath('/superadmin-dashboard/personnel')
    return { success: true }
  } catch (error) {
    console.error('Error in updatePersonnel:', error)
    return {
      success: false,
      error: sanitizeServerError(error)
    }
  }
}

