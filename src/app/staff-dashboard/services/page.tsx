import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import { supabaseAdmin } from '@/lib/supabase/server'
import ServicesTabs from '@/components/features/clinic-services/ServicesTabs'



export const metadata = { title: 'Services & Products — AppoinDent' }

export default async function ServicesPage() {
  const authUser = await enforceRole('staff')

  // Resolve clinic_id
  const clinicId = await getStaffClinicId(authUser.id)
  if (!clinicId) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact a superadmin.
      </div>
    )
  }

  // Parallel fetch
  const [servicesRes, productsRes] = await Promise.all([
    supabaseAdmin
      .from('services')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabaseAdmin
      .from('products')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ])

  const services = servicesRes.data ?? []
  const products = productsRes.data ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Services &amp; Products</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the dental services and retail products offered by your clinic.
        </p>
      </div>

      <ServicesTabs
        clinicId={clinicId}
        initialServices={services}
        initialProducts={products}
      />
    </div>
  )
}
