'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { PatientRecord } from './types'
import { toDateKey, formatDate, formatTime } from '@/lib/date'
import { updateAppointmentStatus } from '@/actions/appointmentActions'

interface CalendarTabProps {
  record: PatientRecord
  authUserId: string
}

export function CalendarTab({
  record,
  authUserId,
}: CalendarTabProps) {
  const router = useRouter()
  const now = new Date()
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [selectedCalDate, setSelectedCalDate] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileModalOpen) {
        setIsMobileModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isMobileModalOpen])

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const handleCalPrev = () => {
    if (calMonth === 1) {
      setCalMonth(12)
      setCalYear(y => y - 1)
    } else {
      setCalMonth(m => m - 1)
    }
  }

  const handleCalNext = () => {
    if (calMonth === 12) {
      setCalMonth(1)
      setCalYear(y => y + 1)
    } else {
      setCalMonth(m => m + 1)
    }
  }

  const getCalGrid = () => {
    const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
    const totalDays = new Date(calYear, calMonth, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) {
      const ds = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      cells.push(ds)
    }
    return cells
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':              return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'pending':                return { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' }
      case 'rescheduled':            return { dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200' }
      case 'completed':              return { dot: 'bg-slate-400',   badge: 'bg-slate-50 text-slate-600 border-slate-200' }
      case 'cancelled':              return { dot: 'bg-red-400',     badge: 'bg-red-50 text-red-600 border-red-200' }
      case 'no_show':                return { dot: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-200' }
      case 'follow_up':               return { dot: 'bg-teal-500',   badge: 'bg-teal-50 text-teal-700 border-teal-200' }
      case 'pending_patient_confirm': return { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200' }
      default:                       return { dot: 'bg-gray-300',    badge: 'bg-gray-50 text-gray-600 border-gray-200' }
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      confirmed: 'Confirmed',
      pending: 'Pending',
      rescheduled: 'Rescheduled',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show',
      follow_up: 'Follow-Up',
      pending_patient_confirm: 'Confirm Reschedule',
    }
    return labels[status] ?? 'Unknown'
  }

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

  const getApptsByDate = (dateStr: string) =>
    record.appointments.filter((a) => {
      if (!a.scheduled_at) return false
      const d = new Date(a.scheduled_at)
      const apptDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return apptDateStr === dateStr
    })

  const calGrid = getCalGrid()
  const selectedCalAppts = selectedCalDate ? getApptsByDate(selectedCalDate) : []

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Legend:</span>
        {[
          { label: 'Confirmed',          dot: 'bg-emerald-500' },
          { label: 'Pending',            dot: 'bg-amber-400' },
          { label: 'Rescheduled',        dot: 'bg-blue-500' },
          { label: 'Confirm Reschedule', dot: 'bg-purple-500' },
          { label: 'Follow-Up',          dot: 'bg-teal-500' },
          { label: 'Completed',          dot: 'bg-slate-400' },
          { label: 'Cancelled',          dot: 'bg-red-400' },
          { label: 'No Show',            dot: 'bg-orange-500' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid Section */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          {/* Calendar Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">
                {MONTHS[calMonth - 1]} {calYear}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCalPrev}
                className="p-1.5 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-650" />
              </button>
              <button
                onClick={handleCalNext}
                className="p-1.5 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-650" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center border-b border-gray-100 pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            {WEEKDAYS.map(w => (
              <div key={w} className="py-2">{w}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-2">
            {calGrid.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="aspect-square bg-gray-50/50 border border-transparent rounded-lg" />
              }

              const dayAppts = getApptsByDate(dateStr)
              const todayStr = toDateKey()
              const isToday = todayStr === dateStr
              const isSelected = selectedCalDate === dateStr

              let cellBg = 'bg-white hover:border-blue-500'
              let borderStyle = 'border-gray-100'

              if (isSelected) {
                cellBg = 'bg-blue-50/50'
                borderStyle = 'border-blue-500'
              } else if (isToday) {
                cellBg = 'bg-slate-50'
                borderStyle = 'border-slate-300'
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
                    if (isMobile) {
                      if (dayAppts.length > 0) {
                        setSelectedCalDate(dateStr)
                        setIsMobileModalOpen(true)
                      }
                    } else {
                      setSelectedCalDate(dateStr)
                    }
                  }}
                  className={`aspect-square border rounded-xl p-2 flex flex-col justify-between items-start transition ${cellBg} ${borderStyle} text-left outline-none relative group`}
                >
                  <span className={`text-sm font-bold ${
                    isSelected ? 'text-blue-600' :
                    isToday ? 'text-slate-900 ring-2 ring-slate-900/5 px-1.5 py-0.5 rounded-md bg-slate-200' :
                    'text-slate-700'
                  }`}>
                    {parseInt(dateStr.slice(8), 10)}
                  </span>

                  <div className="w-full space-y-1">
                    {dayAppts.length > 0 && (
                      <span className="text-[9px] font-bold bg-blue-100 text-blue-700 block truncate px-1 rounded uppercase">
                        {dayAppts.length} {dayAppts.length === 1 ? 'Appt' : 'Appts'}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Day Details (Desktop only) */}
        <div className="hidden lg:flex bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex-col justify-between max-h-[600px]">
          <div>
            <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Day Details
              </h3>
              {selectedCalDate && (
                <span className="text-xs text-gray-500 font-semibold">
                  {formatDate(selectedCalDate)}
                </span>
              )}
            </div>

            {!selectedCalDate ? (
              <div className="text-center py-20 text-gray-400">
                <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-sm">Select a day on the calendar to view your appointments.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-1">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Appointments ({selectedCalAppts.length})
                  </h4>
                  {selectedCalAppts.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
                      No appointments scheduled for this day.
                    </p>
                  ) : (
                    selectedCalAppts.map((appt) => {
                      const time = formatTime(appt.scheduled_at)
                      const colors = getStatusColor(appt.status)
                      return (
                        <div key={appt.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                          {appt.status === 'pending_patient_confirm' && (
                            <div className="flex flex-col gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-purple-800">
                                    The clinic rescheduled your appointment to a new time.
                                  </p>
                                  <p className="text-xs text-purple-600 mt-0.5">
                                    New time: {formatDate(appt.scheduled_at)} at {time}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
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
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-800 text-sm">
                              {appt.services?.name || 'Appointment'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors.badge}`}>
                              {getStatusLabel(appt.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {time}
                            </span>
                            <span className="font-semibold text-slate-700">
                              Dr. {appt.dentists?.first_name} {appt.dentists?.last_name}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {new Date(selectedCalDate) >= new Date(new Date().toDateString()) && (
                  <button
                    onClick={() => router.push(`/patient-dashboard/booking?date=${selectedCalDate}`)}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {selectedCalAppts.length === 0 ? 'Book on this date' : 'Book another on this date'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Modal for Day Details */}
      {mounted && isMobileModalOpen && selectedCalDate && createPortal(
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:hidden"
          onClick={() => {
            setIsMobileModalOpen(false)
            setSelectedCalDate('')
          }}
        >
          <div
            className="bg-white rounded-xl border border-gray-100 shadow-xl p-5 flex flex-col justify-between max-h-[90vh] w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setIsMobileModalOpen(false)
                setSelectedCalDate('')
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div>
              <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Day Details
                </h3>
                <span className="text-xs text-gray-500 font-semibold mr-8">
                  {formatDate(selectedCalDate)}
                </span>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Appointments ({selectedCalAppts.length})
                  </h4>
                  {selectedCalAppts.map((appt) => {
                    const time = formatTime(appt.scheduled_at)
                    const colors = getStatusColor(appt.status)
                    return (
                      <div key={appt.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                        {appt.status === 'pending_patient_confirm' && (
                          <div className="flex flex-col gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-purple-800">
                                  The clinic rescheduled your appointment to a new time.
                                </p>
                                <p className="text-xs text-purple-600 mt-0.5">
                                  New time: {formatDate(appt.scheduled_at)} at {time}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
                                disabled={loadingId === appt.id}
                                onClick={() => {
                                  handleConfirmReschedule(appt.id)
                                  setIsMobileModalOpen(false)
                                  setSelectedCalDate('')
                                }}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 border-red-200 hover:bg-red-50 font-semibold text-xs"
                                disabled={loadingId === appt.id}
                                onClick={() => {
                                  handleDeclineReschedule(appt.id)
                                  setIsMobileModalOpen(false)
                                  setSelectedCalDate('')
                                }}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-800 text-sm">
                            {appt.services?.name || 'Appointment'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors.badge}`}>
                            {getStatusLabel(appt.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {time}
                          </span>
                          <span className="font-semibold text-slate-700">
                            Dr. {appt.dentists?.first_name} {appt.dentists?.last_name}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {new Date(selectedCalDate) >= new Date(new Date().toDateString()) && (
                  <button
                    onClick={() => {
                      setIsMobileModalOpen(false)
                      setSelectedCalDate('')
                      router.push(`/patient-dashboard/booking?date=${selectedCalDate}`)
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {selectedCalAppts.length === 0 ? 'Book on this date' : 'Book another on this date'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
