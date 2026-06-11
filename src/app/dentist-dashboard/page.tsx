import { enforceRole } from '@/lib/auth/protection'
import { getDentistRecordByUserId, getDentistDashboardData } from '@/services/dashboardService'
import DentistDashboardView, { Appointment } from '@/components/features/dashboard/DentistDashboardView'
import { AlertCircle } from 'lucide-react'

export const metadata = { title: 'Dentist Portal — AppoinDent' }

interface RawAppointment {
  id: number
  scheduled_at: string
  status: string
  patients: { id: number; first_name: string; last_name: string; phone: string; birthdate: string; gender: string } | null
  services: { name: string } | null
}

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
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

  // Fetch dashboard data in parallel
  const [
    todayApptsRes,
    upcomingApptsRes,
    allApptsRes
  ] = await getDentistDashboardData(dentistId, clinicId, today)

  const todayApptsRaw = (todayApptsRes.data ?? []) as RawAppointment[]
  const upcomingApptsRaw = (upcomingApptsRes.data ?? []) as RawAppointment[]
  const allApptsRaw = (allApptsRes.data ?? []) as { patient_id: number }[]

  // Map to client format
  const todayAppts: Appointment[] = todayApptsRaw.map(appt => ({
    id: appt.id,
    scheduled_at: appt.scheduled_at,
    status: appt.status,
    patients: Array.isArray(appt.patients) ? appt.patients[0] : appt.patients,
    services: Array.isArray(appt.services) ? appt.services[0] : appt.services
  }))

  const upcomingAppts: Appointment[] = upcomingApptsRaw.map(appt => ({
    id: appt.id,
    scheduled_at: appt.scheduled_at,
    status: appt.status,
    patients: Array.isArray(appt.patients) ? appt.patients[0] : appt.patients,
    services: Array.isArray(appt.services) ? appt.services[0] : appt.services
  }))

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
  const specialty = dentistRecord.specialty

  return (
    <DentistDashboardView
      dentistId={dentistId}
      dentistUserId={authUser.id}
      dentistName={dentistName}
      specialty={specialty}
      clinicId={clinicId}
      todayAppts={todayAppts}
      upcomingAppts={upcomingAppts}
      stats={stats}
    />
  )
}
