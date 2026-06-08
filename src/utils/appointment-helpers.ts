import { TimeSlot } from '@/actions/appointmentActions'

/**
 * Convert "HH:mm:ss" or "HH:mm" → minutes from midnight
 */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convert minutes → "HH:mm"
 */
export function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Generate slots for a day window, avoiding booked appointments and blocked periods.
 */
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  durationMins: number,
  bookedAppts: { scheduled_at: string; end_at: string }[],
  blockedSlots: { start_time: string; end_time: string }[]
): TimeSlot[] {
  const start = toMinutes(openTime)
  const end = toMinutes(closeTime)
  const slots: TimeSlot[] = []

  // Build blocked windows in minutes
  const blockedWindows = [
    ...bookedAppts.map(a => ({
      from: toMinutes(new Date(a.scheduled_at).toTimeString().slice(0, 5)),
      to:   toMinutes(new Date(a.end_at).toTimeString().slice(0, 5)),
    })),
    ...blockedSlots.map(b => ({
      from: toMinutes(b.start_time),
      to:   toMinutes(b.end_time),
    })),
  ]

  for (let cursor = start; cursor + durationMins <= end; cursor += durationMins) {
    const slotEnd = cursor + durationMins
    const overlaps = blockedWindows.some(w => cursor < w.to && slotEnd > w.from)

    slots.push({
      start: fromMinutes(cursor),
      end:   fromMinutes(slotEnd),
      available: !overlaps,
    })
  }

  return slots
}
