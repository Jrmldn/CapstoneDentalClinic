'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import { PatientRecord } from './types'
import { formatDate, formatTime, getStatusBadge } from './utils'

interface AppointmentsTabProps {
  record: PatientRecord
  authUserId: string
}

export function AppointmentsTab({
  record,
  authUserId,
}: AppointmentsTabProps) {
  const router = useRouter()

  const upcomingAppointments = record.appointments.filter(
    a => ['pending', 'confirmed', 'rescheduled'].includes(a.status) && new Date(a.scheduled_at) > new Date()
  )

  const pastAppointments = record.appointments.filter(
    a => ['completed', 'cancelled', 'no_show'].includes(a.status) || new Date(a.scheduled_at) <= new Date()
  )

  const handleCancelAppointment = async (apptId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    try {
      const res = await updateAppointmentStatus(
        apptId,
        'cancelled',
        authUserId,
        'patient',
        'Cancelled by patient'
      )
      if (res.success) {
        alert('Appointment cancelled successfully.')
        router.refresh()
      } else {
        alert(res.error || 'Failed to cancel appointment.')
      }
    } catch (err) {
      alert('An unexpected error occurred.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Upcoming List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appt) => (
              <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">
                      {appt.services?.name || 'General Treatment'}
                    </span>
                    {getStatusBadge(appt.status)}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    {formatDate(appt.scheduled_at)} at {formatTime(appt.scheduled_at)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dentist: Dr. {appt.dentists?.first_name} {appt.dentists?.last_name}
                  </p>
                  {appt.notes && (
                    <p className="text-xs text-slate-400 mt-2 bg-slate-50 p-2 rounded">
                      <span className="font-semibold text-slate-500">Note: </span>{appt.notes}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleCancelAppointment(appt.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200 font-semibold"
                >
                  Cancel Booking
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No upcoming appointments</p>
          )}
        </CardContent>
      </Card>

      {/* Past History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Past Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 opacity-80">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-700">
                      {appt.services?.name || 'General Treatment'}
                    </span>
                    {getStatusBadge(appt.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(appt.scheduled_at)} at {formatTime(appt.scheduled_at)}
                  </p>
                  <p className="text-xs text-slate-400">
                    Dentist: Dr. {appt.dentists?.first_name} {appt.dentists?.last_name}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No past appointments found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
