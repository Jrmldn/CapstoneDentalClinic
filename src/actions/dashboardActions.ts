'use server'

import { getSuperadminDashboardStatsData } from '@/services/dashboardService'

export async function getSuperadminStats() {
  try {
    const [
      clinicsRes,
      staffRes,
      dentistsRes,
      patientsRes,
      recentClinicsRes
    ] = await getSuperadminDashboardStatsData()

    if (recentClinicsRes.error) throw new Error(recentClinicsRes.error.message)

    return {
      success: true,
      data: {
        totalClinics: clinicsRes.count || 0,
        totalStaff: staffRes.count || 0,
        totalDentists: dentistsRes.count || 0,
        totalPatients: patientsRes.count || 0,
        recentClinics: recentClinicsRes.data || []
      }
    }
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return { success: false, error: 'Failed to fetch dashboard stats' }
  }
}
