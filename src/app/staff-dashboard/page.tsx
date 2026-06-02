import { redirect } from 'next/navigation'
import { handleLogout } from '@/actions/handleLogout'
import { createClient } from '@/lib/supabase/serverSSR' // <-- Import your existing setup!

export default async function StaffDashboardPage() {
  // 1. Just call your imported function. It handles the cookies for you!
  const supabase = await createClient() 

  // 2. Get the currently logged-in user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // 3. Look up which clinic this staff member is assigned to
  const { data: staffRecord } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single()

  let clinicName = "Your Clinic"

  // 4. If we found their clinic ID, fetch the actual name of the clinic
  if (staffRecord?.clinic_id) {
    const { data: clinicRecord } = await supabase
      .from('clinics')
      .select('name')
      .eq('id', staffRecord.clinic_id)
      .single()

    if (clinicRecord?.name) {
      clinicName = clinicRecord.name
    }
  }

  // 5. Package the server action
  const logoutAction = handleLogout.bind(null, '/login')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
        
        {/* Header */}
        <header className="mb-8 flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
            <p className="mt-1 text-gray-500">
              Welcome back! You are currently viewing: <span className="font-semibold text-indigo-600">{clinicName}</span>
            </p>
          </div>
          
          <form action={logoutAction}>
            <button 
              type="submit" 
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Sign Out
            </button>
          </form>
        </header>

        {/* Dashboard Content */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold">Today's Appointments</h2>
            <p className="text-sm text-gray-600">No upcoming appointments.</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold">Inventory Alerts</h2>
            <p className="text-sm text-gray-600">All stock levels are normal.</p>
          </div>
        </div>

      </div>
    </div>
  )
}