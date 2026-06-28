import { formatTo12h as dateUtilityFormat } from '@/lib/date'

/**
 * Format 24h time string (e.g. "13:30") to 12h AM/PM format (e.g. "1:30 PM")
 */
export const formatTo12h = (time: string) => {
  return dateUtilityFormat(time)
}

