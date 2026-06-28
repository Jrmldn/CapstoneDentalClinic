export const MANILA_TZ = 'Asia/Manila'
const LOCALE = 'en-US'

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value)
}

function isValid(d: Date): boolean {
  return !Number.isNaN(d.getTime())
}

export function toDateKey(value: Date | string | number = new Date()): string {
  const d = toDate(value)
  if (!isValid(d)) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function formatDate(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const d = toDate(value)
  if (!isValid(d)) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: MANILA_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const d = toDate(value)
  if (!isValid(d)) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: MANILA_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

export function formatTime(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const d = toDate(value)
  if (!isValid(d)) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: MANILA_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

export function formatDateLong(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const d = toDate(value)
  if (!isValid(d)) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: MANILA_TZ,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Format 24h time string (e.g. "13:30" or "13:30:00") to 12h AM/PM format (e.g. "1:30 PM")
 */
export function formatTo12h(time: string | null | undefined): string {
  if (!time) return '—'
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  if (isNaN(hour)) return time
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

