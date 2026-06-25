'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole } from '@/lib/auth/ensureRole'

// TYPES

export interface ToothConditionData {
  tooth_number: number
  tooth_type: string
  condition: string
  surface?: string
  notes?: string
}

// UPDATE DENTAL CHART (upsert tooth conditions)

export async function updateDentalChart(
  patientId: number,
  clinicId: number,
  dentistId: number,
  toothConditions: ToothConditionData[]
) {
  const auth = await ensureRole('dentist')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    let chartId: number

    const { data: existing } = await supabaseAdmin
      .from('dental_charts')
      .select('id')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .maybeSingle()

    if (existing) {
      chartId = existing.id
      await supabaseAdmin
        .from('dental_charts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chartId)
    } else {
      const { data: newChart, error: chartError } = await supabaseAdmin
        .from('dental_charts')
        .insert([{
          patient_id: patientId,
          clinic_id: clinicId,
          dentist_id: dentistId,
        }])
        .select()
        .single()

      if (chartError) throw new Error(chartError.message)
      chartId = newChart.id
    }

    const conditionsData = toothConditions.map(tc => ({
      dental_chart_id: chartId,
      tooth_number: tc.tooth_number,
      tooth_type: tc.tooth_type as 'permanent' | 'temporary',
      condition: tc.condition,
      surface: tc.surface ?? null,
      notes: tc.notes ?? null,
      recorded_at: new Date().toISOString(),
    }))

    const { data: conditions, error: condError } = await supabaseAdmin
      .from('tooth_conditions')
      .insert(conditionsData)
      .select()

    if (condError) throw new Error(condError.message)

    revalidatePath('/staff-dashboard/patients')
    return { success: true, chartId, conditions }
  } catch (error) {
    console.error('Error in updateDentalChart:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}
