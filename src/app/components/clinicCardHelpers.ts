/**
 * Format 24h time string (e.g. "13:30") to 12h AM/PM format (e.g. "1:30 PM")
 */
export const formatTo12h = (time: string) => {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}
