// Tooth-number convention shared across charting, treatment history, and billing.
// Permanent teeth are stored as 1-32. Primary teeth A-T are stored as 101-120
// (charCode + 36, so A=65 -> 101 ... T=84 -> 120). Display reverses the mapping.

// Converts a raw tooth input (e.g. "26", "A", "m") to its stored numeric value.
// Returns null for empty or unrecognized input.
export function toothInputToNumber(raw: string): number | null {
  const value = raw.trim().toUpperCase()
  if (!value) return null

  if (/^[A-T]$/.test(value)) {
    return value.charCodeAt(0) + 36
  }

  if (/^\d+$/.test(value)) {
    const num = Number(value)
    if (num >= 1 && num <= 32) return num
  }

  return null
}

// Converts a stored tooth number back to its display label.
// 101-120 render as letters A-T; permanent teeth render as their number.
export function toothNumberToLabel(num: number | null): string {
  if (num == null) return '—'
  if (num >= 101 && num <= 120) return String.fromCharCode(num - 36)
  return num.toString()
}

// Shared single source of truth for services requiring a tooth number.
export const TOOTH_SPECIFIC_SERVICES = [
  'Tooth Filling',
  'Tooth Extraction',
  'Root Canal Therapy',
  'RCT',
  'Crown',
  'Bridge',
  'Veneer',
]

/**
 * Checks if a service name requires a tooth number (i.e. is tooth-specific).
 */
export function serviceRequiresToothNumber(serviceName: string | null | undefined): boolean {
  if (!serviceName) return false
  const lowerName = serviceName.toLowerCase()
  return TOOTH_SPECIFIC_SERVICES.some(s => lowerName.includes(s.toLowerCase()))
}

