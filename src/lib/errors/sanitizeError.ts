// Messages safe to expose to clients even in production.
// These are user-actionable constraints, not internal implementation details.
const SAFE_MESSAGES = [
  'Insufficient permissions',
  'Access denied',
  'Not authenticated',
  'User record not found',
  'Reschedule',
  'within 1 hour',
  'too close',
  'You have already submitted feedback',
  'Appointment not found',
  'Patient not associated',
  'clinicId required',
  'already exists',
  'Reschedule limit',
]

/**
 * Returns a client-safe error string.
 * In development: returns the full message for debugging.
 * In production: returns the message only if it matches a known safe pattern;
 *   otherwise returns a generic fallback so stack traces never reach clients.
 */
export function sanitizeServerError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'

  if (process.env.NODE_ENV !== 'production') return message

  for (const safe of SAFE_MESSAGES) {
    if (message.includes(safe)) return message
  }

  return 'An unexpected error occurred'
}
