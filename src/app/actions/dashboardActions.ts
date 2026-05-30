'use server'

import { supabaseAdmin } from '@/lib/supabaseServer'

export async function getSuperadminStats() {
  try {
    // We use Promise.all to fetch all 4 stats simultaneously for maximum speed
    const [
      { count: clinicCount },
      { count: staffCount },
      { count: dentistCount },
      { count: patientCount },
      { data: recentClinics }
    ] = await Promise.all([
      supabaseAdmin.from('clinics').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('clinic_staff').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('dentists').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('patients').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('clinics')
        .select('id, name, created_at, is_active')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    return {
      success: true,
      data: {
        totalClinics: clinicCount || 0,
        totalStaff: staffCount || 0,
        totalDentists: dentistCount || 0,
        totalPatients: patientCount || 0,
        recentClinics: recentClinics || []
      }
    }
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return { success: false, error: 'Failed to fetch dashboard stats' }
  }
}