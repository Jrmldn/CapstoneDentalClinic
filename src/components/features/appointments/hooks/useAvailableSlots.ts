'use client'

import { useState } from 'react'
import { getAvailableSlots } from '@/actions/slotAvailabilityActions'

export const MILLISECONDS_PER_MINUTE = 60_000

export interface Slot {
  start: string
  end: string
  available: boolean
}

export function useAvailableSlots(clinicId: number) {
  const [slots, setSlots] = useState<Slot[]>([])

  const fetchSlots = async (dentistId: number, serviceId: number, date: string) => {
    if (!dentistId || !serviceId || !date) return
    const result = await getAvailableSlots(clinicId, dentistId, serviceId, date)
    if (result.success && result.slots) {
      setSlots(result.slots)
    }
  }

  const clearSlots = () => setSlots([])

  return { slots, fetchSlots, clearSlots }
}
