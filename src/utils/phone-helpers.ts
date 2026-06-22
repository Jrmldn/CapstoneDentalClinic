/**
 * Checks if a phone number is a UUID placeholder or is un-updated/empty.
 */
export function isPlaceholderPhone(phone: string | null | undefined): boolean {
  if (!phone || phone.trim() === '') {
    return true
  }
  
  // Check if it's a UUID (standard format: 8-4-4-4-12 hex chars)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(phone)) {
    return true
  }

  // Check if it starts with 'Update required' or similar placeholder
  if (phone.toLowerCase().startsWith('update required')) {
    return true
  }

  return false
}

/**
 * Returns 'Update Required' if the phone is a placeholder or not provided,
 * otherwise returns the phone number itself.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (isPlaceholderPhone(phone)) {
    return 'Update Required'
  }
  return phone as string
}
