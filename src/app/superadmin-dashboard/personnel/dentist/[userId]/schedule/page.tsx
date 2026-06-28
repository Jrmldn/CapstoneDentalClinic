import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { enforceRole } from '@/lib/auth/protection'
import DentistScheduleTab from '@/app/superadmin-dashboard/clinic/[id]/profile/_components/DentistScheduleTab'
import type { BlockedSlot } from '@/app/dentist-dashboard/availability/AvailabilityClient'

interface Props {
  params: Promise<{ userId: string }>
}

interface DentistRow {
  id: number
  first_name: string
  last_name: string
}

interface WorkingHourRow {
  id: number
  dentist_id: number
  day_of_week: number
  start_time: string
  end_time: string
}

export default async function DentistSchedulePage({ params }: Props) {
  await enforceRole('superadmin')
  const { userId } = await params

  const { data: dentistData } = await supabaseAdmin
    .from('dentists')
    .select('id, first_name, last_name')
    .eq('user_id', userId)
    .single()

  const dentist = dentistData as DentistRow | null

  if (!dentist) {
    redirect('/superadmin-dashboard/personnel')
  }

  const [blockedSlotsRes, workingHoursRes] = await Promise.all([
    supabaseAdmin
      .from('dentist_blocked_slots')
      .select('*')
      .eq('dentist_id', dentist.id),
    supabaseAdmin
      .from('dentist_availability')
      .select('*')
      .eq('dentist_id', dentist.id)
      .order('day_of_week', { ascending: true }),
  ])

  const blockedSlotsMap: Record<number, BlockedSlot[]> = {
    [dentist.id]: (blockedSlotsRes.data ?? []) as BlockedSlot[],
  }
  const workingHoursMap: Record<number, WorkingHourRow[]> = {
    [dentist.id]: (workingHoursRes.data ?? []) as WorkingHourRow[],
  }

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/superadmin-dashboard/personnel"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Personnel
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Dentist Schedule: {dentist.first_name} {dentist.last_name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage working hours and blocked dates for this dentist.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <DentistScheduleTab
          dentists={[dentist]}
          initialBlockedSlotsMap={blockedSlotsMap}
          initialWorkingHoursMap={workingHoursMap}
        />
      </div>
    </div>
  )
}
