import { cache } from 'react'
import { createClient } from '@/lib/supabase/serverSSR'

export type AppRole = 'patient' | 'dentist' | 'staff' | 'superadmin'

export type EnsureRoleResult =
  | { success: true; userId: string; role: AppRole }
  | { success: false; error: string }

export const ensureRole = cache(async (...roles: AppRole[]): Promise<EnsureRoleResult> => {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (dbError || !userData) {
    return { success: false, error: 'User record not found' }
  }

  if (!roles.includes(userData.role as AppRole)) {
    return { success: false, error: 'Insufficient permissions' }
  }

  return { success: true, userId: user.id, role: userData.role as AppRole }
})
