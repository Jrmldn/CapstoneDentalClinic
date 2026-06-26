import { enforceRole } from '@/lib/auth/protection'
import { getDentistRecordByUserId, getDentistDashboardData } from '@/services/dashboardService'
import { fetchServices } from '@/actions/serviceActions'
import DentistDashboardView, { Appointment } from '@/components/features/dashboard/DentistDashboardView'
import { DentistRawAppointment } from '@/components/features/dashboard/types'
import type { Service } from '@/components/features/billing/types'
import { normalizeRelation } from '@/lib/utils'
import { toDateKey } from '@/lib/date'
import { AlertCircle } from 'lucide-react'

export const metadata = { title: 'Dentist Portal — AppoinDent' }

export default async function DentistDashboardPage() {
  const authUser = await enforceRole('dentist')

  // Get dentist's profile
  const { data: dentistRecord } = await getDentistRecordByUserId(authUser.id)

  if (!dentistRecord?.id || !dentistRecord?.clinic_id) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh] bg-slate-50">
        <div className="text-center bg-white p-8 rounded-2xl border border-gray-150 shadow-sm max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-slate-900">Dentist Profile Missing</h2>
          <p className="text-xs text-gray-500 mt-1.5">
            Could not find your dentist profile or assigned clinic. Please check with your administrator.
          </p>
        </div>
      </div>
    )
  }

  const dentistId = dentistRecord.id
  const clinicId = dentistRecord.clinic_id
  const today = toDateKey()

  // Fetch dashboard data in parallel
  const [
    todayApptsRes,
    upcomingApptsRes,
    allApptsRes
  ] = await getDentistDashboardData(dentistId, clinicId, today)

  const todayApptsRaw = (todayApptsRes.data ?? []) as DentistRawAppointment[]
  const upcomingApptsRaw = (upcomingApptsRes.data ?? []) as DentistRawAppointment[]
  const allApptsRaw = (allApptsRes.data ?? []) as { patient_id: number }[]

  const todayAppts: Appointment[] = todayApptsRaw
    .map(appt => ({
      id: appt.id,
      scheduled_at: appt.scheduled_at,
      status: appt.status,
      payment_status: appt.payment_status,
      is_walk_in: appt.is_walk_in,
      downpayment: appt.downpayment,
      patients: normalizeRelation(appt.patients),
      services: normalizeRelation(appt.services),
    }))
    .filter(a => a.payment_status !== 'unpaid' || a.is_walk_in)

  const ACTIVE_STATUSES = ['pending', 'confirmed', 'rescheduled', 'follow_up', 'pending_patient_confirm']
  const upcomingAppts: Appointment[] = upcomingApptsRaw
    .map(appt => ({
      id: appt.id,
      scheduled_at: appt.scheduled_at,
      status: appt.status,
      payment_status: appt.payment_status,
      is_walk_in: appt.is_walk_in,
      downpayment: appt.downpayment,
      patients: normalizeRelation(appt.patients),
      services: normalizeRelation(appt.services),
    }))
    .filter(a => ACTIVE_STATUSES.includes(a.status) && (a.payment_status !== 'unpaid' || a.is_walk_in))

  // Calculate statistics
  const completedToday = todayAppts.filter(a => a.status === 'completed').length
  const pendingToday = todayAppts.filter(a => a.status === 'pending' || a.status === 'confirmed').length
  const totalToday = todayAppts.length

  // Unique patients count
  const uniquePatientIds = new Set(allApptsRaw.map(a => a.patient_id))
  const patientsCount = uniquePatientIds.size

  const stats = {
    total: totalToday,
    completed: completedToday,
    pending: pendingToday,
    patientsCount
  }

  const dentistName = `${dentistRecord.first_name} ${dentistRecord.last_name}`

  const servicesRes = await fetchServices(clinicId)
  const services = (servicesRes.services ?? []) as Service[]

  return (
    <DentistDashboardView
      dentistId={dentistId}
      dentistUserId={authUser.id}
      dentistName={dentistName}
      clinicId={clinicId}
      todayAppts={todayAppts}
      upcomingAppts={upcomingAppts}
      stats={stats}
      services={services}
    />
  )
}
