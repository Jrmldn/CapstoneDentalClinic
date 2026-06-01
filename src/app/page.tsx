import { createClient } from '@/lib/supabase/serverSSR'
import { PageShell } from './components/PageShell'
import { ClinicCard } from './components/ClinicCard'

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
}

export default async function Home() {
  const supabase = await createClient()

  const { data: clinics, error } = await supabase
    .from('clinics')
    .select('id, name, address, phone')
    .eq('is_active', true)

  const clinicsList: Clinic[] = clinics || []

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">landing page test</h1>
          <p className="text-lg text-gray-600">
            Find and book appointments at our dental clinics
          </p>
        </div>

        {/* Clinics Grid */}
        {clinicsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinicsList.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                id={clinic.id}
                name={clinic.name}
                address={clinic.address}
                phone={clinic.phone}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Clinics Available
              </h2>
              <p className="text-gray-600">
                We're setting up clinic information. Please check back soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
