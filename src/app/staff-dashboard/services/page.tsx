import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import { supabaseAdmin } from '@/lib/supabase/server'
import ProductsTable from '@/components/features/clinic-services/product/ProductsTable'



export const metadata = { title: 'Products — AppoinDent' }

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

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Products</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the retail products offered by your clinic.
        </p>
      </div>

      <ProductsTable
        clinicId={clinicId}
        initialProducts={products ?? []}
        viewerRole="staff"
      />
    </div>
  )
}
