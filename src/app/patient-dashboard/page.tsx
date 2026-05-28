import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServerSSR'
import { handleLogout } from '@/app/actions/handleLogout' // 1. IMPORT YOUR ACTION HERE

interface PatientInfo {
  first_name: string
  last_name: string
  email: string
}

export default async function PatientDashboard() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: patientData } = await supabase
    .from('patients')
    .select('first_name, last_name')
    .eq('user_id', authUser.id)
    .single()

  const patient: PatientInfo = {
    first_name: patientData?.first_name ?? '',
    last_name: patientData?.last_name ?? '',
    email: authUser.email ?? '',
  }

  // 2. PRE-BIND THE REDIRECT TARGET PATH
  // This passes '/login' safely into the action's first parameter
  const logoutAction = handleLogout.bind(null, '/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">AppointDent</h1>
          
          {/* 3. USE THE BOUND ACTION */}
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