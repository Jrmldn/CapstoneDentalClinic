import { createClient } from '@/lib/supabase/serverSSR'
import { handleLogout } from '@/actions/handleLogout'
import { enforceRole } from '@/lib/auth/protection'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

interface PatientInfo {
  first_name: string
  last_name: string
  email: string
}

async function verifyPatient(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: patientData, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (patientError || !patientData) {
    redirect('/')
  }

  return patientData
}

async function fetchClinicName(supabase: Awaited<ReturnType<typeof createClient>>, clinicId: string) {
  const { data: clinicData, error: clinicError } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', clinicId)
    .maybeSingle()

  if (clinicError || !clinicData) {
    return null
  }

  return clinicData.name
}

function verifyClinicAccess(cookieClinicId: string | undefined, urlClinicId: string | string[] | undefined) {
  if (!cookieClinicId) {
    redirect('/')
  }

  if (!urlClinicId) {
    redirect('/')
  }

  const urlClinicIdString = Array.isArray(urlClinicId) ? urlClinicId[0] : urlClinicId

  if (cookieClinicId !== urlClinicIdString) {
    redirect('/')
  }

  return cookieClinicId
}

export default async function PatientDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  // 1. One line secures the whole page and gives you the valid user object
  const authUser = await enforceRole('patient')

  // 2. Get clinic ID from cookie and URL
  const cookieStore = await cookies()
  const cookieClinicId = cookieStore.get('clinic_id')?.value

  const resolvedSearchParams = await searchParams
  const urlClinicId = resolvedSearchParams.clinic

  // 3. Verify clinic access (cookie must match URL)
  const clinicId = verifyClinicAccess(cookieClinicId, urlClinicId)

  const supabase = await createClient()

  // 4. Verify patient exists
  await verifyPatient(supabase, authUser.id)

  // 5. Fetch clinic name
  const clinicName = await fetchClinicName(supabase, clinicId)

  // 6. Fetch the UI display data
  const { data: patientData } = await supabase
    .from('patients')
    .select('first_name, last_name')
    .eq('user_id', authUser.id)
    .maybeSingle()

  const patient: PatientInfo = {
    first_name: patientData?.first_name ?? '',
    last_name: patientData?.last_name ?? '',
    email: authUser.email ?? '',
  }

  const logoutAction = handleLogout.bind(null, '/')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AppointDent</h1>
            {clinicName && <p className="text-sm text-gray-600 mt-1">You are viewing: {clinicName}</p>}
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 transition"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Welcome,{' '}
            {patient.first_name
              ? `${patient.first_name} ${patient.last_name}`
              : patient.email}
            !
          </h2>
          <p className="text-gray-600 mt-2">{patient.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Schedule Appointment</h3>
            <p className="text-gray-600 text-sm mt-2">Book your next dental appointment</p>
            <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
              Schedule
            </button>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">View Appointments</h3>
            <p className="text-gray-600 text-sm mt-2">Check your upcoming appointments</p>
            <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
              View
            </button>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Update Profile</h3>
            <p className="text-gray-600 text-sm mt-2">Update your personal information</p>
            <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
              Update
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}