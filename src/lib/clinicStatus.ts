/**
 * Utility: getEffectiveClinicStatus
 *
 * Resolves the real-time open/closed state of a clinic.
 *
 * - 'open'   → always Open  (manual override)
 * - 'closed' → always Closed (manual override)
 * - 'auto'   → derived from today's operating hours entry
 *
 * This function is intentionally pure (no DB calls) so it can be used
 * safely in both Server Components and Client Components. Pass the
 * already-fetched clinic + operating hours data from the page.
 */

export type ClinicEffectiveStatus = 'open' | 'closed'

export interface OperatingHourRow {
  day_of_week: number  // 0 = Sunday … 6 = Saturday (JS convention)
  open_time:   string  // 'HH:MM:SS'
  close_time:  string  // 'HH:MM:SS'
  is_closed:   boolean
}

/**
 * Convert a 'HH:MM:SS' or 'HH:MM' string to total minutes since midnight.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Returns the effective clinic status at a given moment.
 *
 * @param manualStatus    The `manual_status` value stored in the `clinics` table.
 * @param operatingHours  All rows from `clinic_operating_hours` for this clinic.
 * @param now             Optional – defaults to `new Date()` (useful for testing).
 */
export function getEffectiveClinicStatus(
  manualStatus: string | null | undefined,
  operatingHours: OperatingHourRow[],
  now: Date = new Date(),
): ClinicEffectiveStatus {
  // Manual overrides take priority
  if (manualStatus === 'open')   return 'open'
  if (manualStatus === 'closed') return 'closed'

  // Auto: derive from operating hours
  if (manualStatus === 'auto') {
    const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday

    const todayHours = operatingHours.find(h => h.day_of_week === dayOfWeek)

    // No hours defined for today → treat as closed
    if (!todayHours) return 'closed'

    // Explicitly marked as closed for today
    if (todayHours.is_closed) return 'closed'

    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const openMinutes    = timeToMinutes(todayHours.open_time)
    const closeMinutes   = timeToMinutes(todayHours.close_time)

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes
      ? 'open'
      : 'closed'
  }

  // Fallback – treat unknown values as closed
  return 'closed'
}

/**
 * Returns a human-readable label for a manual_status value.
 */
export function getStatusLabel(manualStatus: string | null | undefined): string {
  switch (manualStatus) {
    case 'open':   return 'Open'
    case 'closed': return 'Closed'
    case 'auto':   return 'Auto (Based on Hours)'
    default:       return 'Unknown'
  }
}
