import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/server'
import ProfileTabs from './_components/ProfileTabs'
import { enforceRole } from '@/lib/auth/protection'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClinicProfilePage({ params }: Props) {
  await enforceRole('superadmin')
  const { id } = await params
  const clinicId = parseInt(id, 10)

  if (isNaN(clinicId)) {
    redirect('/superadmin-dashboard/clinic')
  }

  // Fetch all profile data in parallel
  const [clinicRes, hoursRes, specialtiesRes, galleryRes, holidaysRes, dentistsRes] = await Promise.all([
    supabaseAdmin.from('clinics').select('*').eq('id', clinicId).single(),
    supabaseAdmin
      .from('clinic_operating_hours')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('day_of_week', { ascending: true }),
    supabaseAdmin.from('clinic_specialties').select('*').eq('clinic_id', clinicId),
    supabaseAdmin
      .from('clinic_gallery')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('sort_order', { ascending: true }),
    supabaseAdmin
      .from('clinic_holidays')
      .select('id, date, description, is_special_day')
      .eq('clinic_id', clinicId)
      .order('date', { ascending: true }),
    supabaseAdmin
      .from('dentists')
      .select('id, first_name, last_name')
      .eq('clinic_id', clinicId)
      .order('last_name', { ascending: true }),
  ])

  if (!clinicRes.data) {
    redirect('/superadmin-dashboard/clinic')
  }

  type DentistRow = { id: number; first_name: string; last_name: string }
  type BlockedSlotRow = { id: number; dentist_id: number; blocked_date: string; start_time: string | null; end_time: string | null; reason: string | null }
  type WorkingHourRow = { id: number; dentist_id: number; day_of_week: number; start_time: string; end_time: string }

  const dentists = (dentistsRes.data ?? []) as DentistRow[]
  const dentistIds = dentists.map(d => d.id)

  // Fetch blocked slots and working hours for all dentists in this clinic
  const [blockedSlotsRes, workingHoursRes] = await Promise.all(
    dentistIds.length > 0
      ? [
          supabaseAdmin
            .from('dentist_blocked_slots')
            .select('*')
            .in('dentist_id', dentistIds),
          supabaseAdmin
            .from('dentist_availability')
            .select('*')
            .in('dentist_id', dentistIds)
            .order('day_of_week', { ascending: true }),
        ]
      : [
          Promise.resolve({ data: [] as BlockedSlotRow[] }),
          Promise.resolve({ data: [] as WorkingHourRow[] }),
        ]
  )

  // Group by dentist_id
  const blockedSlotsMap: Record<number, BlockedSlotRow[]> = {}
  const workingHoursMap: Record<number, WorkingHourRow[]> = {}
  const allBlocked = (blockedSlotsRes.data ?? []) as BlockedSlotRow[]
  const allHours = (workingHoursRes.data ?? []) as WorkingHourRow[]
  for (const did of dentistIds) {
    blockedSlotsMap[did] = allBlocked.filter(s => s.dentist_id === did)
    workingHoursMap[did] = allHours.filter(h => h.dentist_id === did)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clinic Profile: {clinicRes.data.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage general information, operating hours, specialties, gallery, holidays, and dentist schedules.
        </p>
      </div>

      <ProfileTabs
        clinicId={clinicId}
        clinic={clinicRes.data}
        operatingHours={hoursRes.data ?? []}
        specialties={specialtiesRes.data ?? []}
        gallery={galleryRes.data ?? []}
        holidays={holidaysRes.data ?? []}
        dentists={dentists}
        blockedSlotsMap={blockedSlotsMap}
        workingHoursMap={workingHoursMap}
      />
    </div>
  )
}
