'use server'

import { supabaseAdmin } from '@/lib/supabase/server'

type Role = 'patient' | 'staff' | 'dentist' | 'superadmin'

/**
 * logLogin — Records a successful login event in login_logs.
 * Uses the service-role client so RLS does not block the insert.
 * Call this after a confirmed authenticated session is established.
 */
export async function logLogin(userId: string, email: string, role: Role): Promise<void> {
  const { error } = await supabaseAdmin
    .from('login_logs')
    .insert({ user_id: userId, email, role })

  if (error) {
    // Non-fatal: log failure to console but do not block the user's login flow
    console.error('[logLogin] Failed to write login audit record:', error.message)
  }
}
