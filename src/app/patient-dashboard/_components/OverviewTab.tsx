'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CheckCircle2,
  Heart,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import { PatientRecord } from './types'
import { formatDate, formatTime, getStatusBadge } from './utils'

interface OverviewTabProps {
  record: PatientRecord
  authUserId: string
}

export function OverviewTab({
  record,
  authUserId,
}: OverviewTabProps) {
  const router = useRouter()
  const upcomingAppointments = record.appointments.filter(
    a => ['pending', 'confirmed', 'rescheduled'].includes(a.status) && new Date(a.scheduled_at) > new Date()
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
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-6 scale-150">
          <Calendar className="w-64 h-64" />
        </div>
        <div className="max-w-xl">
          <h3 className="text-2xl font-bold">
            Hello, {record.patient.first_name || 'Patient'}!
          </h3>
          <p className="mt-2 text-blue-100 text-sm leading-relaxed">
            Welcome to your patient dashboard. Here you can book new sessions, track your clinic history, check prescriptions, and keep your profile up to date.
          </p>
          <Button
            onClick={() => router.push('/patient-dashboard/booking')}
            className="mt-4 bg-white text-blue-600 hover:bg-blue-50 font-bold border-none"
          >
            Schedule Appointment
          </Button>
        </div>
      </div>

      {/* Grid of Key Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Appointments</p>
              <h4 className="text-2xl font-bold text-slate-900">{record.appointments.length}</h4>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Completed Visits</p>
              <h4 className="text-2xl font-bold text-slate-900">
                {record.appointments.filter(a => a.status === 'completed').length}
              </h4>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Prescriptions</p>
              <h4 className="text-2xl font-bold text-slate-900">{record.prescriptions.length}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Next Upcoming Appointment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            (() => {
              const next = upcomingAppointments.sort(
                (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
              )[0]
              return (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-100 rounded-xl border border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-lg">
                        {next.services?.name || 'Consultation'}
                      </span>
                      {getStatusBadge(next.status)}
                    </div>
                    <p className="text-sm text-slate-600 mt-1 font-medium flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {formatDate(next.scheduled_at)} at {formatTime(next.scheduled_at)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Dentist: Dr. {next.dentists?.first_name} {next.dentists?.last_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCancelAppointment(next.id)}
                      variant="destructive"
                      size="sm"
                      className="font-bold"
                    >
                      Cancel Booking
                    </Button>
                  </div>
                </div>
              )
            })()
          ) : (
            <div className="text-center py-6 text-slate-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 opacity-40 text-blue-600" />
              <p className="text-sm font-medium">No upcoming appointments scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
