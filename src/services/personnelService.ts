import { supabaseAdmin } from '@/lib/supabase/server'
import { cache } from 'react'


/**
 * Searches for users matching email criteria and returns their IDs.
 */
export const getMatchingUserIds = cache(async (searchQuery: string): Promise<string[]> => {
  if (!searchQuery) return []

  const { data: matchingUsers } = await supabaseAdmin
    .from('users')
    .select('id')
    .ilike('email', `%${searchQuery}%`)

  return (matchingUsers as { id: string }[] | null)?.map(u => u.id) || []
})

/**
 * Invokes admin auth to create a user account.
 */
export async function createAuthUser(data: {
  email: string
  password?: string
  fullName: string
  role: 'staff' | 'dentist'
}) {
  return supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      role: data.role,
    },
  })
}

/**
 * Deletes a user account from auth management.
 */
export async function deleteAuthUser(userId: string) {
  return supabaseAdmin.auth.admin.deleteUser(userId)
}

/**
 * Inserts a record in clinic_staff.
 */
export async function insertStaff(data: {
  userId: string
  clinicId: number
  firstName: string
  lastName: string
}) {
  return supabaseAdmin
    .from('clinic_staff')
    .insert({
      user_id: data.userId,
      clinic_id: data.clinicId,
      first_name: data.firstName,
      last_name: data.lastName,
    })
}

/**
 * Inserts a record in dentists.
 */
export async function insertDentist(data: {
  userId: string
  clinicId: number
  firstName: string
  lastName: string
  specialty: string
}) {
  return supabaseAdmin
    .from('dentists')
    .insert({
      user_id: data.userId,
      clinic_id: data.clinicId,
      first_name: data.firstName,
      last_name: data.lastName,
      specialty: data.specialty,
    })
}

/**
 * Deletes user record by ID.
 */
export async function deleteUserRecord(userId: string) {
  return supabaseAdmin
    .from('users')
    .delete()
    .eq('id', userId)
}

/**
 * Fetches all staff from clinic_staff.
 */
export const getAllStaff = cache(async () => {
  return supabaseAdmin
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
})

/**
 * Fetches all dentists from dentists.
 */
export const getAllDentists = cache(async () => {
  return supabaseAdmin
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
})

/**
 * Handles filtered and paginated staff queries.
 */
export async function getStaffList(params: {
  matchingUserIds?: string[]
  searchQuery?: string
  clinicFilter?: number
  from: number
  to: number
}) {
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

  if (params.searchQuery) {
    if (params.matchingUserIds && params.matchingUserIds.length > 0) {
      query = query.or(
        `first_name.ilike.%${params.searchQuery}%,last_name.ilike.%${params.searchQuery}%,user_id.in.(${params.matchingUserIds.join(',')})`
      )
    } else {
      query = query.or(`first_name.ilike.%${params.searchQuery}%,last_name.ilike.%${params.searchQuery}%`)
    }
  }

  if (params.clinicFilter) {
    query = query.eq('clinic_id', params.clinicFilter)
  }

  return query.range(params.from, params.to)
}

/**
 * Handles filtered and paginated dentists queries.
 */
export async function getDentistsList(params: {
  matchingUserIds?: string[]
  searchQuery?: string
  clinicFilter?: number
  from: number
  to: number
}) {
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

  if (params.searchQuery) {
    if (params.matchingUserIds && params.matchingUserIds.length > 0) {
      query = query.or(
        `first_name.ilike.%${params.searchQuery}%,last_name.ilike.%${params.searchQuery}%,user_id.in.(${params.matchingUserIds.join(',')})`
      )
    } else {
      query = query.or(`first_name.ilike.%${params.searchQuery}%,last_name.ilike.%${params.searchQuery}%`)
    }
  }

  if (params.clinicFilter) {
    query = query.eq('clinic_id', params.clinicFilter)
  }

  return query.range(params.from, params.to)
}

/**
 * Updates personnel record in the database.
 */
export async function updatePersonnelRecord(
  table: 'clinic_staff' | 'dentists',
  userId: string,
  payload: {
    first_name: string
    last_name: string
    clinic_id: number
    specialty?: string
  }
) {
  return supabaseAdmin
    .from(table)
    .update(payload)
    .eq('user_id', userId)
}
