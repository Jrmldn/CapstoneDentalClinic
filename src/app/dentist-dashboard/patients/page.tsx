import { enforceRole } from '@/lib/auth/protection'
import { getDentistRecordByUserId } from '@/services/dashboardService'
import { fetchPatientsByClinic } from '@/actions/patientActions'
import PatientsClient from '@/components/features/patients/PatientsClient'
import { AlertCircle } from 'lucide-react'

export const metadata = { title: 'Patients — Dentist Portal' }

export default async function PatientsPage() {
  const authUser = await enforceRole('dentist')

  // Get dentist's profile
  const { data: dentistRecord } = await getDentistRecordByUserId(authUser.id)

  if (!dentistRecord?.id || !dentistRecord?.clinic_id) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact an administrator.
      </div>
    )
  }

  const dentistId = dentistRecord.id
  const clinicId = dentistRecord.clinic_id

  // Fetch all patients for this clinic
  const patientsRes = await fetchPatientsByClinic(clinicId, '', true)
  const initialPatients = patientsRes.patients || []

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Patient Directory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Access patient dental charts, update treatment records, file assessments, or register new patients.
        </p>
      </div>

      <PatientsClient
        clinicId={clinicId}
        initialPatients={initialPatients}
        dentistId={dentistId}
        viewerRole="dentist"
      />
    </div>
  )
}
