import { createClient } from '@/lib/supabase/serverSSR'
import { enforceRole } from '@/lib/auth/protection'
import { fetchInventory } from '@/actions/managementActions'
import InventoryClient from '@/components/features/inventory/InventoryClient'


export const metadata = { title: 'Inventory — AppoinDent' }

export default async function InventoryPage() {
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

  const inventoryRes = await fetchInventory(clinicId)
  const initialItems = inventoryRes.items || []

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your clinic&apos;s supplies and stock levels.
          </p>
        </div>
      </div>

      <InventoryClient 
        clinicId={clinicId} 
        initialItems={initialItems} 
        userId={authUser.id}
      />
    </div>
  )
}
