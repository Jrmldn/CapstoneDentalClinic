/**
 * Computes the new quantity, limited to 4 decimal places.
 */
export function calculateNewQuantity(currentQty: number, delta: number): number {
  return parseFloat((currentQty + delta).toFixed(4))
}

/**
 * Checks if current quantity is at or below the alert threshold.
 */
export function isStockLow(quantity: number, alertThreshold: number): boolean {
  return quantity <= alertThreshold
}

/**
 * Filters inventory items to find those at or below their alert thresholds.
 */
export function filterLowStockItems<
  T extends { quantity: number | string; alert_threshold: number | string }
>(items: T[]): T[] {
  return items.filter(item => isStockLow(Number(item.quantity), Number(item.alert_threshold)))
}

/**
 * Formats raw inventory logs with the name of the user who performed the action.
 */
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
