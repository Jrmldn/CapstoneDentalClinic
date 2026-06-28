import React from 'react'

import { formatDateLong, formatTime as formatTimeManila } from '@/lib/date'
import { PatientAppointment } from './types'

export const formatDate = (dateStr: string) => formatDateLong(dateStr)

export const formatTime = (dateStr: string) => formatTimeManila(dateStr)

const ACTIVE_STATUSES = ['pending', 'confirmed', 'rescheduled', 'follow_up', 'pending_patient_confirm']

export const isUpcomingAppointment = (appt: PatientAppointment) =>
  ACTIVE_STATUSES.includes(appt.status) && new Date(appt.scheduled_at).getTime() >= Date.now()

export const isPastAppointment = (appt: PatientAppointment) => !isUpcomingAppointment(appt)

import { AppointmentStatusBadge } from '@/components/features/appointments/AppointmentStatusBadge'

export const getStatusBadge = (status: string) => {
  return <AppointmentStatusBadge status={status} />
}
