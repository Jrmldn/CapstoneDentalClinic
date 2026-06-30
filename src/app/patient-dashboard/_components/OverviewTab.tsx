'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CheckCircle2,
  Heart,
  Clock,
  User,
  AlertCircle,
  CreditCard,
  MapPin,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PatientRecord } from './types'
import { formatDate, formatTime, getStatusBadge, isUpcomingAppointment } from './utils'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import { ClinicMap } from '@/components/features/landing-page/ClinicMap'
import { Clinic } from '@/components/features/landing-page/types'

interface OverviewTabProps {
  record: PatientRecord
  authUserId: string
  clinics: Clinic[]
  outstandingBalance: number
}

export function OverviewTab({
  record,
  authUserId,
  clinics,
  outstandingBalance,
}: OverviewTabProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const upcomingAppointments = record.appointments.filter(isUpcomingAppointment)

  const handleConfirmReschedule = async (apptId: number) => {
    setLoadingId(apptId)
    try {
      const res = await updateAppointmentStatus(apptId, 'confirmed', authUserId, 'patient', 'Patient confirmed staff reschedule')
      if (res.success) router.refresh()
      else alert(res.error || 'Failed to confirm reschedule.')
    } catch {
      alert('An unexpected error occurred.')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDeclineReschedule = async (apptId: number) => {
    if (!confirm('Decline this reschedule? The appointment status will revert to pending.')) return
    setLoadingId(apptId)
    try {
      const res = await updateAppointmentStatus(apptId, 'pending', authUserId, 'patient', 'Patient declined staff reschedule')
      if (res.success) router.refresh()
      else alert(res.error || 'Failed to decline reschedule.')
    } catch {
      alert('An unexpected error occurred.')
    } finally {
      setLoadingId(null)
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Outstanding Balance</p>
              <h4 className="text-2xl font-bold text-slate-900">
                ₱{outstandingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </h4>
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
              const next = [...upcomingAppointments].sort(
                (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
              )[0]
              return (
                <div className="flex flex-col gap-3 p-4 bg-slate-100 rounded-xl border border-slate-200">
                  {next.status === 'pending_patient_confirm' && (
                    <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-purple-800">
                          The clinic rescheduled your appointment to a new time.
                        </p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          New time: {formatDate(next.scheduled_at)} at {formatTime(next.scheduled_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
                          disabled={loadingId === next.id}
                          onClick={() => handleConfirmReschedule(next.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 border-red-200 hover:bg-red-50 font-semibold text-xs"
                          disabled={loadingId === next.id}
                          onClick={() => handleDeclineReschedule(next.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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
                    {next.status !== 'pending_patient_confirm' && (
                      <Button
                        onClick={() => router.push(`/patient-dashboard/booking?reschedule=true&apptId=${next.id}`)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
                        size="sm"
                      >
                        Reschedule
                      </Button>
                    )}
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

      {/* Clinic Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Find a Clinic Near You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClinicMap clinics={clinics} bookingHref="/patient-dashboard/booking" />
        </CardContent>
      </Card>
    </div>
  )
}
