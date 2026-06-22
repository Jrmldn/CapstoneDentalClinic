import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import { fetchInventory, fetchCategories } from '@/actions/inventoryActions'
import InventoryClient from '@/components/features/inventory/InventoryClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Inventory — AppoinDent' }

export default async function InventoryPage() {
  const authUser = await enforceRole('staff')

  const clinicId = await getStaffClinicId(authUser.id)
  if (!clinicId) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact a superadmin.
      </div>
    )
  }

  const [inventoryRes, categoriesRes] = await Promise.all([
    fetchInventory(clinicId),
    fetchCategories(clinicId),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track and manage your clinic&apos;s supplies and stock levels.
        </p>
      </div>

      <InventoryClient
        clinicId={clinicId}
        initialItems={inventoryRes.items || []}
        initialCategories={categoriesRes.categories || []}
        userId={authUser.id}
      />
    </div>
  )
}
