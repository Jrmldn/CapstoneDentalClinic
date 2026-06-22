'server only'

import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole, AppRole } from '@/lib/auth/ensureRole'

export type PatientAccessResult =
  | { allowed: true;  callerId: string; role: AppRole; callerClinicId?: number }
  | { allowed: false; reason: string }

/**
 * Validates that the currently authenticated caller is allowed to access
 * a specific patient's records.
 *
 * Access is role-based (practice-wide), not clinic-scoped — branches share one
 * patient base, so any staff/dentist/superadmin may access any patient.
 *
 * - patient    → must own the record (patients.user_id = caller)
 * - staff/dentist/superadmin → always allowed
 *
 * The clinic_patients junction is metadata only (origin branch / enrollment
 * history) and is intentionally NOT consulted here for access control.
 *
 * Cached per-request via React cache() to avoid N+1 DB calls.
 */
export const validatePatientAccess = cache(async (
  patientId: number
): Promise<PatientAccessResult> => {
  const auth = await ensureRole('patient', 'staff', 'dentist', 'superadmin')
  if (!auth.success) return { allowed: false, reason: auth.error }

  if (auth.role === 'patient') {
    const { data } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('user_id', auth.userId)
      .maybeSingle()
    if (!data) return { allowed: false, reason: 'Access denied' }
    return { allowed: true, callerId: auth.userId, role: auth.role }
  }

  // staff, dentist, superadmin: practice-wide access by role
  return { allowed: true, callerId: auth.userId, role: auth.role }
})
