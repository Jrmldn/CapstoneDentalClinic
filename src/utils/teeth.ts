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
