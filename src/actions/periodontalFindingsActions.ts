'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole } from '@/lib/auth/ensureRole'

// TYPES

export interface PeriodontalFindingsData {
  patient_id: number
  clinic_id: number
  dentist_id: number
  appointment_id?: number | null
  dental_chart_id?: number | null
  gingivitis: string[]
  periodontal_condition: string[]
  occlusion: string[]
  appliances: string[]
}

// ADD PERIODONTAL FINDINGS

export async function addPeriodontalFindings(data: PeriodontalFindingsData) {
  const auth = await ensureRole('dentist', 'superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: finding, error } = await supabaseAdmin
      .from('periodontal_findings')
      .insert([{
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        dentist_id: data.dentist_id,
        appointment_id: data.appointment_id ?? null,
        dental_chart_id: data.dental_chart_id ?? null,
        gingivitis: data.gingivitis,
        periodontal_condition: data.periodontal_condition,
        occlusion: data.occlusion,
        appliances: data.appliances,
        recorded_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/dentist-dashboard/patients')
    return { success: true, finding }
  } catch (error) {
    console.error('Error in addPeriodontalFindings:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}
