import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Fetches an inventory item by its ID.
 */
export async function getInventoryItemById(itemId: number) {
  return supabaseAdmin
    .from('inventory_items')
    .select('id, quantity, alert_threshold')
    .eq('id', itemId)
    .single()
}

/**
 * Updates stock quantity and updated_at timestamp for a specific inventory item.
 */
export async function updateInventoryItemStock(itemId: number, quantity: number, updatedAt: string) {
  return supabaseAdmin
    .from('inventory_items')
    .update({ quantity, updated_at: updatedAt })
    .eq('id', itemId)
}

/**
 * Inserts a log entry documenting stock changes.
 */
export async function insertInventoryLog(logData: {
  item_id: number
  changed_by: string
  delta: number
  reason: string
}) {
  return supabaseAdmin
    .from('inventory_logs')
    .insert([logData])
}

/**
 * Fetches all inventory items for a specific clinic.
 */
export async function getInventoryItemsByClinic(clinicId: number) {
  return supabaseAdmin
    .from('inventory_items')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('name', { ascending: true })
}

/**
 * Inserts a new inventory item.
 */
export async function insertInventoryItem(insertData: {
  clinic_id: number
  name: string
  unit: string
  quantity: number
  alert_threshold: number
}) {
  return supabaseAdmin
    .from('inventory_items')
    .insert([insertData])
    .select()
    .single()
}

/**
 * Deletes an inventory item.
 */
export async function deleteInventoryItemById(itemId: number) {
  return supabaseAdmin
    .from('inventory_items')
    .delete()
    .eq('id', itemId)
}

/**
 * Fetches change history for a single inventory item along with user profile information.
 */
export async function getInventoryLogsByItemId(itemId: number) {
  return supabaseAdmin
    .from('inventory_logs')
    .select(`
      *,
      users (
        id,
        email,
        role
      )
    `)
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
}

/**
 * Fetches name info for clinic staff from a list of user IDs.
 */
export async function getStaffByUserIds(userIds: string[]) {
  return supabaseAdmin
    .from('clinic_staff')
    .select('user_id, first_name, last_name')
    .in('user_id', userIds)
}

/**
 * Fetches name info for dentists from a list of user IDs.
 */
export async function getDentistsByUserIds(userIds: string[]) {
  return supabaseAdmin
    .from('dentists')
    .select('user_id, first_name, last_name')
    .in('user_id', userIds)
}
