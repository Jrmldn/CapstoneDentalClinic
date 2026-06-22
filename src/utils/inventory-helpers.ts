import type { InventoryItem, InventoryStatus } from '@/components/features/inventory/types'

export const EXPIRY_SOON_DAYS = 30

export function calculateNewQuantity(currentQty: number, delta: number): number {
  return parseFloat((currentQty + delta).toFixed(4))
}

export function isStockLow(quantity: number, alertThreshold: number): boolean {
  return quantity > 0 && quantity <= alertThreshold
}

export function filterLowStockItems<
  T extends { quantity: number | string; alert_threshold: number | string }
>(items: T[]): T[] {
  return items.filter(item => isStockLow(Number(item.quantity), Number(item.alert_threshold)))
}

export function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date(new Date().toDateString())
}

export function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const today = new Date(new Date().toDateString())
  const threshold = new Date(today)
  threshold.setDate(threshold.getDate() + EXPIRY_SOON_DAYS)
  return expiry >= today && expiry <= threshold
}

// Returns all statuses that apply to an item (can be multiple, e.g. expired + low_stock)
export function getInventoryStatuses(item: Pick<InventoryItem, 'quantity' | 'alert_threshold' | 'expiry_date'>): InventoryStatus[] {
  const statuses: InventoryStatus[] = []
  if (isExpired(item.expiry_date)) statuses.push('expired')
  if (isExpiringSoon(item.expiry_date)) statuses.push('expiring_soon')
  if (Number(item.quantity) === 0) statuses.push('out_of_stock')
  else if (isStockLow(Number(item.quantity), Number(item.alert_threshold))) statuses.push('low_stock')
  if (statuses.length === 0) statuses.push('normal')
  return statuses
}

// Single highest-priority status (used for row tinting)
export function getInventoryStatus(item: Pick<InventoryItem, 'quantity' | 'alert_threshold' | 'expiry_date'>): InventoryStatus {
  return getInventoryStatuses(item)[0]
}

export interface InventorySummary {
  expired: number
  expiringSoon: number
  outOfStock: number
  lowStock: number
  normal: number
}

export function summarizeInventory(items: InventoryItem[]): InventorySummary {
  const summary: InventorySummary = { expired: 0, expiringSoon: 0, outOfStock: 0, lowStock: 0, normal: 0 }
  for (const item of items) {
    const statuses = getInventoryStatuses(item)
    if (statuses.includes('expired')) summary.expired++
    if (statuses.includes('expiring_soon')) summary.expiringSoon++
    if (statuses.includes('out_of_stock')) summary.outOfStock++
    if (statuses.includes('low_stock')) summary.lowStock++
    if (statuses.includes('normal')) summary.normal++
  }
  return summary
}

export function formatInventoryLogs<
  T extends { changed_by: string; users?: { email: string } | null }
>(
  rawLogs: T[],
  nameMap: Record<string, string>
): Array<T & { performer_name: string }> {
  return rawLogs.map((log) => ({
    ...log,
    performer_name: nameMap[log.changed_by] || log.users?.email || 'Unknown User'
  }))
}
