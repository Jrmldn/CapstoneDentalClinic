export interface StaffDashboardStats {
  uniquePatients: number
  lowStockCount: number
  unpaidTotal: number
  confirmedToday: number
  pendingToday: number
  lowStockItems: Array<{ id: number; name: string; quantity: number; alert_threshold: number }>
}

/**
 * Computes aggregations, low stock levels, and counts for the staff dashboard.
 */
export function calculateStaffDashboardStats(
  todayAppts: Array<{ status: string }>,
  patientsAppts: Array<{ patient_id: number }>,
  allInventory: Array<{ id: number; name: string; quantity: number; alert_threshold: number }>,
  pendingTx: Array<{ total_amount: number }>
): StaffDashboardStats {
  const uniquePatients = new Set(patientsAppts.map((a) => a.patient_id)).size
  
  const lowStockItems = allInventory.filter(
    (item) => Number(item.quantity) <= Number(item.alert_threshold)
  )
  
  const unpaidTotal = pendingTx.reduce((sum, tx) => sum + Number(tx.total_amount), 0)
  
  const confirmedToday = todayAppts.filter((a) => a.status === 'confirmed').length
  const pendingToday = todayAppts.filter((a) => a.status === 'pending').length

  return {
    uniquePatients,
    lowStockCount: lowStockItems.length,
    unpaidTotal,
    confirmedToday,
    pendingToday,
    lowStockItems
  }
}
