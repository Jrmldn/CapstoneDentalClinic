import { enforceRole } from '@/lib/auth/protection'
import {
  getStaffRecordByUserId,
  getStaffDashboardData
} from '@/services/dashboardService'
import { calculateStaffDashboardStats } from '@/utils/dashboard-helpers'
import StaffDashboardView, { Appointment } from '@/components/features/dashboard/StaffDashboardView'
import { StaffRawAppointment } from '@/components/features/dashboard/types'
import { normalizeRelation } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

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
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

  // Fetch all dashboard data in parallel
  const [
    todayApptsRes,
    patientsRes,
    stockAlertRes,
    pendingTxRes,
  ] = await getStaffDashboardData(clinicId, today)

  const todayApptsRaw = (todayApptsRes.data ?? []) as StaffRawAppointment[]
  const patientsAppts = patientsRes.data ?? []
  const allInventory = stockAlertRes.data ?? []
  const pendingTx = pendingTxRes.data ?? []

  const todayAppts: Appointment[] = todayApptsRaw.map((appt) => ({
    id: appt.id,
    scheduled_at: appt.scheduled_at,
    status: appt.status,
    patients: normalizeRelation(appt.patients),
    services: normalizeRelation(appt.services),
  }))

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