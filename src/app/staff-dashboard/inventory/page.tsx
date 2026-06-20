import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import { fetchInventory } from '@/actions/inventoryActions'
import InventoryClient from '@/components/features/inventory/InventoryClient'


export const metadata = { title: 'Inventory — AppoinDent' }

export default async function InventoryPage() {
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
