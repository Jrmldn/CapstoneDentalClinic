'use server'

import { supabaseAdmin } from '@/lib/supabase/server'

export interface BranchDentist {
  id: number
  first_name: string
  last_name: string
  specialty: string | null
}

export interface BranchService {
  id: number
  name: string
  price: number
  slot_duration_min: number
}

export interface BranchSettings {
  default_downpayment_amount: number
}

/**
 * getBranchData — Loads the dentists, active services, and clinic settings
 * for a given branch (clinic_id). Called client-side after the patient
 * selects a branch in the booking flow.
 */
export async function getBranchData(clinicId: number): Promise<{
  success: boolean
  dentists: BranchDentist[]
  services: BranchService[]
  settings: BranchSettings
  error?: string
}> {
  try {
    const [dentistsRes, servicesRes, clinicRes] = await Promise.all([
      supabaseAdmin
        .from('dentists')
        .select('id, first_name, last_name, specialty')
        .eq('clinic_id', clinicId),
      supabaseAdmin
        .from('services')
        .select('id, name, price, slot_duration_min')
        .eq('clinic_id', clinicId)
        .eq('is_active', true),
      supabaseAdmin
        .from('clinics')
        .select('default_downpayment_amount')
        .eq('id', clinicId)
        .single(),
    ])

    if (dentistsRes.error) throw new Error(dentistsRes.error.message)
    if (servicesRes.error) throw new Error(servicesRes.error.message)

    return {
      success: true,
      dentists: (dentistsRes.data ?? []) as BranchDentist[],
      services: (servicesRes.data ?? []) as BranchService[],
      settings: {
        default_downpayment_amount: clinicRes.data?.default_downpayment_amount ?? 0,
      },
    }
  } catch (error) {
    console.error('[getBranchData]', error)
    return {
      success: false,
      dentists: [],
      services: [],
      settings: { default_downpayment_amount: 0 },
      error: error instanceof Error ? error.message : 'Failed to load branch data',
    }
  }
}
