'server only'

import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole, AppRole } from '@/lib/auth/ensureRole'

export type PatientAccessResult =
  | { allowed: true;  callerId: string; role: AppRole; callerClinicId?: number }
  | { allowed: false; reason: string }

async function getCallerClinicId(userId: string, role: 'staff' | 'dentist'): Promise<number | null> {
  const table = role === 'staff' ? 'clinic_staff' : 'dentists'
  const { data } = await supabaseAdmin
    .from(table)
    .select('clinic_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.clinic_id ?? null
}

/**
 * Validates that the currently authenticated caller is allowed to access
 * a specific patient's records.
 *
 * - patient    → must own the record (patients.user_id = caller)
 * - staff/dentist → caller's clinic must have an appointment with this patient
 * - superadmin → always allowed
 *
 * Cached per-request via React cache() to avoid N+1 DB calls.
 */
export const validatePatientAccess = cache(async (
  patientId: number
): Promise<PatientAccessResult> => {
  const auth = await ensureRole('patient', 'staff', 'dentist', 'superadmin')
  if (!auth.success) return { allowed: false, reason: auth.error }

  if (auth.role === 'superadmin') {
    return { allowed: true, callerId: auth.userId, role: auth.role }
  }

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

  // staff or dentist: derive clinic from caller identity, don't trust client input
  const callerClinicId = await getCallerClinicId(auth.userId, auth.role)
  if (!callerClinicId) return { allowed: false, reason: 'Caller clinic not found' }

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('patient_id', patientId)
    .eq('clinic_id', callerClinicId)
    .limit(1)
    .maybeSingle()

  if (!appt) return { allowed: false, reason: 'Patient not associated with your clinic' }

  return { allowed: true, callerId: auth.userId, role: auth.role, callerClinicId }
})
