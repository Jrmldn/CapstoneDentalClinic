import { createClient } from '@/lib/supabase/serverSSR'
import { enforceRole } from '@/lib/auth/protection'
import { fetchPatientsByClinic } from '@/actions/patientActions'
import PatientsClient from '@/components/features/patients/PatientsClient'

export const metadata = { title: 'Patients — AppoinDent' }

export default async function PatientsPage() {
  const authUser = await enforceRole('staff')
  const supabase = await createClient()

  // Resolve clinic_id
  const { data: staffRecord } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', authUser.id)
    .maybeSingle()

  const clinicId = staffRecord?.clinic_id as number | undefined
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
      />
    </div>
  )
}
