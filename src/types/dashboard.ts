import { Clinic } from '@/types/clinic'

export interface SuperadminStats {
  totalClinics: number
  totalStaff: number
  totalDentists: number
  totalPatients: number
  recentClinics: Pick<Clinic, 'id' | 'name' | 'created_at' | 'is_active'>[]
}
