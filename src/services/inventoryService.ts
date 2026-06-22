import { supabaseAdmin } from '@/lib/supabase/server'
import { cache } from 'react'

export const getInventoryItemById = cache(async (itemId: number) => {
  return supabaseAdmin
    .from('inventory_items')
    .select('id, quantity, alert_threshold')
    .eq('id', itemId)
    .single()
})

export async function updateInventoryItemStock(itemId: number, quantity: number, updatedAt: string) {
  return supabaseAdmin
    .from('inventory_items')
    .update({ quantity, updated_at: updatedAt })
    .eq('id', itemId)
}

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

export const getInventoryItemsByClinic = cache(async (clinicId: number) => {
  return supabaseAdmin
    .from('inventory_items')
    .select('*, inventory_categories ( id, name )')
    .eq('clinic_id', clinicId)
    .order('name', { ascending: true })
})

export async function insertInventoryItem(insertData: {
  clinic_id: number
  name: string
  unit: string
  quantity: number
  alert_threshold: number
  category_id?: number | null
  expiry_date?: string | null
}) {
  return supabaseAdmin
    .from('inventory_items')
    .insert([insertData])
    .select()
    .single()
}

export async function updateInventoryItemMeta(itemId: number, data: {
  name?: string
  unit?: string
  alert_threshold?: number
  category_id?: number | null
  expiry_date?: string | null
}) {
  return supabaseAdmin
    .from('inventory_items')
    .update(data)
    .eq('id', itemId)
}

export async function deleteInventoryItemById(itemId: number) {
  return supabaseAdmin
    .from('inventory_items')
    .delete()
    .eq('id', itemId)
}

export const getInventoryLogsByItemId = cache(async (itemId: number) => {
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
})

export async function getStaffByUserIds(userIds: string[]) {
  return supabaseAdmin
    .from('clinic_staff')
    .select('user_id, first_name, last_name')
    .in('user_id', userIds)
}

export async function getDentistsByUserIds(userIds: string[]) {
  return supabaseAdmin
    .from('dentists')
    .select('user_id, first_name, last_name')
    .in('user_id', userIds)
}

export const getCategoriesByClinic = cache(async (clinicId: number) => {
  return supabaseAdmin
    .from('inventory_categories')
    .select('id, name')
    .eq('clinic_id', clinicId)
    .order('name', { ascending: true })
})

export async function insertCategory(clinicId: number, name: string) {
  return supabaseAdmin
    .from('inventory_categories')
    .insert([{ clinic_id: clinicId, name }])
    .select()
    .single()
}

export async function updateCategoryById(id: number, name: string) {
  return supabaseAdmin
    .from('inventory_categories')
    .update({ name })
    .eq('id', id)
}

export async function deleteCategoryById(id: number) {
  return supabaseAdmin
    .from('inventory_categories')
    .delete()
    .eq('id', id)
}
