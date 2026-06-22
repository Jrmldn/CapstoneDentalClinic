'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'
import { revalidatePath } from 'next/cache'
import { ensureRole } from '@/lib/auth/ensureRole'
import { normalizeRelation } from '@/lib/utils'
import {
  getInventoryItemById,
  updateInventoryItemStock,
  insertInventoryLog,
  getInventoryItemsByClinic,
  insertInventoryItem,
  updateInventoryItemMeta,
  deleteInventoryItemById,
  getInventoryLogsByItemId,
  getStaffByUserIds,
  getDentistsByUserIds,
  getCategoriesByClinic,
  insertCategory,
  updateCategoryById,
  deleteCategoryById,
} from '@/services/inventoryService'
import {
  calculateNewQuantity,
  isStockLow,
  filterLowStockItems,
  formatInventoryLogs
} from '@/utils/inventory-helpers'
import type { InventoryItem, InventoryCategory } from '@/components/features/inventory/types'

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

export async function updateInventoryStock(
  itemId: number,
  delta: number,
  changedBy: string,
  reason: string
) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error }

    const { data: item, error: fetchError } = await getInventoryItemById(itemId)

    if (fetchError || !item) throw new Error('Inventory item not found')

    const newQty = calculateNewQuantity(Number(item.quantity), delta)

    if (newQty < 0) throw new Error('Insufficient stock — quantity cannot go below zero')

    const { error: updateError } = await updateInventoryItemStock(itemId, newQty, new Date().toISOString())

    if (updateError) throw new Error(updateError.message)

    const { error: logError } = await insertInventoryLog({
      item_id: itemId,
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
    return { success: false, error: sanitizeServerError(error) }
  }
}

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
    return { success: false, error: sanitizeServerError(error), alerts: [] }
  }
}

type InventoryItemRaw = {
  id: number
  name: string
  unit: string
  quantity: number
  alert_threshold: number
  category_id: number | null
  expiry_date: string | null
  updated_at: string | null
  created_at: string | null
  clinic_id: number
  inventory_categories: InventoryCategory | InventoryCategory[] | null
}

export async function fetchInventory(clinicId: number) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error, items: [] }

    const { data: items, error } = await getInventoryItemsByClinic(clinicId)

    if (error) throw new Error(error.message)

    const normalized = (items as unknown as InventoryItemRaw[]).map(item => ({
      ...item,
      inventory_categories: normalizeRelation(item.inventory_categories),
    })) as InventoryItem[]

    return { success: true, items: normalized }
  } catch (error) {
    console.error('Error in fetchInventory:', error)
    return { success: false, error: sanitizeServerError(error), items: [] }
  }
}

export async function addInventoryItem(
  clinicId: number,
  data: {
    name: string
    unit: string
    quantity: number
    alert_threshold: number
    category_id?: number | null
    expiry_date?: string | null
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
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function editInventoryItem(
  itemId: number,
  data: {
    name?: string
    unit?: string
    alert_threshold?: number
    category_id?: number | null
    expiry_date?: string | null
  }
) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error }

    const { error } = await updateInventoryItemMeta(itemId, data)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/inventory')
    return { success: true }
  } catch (error) {
    console.error('Error in editInventoryItem:', error)
    return { success: false, error: sanitizeServerError(error) }
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
    return { success: false, error: sanitizeServerError(error) }
  }
}

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
    (staffRes.data as { user_id: string; first_name: string; last_name: string }[] | null)?.forEach(s => {
      performerNameByUserId[s.user_id] = `${s.first_name} ${s.last_name}`
    });
    (dentistRes.data as { user_id: string; first_name: string; last_name: string }[] | null)?.forEach(d => {
      performerNameByUserId[d.user_id] = `${d.first_name} ${d.last_name}`
    })

    const formattedLogs = formatInventoryLogs(rawLogs, performerNameByUserId)

    return { success: true, logs: formattedLogs }
  } catch (error) {
    console.error('Error in fetchInventoryLogs:', error)
    return { success: false, error: sanitizeServerError(error), logs: [] }
  }
}

// CATEGORIES

export async function fetchCategories(clinicId: number) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error, categories: [] }

    const { data, error } = await getCategoriesByClinic(clinicId)

    if (error) throw new Error(error.message)

    return { success: true, categories: data ?? [] }
  } catch (error) {
    console.error('Error in fetchCategories:', error)
    return { success: false, error: sanitizeServerError(error), categories: [] }
  }
}

export async function addCategory(clinicId: number, name: string) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error }

    const { data, error } = await insertCategory(clinicId, name)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/inventory')
    return { success: true, category: data }
  } catch (error) {
    console.error('Error in addCategory:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function editCategory(id: number, name: string) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error }

    const { error } = await updateCategoryById(id, name)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/inventory')
    return { success: true }
  } catch (error) {
    console.error('Error in editCategory:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function removeCategory(id: number) {
  try {
    const auth = await ensureRole('staff')
    if (!auth.success) return { success: false, error: auth.error }

    const { error } = await deleteCategoryById(id)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/inventory')
    return { success: true }
  } catch (error) {
    console.error('Error in removeCategory:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}
