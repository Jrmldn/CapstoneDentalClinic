'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { Clinic } from '@/types/clinic'


export async function getClinics(): Promise<{ success: boolean; data: Pick<Clinic, 'id' | 'name'>[] }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('clinics')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Fetch clinics error:', error)
    return { success: false, data: [] }
  }
}
