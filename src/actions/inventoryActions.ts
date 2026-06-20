'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { revalidatePath } from 'next/cache'
import { ensureRole } from '@/lib/auth/ensureRole'
import {
  getInventoryItemById,
  updateInventoryItemStock,
  insertInventoryLog,
  getInventoryItemsByClinic,
  insertInventoryItem,
  deleteInventoryItemById,
  getInventoryLogsByItemId,
  getStaffByUserIds,
  getDentistsByUserIds
} from '@/services/inventoryService'
import {
  calculateNewQuantity,
  isStockLow,
  filterLowStockItems,
  formatInventoryLogs
} from '@/utils/inventory-helpers'

// TYPES

interface InventoryLogRaw {
  id: number
  item_id: number
  changed_by: string
  delta: number
  reason: string
  created_at: string
  users?: {
    id: string
    email: string
    role: string
  }
}

export interface FormattedInventoryLog extends InventoryLogRaw {
  performer_name: string
}

// INVENTORY

/** Update (add/subtract) stock quantity for an inventory item */
export async function updateInventoryStock(
  itemId: number,
  delta: number,         // positive = restock, negative = usage/deduction
  changedBy: string,     // user UUID
  reason: string
) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error }

    // Get current quantity
    const { data: item, error: fetchError } = await getInventoryItemById(itemId)

    if (fetchError || !item) throw new Error('Inventory item not found')

    const newQty = calculateNewQuantity(Number(item.quantity), delta)

    if (newQty < 0) throw new Error('Insufficient stock — quantity cannot go below zero')

    // Update quantity
    const { error: updateError } = await updateInventoryItemStock(itemId, newQty, new Date().toISOString())

    if (updateError) throw new Error(updateError.message)

    // Log the change
    const { error: logError } = await insertInventoryLog({
      item_id:    itemId,
      changed_by: changedBy,
      delta,
      reason,
    })

    if (logError) throw new Error(logError.message)

    const isLow = isStockLow(newQty, Number(item.alert_threshold))

    revalidatePath('/staff-dashboard/inventory')
    return { success: true, newQuantity: newQty, isLow }
  } catch (error) {
    console.error('Error in updateInventoryStock:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

/** Fetch all items that are at or below their alert threshold */
export async function fetchStockAlerts(clinicId: number) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error, alerts: [] }

    const { data: items, error } = await getInventoryItemsByClinic(clinicId)

    if (error) throw new Error(error.message)

    const lowStock = filterLowStockItems(items ?? [])

    return { success: true, alerts: lowStock }
  } catch (error) {
    console.error('Error in fetchStockAlerts:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      alerts: [],
    }
  }
}

/** Full inventory list for a clinic */
export async function fetchInventory(clinicId: number) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error, items: [] }

    const { data: items, error } = await getInventoryItemsByClinic(clinicId)

    if (error) throw new Error(error.message)

    return { success: true, items: items ?? [] }
  } catch (error) {
    console.error('Error in fetchInventory:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      items: [],
    }
  }
}

export async function addInventoryItem(
  clinicId: number,
  data: {
    name: string
    unit: string
    quantity: number
    alert_threshold: number
  }
) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error }

    const { data: item, error } = await insertInventoryItem({
      clinic_id: clinicId,
      ...data
    })

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/inventory')
    return { success: true, item }
  } catch (error) {
    console.error('Error in addInventoryItem:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function deleteInventoryItem(itemId: number) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error }

    const { error } = await deleteInventoryItemById(itemId)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/inventory')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteInventoryItem:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

/** Fetch change history for a single inventory item */
export async function fetchInventoryLogs(itemId: number) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error, logs: [] }

    const { data: logs, error } = await getInventoryLogsByItemId(itemId)

    if (error) throw new Error(error.message)

    const rawLogs = (logs || []) as InventoryLogRaw[]
    const userIds = [...new Set(rawLogs.map((l) => l.changed_by).filter(Boolean))] as string[]

    const [staffRes, dentistRes] = await Promise.all([
      getStaffByUserIds(userIds),
      getDentistsByUserIds(userIds)
    ])

    const performerNameByUserId: Record<string, string> = {};
    (staffRes.data as { user_id: string; first_name: string; last_name: string }[] | null)?.forEach(staffMember => {
      performerNameByUserId[staffMember.user_id] = `${staffMember.first_name} ${staffMember.last_name}`
    });
    (dentistRes.data as { user_id: string; first_name: string; last_name: string }[] | null)?.forEach(dentistMember => {
      performerNameByUserId[dentistMember.user_id] = `${dentistMember.first_name} ${dentistMember.last_name}`
    });

    const formattedLogs = formatInventoryLogs(rawLogs, performerNameByUserId)

    return { success: true, logs: formattedLogs }
  } catch (error) {
    console.error('Error in fetchInventoryLogs:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      logs: [],
    }
  }
}
