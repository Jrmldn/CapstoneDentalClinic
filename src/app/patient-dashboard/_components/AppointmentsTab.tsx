'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronLeft, ChevronRight, CalendarClock, AlertCircle, Star, MessageSquare } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import { submitFeedback } from '@/actions/patientCoreActions'
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
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [pastPage, setPastPage] = useState(1)

  // Feedback state
  const [feedbackApptId, setFeedbackApptId] = useState<number | null>(null)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [submittedFeedbackIds, setSubmittedFeedbackIds] = useState<Set<number>>(new Set())

  const upcomingAppointments = record.appointments.filter(
    a =>
      ['pending', 'confirmed', 'rescheduled', 'follow_up', 'pending_patient_confirm'].includes(a.status) &&
      new Date(a.scheduled_at) > new Date()
  )

  const pastAppointments = record.appointments.filter(
    a =>
      ['completed', 'cancelled', 'no_show'].includes(a.status) ||
      (!['pending', 'confirmed', 'rescheduled', 'follow_up', 'pending_patient_confirm'].includes(a.status) &&
        new Date(a.scheduled_at) <= new Date())
  )

  const PAGE_SIZE = 10
  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingAppointments.length / PAGE_SIZE))
  const paginatedUpcoming = upcomingAppointments.slice((upcomingPage - 1) * PAGE_SIZE, upcomingPage * PAGE_SIZE)
  const pastTotalPages = Math.max(1, Math.ceil(pastAppointments.length / PAGE_SIZE))
  const paginatedPast = pastAppointments.slice((pastPage - 1) * PAGE_SIZE, pastPage * PAGE_SIZE)

  const handleConfirmReschedule = async (apptId: number) => {
    setLoadingId(apptId)
    try {
      const res = await updateAppointmentStatus(apptId, 'confirmed', authUserId, 'patient', 'Patient confirmed staff reschedule')
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || 'Failed to confirm reschedule.')
      }
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
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || 'Failed to decline reschedule.')
      }
    } catch {
      alert('An unexpected error occurred.')
    } finally {
      setLoadingId(null)
    }
  }

  const handleFeedbackSubmit = async (apptId: number, clinicId: number) => {
    if (feedbackRating === 0) { alert('Please select a star rating.'); return }
    setFeedbackLoading(true)
    try {
      const res = await submitFeedback(
        apptId,
        record.patient.id,
        clinicId,
        feedbackRating,
        feedbackComment || undefined
      )
      if (res.success) {
        setSubmittedFeedbackIds(prev => new Set(prev).add(apptId))
        setFeedbackApptId(null)
        setFeedbackRating(0)
        setFeedbackComment('')
      } else {
        alert(res.error || 'Failed to submit feedback.')
      }
    } catch {
      alert('An unexpected error occurred.')
    } finally {
      setFeedbackLoading(false)
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
            paginatedUpcoming.map((appt) => (
              <div key={appt.id} className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                {/* Staff reschedule confirmation banner */}
                {appt.status === 'pending_patient_confirm' && (
                  <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-purple-800">
                        The clinic rescheduled your appointment to a new time.
                      </p>
                      <p className="text-xs text-purple-600 mt-0.5">
                        New time: {formatDate(appt.scheduled_at)} at {formatTime(appt.scheduled_at)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
                        disabled={loadingId === appt.id}
                        onClick={() => handleConfirmReschedule(appt.id)}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50 font-semibold text-xs"
                        disabled={loadingId === appt.id}
                        onClick={() => handleDeclineReschedule(appt.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  {/* Reschedule link — patients cannot cancel, only reschedule */}
                  {appt.status !== 'pending_patient_confirm' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200 font-semibold flex items-center gap-1.5"
                      onClick={() => router.push(`/patient-dashboard/booking?reschedule=true&apptId=${appt.id}`)}
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      Reschedule
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No upcoming appointments</p>
          )}
          {upcomingTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400">Page {upcomingPage} of {upcomingTotalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setUpcomingPage(p => Math.max(1, p - 1))}
                  disabled={upcomingPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setUpcomingPage(p => Math.min(upcomingTotalPages, p + 1))}
                  disabled={upcomingPage === upcomingTotalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
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
            paginatedPast.map((appt) => {
              const alreadyRated = submittedFeedbackIds.has(appt.id)
              const isFeedbackOpen = feedbackApptId === appt.id
              return (
                <div key={appt.id} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between gap-4">
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
                    {appt.status === 'completed' && !alreadyRated && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 hover:bg-amber-50 border-amber-200 font-semibold flex items-center gap-1.5 shrink-0"
                        onClick={() => { setFeedbackApptId(isFeedbackOpen ? null : appt.id); setFeedbackRating(0); setFeedbackComment('') }}
                      >
                        <Star className="w-3.5 h-3.5" />
                        {isFeedbackOpen ? 'Cancel' : 'Rate Visit'}
                      </Button>
                    )}
                    {appt.status === 'completed' && alreadyRated && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-emerald-500" /> Rated
                      </span>
                    )}
                    {appt.status !== 'completed' && <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>

                  {/* Inline feedback form */}
                  {isFeedbackOpen && (
                    <div className="border-t border-slate-200 pt-3 space-y-3">
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> How was your visit?
                      </p>
                      {/* Star picker */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className="p-0.5 transition"
                          >
                            <Star
                              className={`w-6 h-6 transition ${
                                star <= feedbackRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Add a comment (optional)..."
                        rows={2}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                      />
                      <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                        disabled={feedbackLoading || feedbackRating === 0}
                        onClick={() => handleFeedbackSubmit(appt.id, appt.clinic_id!)}
                      >
                        {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No past appointments found</p>
          )}
          {pastTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400">Page {pastPage} of {pastTotalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPastPage(p => Math.max(1, p - 1))}
                  disabled={pastPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPastPage(p => Math.min(pastTotalPages, p + 1))}
                  disabled={pastPage === pastTotalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
