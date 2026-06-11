import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import { fetchPatientsByClinic } from '@/actions/patientActions'
import PatientsClient from '@/components/features/patients/PatientsClient'

export const metadata = { title: 'Patients — AppoinDent' }

export default async function PatientsPage() {
  const authUser = await enforceRole('staff')

  // Resolve clinicId
  const clinicId = await getStaffClinicId(authUser.id)
  if (!clinicId) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact a superadmin.
      </div>
    )
  }

  // Fetch initial patients list
  const patientsRes = await fetchPatientsByClinic(clinicId, '', true)
  const initialPatients = patientsRes.patients || []

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Access patient medical histories, clinical records, treatment summaries, and register new patients.
          </p>
        </div>
      </div>

      <PatientsClient
        clinicId={clinicId}
        initialPatients={initialPatients}
        viewerRole="staff"
      />
    </div>
  )
}
