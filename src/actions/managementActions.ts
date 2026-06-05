'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ═══════════════════════════════════════════════════════════════
// SECTION 1 — CALENDAR & HOLIDAYS
// ═══════════════════════════════════════════════════════════════

export interface HolidayData {
  date: string          // "YYYY-MM-DD"
  description: string
  is_special_day: boolean  // false = closed, true = special (open but notable)
}

/** Add or update a holiday / special day for a clinic */
export async function manageClinicHolidays(
  clinicId: number,
  action: 'add' | 'remove',
  holidayData?: HolidayData,
  holidayId?: number
) {
  try {
    if (action === 'remove' && holidayId) {
      const { error } = await supabaseAdmin
        .from('clinic_holidays')
        .delete()
        .eq('id', holidayId)
        .eq('clinic_id', clinicId)

      if (error) throw new Error(error.message)
    } else if (action === 'add' && holidayData) {
      const { error } = await supabaseAdmin
        .from('clinic_holidays')
        .upsert([{
          clinic_id:      clinicId,
          date:           holidayData.date,
          description:    holidayData.description,
          is_special_day: holidayData.is_special_day,
        }], { onConflict: 'clinic_id,date' })

      if (error) throw new Error(error.message)
    }

    revalidatePath('/staff-dashboard/calendar')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to manage holiday',
    }
  }
}

/** Fetch all holidays + appointments for a calendar month view */
export async function fetchCalendarData(
  clinicId: number,
  year: number,
  month: number    // 1-indexed
) {
  try {
    const monthStr   = String(month).padStart(2, '0')
    const firstDay   = `${year}-${monthStr}-01`
    const lastDay    = new Date(year, month, 0).toISOString().slice(0, 10)

    const [holidaysRes, appointmentsRes] = await Promise.all([
      supabaseAdmin
        .from('clinic_holidays')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('date', { ascending: true }),

      supabaseAdmin
        .from('appointments')
        .select(`
          id, scheduled_at, end_at, status,
          patients ( id, first_name, last_name ),
          services ( id, name )
        `)
        .eq('clinic_id', clinicId)
        .gte('scheduled_at', `${firstDay}T00:00:00`)
        .lte('scheduled_at', `${lastDay}T23:59:59`)
        .not('status', 'in', '(cancelled,no_show)')
        .order('scheduled_at', { ascending: true }),
    ])

    if (holidaysRes.error)     throw new Error(holidaysRes.error.message)
    if (appointmentsRes.error) throw new Error(appointmentsRes.error.message)

    return {
      success: true,
      holidays:     holidaysRes.data     ?? [],
      appointments: appointmentsRes.data ?? [],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch calendar data',
      holidays: [],
      appointments: [],
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2 — INVENTORY
// ═══════════════════════════════════════════════════════════════

/** Update (add/subtract) stock quantity for an inventory item */
export async function updateInventoryStock(
  itemId: number,
  delta: number,         // positive = restock, negative = usage/deduction
  changedBy: string,     // user UUID
  reason: string
) {
  try {
    // Get current quantity
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('inventory_items')
      .select('id, quantity, alert_threshold')
      .eq('id', itemId)
      .single()

    if (fetchError || !item) throw new Error('Inventory item not found')

    const newQty = parseFloat((Number(item.quantity) + delta).toFixed(4))

    if (newQty < 0) throw new Error('Insufficient stock — quantity cannot go below zero')

    // Update quantity
    const { error: updateError } = await supabaseAdmin
      .from('inventory_items')
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (updateError) throw new Error(updateError.message)

    // Log the change
    await supabaseAdmin.from('inventory_logs').insert([{
      item_id:    itemId,
      changed_by: changedBy,
      delta,
      reason,
    }])

    const isLow = newQty <= Number(item.alert_threshold)

    revalidatePath('/staff-dashboard/inventory')
    return { success: true, newQuantity: newQty, isLow }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update stock',
    }
  }
}

/** Fetch all items that are at or below their alert threshold */
export async function fetchStockAlerts(clinicId: number) {
  try {
    const { data: items, error } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('clinic_id', clinicId)
      // quantity <= alert_threshold  — Supabase filter via lte on a column
      // We use rpc or JS filter; here we fetch all and filter (simple approach)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    const lowStock = (items ?? []).filter(
      item => Number(item.quantity) <= Number(item.alert_threshold)
    )

    return { success: true, alerts: lowStock }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stock alerts',
      alerts: [],
    }
  }
}

/** Full inventory list for a clinic */
export async function fetchInventory(clinicId: number) {
  try {
    const { data: items, error } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    return { success: true, items: items ?? [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch inventory',
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
    const { data: item, error } = await supabaseAdmin
      .from('inventory_items')
      .insert([{
        clinic_id: clinicId,
        ...data
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/inventory')
    return { success: true, item }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add inventory item',
    }
  }
}

export async function deleteInventoryItem(itemId: number) {
  try {
    const { error } = await supabaseAdmin
      .from('inventory_items')
      .delete()
      .eq('id', itemId)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/inventory')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete inventory item',
    }
  }
}

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

/** Fetch change history for a single inventory item */
export async function fetchInventoryLogs(itemId: number) {
  try {
    const { data: logs, error } = await supabaseAdmin
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

    if (error) throw new Error(error.message)

    const rawLogs = (logs || []) as InventoryLogRaw[] // FIX: Replace any with explicit cast
    const userIds = [...new Set(rawLogs.map((l) => l.changed_by).filter(Boolean))] as string[] // FIX: Removed any
    
    const [staffRes, dentistRes] = await Promise.all([
      supabaseAdmin.from('clinic_staff').select('user_id, first_name, last_name').in('user_id', userIds),
      supabaseAdmin.from('dentists').select('user_id, first_name, last_name').in('user_id', userIds)
    ])

    const nameMap: Record<string, string> = {}
    staffRes.data?.forEach(s => {
      nameMap[s.user_id] = `${s.first_name} ${s.last_name}`
    })
    dentistRes.data?.forEach(d => {
      nameMap[d.user_id] = `${d.first_name} ${d.last_name}`
    })

    const formattedLogs: FormattedInventoryLog[] = rawLogs.map((l) => ({ // FIX: Removed any and added interface
      ...l,
      performer_name: nameMap[l.changed_by] || l.users?.email || 'Unknown User'
    }))

    return { success: true, logs: formattedLogs }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch inventory logs',
      logs: [],
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3 — NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

/** Manually retrigger a failed SMS or email notification */
export async function retriggerNotification(notificationId: number) {
  try {
    // Mark as 'pending' so the sending worker/edge-function picks it up again
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ status: 'pending', error_message: '' })
      .eq('id', notificationId)
      .eq('status', 'failed')            // only allow retrigger on failed ones
      .select()
      .single()

    if (error || !notification) {
      throw new Error('Notification not found or not in a failed state')
    }

    revalidatePath('/staff-dashboard/notifications')
    return { success: true, notification }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrigger notification',
    }
  }
}

/** Fetch all notifications for a clinic's appointments, filterable by status */
export async function fetchNotifications(
  clinicId: number,
  status?: 'pending' | 'sent' | 'failed'
) {
  try {
    // Get appointment IDs for this clinic
    const { data: apptIds } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('clinic_id', clinicId)

    const ids = apptIds?.map(a => a.id) ?? []
    if (ids.length === 0) return { success: true, notifications: [] }

    const baseQuery = supabaseAdmin
      .from('notifications')
      .select(`
        *,
        patients ( id, first_name, last_name, phone ),
        appointments ( id, scheduled_at )
      `)
      .in('appointment_id', ids)
      .order('created_at', { ascending: false })

    const { data: notifications, error } = status
      ? await baseQuery.eq('status', status)
      : await baseQuery
    if (error) throw new Error(error.message)

    return { success: true, notifications: notifications ?? [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch notifications',
      notifications: [],
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4 — REPORTS  (data layer — PDF rendering on frontend)
// ═══════════════════════════════════════════════════════════════

/** Sales & revenue summary for a date range */
export async function generateSalesReport(
  clinicId: number,
  from: string,   // "YYYY-MM-DD"
  to:   string
) {
  try {
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id, subtotal, discount_type, discount_amount,
        hmo_coverage, philhealth_coverage, total_amount,
        payment_method, payment_status, created_at,
        patients ( id, first_name, last_name ),
        transaction_items (
          id, description, quantity, unit_price, total_price,
          services ( id, name ),
          products ( id, name )
        )
      `)
      .eq('clinic_id', clinicId)
      .gte('created_at', `${from}T00:00:00`)
      .lte('created_at', `${to}T23:59:59`)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    const txList = transactions ?? []

    // Aggregate totals
    const totalRevenue    = txList.reduce((s, t) => s + Number(t.total_amount), 0)
    const totalSubtotal   = txList.reduce((s, t) => s + Number(t.subtotal), 0)
    const totalDiscounts  = txList.reduce((s, t) => s + Number(t.discount_amount), 0)
    const totalHmo        = txList.reduce((s, t) => s + Number(t.hmo_coverage), 0)
    const totalPhilHealth = txList.reduce((s, t) => s + Number(t.philhealth_coverage), 0)

    return {
      success: true,
      summary: {
        from,
        to,
        totalTransactions: txList.length,
        totalRevenue,
        totalSubtotal,
        totalDiscounts,
        totalHmo,
        totalPhilHealth,
      },
      transactions: txList,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate sales report',
    }
  }
}

/** Appointment summary: counts by status for a date range */
export async function generateAppointmentSummary(
  clinicId: number,
  from: string,
  to: string
) {
  try {
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id, status, scheduled_at, is_walk_in,
        services ( id, name ),
        patients ( id, first_name, last_name )
      `)
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', `${from}T00:00:00`)
      .lte('scheduled_at', `${to}T23:59:59`)
      .order('scheduled_at', { ascending: true })

    if (error) throw new Error(error.message)

    const apptList = appointments ?? []

    // Count by status
    const countByStatus = apptList.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1
      return acc
    }, {})

    const walkIns = apptList.filter(a => a.is_walk_in).length

    return {
      success: true,
      summary: {
        from,
        to,
        total:        apptList.length,
        walkIns,
        countByStatus,
      },
      appointments: apptList,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate appointment summary',
    }
  }
}

/** Service frequency: how often each service was booked in a date range */
export async function generateServiceFrequency(
  clinicId: number,
  from: string,
  to: string
) {
  try {
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('service_id, services ( id, name, price )')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', `${from}T00:00:00`)
      .lte('scheduled_at', `${to}T23:59:59`)
      .not('status', 'in', '(cancelled,no_show)')

    if (error) throw new Error(error.message)

    // Aggregate frequency per service
    const freq = new Map<number, { name: string; price: number; count: number }>()

    for (const appt of appointments ?? []) {
      // Supabase returns joined relations as an array — take the first element
      const rawSvc = appt.services
      const svc = Array.isArray(rawSvc) ? rawSvc[0] : rawSvc
      if (!svc) continue
      const existing = freq.get(svc.id)
      if (existing) {
        existing.count += 1
      } else {
        freq.set(svc.id, { name: svc.name, price: Number(svc.price), count: 1 })
      }
    }

    const serviceFrequency = Array.from(freq.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)   // most popular first

    return { success: true, from, to, serviceFrequency }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate service frequency report',
    }
  }
}
