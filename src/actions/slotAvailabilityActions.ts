'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import {
  getClinicHoliday,
  getClinicOperatingHours,
  getDentistAvailability,
  getDentistBlockedSlots,
  getServiceById,
  getActiveAppointmentsForSlots,
  getClinicCapacity,
} from '@/services/appointmentService'
import { generateTimeSlots } from '@/utils/appointment-helpers'
import { toDateKey } from '@/lib/date'

// TYPES

export interface TimeSlot {
  start: string   // "HH:mm"
  end: string     // "HH:mm"
  available: boolean
}

// GET AVAILABLE SLOTS

const DEFAULT_SLOT_DURATION_MIN = 60

export async function getAvailableSlots(
  clinicId: number,
  dentistId: number,
  serviceId: number | null,
  date: string   // "YYYY-MM-DD"
): Promise<{ success: boolean; slots?: TimeSlot[]; error?: string }> {
  try {
    const dayOfWeek = new Date(date).getDay() // 0=Sun … 6=Sat
    const dayStart = `${date}T00:00:00`
    const dayEnd   = `${date}T23:59:59`

    // Run all database fetches in parallel (Class A Optimization)
    const [
      holidayRes,
      opHoursRes,
      dentistHoursRes,
      blockedSlotsRes,
      serviceRes,
      existingApptsRes,
      clinicRes,
    ] = await Promise.all([
      getClinicHoliday(clinicId, date),
      getClinicOperatingHours(clinicId, dayOfWeek),
      getDentistAvailability(dentistId, dayOfWeek),
      getDentistBlockedSlots(dentistId, date),
      serviceId != null ? getServiceById(serviceId) : Promise.resolve({ data: null, error: null }),
      getActiveAppointmentsForSlots(clinicId, dentistId, dayStart, dayEnd),
      getClinicCapacity(clinicId),
    ])

    const holiday = holidayRes.data
    const opHours = opHoursRes.data
    const opError = opHoursRes.error
    const dentistHours = dentistHoursRes.data
    const blockedSlots = blockedSlotsRes.data
    const service = serviceRes.data
    const serviceError = serviceRes.error
    const existingAppts = existingApptsRes.data
    const clinic = clinicRes.data

    // 1. Check for clinic holiday / closure
    if (holiday && !holiday.is_special_day) {
      return { success: true, slots: [] } // clinic is closed that day
    }

    // 2. Clinic operating hours for the weekday
    if (opError) throw new Error(opError.message)
    if (!opHours || opHours.is_closed) return { success: true, slots: [] }

    // 3. Dentist availability for the weekday
    // Use dentist hours if defined, otherwise fall back to clinic hours
    const windowStart = dentistHours?.start_time ?? opHours.open_time
    const windowEnd   = dentistHours?.end_time   ?? opHours.close_time

    // 4. Dentist blocked slots for that specific date (already fetched)

    // 5. Service duration — fall back to default when no service is selected
    if (serviceId != null && (serviceError || !service)) throw new Error('Service not found')
    const duration = service?.slot_duration_min ?? DEFAULT_SLOT_DURATION_MIN

    // 6. Existing appointments for that dentist on that date (not cancelled/no-show) (already fetched)

    // 7. Check max appointments per day
    const maxPerDay = clinic?.max_appointments_per_day ?? Infinity
    const bookedCount = existingAppts?.length ?? 0

    if (bookedCount >= maxPerDay) return { success: true, slots: [] }

    // 8. Generate slots using helpers
    let slots = generateTimeSlots(
      windowStart,
      windowEnd,
      duration,
      existingAppts ?? [],
      (blockedSlots ?? []).filter(s => s.start_time != null && s.end_time != null) as { start_time: string; end_time: string }[]
    )

    // 9. Disable past time slots based on Manila timezone
    const todayKey = toDateKey(new Date())
    if (date <= todayKey) {
      const now = new Date()
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now)
      const [h, m] = timeStr.split(':').map(Number)
      const currentTotalMinutes = h * 60 + m

      slots = slots.map(slot => {
        if (!slot.available) return slot

        if (date < todayKey) {
          return { ...slot, available: false }
        }

        if (date === todayKey) {
          const [sHour, sMin] = slot.start.split(':').map(Number)
          const slotStartMinutes = sHour * 60 + sMin
          if (slotStartMinutes <= currentTotalMinutes) {
            return { ...slot, available: false }
          }
        }

        return slot
      })
    }

    return { success: true, slots }
  } catch (error) {
    console.error('Error in getAvailableSlots:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}
