import { cache } from 'react'
import { createClient } from '@/lib/supabase/serverSSR'

export const getStaffClinicId = cache(async (userId: string): Promise<number | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.clinic_id ?? null
})
