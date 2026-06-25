import { FormattedStaff, FormattedDentist } from '@/types/clinic'

interface RawStaffItem {
  id: number
  user_id: string
  clinic_id: number
  first_name: string
  last_name: string
  users: { email: string; is_disabled: boolean } | { email: string; is_disabled: boolean }[] | null
  clinics: { name: string } | { name: string }[] | null
}

interface RawDentistItem extends RawStaffItem {
  specialty?: string
}

/**
 * Standardizes offset range computation for pagination.
 */
export function getPaginationRange(page: number, limit: number): { from: number; to: number } {
  const from = (page - 1) * limit
  const to = from + limit - 1
  return { from, to }
}

/**
 * Formats database staff lists to FormattedStaff[].
 */
export function formatStaff(staffList: RawStaffItem[]): FormattedStaff[] {
  return staffList.map((staff) => {
    const userRelation = Array.isArray(staff.users) ? staff.users[0] : staff.users
    const clinicRelation = Array.isArray(staff.clinics) ? staff.clinics[0] : staff.clinics
    return {
      id: staff.id,
      userId: staff.user_id,
      clinicId: staff.clinic_id,
      firstName: staff.first_name,
      lastName: staff.last_name,
      email: userRelation?.email || 'No email',
      clinicName: clinicRelation?.name || 'Unassigned',
      isDisabled: userRelation?.is_disabled ?? false,
    }
  })
}

/**
 * Formats database dentists lists to FormattedDentist[].
 */
export function formatDentists(dentistsList: RawDentistItem[]): FormattedDentist[] {
  return dentistsList.map((dentist) => {
    const userRelation = Array.isArray(dentist.users) ? dentist.users[0] : dentist.users
    const clinicRelation = Array.isArray(dentist.clinics) ? dentist.clinics[0] : dentist.clinics
    return {
      id: dentist.id,
      userId: dentist.user_id,
      clinicId: dentist.clinic_id,
      firstName: dentist.first_name,
      lastName: dentist.last_name,
      specialty: dentist.specialty || '',
      email: userRelation?.email || 'No email',
      clinicName: clinicRelation?.name || 'Unassigned',
      isDisabled: userRelation?.is_disabled ?? false,
    }
  })
}
