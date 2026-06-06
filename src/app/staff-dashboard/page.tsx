import { enforceRole } from '@/lib/auth/protection'
import {
  getStaffRecordByUserId,
  getStaffDashboardData
} from '@/services/dashboardService'
import { calculateStaffDashboardStats } from '@/utils/dashboard-helpers'
import StaffDashboardView, { Appointment } from '@/components/features/dashboard/StaffDashboardView'
import { AlertCircle } from 'lucide-react'

interface RawAppointment {
  id: number
  scheduled_at: string
  status: string
  patients: { first_name: string; last_name: string } | Array<{ first_name: string; last_name: string }> | null
  services: { name: string } | Array<{ name: string }> | null
}

export default async function StaffDashboardPage() {
  const authUser = await enforceRole('staff')

  // Get staff's clinic
  const { data: staffRecord } = await getStaffRecordByUserId(authUser.id)

  if (!staffRecord?.clinic_id) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-800">No Clinic Assigned</h2>
          <p className="text-sm text-gray-500 mt-1">Contact your administrator to be assigned to a clinic.</p>
        </div>
      </div>
    )
  }

  const clinicId = staffRecord.clinic_id
  const today = new Date().toISOString().slice(0, 10)

  // Fetch all dashboard data in parallel
  const [
    todayApptsRes,
    patientsRes,
    stockAlertRes,
    pendingTxRes,
  ] = await getStaffDashboardData(clinicId, today)

  const todayApptsRaw = (todayApptsRes.data ?? []) as RawAppointment[]
  const patientsAppts = patientsRes.data ?? []
  const allInventory = stockAlertRes.data ?? []
  const pendingTx = pendingTxRes.data ?? []

  // Map joined relations correctly whether they return as object or array
  const todayAppts: Appointment[] = todayApptsRaw.map((appt) => {
    const rawPatient = appt.patients
    const rawService = appt.services
    return {
      id: appt.id,
      scheduled_at: appt.scheduled_at,
      status: appt.status,
      patients: Array.isArray(rawPatient) ? rawPatient[0] : rawPatient,
      services: Array.isArray(rawService) ? rawService[0] : rawService,
    }
  })

  // Calculate statistics
  const stats = calculateStaffDashboardStats(todayAppts, patientsAppts, allInventory, pendingTx)

  return (
    <StaffDashboardView
      staffName={staffRecord.first_name}
      todayAppts={todayAppts}
      stats={stats}
    />
  )
}